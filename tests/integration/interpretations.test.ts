import { GET as definitions } from "@/app/api/v1/numerology/definitions/route";
import { expect, it } from "vitest";
import { GET } from "@/app/api/v1/numerology/interpretations/[index]/[value]/route";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { getInterpretation, interpretationCatalog } from "@/lib/interpretations/catalog";

function retrieve(index: string, value: string, query = "") {
  return GET(new Request(`http://localhost/api/v1/numerology/interpretations/${index}/${value}${query}`), { params: Promise.resolve({ index, value }) });
}
it("retrieves every imported full interpretation verbatim", async () => {
  for (const item of interpretationCatalog) {
    const response = await retrieve(item.index, String(item.value));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(await response.json()).toMatchObject({ success: true, data: { locale: "vi", contentVersion: "v1.0.0-draft", interpretation: item } });
  }
});
it.each([["unknown", "1", ""], ["lifePath", "01", ""], ["lifePath", "10", ""], ["lifePath", "1", "?locale=en"], ["lifePath", "1", "?extra=yes"], ["lifePath", "1", "?locale=vi&locale=vi"]])("rejects invalid lookup %s %s %s", async (index, value, query) => {
  const response = await retrieve(index, value, query);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
});
it.each([["personalYear", "11"]])("reports missing content for %s %s", async (index, value) => {
  const response = await retrieve(index, value);
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, error: { code: "INTERPRETATION_NOT_FOUND" } });
});
it.each(["1990-05-20", "1998-02-11", "1990-05-22", ...Array.from({ length: 9 }, (_, i) => `2013-12-0${i + 1}`)])("adds exact summaries without changing calculations for %s", async (birthDate) => {
  const response = await POST(new Request("http://localhost/api/v1/numerology/calculate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Nguyễn Văn An", birthDate, referenceDate: "2026-11-08" }) }));
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(Object.keys(data.indices)).toHaveLength(9);
  expect(Object.keys(data.interpretations)).toHaveLength(9);
  for (const [index, calculation] of Object.entries(data.indices)) {
    const item = getInterpretation(index as Parameters<typeof getInterpretation>[0], (calculation as { value: number }).value);
    expect(item).toBeDefined();
    if (item) {
      expect(data.interpretations[index]).toMatchObject({ value: item.value, summary: item.summary, title: item.title });
      expect(data.interpretations[index]).not.toHaveProperty("essence");
    }
  }
});

it.each([11, 22])("retrieves Birthday %s with its preserved master and base", async (value) => {
  const response = await retrieve("birthday", String(value), "?locale=vi");
  expect(response.status).toBe(200);
  expect((await response.json()).data.interpretation).toMatchObject({ index: "birthday", value, baseValue: value === 11 ? 2 : 4 });
});
it("resolves the exact production request with all nine summaries", async () => {
  const response = await POST(new Request("http://localhost/api/v1/numerology/calculate", { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Bùi Khải An", birthDate: "2013-12-22", referenceDate: "2026-11-08", locale: "vi" }) }));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.indices.birthday).toMatchObject({ value: 22, baseValue: 4 });
  expect(body.data.interpretations.birthday).toMatchObject({ value: 22, baseValue: 4 });
  expect(Object.keys(body.data.indices)).toHaveLength(9);
  expect(Object.keys(body.data.interpretations)).toHaveLength(9);
  for (const summary of Object.values(body.data.interpretations)) expect(summary).toHaveProperty("summary", expect.any(String));
});

it("Definitions advertises only loaded content with complete coverage across nine indices", async () => {
  const response = await definitions(new Request("http://localhost/api/v1/numerology/definitions?locale=vi"));
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(data.missingContent).toEqual([]);
  expect(data.definitions).toHaveLength(9);
  let total = 0;
  for (const definition of data.definitions) {
    expect(definition.availableValues).toEqual(definition.supportedValues);
    for (const value of definition.supportedValues) {
      const article = await retrieve(definition.type, String(value), "?locale=vi");
      expect(article.status).toBe(200);
      total++;
    }
  }
  expect(total).toBe(101);
});
