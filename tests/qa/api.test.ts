import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { GET as content } from "@/app/api/v1/numerology/interpretations/[index]/[value]/route";
import { MAX_REQUEST_BYTES } from "@/lib/config";
import fixtures from "@/tests/fixtures/independent-v1.json";
import steps from "@/tests/fixtures/fixture-a-steps.json";
const input = fixtures[0].input;
const url = "http://localhost/api/v1/numerology/calculate";
const request = (body: unknown) => new Request(url, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
const cases: [string, unknown][] = [
  ["missing name", { birthDate: input.birthDate }],
  ["missing birth", { fullName: input.fullName }],
  ...["", "   ", "--123😀", "你好", "A".repeat(201), null, 123].map((fullName): [string, unknown] => ["invalid name", {...input,fullName}]),
  ...["2026-2-01","2026-02-30","1900-02-29","2100-02-29","0000-01-01","10000-01-01","2026-11-08\n",null].map((birthDate): [string, unknown] => ["invalid birth",{...input,birthDate}]),
  ...["2026-02-29","2026-13-01","2026-11-08T00:00:00Z",null].map((referenceDate): [string, unknown] => ["invalid reference",{...input,referenceDate}]),
  ["unsupported locale",{...input,locale:"en"}], ["null locale",{...input,locale:null}],
  ["unknown field",{...input,privateField:"do not reflect"}], ["array",[]], ["null body",null],
];
afterEach(() => vi.useRealTimers());
it.each(cases)("validates %s with safe 400 envelopes", async (_label, body) => {
  const response = await POST(request(body));
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const result = await response.json();
  expect(result).toMatchObject({ success:false,error:{code:"VALIDATION_ERROR",message:expect.any(String),details:expect.any(Array)} });
  expect(result).not.toHaveProperty("data");
  expect(JSON.stringify(result)).not.toMatch(/privateField|do not reflect|Nguyễn|stack/);
});
it.each([
  ["Nguyễn Văn An","NGUYEN VAN AN"],
  ["Nguye\u0302\u0303n Va\u0306n An","NGUYEN VAN AN"],
  ["Đặng đ","DANG D"],
  ["  A---J😀123  ","AJ"],
])("accepts documented normalization for %s", async (fullName, normalizedName) => {
  const response = await POST(request({...input,fullName}));
  expect(response.status).toBe(200);
  expect((await response.json()).data.name.normalizedName).toBe(normalizedName);
});
it.each(["2000-02-29","2024-02-29","2400-02-29"])("validates real leap date %s before reporting missing Birthday 11 content", async (birthDate) => {
  const response = await POST(request({...input,birthDate}));
  expect(response.status).toBe(500);
  expect((await response.json()).error.code).toBe("INTERPRETATION_CONTENT_MISSING");
});
it("verifies all fixture A fields, steps, summaries and repeatability through native handlers", async () => {
  const log = vi.spyOn(console,"log");
  const error = vi.spyOn(console,"error");
  const warn = vi.spyOn(console,"warn");
  try {
    const results = [];
    for (let i=0;i<3;i++) {
      const response = await POST(request(input));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.has("etag")).toBe(false);
      results.push(await response.json());
    }
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
    const {data}=results[0];
    expect(data).toMatchObject({ calculationVersion:"v1",contentVersion:"v1.0.0-draft",locale:"vi",referenceDate:input.referenceDate,name:fixtures[0].name });
    for (const [type,expected] of Object.entries(fixtures[0].expected)) {
      expect(data.indices[type]).toMatchObject({type,...expected,steps:steps[type as keyof typeof steps]});
      expect(data.interpretations[type]).toMatchObject({index:type,value:expected.value});
      for (const field of ["essence","strengths","challenges","careerAndGrowth","periodFocus"]) expect(data.interpretations[type]).not.toHaveProperty(field);
    }
    expect(log).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();
  } finally {log.mockRestore();error.mockRestore();warn.mockRestore();}
});
it.each([
  ["lifePath","8","life-path.json"], ["personality","11","personality.json"],
  ["personalYear","8","personal-year.json"], ["personalMonth","1","personal-month.json"],
])("serves source-exact full article %s/%s", async (index,value,filename) => {
  const raw = JSON.parse(readFileSync(new URL(`../../lib/interpretations/content/vi/${filename}`,import.meta.url),"utf8"));
  const response = await content(new Request(`http://localhost/api/v1/numerology/interpretations/${index}/${value}?locale=vi`),{params:Promise.resolve({index,value})});
  expect(response.status).toBe(200);
  expect((await response.json()).data.interpretation).toEqual(raw.items.find((item:{value:number}) => item.value === Number(value)));
});
it("rejects malformed JSON and invalid UTF-8", async () => {
  for (const body of ["{",new Uint8Array([0xff])]) {
    const response = await POST(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body}));
    expect(response.status).toBe(400);expect((await response.json()).error.code).toBe("INVALID_JSON");
  }
});
it("retains the byte-limit error even if cancelling an oversized stream rejects", async () => {
  const stream = new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES+1));},cancel(){throw new Error("synthetic cancellation failure");}});
  const response = await POST(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:stream,duplex:"half"} as RequestInit));
  expect(response.status).toBe(413);
  expect((await response.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
});
