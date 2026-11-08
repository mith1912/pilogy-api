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
it.each([["birthday", "11"], ["birthday", "22"], ["personalYear", "11"]])("reports missing content for %s %s", async (index, value) => {
  const response = await retrieve(index, value);
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, error: { code: "INTERPRETATION_NOT_FOUND" } });
});
it.each(["1990-05-20"])("adds exact summaries without changing calculations for %s", async (birthDate) => {
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

it.each(["1998-02-11", "1990-05-22"])("fails Calculate when required Birthday content is absent: %s", async (birthDate) => {
  const response = await POST(new Request("http://localhost/api/v1/numerology/calculate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Nguyễn Văn An", birthDate, referenceDate: "2026-11-08" }) }));
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ success: false, error: { code: "INTERPRETATION_CONTENT_MISSING", message: "Required interpretation content is unavailable.", details: [] } });
});
