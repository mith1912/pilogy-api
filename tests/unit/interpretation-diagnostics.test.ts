import { expect, it, vi } from "vitest";
import { getInterpretationSummaries } from "@/lib/interpretations/catalog";
import { calculateNumerology } from "@/lib/numerology/service";
import { failure } from "@/lib/api/response";

it("reports only catalog coordinates when a required summary is unavailable", async () => {
  const result = calculateNumerology({ fullName: "Bùi Khải An", birthDate: "2013-12-22", referenceDate: "2026-11-08", locale: "vi" });
  // Simulate an engine/catalog mismatch without deleting immutable production content.
  result.indices.birthday.value = 33;
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    let caught: unknown;
    try { getInterpretationSummaries(result.indices); } catch (error) { caught = error; }
    expect(caught).toBeDefined();
    expect(log).toHaveBeenCalledExactlyOnceWith("INTERPRETATION_CONTENT_MISSING", { index: "birthday", value: 33 });
    const response = failure(caught);
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ success: false, error: {
      code: "INTERPRETATION_CONTENT_MISSING", message: "Required interpretation content is unavailable.",
      details: [{ field: "interpretations.birthday", code: "MISSING_VALUE_33" }],
    } });
  } finally { log.mockRestore(); }
});
