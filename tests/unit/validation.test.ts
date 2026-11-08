import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateSchema } from "@/lib/validation/calculate";
import { calculateNumerology } from "@/lib/numerology/service";
import { failure, success } from "@/lib/api/response";

afterEach(() => vi.useRealTimers());

const valid = { fullName: " Nguyễn An ", birthDate: "2000-02-29" };
describe("validation", () => {
  it("accepts Unicode names, trims and defaults locale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-08T23:59:59Z"));
    expect(calculateSchema.parse(valid)).toEqual({ ...valid, fullName: "Nguyễn An", locale: "vi", referenceDate: "2026-11-08" });
  });
  it.each(["2023-02-29", "1900-02-29", "2000-02-30", "2020-04-31", "2020-13-01", "0000-01-01", "2020-1-01", "2020-01-01T00:00:00Z", "bad"])("rejects invalid date %s", (birthDate) => {
    expect(calculateSchema.safeParse({ ...valid, birthDate }).success).toBe(false);
  });
  it.each([undefined, null, "", "   ", 123, "a".repeat(201)])("rejects missing or invalid full name %s", (fullName) => {
    expect(calculateSchema.safeParse({ ...valid, fullName }).success).toBe(false);
  });
  it("rejects unsupported locales, unknown fields and non-objects", () => {
    for (const input of [{ ...valid, locale: "en" }, { ...valid, extra: true }, null, [], "name"]) {
      expect(calculateSchema.safeParse(input).success).toBe(false);
    }
  });
});
it("calculates with the active version", () => {
  expect(calculateNumerology(calculateSchema.parse(valid)).calculationVersion).toBe("v1");
});
it("wraps successes and hides unexpected errors", async () => {
  expect(await success({ status: "ok" }).json()).toEqual({ success: true, data: { status: "ok" } });
  const response = failure(new Error("secret personal information"));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", details: [] } });
});
