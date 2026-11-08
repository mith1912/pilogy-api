import { afterEach, describe, expect, it } from "vitest";
import { calculateNumerology } from "@/lib/numerology/service";
import { normalizeName, analyzeName, letterValue } from "@/lib/numerology/name";
import { parseCalendarDate } from "@/lib/numerology/date";
import { reduceNumber } from "@/lib/numerology/reduction";
import { calculateSchema } from "@/lib/validation/calculate";

const profile = { fullName: "Nguyễn Văn An", birthDate: "1990-05-20", referenceDate: "2026-11-08", locale: "vi" as const };
const calculate = () => calculateNumerology(profile);
describe("reviewed V1 examples", () => {
  it("matches every supplied expected result", () => {
    const result = calculate();
    expect(result.name).toMatchObject({ normalizedName: "NGUYEN VAN AN", nameTotal: 48, vowelTotal: 10, consonantTotal: 38 });
    expect(Object.fromEntries(Object.entries(result.indices).map(([key, index]) => [key, index.value])))
      .toEqual({ lifePath: 8, expression: 3, soulUrge: 1, personality: 11, birthday: 2, attitude: 7, maturity: 11, personalYear: 8, personalMonth: 1 });
    expect(result.indices.personality.baseValue).toBe(2);
    expect(result.indices.maturity.baseValue).toBe(2);
    expect(result.indices.personalMonth?.referenceDate).toBe(profile.referenceDate);
  });
  it("preserves birth day 11 to produce Life Path 22", () => {
    const { lifePath } = calculateNumerology({ ...profile, birthDate: "1998-02-11" }).indices;
    expect(lifePath.value).toBe(22);
    expect(lifePath.baseValue).toBe(4);
    expect(lifePath.steps).toEqual([
      { label: "birthYear", operation: "digitSum", inputs: [1,9,9,8], result: 27 },
      { label: "birthYear", operation: "digitSum", inputs: [2,7], result: 9 },
      { label: "lifePath.sum", operation: "sum", inputs: [2,11,9], result: 22 },
      { label: "lifePath.base", operation: "digitSum", inputs: [2,2], result: 4 },
    ]);
  });
});
it.each([[11,2], [22,4], [33,6], [29,2], [38,2]])("preserves masters for %i and includes base %i", (input, base) => {
  const result = reduceNumber(input);
  expect(result.value).toBe(input > 33 ? 11 : input === 29 ? 11 : input);
  expect(result.baseValue).toBe(base);
  expect(reduceNumber(input, false).value).toBe(base);
});
it("preserves intermediate master 33 and repeated sums", () => {
  expect(reduceNumber(699).steps.map((step) => step.result)).toEqual([24,6]);
  expect(reduceNumber(9996).value).toBe(33);
});
it("maps every Pythagorean letter", () => {
  for (const [value, letters] of ["AJS", "BKT", "CLU", "DMV", "ENW", "FOX", "GPY", "HQZ", "IR"].entries()) {
    for (const letter of letters) expect(letterValue(letter)).toBe(value + 1);
  }
});
it("normalizes Vietnamese names, decomposed marks, punctuation and Đ", () => {
  expect(normalizeName("  Đặng\tThị—Ánh! ")).toBe("DANG THIANH");
  expect(normalizeName("Nguyễn Văn An".normalize("NFD"))).toBe("NGUYEN VAN AN");
  expect(analyzeName("Y An")).toMatchObject({ vowelTotal: 1, consonantTotal: 12 });
});
it.each(["", "   ", "--!", "123", "你好"])("rejects names with no calculable letters: %s", (fullName) => {
  expect(calculateSchema.safeParse({ ...profile, fullName }).success).toBe(false);
  expect(() => analyzeName(fullName)).toThrow();
});
it.each(["1900-02-29", "2023-02-29", "2026-11-31", "0000-01-01", "2026-11-08T00:00:00Z"])("rejects invalid birth and target dates: %s", (date) => {
  expect(() => parseCalendarDate(date)).toThrow();
  expect(calculateSchema.safeParse({ ...profile, birthDate: date }).success).toBe(false);
  expect(calculateSchema.safeParse({ ...profile, referenceDate: date }).success).toBe(false);
});
it.each(["2000-02-29", "2024-02-29", "0001-01-01", "9999-12-31"])("accepts valid calendar date %s", (date) => {
  expect(calculateSchema.safeParse({ ...profile, birthDate: date, referenceDate: date }).success).toBe(true);
});
it("uses calendar year rather than birthday boundaries", () => {
  const before = calculateNumerology({ ...profile, referenceDate: "2026-01-01" });
  expect(before.indices.personalYear?.value).toBe(calculate().indices.personalYear?.value);
  expect(before.indices.personalMonth?.value).toBe(9);
});
it("name total always equals vowel plus consonant totals", () => {
  for (const name of ["Nguyễn Văn An", "Đặng Thị Ánh", "Y An", "AEIOU", "Lynn"]) {
    const totals = analyzeName(name);
    expect(totals.nameTotal).toBe(totals.vowelTotal + totals.consonantTotal);
  }
});
const originalTimezone = process.env.TZ;
afterEach(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});
it("is date-only and timezone independent", () => {
  const expected = calculate();
  for (const timezone of ["UTC", "Pacific/Honolulu", "Pacific/Kiritimati", "Asia/Ho_Chi_Minh"]) {
    process.env.TZ = timezone;
    expect(calculate()).toEqual(expected);
  }
});
it("is deterministic and does not mutate inputs", () => {
  const input = Object.freeze({ ...profile });
  const result = calculateNumerology(input);
  for (let i = 0; i < 20; i++) expect(calculateNumerology(input)).toEqual(result);
  result.indices.lifePath.steps.length = 0;
  expect(calculateNumerology(input).indices.lifePath.steps.length).toBeGreaterThan(0);
});

it.each(["Lynn", "Ai"])("does not invent a zero-total convention for %s", (fullName) => {
  expect(() => calculateNumerology({ ...profile, fullName })).toThrow("have not been specified");
});

it("reduces master components and cycle totals to single digits", () => {
  const result = calculateNumerology({ ...profile, birthDate: "1990-11-22", referenceDate: "2029-11-08" });
  expect(result.indices.personalYear).toMatchObject({ value: 1, baseValue: 1 });
  expect(result.indices.personalYear.steps).toContainEqual({ label: "personalYear.sum", operation: "sum", inputs: [2, 4, 4], result: 10 });
});

it("reduces master cycle sums without preserving them", () => {
  const result = calculateNumerology({ ...profile, birthDate: "1990-05-05", referenceDate: "2026-09-01" });
  expect(result.indices.personalYear).toMatchObject({ value: 2, baseValue: 2 });
  expect(result.indices.personalMonth).toMatchObject({ value: 2, baseValue: 2 });
});
