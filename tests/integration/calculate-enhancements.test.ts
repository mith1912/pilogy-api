import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { getInterpretation } from "@/lib/interpretations/catalog";
import { calculateNumerology } from "@/lib/numerology/service";
import { generateOverallSummary } from "@/lib/numerology/overall-summary";
import type { ApiResponse, CalculateApiData } from "@/lib/types/api";
import witnesses from "@/tests/fixtures/domain-witnesses.json";

const input = { fullName: "Nguyễn Văn An", birthDate: "1990-05-20", referenceDate: "2027-03-01", locale: "vi" } as const;
const post = (body: object) => POST(new Request("http://localhost/api/v1/numerology/calculate", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}));
async function calculate(body: object): Promise<CalculateApiData> {
  const response = await post(body);
  expect(response.status).toBe(200);
  const payload: ApiResponse<CalculateApiData> = await response.json();
  if (!payload.success) throw new Error(payload.error.code);
  return payload.data;
}
afterEach(() => vi.useRealTimers());

it("keeps the prior numeric result available through explicit consonant mode", async () => {
  const legacy = await calculate({ ...input, yMode: "consonant" });
  expect(legacy.calculationOptions).toMatchObject({ yModeRequested: "consonant", yModeApplied: "consonant", fallbackUsed: false });
  expect(legacy.name).toMatchObject({ nameTotal: 48, vowelTotal: 10, consonantTotal: 38 });
  expect(legacy.indices).toMatchObject({ soulUrge: { value: 1 }, personality: { value: 11 }, expression: { value: 3 } });
  for (const yMode of ["auto", "vowel", "consonant"] as const) {
    const result = await calculate({ ...input, yMode });
    const isVowel = yMode !== "consonant";
    expect(result.calculationOptions).toMatchObject({
      yModeRequested: yMode, yModeApplied: yMode, classificationRulesVersion: "vi-y-v1", fallbackUsed: false,
      yOccurrences: [{ classification: isVowel ? "vowel" : "consonant", numericValue: 7 }],
    });
    for (const type of ["expression", "lifePath", "birthday", "attitude", "maturity", "personalYear", "personalMonth"] as const) {
      expect(result.indices[type]).toEqual(legacy.indices[type]);
    }
    expect(result.name.nameTotal).toBe(legacy.name.nameTotal);
    expect(result.indices.soulUrge.value).toBe(isVowel ? 8 : 1);
    expect(result.indices.personality.value).toBe(isVowel ? 4 : 11);
    expect(result.interpretations.soulUrge.value).toBe(result.indices.soulUrge.value);
    expect(result.interpretations.personality.value).toBe(result.indices.personality.value);
    expect(result.overallSummary.sourceIndices).toContainEqual({ type: "soulUrge", value: result.indices.soulUrge.value });
  }
});

it("applies different classifications in one name and preserves the original Y spelling", async () => {
  const fullName = "Mỹ Tây Yvonne".normalize("NFD");
  const result = await calculate({ ...input, fullName, yMode: "auto" });
  expect(result.calculationOptions).toMatchObject({ fallbackUsed: true, yOccurrences: [
    { originalCharacter: "y\u0303", ruleId: "vi-vowel-nucleus", classification: "vowel" },
    { originalCharacter: "y", ruleId: "vi-final-glide", classification: "consonant" },
    { originalCharacter: "Y", ruleId: "legacy-fallback", classification: "consonant" },
  ] });
  expect(result.name).toMatchObject({ nameTotal: 53, vowelTotal: 19, consonantTotal: 34 });
  expect(result.indices).toMatchObject({ soulUrge: { value: 1 }, personality: { value: 7 }, expression: { value: 8 } });
  expect((await calculate({ ...input, fullName: fullName.normalize("NFC"), yMode: "auto" })).indices).toEqual(result.indices);
});

it("keeps master reduction after moving Y and keeps the zero-group error", async () => {
  const preserved = await calculate({ ...input, fullName: "Mỹ U A C", yMode: "auto" });
  expect(preserved.indices.soulUrge).toMatchObject({ value: 11, baseValue: 2 });
  expect(preserved.interpretations.soulUrge.value).toBe(11);
  expect((await calculate({ ...input, fullName: "Mỹ U A C", yMode: "consonant" })).indices.soulUrge.value).toBe(4);

  const onlyVowels = await post({ ...input, fullName: "Y U", yMode: "vowel" });
  expect(onlyVowels.status).toBe(422);
  expect(await onlyVowels.json()).toMatchObject({ error: { code: "CALCULATION_RULE_UNSPECIFIED" } });
});

it("returns empty metadata for a name without Y and validates invalid mode", async () => {
  const result = await calculate({ ...input, fullName: "An", yMode: "auto" });
  expect(result.calculationOptions).toMatchObject({ yOccurrences: [], fallbackUsed: false });
  const invalid = await post({ ...input, yMode: "guess" });
  expect(invalid.status).toBe(400);
  expect(await invalid.json()).toMatchObject({ error: { details: [{ field: "yMode" }] } });
});

it.each([11, 22, 33])("uses the exact Master Number %s catalog theme", async (value) => {
  const witness = witnesses.find((item) => item.type === "lifePath" && item.value === value)!;
  const { overallSummary } = await calculate(witness.input);
  expect(overallSummary.sourceIndices).toContainEqual({ type: "lifePath", value });
  expect(overallSummary.overview?.content).toContain(getInterpretation("lifePath", value)?.keywords[0]);
  expect(overallSummary.completeness).toEqual({ missingSections: [], missingIndices: [] });
});

it("uses the effective UTC date or the selected future date and is deterministic", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-22T09:00:00Z"));
  const laterThisYear = await calculate({ ...input, referenceDate: "2026-12-01" });
  expect(laterThisYear.overallSummary.currentCycle?.content).toContain("12/2026");
  const current = await calculate({ ...input, referenceDate: undefined });
  expect(current.referenceDate).toBe("2026-11-22");
  expect(current.overallSummary.currentCycle?.content).toContain("11/2026");
  const future = await calculate({ ...input, yMode: "auto" });
  expect(future.overallSummary.currentCycle?.content).toContain("3/2027");
  for (const type of ["personalYear", "personalMonth"] as const) {
    expect(future.overallSummary.sourceIndices).toContainEqual({ type, value: future.indices[type].value });
    expect(future.overallSummary.currentCycle?.content).toContain(future.interpretations[type].keywords[0]);
  }
  expect(await calculate({ ...input, yMode: "auto" })).toEqual(future);
});

it("omits unsupported summary sections and retains one supported cycle when the other is absent", () => {
  const result = calculateNumerology(input);
  const { maturity, personalMonth } = result.indices;
  const summary = generateOverallSummary({ ...result, indices: { maturity, personalMonth } }, (type, value) =>
    type === "maturity" ? undefined : getInterpretation(type, value));
  expect(summary).not.toHaveProperty("overview");
  expect(summary).not.toHaveProperty("growthAdvice");
  expect(summary.currentCycle?.content).toContain("3/2027");
  expect(summary.sourceIndices).toEqual([{ type: "personalMonth", value: personalMonth.value }]);
  expect(summary.completeness.missingIndices).toContain("maturity");
  expect(summary.completeness.missingSections).toContain("growthAdvice");
});

it("selects an authored combination for the calculated pair and leaves legacy fields consumable", async () => {
  const { calculationOptions, overallSummary, ...legacyFields } = await calculate({
    ...input, birthDate: "2000-01-04", yMode: "auto",
  });
  expect(calculationOptions.yModeApplied).toBe("auto");
  expect(legacyFields.indices).toMatchObject({ lifePath: { value: 7 }, expression: { value: 3 } });
  expect(legacyFields.interpretations.lifePath.value).toBe(7);
  expect(overallSummary.overview?.content).toContain("Bạn có thể là người suy nghĩ nhiều hơn những gì mình thể hiện.");
});

it("defaults to auto and reports both Y classifications in the supplied Vietnamese example", async () => {
  const example = { ...input, fullName: "Nguyễn Thị Mỹ Lan", referenceDate: "2026-11-22" };
  const omitted = await calculate(example);
  const automatic = await calculate({ ...example, yMode: "auto" });
  expect(omitted).toEqual({
    ...automatic,
    calculationOptions: { ...automatic.calculationOptions, yModeRequested: null },
  });
  expect(omitted.calculationOptions).toMatchObject({
    yModeRequested: null, yModeApplied: "auto", fallbackUsed: false, yOccurrences: [
      { originalCharacter: "y", classification: "vowel", ruleId: "vi-compound-nucleus", numericValue: 7 },
      { originalCharacter: "ỹ", classification: "vowel", ruleId: "vi-vowel-nucleus", numericValue: 7 },
    ],
  });
  expect(omitted.name).toMatchObject({ vowelTotal: 32, consonantTotal: 39, nameTotal: 71 });
  expect(omitted.indices).toMatchObject({ soulUrge: { value: 5 }, personality: { value: 3 }, expression: { value: 8 } });
  const previous = await calculate({ ...example, yMode: "consonant" });
  expect(previous.indices).toMatchObject({ soulUrge: { value: 9 }, personality: { value: 8 } });
  for (const type of ["expression", "lifePath", "birthday", "attitude", "maturity", "personalYear", "personalMonth"] as const) {
    expect(omitted.indices[type]).toEqual(previous.indices[type]);
  }

  expect(calculateNumerology(example).indices).toEqual(omitted.indices);
  expect((await calculate({ ...example, fullName: example.fullName.normalize("NFD") })).indices).toEqual(omitted.indices);
});
