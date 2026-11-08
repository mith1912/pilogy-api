import { expect, it } from "vitest";
import { parseCalendarDate } from "@/lib/numerology/date";
import { calculateSchema } from "@/lib/validation/calculate";
import { interpretationParamsSchema, interpretationSchema } from "@/lib/validation/interpretations";
import { interpretationCatalog } from "@/lib/interpretations/catalog";

it.each(["2026-11-08\n", "2026-11-08\r", "2026-11-08\r\n"])("rejects trailing line terminators in exact date-only inputs: %j", (value) => {
  expect(() => parseCalendarDate(value)).toThrow();
  expect(calculateSchema.safeParse({ fullName: "Nguyễn Văn An", birthDate: value }).success).toBe(false);
});
it.each(["1\n", "11\n", "22\r", "33\r\n"])("rejects noncanonical lookup values: %j", (value) => {
  expect(interpretationParamsSchema.safeParse({ index: "lifePath", value }).success).toBe(false);
});
it("rejects an unreachable Birthday 33 article at schema validation", () => {
  const sample = interpretationCatalog.find((item) => item.index === "lifePath" && item.value === 33)!;
  expect(interpretationSchema.safeParse({ ...sample, index: "birthday" }).success).toBe(false);
});
