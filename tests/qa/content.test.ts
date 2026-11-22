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
