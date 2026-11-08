import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { auditContent } from "@/scripts/qa-content.mjs";
import { interpretationFileSchema } from "@/lib/validation/interpretations";
import { interpretationCatalog } from "@/lib/interpretations/catalog";
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
  expect(combined).toHaveLength(99);
  expect(new Set(combined.map((item) => `${item.index}/${item.value}`)).size).toBe(99);
  for (const item of combined) {
    expect(interpretationCatalog).toContainEqual(item);
    expect(witnesses.some((witness) => witness.type === item.index && witness.value === item.value)).toBe(true);
  }
});
it("detects and reports actual coverage gaps instead of treating a 99-record count as completeness", () => {
  const audit = auditContent();
  expect(audit.requiredCombinations).toBe(101);
  expect(audit.missing).toEqual(["birthday/11", "birthday/22"]);
  expect(audit.unused).toEqual([]);
  expect(audit.integrityIssues).toEqual([]);
  // This is a diagnostic test, not a completeness PASS. npm run qa applies the failing release gate.
});
it("reproduces editorial diagnostics without changing imported articles", () => {
  const audit = auditContent();
  expect(audit.summaryDuplicates).toEqual([]);
  expect(audit.paragraphDuplicates.some((group) => group.references.length === 198)).toBe(true);
  expect(audit.titleDuplicates).toHaveLength(12);
  expect(audit.similarities.length).toBeGreaterThan(0);
  expect(audit.keywordIssues).toHaveLength(6);
});
