import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/numerology/calculate/route";
import { GET as health } from "@/app/api/v1/health/route";
import { GET as config } from "@/app/api/v1/config/route";
import { GET as definitions } from "@/app/api/v1/numerology/definitions/route";
import { ApiError } from "@/lib/api/errors";
import { failure, preparePublicContent, preparedPublicContent, success } from "@/lib/api/response";
import { MAX_REQUEST_BYTES, REQUEST_BODY_TIMEOUT_MS, resolveMaxRequestBytes } from "@/lib/config";
import { getDefinitions, getInterpretation } from "@/lib/interpretations/catalog";
const fixture = { fullName:"Nguyễn Văn An",birthDate:"1990-05-20",referenceDate:"2026-11-08" };
const url="http://localhost/api/v1/numerology/calculate";
const request=(body: BodyInit, headers={"content-type":"application/json"})=>new Request(url,{method:"POST",headers,body});
afterEach(()=>vi.useRealTimers());
it("defaults to 4 KiB and validates private deployment overrides",()=>{
  expect(resolveMaxRequestBytes(undefined)).toBe(4096);
  expect(resolveMaxRequestBytes("2048")).toBe(2048);
  expect(resolveMaxRequestBytes("16384")).toBe(16384);
  for(const value of ["0","-1","NaN","Infinity","4096.1","999999999","2047","16385",""])expect(()=>resolveMaxRequestBytes(value)).toThrow("Invalid maximum request byte configuration.");
});
it("accepts exactly the configured byte boundary and rejects one extra byte",async()=>{
  const json=JSON.stringify(fixture);const padding=MAX_REQUEST_BYTES-Buffer.byteLength(json);
  expect((await POST(request(json+" ".repeat(padding)))).status).toBe(200);
  const oversized=await POST(request(json+" ".repeat(padding+1)));
  expect(oversized.status).toBe(413);expect((await oversized.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
});
it("accepts a valid maximum-length name even with every letter JSON-escaped",async()=>{
  const body='{"fullName":"'+"\\u0041".repeat(199)+'\\u0042","birthDate":"1990-05-20","referenceDate":"2026-11-08"}';
  expect(Buffer.byteLength(body)).toBeLessThan(2048);
  expect((await POST(request(body))).status).toBe(200);
});
it("does not await a hanging cancellation after detecting an oversized stream",async()=>{
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES+1));},cancel(){return new Promise(()=>{});}});
  const response=await POST(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:stream,duplex:"half"} as RequestInit));
  expect(response.status).toBe(413);
});
it("times out incomplete streams even when bytes already form valid JSON",async()=>{
  vi.useFakeTimers();
  const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify(fixture)));}});
  const pending=POST(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:stream,duplex:"half"} as RequestInit));
  await vi.advanceTimersByTimeAsync(REQUEST_BODY_TIMEOUT_MS+1);
  const response=await pending;expect(response.status).toBe(400);expect((await response.json()).error.code).toBe("INVALID_JSON");
  expect(vi.getTimerCount()).toBe(0);
});
it("bounds the number of empty stream chunks as well as bytes",async()=>{
  let chunks=0;
  const stream=new ReadableStream({pull(controller){chunks++;controller.enqueue(new Uint8Array());}});
  const response=await POST(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:stream,duplex:"half"} as RequestInit));
  expect(response.status).toBe(400);expect(chunks).toBeLessThanOrEqual(MAX_REQUEST_BYTES*2+2);
});
it("rejects query fields on endpoints with no query contract",async()=>{
  for(const response of [health(new Request("http://localhost/api/v1/health?name=private")),config(new Request("http://localhost/api/v1/config?extra=x")),await POST(new Request(url+"?name=private",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(fixture)}))]){
    expect(response.status).toBe(400);const body=await response.json();expect(body.error.code).toBe("VALIDATION_ERROR");expect(JSON.stringify(body)).not.toMatch(/private|name=|stack|\/Users\//);
  }
});
it("bounds public query parsing and rejects duplicate or unsupported query keys",async()=>{
  for(const query of ["?locale="+"x".repeat(300),"?locale=vi&locale=vi","?unknown=x"]){
    const response=definitions(new Request("http://localhost/api/v1/numerology/definitions"+query));expect(response.status).toBe(400);expect(response.headers.get("cache-control")).toBe("no-store");
  }
});
it("adds API security headers consistently without browser CORS or local HSTS",()=>{
  const publicData=preparePublicContent({sample:"public"});const first=preparedPublicContent(new Request(url),publicData);
  const cached=preparedPublicContent(new Request(url,{headers:{"if-none-match":first.headers.get("etag")!}}),publicData);
  for(const response of [success({ok:true}),failure(new Error("private /Users/path token=secret")),first,cached]){
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);expect(response.headers.has("strict-transport-security")).toBe(false);
  }
});
it("formats an application-origin 429 without pretending enforcement exists",async()=>{
  const response=failure(new ApiError(429,"RATE_LIMIT_EXCEEDED","Request limit exceeded.",undefined,45));
  expect(response.status).toBe(429);expect(response.headers.get("retry-after")).toBe("45");expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({success:false,error:{code:"RATE_LIMIT_EXCEEDED",message:"Request limit exceeded.",details:[]}});
  expect(failure(new ApiError(429,"RATE_LIMIT_EXCEEDED","Request limit exceeded.",undefined,NaN)).headers.get("retry-after")).toBe("60");
});
it("serializes prepared public content once without timing-sensitive assertions",async()=>{
  let calls=0;
  const prepared=preparePublicContent({toJSON(){calls++;return {public:true};}});
  for(let i=0;i<10;i++)expect(await preparedPublicContent(new Request(url),prepared).json()).toEqual({success:true,data:{public:true}});
  expect(calls).toBe(1);expect(Object.isFrozen(prepared)).toBe(true);
});
it("keeps public content deeply immutable and metadata reusable",()=>{
  const article=getInterpretation("personality",11)!;
  expect(Object.isFrozen(article)).toBe(true);expect(Object.isFrozen(article.strengths)).toBe(true);expect(Object.isFrozen(article.strengths[0])).toBe(true);
  expect(Reflect.set(article,"title","modified")).toBe(false);
  expect(getDefinitions()).toBe(getDefinitions());expect(Object.isFrozen(getDefinitions().definitions)).toBe(true);
});
