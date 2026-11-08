import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { GET as health } from "@/app/api/v1/health/route";
import { GET as config } from "@/app/api/v1/config/route";
import { GET as definitions } from "@/app/api/v1/numerology/definitions/route";
import { MAX_REQUEST_BYTES } from "@/lib/config";

const valid = { fullName: "Nguyễn An", birthDate: "1990-05-20" };
function request(body: string, headers: Record<string, string> = { "content-type": "application/json" }) {
  return new Request("http://localhost/api/v1/numerology/calculate", { method: "POST", body, headers });
}
async function assertError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(body).toMatchObject({ success: false, error: { code, message: expect.any(String) } });
  expect(body).not.toHaveProperty("data");
  return body;
}
describe("route integration (native Request/Response)", () => {
  it("reports service health", async () => {
    expect(await health(new Request("http://localhost/api/v1/health")).json()).toEqual({ success: true, data: { status: "ok", apiVersion: "v1" } });
  });
  it("exposes only public config", async () => {
    expect(await config(new Request("http://localhost/api/v1/config")).json()).toEqual({ success: true, data: {
      apiVersion: "v1", calculationVersion: "v1", defaultLocale: "vi", supportedLocales: ["vi"],
      maxRequestBytes: MAX_REQUEST_BYTES, calculationAvailable: true, features: { calculations: true, interpretationSummaries: true, fullInterpretations: true, definitions: true },
    } });
  });
  it("exposes imported draft content definitions", async () => {
    expect(await definitions(new Request("http://localhost/api/v1/numerology/definitions")).json()).toMatchObject({ success: true, data: { status: "draft", definitions: expect.any(Array), plannedIndices: expect.arrayContaining(["lifePath", "personalMonth"]) } });
  });
  it("returns structured calculation results", async () => {
    const response = await POST(request(JSON.stringify({ ...valid, referenceDate: "2026-11-08" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: { calculationVersion: "v1", indices: { lifePath: { type: "lifePath", value: expect.any(Number), baseValue: expect.any(Number), steps: expect.any(Array) }, personalYear: { referenceDate: "2026-11-08" } } } });
  });
  it.each(["{", "", "null", "[]"])("handles invalid JSON or shape %s", async (body) => {
    await assertError(await POST(request(body)), 400, body === "{" || body === "" ? "INVALID_JSON" : "VALIDATION_ERROR");
  });
  it("validates missing names and invalid dates", async () => {
    for (const input of [{ birthDate: valid.birthDate }, { ...valid, birthDate: "2023-02-29" }]) {
      await assertError(await POST(request(JSON.stringify(input))), 400, "VALIDATION_ERROR");
    }
  });
  it("does not reflect personal data or unknown keys in errors", async () => {
    const body = await assertError(await POST(request(JSON.stringify({ ...valid, fullName: "", "private-name": "private-value" }))), 400, "VALIDATION_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/private-name|private-value|Nguyễn/);
  });
  it("requires JSON media type", async () => {
    await assertError(await POST(request("{}", {})), 415, "UNSUPPORTED_MEDIA_TYPE");
  });
  it("accepts JSON content type parameters", async () => {
    expect((await POST(request(JSON.stringify(valid), { "content-type": "application/json; charset=utf-8" }))).status).toBe(200);
  });
  it("limits bytes with absent, false, or oversized content-length", async () => {
    for (const length of [undefined, "1", String(MAX_REQUEST_BYTES + 1)]) {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (length) headers["content-length"] = length;
      await assertError(await POST(request("ư".repeat(MAX_REQUEST_BYTES), headers)), 413, "PAYLOAD_TOO_LARGE");
    }
  });
  it("limits multi-chunk streams", async () => {
    const stream = new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    } });
    const req = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
    await assertError(await POST(req), 413, "PAYLOAD_TOO_LARGE");
  });
});

it("reports unspecified empty-letter-group rules without fabricated zero indices", async () => {
  await assertError(await POST(request(JSON.stringify({ ...valid, fullName: "Lynn" }))), 422, "CALCULATION_RULE_UNSPECIFIED");
});

afterEach(() => vi.useRealTimers());

it("returns all nine indices for the approved reference date", async () => {
  const response = await POST(request(JSON.stringify({ fullName: "Nguyễn Văn An", birthDate: "1990-05-20", referenceDate: "2026-11-08" })));
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(data.referenceDate).toBe("2026-11-08");
  expect(Object.fromEntries(Object.entries(data.indices).map(([key, index]) => [key, (index as { value: number }).value])))
    .toEqual({ lifePath: 8, expression: 3, soulUrge: 1, personality: 11, birthday: 2, attitude: 7, maturity: 11, personalYear: 8, personalMonth: 1 });
  for (const [type, index] of Object.entries(data.indices)) {
    expect(index).toMatchObject({ type, value: expect.any(Number), baseValue: expect.any(Number), steps: expect.any(Array) });
  }
});

it.each(["2026-01-01T00:30:00Z", "2026-12-31T23:30:00Z"])("defaults to the UTC calendar date at %s", async (instant) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(instant));
  const { data } = await (await POST(request(JSON.stringify(valid)))).json();
  expect(data.referenceDate).toBe(instant.slice(0, 10));
  expect(Object.keys(data.indices)).toHaveLength(9);
  expect(data.indices.personalYear.referenceDate).toBe(data.referenceDate);
  expect(data.indices.personalMonth.referenceDate).toBe(data.referenceDate);
});

it.each([null, "", "2026-02-29", "2026-13-01", "2026-1-01", "2026-11-08T00:00:00Z", 2026])("rejects invalid referenceDate %s", async (referenceDate) => {
  const body = await assertError(await POST(request(JSON.stringify({ ...valid, referenceDate }))), 400, "VALIDATION_ERROR");
  expect(body.error.details).toContainEqual({ field: "referenceDate", code: expect.any(String) });
});

it("supports the legacy date alias and rejects conflicting dates", async () => {
  const { data } = await (await POST(request(JSON.stringify({ ...valid, targetDate: "2026-11-08" })))).json();
  expect(data.referenceDate).toBe("2026-11-08");
  await assertError(await POST(request(JSON.stringify({ ...valid, targetDate: "2026-11-08", referenceDate: "2027-01-01" }))), 400, "VALIDATION_ERROR");
});
