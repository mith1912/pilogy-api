import { expect, it } from "vitest";
import { gzipSync } from "node:zlib";
import { GET as definitions } from "@/app/api/v1/numerology/definitions/route";
import { GET as content } from "@/app/api/v1/numerology/interpretations/[index]/[value]/route";
import { GET as config } from "@/app/api/v1/config/route";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { calculateNumerology } from "@/lib/numerology/service";
import { calculateSchema } from "@/lib/validation/calculate";
import { INDEX_IDS } from "@/lib/numerology/types";
import { CONTENT_VERSION } from "@/lib/interpretations/catalog";
const fixture = { fullName: "Nguyễn Văn An", birthDate: "1990-05-20", referenceDate: "2026-11-08", locale: "vi" };
const base = "http://localhost/api/v1/numerology";
it("preserves every calculation field and matches all nine full articles", async () => {
  const response = await POST(new Request(`${base}/calculate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fixture) }));
  expect(response.headers.get("cache-control")).toBe("no-store");
  const { data } = await response.json();
  const calculated = calculateNumerology(calculateSchema.parse(fixture));
  expect(data).toMatchObject(calculated);
  expect(data.contentVersion).toBe(CONTENT_VERSION);
  expect(Object.keys(data.interpretations).sort()).toEqual([...INDEX_IDS].sort());
  for (const type of INDEX_IDS) {
    expect(data.indices[type].steps.length).toBeGreaterThan(0);
    const full = await content(new Request(`${base}/interpretations/${type}/${data.indices[type].value}`), { params: Promise.resolve({ index: type, value: String(data.indices[type].value) }) });
    const article = (await full.json()).data;
    expect(article.contentVersion).toBe(data.contentVersion);
    expect(data.interpretations[type]).toMatchObject({ index: type, value: data.indices[type].value, title: article.interpretation.title, subtitle: article.interpretation.subtitle, tagline: article.interpretation.tagline, summary: article.interpretation.summary });
    expect(data.interpretations[type]).not.toHaveProperty("strengths");
  }
});
it("defines all nine types with actual engine and content ranges", async () => {
  const { data } = await definitions(new Request(`${base}/definitions?locale=vi`)).json();
  expect(data.definitions.map((item: { type: string }) => item.type)).toEqual(INDEX_IDS);
  data.definitions.forEach((item: { displayOrder: number; type: string; supportedValues: number[]; availableValues: number[]; supportsMasterNumbers: boolean }, order: number) => {
    expect(item.displayOrder).toBe(order + 1);
    expect(item.supportsMasterNumbers).toBe(!["personalYear", "personalMonth"].includes(item.type));
    expect(item.availableValues.every((value) => item.supportedValues.includes(value))).toBe(true);
  });
  expect(data.definitions.find((item: { type: string }) => item.type === "birthday")).toMatchObject({ supportedValues: [1,2,3,4,5,6,7,8,9,11,22], availableValues: [1,2,3,4,5,6,7,8,9] });
});
it.each(["?locale=en", "?locale=", "?extra=x", "?locale=vi&locale=vi"])("validates definitions query %s", async (query) => {
  const response = definitions(new Request(`${base}/definitions${query}`));
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR", details: [] } });
});
it("revalidates public content with ETags and no body on 304", async () => {
  for (const handler of [
    (request: Request) => definitions(request),
    (request: Request) => content(request, { params: Promise.resolve({ index: "personality", value: "11" }) }),
  ]) {
    const first = await handler(new Request(`${base}/definitions`));
    const etag = first.headers.get("etag")!;
    expect(etag).toMatch(/^W\/"[a-f0-9]+"$/);
    const second = await handler(new Request(`${base}/definitions`, { headers: { "if-none-match": etag } }));
    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
    expect(second.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect((await handler(new Request(`${base}/definitions`, { headers: { "if-none-match": '"different"' } }))).status).toBe(200);
  }
});
it.each([{ locale: "en" }, { surprise: true }, { referenceDate: "1900-02-29" }])("rejects invalid Calculate fields %o", async (extra) => {
  const response = await POST(new Request(`${base}/calculate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...fixture, ...extra }) }));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR", details: expect.any(Array) } });
});
it("measures representative serialized UTF-8 payloads", async () => {
  const responses = {
    calculate: await POST(new Request(`${base}/calculate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fixture) })),
    interpretation: await content(new Request(`${base}/interpretations/lifePath/8`), { params: Promise.resolve({ index: "lifePath", value: "8" }) }),
    definitions: definitions(new Request(`${base}/definitions`)), config: config(new Request("http://localhost/api/v1/config")),
  };
  for (const [endpoint, response] of Object.entries(responses)) {
    const bytes = Buffer.from(await response.text());
    console.info(`Payload ${endpoint}: ${bytes.length} bytes UTF-8, ${gzipSync(bytes).length} bytes gzip`);
    expect(bytes.length).toBeLessThan(endpoint === "calculate" ? 20000 : 15000);
  }
});
