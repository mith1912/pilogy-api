import { API_ERROR_CODES } from "@/lib/api/errors";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { z } from "zod";
import { GET as config } from "@/app/api/v1/config/route";
import { GET as health } from "@/app/api/v1/health/route";
import { GET as definitions } from "@/app/api/v1/numerology/definitions/route";
import { GET as content } from "@/app/api/v1/numerology/interpretations/[index]/[value]/route";
import { POST } from "@/app/api/v1/numerology/calculate/route";

const contract = JSON.parse(readFileSync(new URL("../../docs/openapi.yaml", import.meta.url), "utf8"));
const schemas = JSON.parse(JSON.stringify(contract.components.schemas).replaceAll("#/components/schemas/", "#/$defs/"));
const schema = (name: string) => z.fromJSONSchema({ $ref: `#/$defs/${name}`, $defs: schemas });
const base = "http://localhost/api/v1/numerology";
const calculateRequest = (body: object) => new Request(`${base}/calculate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

it("publishes OpenAPI 3.1 for all implemented paths", () => {
  expect(contract.openapi).toBe("3.1.0");
  expect(schemas.Error.properties.error.properties.code.enum).toEqual(API_ERROR_CODES);
  expect(Object.keys(contract.paths)).toEqual(expect.arrayContaining(["/api/v1/health", "/api/v1/config", "/api/v1/numerology/calculate", "/api/v1/numerology/definitions", "/api/v1/numerology/interpretations/{type}/{value}"]));
  for (const name of Object.keys(schemas)) expect(() => schema(name)).not.toThrow();
});
it("validates real endpoint success envelopes against the published response schemas", async () => {
  const responses = [
    ["HealthResponse", health(new Request("http://localhost/api/v1/health"))],
    ["ConfigResponse", config(new Request("http://localhost/api/v1/config"))],
    ["DefinitionsResponse", definitions(new Request(`${base}/definitions`))],
    ["FullContentResponse", await content(new Request(`${base}/interpretations/personality/11`), { params: Promise.resolve({ index: "personality", value: "11" }) })],
    ["CalculateResponse", await POST(calculateRequest({ fullName: "Nguyễn Văn An", birthDate: "1990-05-20", referenceDate: "2026-11-08" }))],
  ] as const;
  for (const [name, response] of responses) {
    expect(response.status).toBe(200);
    schema(name).parse(await response.json());
  }
});
it("validates client and server error envelopes against the published schema", async () => {
  const responses = [
    await POST(calculateRequest({})),
    await POST(calculateRequest({ fullName: "Nguyễn Văn An", birthDate: "1990-05-22", referenceDate: "2026-11-08" })),
    await content(new Request(`${base}/interpretations/birthday/11`), { params: Promise.resolve({ index: "birthday", value: "11" }) }),
  ];
  for (const response of responses) {
    expect(response.status).toBeGreaterThanOrEqual(400);
    schema("Error").parse(await response.json());
  }
});
