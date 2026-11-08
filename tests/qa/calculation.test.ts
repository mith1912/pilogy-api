import { afterEach, describe, expect, it, vi } from "vitest";
import fixtures from "@/tests/fixtures/independent-v1.json";
import fixtureASteps from "@/tests/fixtures/fixture-a-steps.json";
import { calculateNumerology } from "@/lib/numerology/service";
import { INDEX_IDS } from "@/lib/numerology/types";

// Independent table from the documented letter groups, not production helpers.
const table: Record<string, number> = Object.fromEntries(["AJS","BKT","CLU","DMV","ENW","FOX","GPY","HQZ","IR"].flatMap((letters, group) => [...letters].map((letter) => [letter, group + 1])));
const originalTZ = process.env.TZ;
afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe("independent explicit V1 vectors", () => {
  it.each(fixtures)("$id: verifies all nine values, bases, letter order and every step", (fixture) => {
    const result = calculateNumerology({ ...fixture.input, locale: "vi" });
    expect(result.name).toMatchObject(fixture.name);
    const expectedLetters = [...fixture.name.normalizedName.replaceAll(" ", "")].map((letter) => ({ letter, value: table[letter], group: "AEIOU".includes(letter) ? "vowel" : "consonant" }));
    expect(result.name.letters).toEqual(expectedLetters);
    expect(result.name.nameTotal).toBe(result.name.vowelTotal + result.name.consonantTotal);
    expect(result.referenceDate).toBe(fixture.input.referenceDate);
    for (const type of INDEX_IDS) {
      const index = result.indices[type];
      expect(index).toMatchObject({ type, ...fixture.expected[type] });
      expect(index.steps.length).toBeGreaterThan(0);
      // Track each independent reduction chain; component steps may be interleaved by label.
      const [year, month, day] = fixture.input.birthDate.split("-").map(Number);
      const [referenceYear, referenceMonth] = fixture.input.referenceDate.split("-").map(Number);
      const current: Record<string, number> = { birthYear: year, birthMonth: month, birthDay: day, referenceYear };
      const sums: Record<string, number[]> = {
        lifePath: fixture.lifeComponents, personalYear: fixture.personalComponents,
        expression: expectedLetters.map((item) => item.value),
        soulUrge: expectedLetters.filter((item) => item.group === "vowel").map((item) => item.value),
        personality: expectedLetters.filter((item) => item.group === "consonant").map((item) => item.value),
        birthday: [day], attitude: [month, day],
        maturity: [fixture.expected.lifePath.value, fixture.expected.expression.value],
        personalMonth: [fixture.expected.personalYear.value, referenceMonth],
      };
      let sumSeen = false;
      for (const step of index.steps) {
        expect(["sum", "digitSum"]).toContain(step.operation);
        expect(step.inputs.every(Number.isSafeInteger)).toBe(true);
        expect(step.inputs.reduce((a, b) => a + b, 0)).toBe(step.result);
        if (step.operation === "sum") {
          expect(sumSeen).toBe(false);
          sumSeen = true;
          expect(step.label).toBe(`${type}.sum`);
          expect(step.inputs).toEqual(sums[type]);
          current[type] = step.result;
        } else {
          const chain = step.label.endsWith(".base") ? type : step.label;
          expect(current[chain]).toBeDefined();
          expect(step.inputs).toEqual([...String(current[chain])].map(Number));
          current[chain] = step.result;
        }
      }
      expect(sumSeen).toBe(true);
      const normalSteps = index.steps.filter((step) => step.label === `${type}.sum` || step.label === type);
      expect(normalSteps.at(-1)?.result).toBe(index.value);
      expect(index.steps.at(-1)?.result).toBe(index.baseValue);
      expect(index.steps.filter((step) => step.label === `${type}.base`).length).toBe(index.value > 9 ? 1 : 0);
      if (type === "personalYear" || type === "personalMonth") expect(index.referenceDate).toBe(fixture.input.referenceDate);
    }
  });
  it("compares every fixture A step against manually transcribed arithmetic", () => {
    const result = calculateNumerology({ ...fixtures[0].input, locale: "vi" });
    expect(Object.fromEntries(INDEX_IDS.map((type) => [type, result.indices[type].steps]))).toEqual(fixtureASteps);
  });
  it("covers all reachable Life Paths and supported masters with actual witnesses", () => {
    const expectedDomains: Record<string, number[]> = {
      lifePath: [1,2,3,4,5,6,7,8,9,11,22,33],
      expression: [11,22,33], soulUrge: [11,22,33], personality: [11,22,33],
      birthday: [11,22], attitude: [33], maturity: [11,22,33],
      personalYear: [1,2,3,4,5,6,7,8,9], personalMonth: [1,2,3,4,5,6,7,8,9],
    };
    for (const [type, values] of Object.entries(expectedDomains)) {
      const observed = new Set(fixtures.map((fixture) => fixture.expected[type as keyof typeof fixture.expected].value));
      for (const value of values) expect(observed.has(value)).toBe(true);
    }
  });
  it.each(["UTC", "Pacific/Honolulu", "Pacific/Kiritimati", "Asia/Ho_Chi_Minh"])("is independent of timezone and clock with explicit input: %s", (timezone) => {
    process.env.TZ = timezone;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2040-01-01T00:01:00Z"));
    const result = calculateNumerology({ ...fixtures[0].input, locale: "vi" });
    for (const type of INDEX_IDS) expect(result.indices[type]).toMatchObject(fixtures[0].expected[type]);
  });
});
