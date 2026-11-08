import { expect, it } from "vitest";
import witnesses from "@/tests/fixtures/domain-witnesses.json";
import { calculateNumerology } from "@/lib/numerology/service";
import { getSupportedValues } from "@/lib/interpretations/definitions";
import { INDEX_IDS, type IndexId } from "@/lib/numerology/types";

it.each(witnesses)("reachable domain witness $type/$value", (witness) => {
  const type = witness.type as IndexId;
  expect(calculateNumerology({ ...witness.input, locale: "vi" }).indices[type].value).toBe(witness.value);
});
it("definitions match exactly the independently witnessed domain", () => {
  expect(witnesses).toHaveLength(101);
  for (const type of INDEX_IDS) {
    const values = witnesses.filter((witness) => witness.type === type).map((witness) => witness.value).sort((a,b) => a-b);
    expect(getSupportedValues(type)).toEqual(values);
  }
});
