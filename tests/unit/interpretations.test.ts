import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { CONTENT_VERSION, getDefinitions, getInterpretation, interpretationCatalog } from "@/lib/interpretations/catalog";
import { interpretationFileSchema, interpretationSchema } from "@/lib/validation/interpretations";
import coverage from "@/lib/interpretations/content/vi/coverage.json";
import { INDEX_IDS } from "@/lib/numerology/types";

describe("imported interpretation coverage", () => {
  it("matches every imported item exactly without rewriting content", () => {
    const directory = new URL("../../lib/interpretations/content/vi/", import.meta.url);
    const items = readdirSync(directory).filter((name) => name.endsWith(".json") && name !== "coverage.json")
      .flatMap((name) => {
        const raw = JSON.parse(readFileSync(new URL(name, directory), "utf8"));
        expect(interpretationFileSchema.parse(raw)).toEqual(raw);
        return raw.items;
      });
    expect(interpretationCatalog).toHaveLength(items.length);
    for (const item of items) expect(getInterpretation(item.index, item.value)).toEqual(item);
  });
  it("matches the supplied version and all 99 coverage entries", () => {
    expect(CONTENT_VERSION).toBe(coverage.contentVersion);
    expect(interpretationCatalog).toHaveLength(coverage.total);
    for (const index of INDEX_IDS) {
      const items = interpretationCatalog.filter((item) => item.index === index);
      expect(items).toHaveLength(coverage.counts[index]);
      expect(new Set(items.map((item) => item.value)).size).toBe(items.length);
      for (let value = 1; value <= 9; value++) expect(getInterpretation(index, value)).toBeDefined();
    }
  });
  it("covers core masters and explicitly reports missing Birthday content", () => {
    for (const index of ["lifePath", "expression", "soulUrge", "personality", "attitude", "maturity"] as const) {
      for (const value of [11, 22, 33]) expect(getInterpretation(index, value)).toBeDefined();
    }
    expect(getDefinitions().missingContent).toEqual([{ index: "birthday", values: [11, 22] }]);
    for (const value of [11, 22]) expect(getInterpretation("birthday", value)).toBeUndefined();
  });
  it("rejects malformed content, wrong bases, cycle masters and duplicates", () => {
    const item = interpretationCatalog[0];
    for (const invalid of [{ ...item, summary: " " }, { ...item, baseValue: 9 }, { ...item, strengths: [] }, { ...item, index: "unknown" }, { ...item, index: "personalYear", value: 11, baseValue: 2 }]) {
      expect(interpretationSchema.safeParse(invalid).success).toBe(false);
    }
    expect(interpretationFileSchema.safeParse({ locale: "vi", contentVersion: CONTENT_VERSION, index: item.index, items: [item, item] }).success).toBe(false);
    expect(interpretationFileSchema.safeParse({ locale: "vi", contentVersion: CONTENT_VERSION, index: "birthday", items: [item] }).success).toBe(false);
  });
});
