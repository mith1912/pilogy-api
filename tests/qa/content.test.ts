import overallSummaryJson from "@/lib/interpretations/overall/overall-summary.vi.json";
import { overallSummaryContentSchema } from "@/lib/validation/overall-summary";
import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { auditContent } from "@/scripts/qa-content.mjs";
import { interpretationFileSchema } from "@/lib/validation/interpretations";
import { overallSummaryContent } from "@/lib/interpretations/overall/vi";
import { generateOverallSummary } from "@/lib/numerology/overall-summary";
import { calculateNumerology } from "@/lib/numerology/service";
import { getInterpretation, interpretationCatalog } from "@/lib/interpretations/catalog";
import witnesses from "@/tests/fixtures/domain-witnesses.json";

const directory = new URL("../../lib/interpretations/content/vi/", import.meta.url);
it("independently reads all JSON and validates every imported record and combination", () => {
  const files = readdirSync(directory).filter((name) => name.endsWith(".json") && name !== "coverage.json");
  const combined = files.flatMap((filename) => {
    const bytes = readFileSync(new URL(filename, directory));
    const raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    expect(interpretationFileSchema.parse(raw)).toEqual(raw);
    expect(raw.locale).toBe("vi");
    expect(raw.contentVersion).toBe("v1.0.0-draft");
    return raw.items;
  });
  expect(combined).toHaveLength(101);
  expect(new Set(combined.map((item) => `${item.index}/${item.value}`)).size).toBe(101);
  for (const item of combined) {
    expect(interpretationCatalog).toContainEqual(item);
    expect(witnesses.some((witness) => witness.type === item.index && witness.value === item.value)).toBe(true);
  }
});
it("requires complete coverage of all reachable values", () => {
  const audit = auditContent();
  expect(audit.requiredCombinations).toBe(101);
  expect(audit.missing).toEqual([]);
  expect(audit.unused).toEqual([]);
  expect(audit.integrityIssues).toEqual([]);
});
it("reproduces editorial diagnostics without changing imported articles", () => {
  const audit = auditContent();
  expect(audit.summaryDuplicates).toEqual([]);
  expect(audit.paragraphDuplicates.some((group) => group.references.length > 1)).toBe(true);
  expect(audit.titleDuplicates).toHaveLength(12);
  expect(audit.similarities.length).toBeGreaterThan(0);
  expect(audit.keywordIssues).toHaveLength(6);
});

it("covers all seven overall sections across the reachable calculation witnesses", () => {
  for (const witness of witnesses) {
    const result = calculateNumerology({ ...witness.input, locale: "vi" });
    const summary = generateOverallSummary(result, getInterpretation);
    expect(summary.completeness).toEqual({ missingSections: [], missingIndices: [] });
    expect(summary.sourceIndices).toHaveLength(8);
    for (const { type, value } of summary.sourceIndices) {
      expect(value).toBe(result.indices[type].value);
    }
  }
  const { overviewCombinations } = overallSummaryContent;
  for (const rule of overviewCombinations) {
    expect(getInterpretation("lifePath", rule.lifePath)).toBeDefined();
    expect(getInterpretation("expression", rule.expression)).toBeDefined();
    expect(rule.content.length).toBeGreaterThan(60);
  }
  expect(new Set(overviewCombinations.map(({ lifePath, expression }) => `${lifePath}/${expression}`)).size)
    .toBe(overviewCombinations.length);
});

it("loads and validates Vietnamese summary JSON and rejects undeclared template slots", () => {
  expect(overallSummaryContent).toMatchObject({
    version: overallSummaryJson.version, contentVersion: overallSummaryJson.contentVersion,
    locale: "vi", title: overallSummaryJson.title, overviewCombinations: overallSummaryJson.overviewCombinations,
  });
  const copy = structuredClone(overallSummaryJson);
  copy.sections.overview.repeat = "Chủ đề {missing}";
  expect(overallSummaryContentSchema.safeParse(copy).success).toBe(false);
});

it("omits an unavailable JSON section while retaining the remaining summary", () => {
  const json = { ...overallSummaryJson, sections: { ...overallSummaryJson.sections, relationships: undefined } };
  const catalog = overallSummaryContentSchema.parse(json);
  const result = calculateNumerology({ ...witnesses[0].input, locale: "vi" });
  const summary = generateOverallSummary(result, getInterpretation, catalog);
  expect(summary).not.toHaveProperty("relationships");
  expect(summary.innerSelf?.content).toBeTruthy();
  expect(summary.completeness).toEqual({ missingSections: ["relationships"], missingIndices: [] });
});
