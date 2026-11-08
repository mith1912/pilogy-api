import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";

const base = process.env.QA_BASE_URL ?? "http://127.0.0.1:3105";
const fixture = JSON.parse(readFileSync(new URL("../tests/fixtures/independent-v1.json", import.meta.url),"utf8"))[0];
const steps = JSON.parse(readFileSync(new URL("../tests/fixtures/fixture-a-steps.json", import.meta.url),"utf8"));
const contract = JSON.parse(readFileSync(new URL("../docs/openapi.yaml",import.meta.url),"utf8"));
const schemas = JSON.parse(JSON.stringify(contract.components.schemas).replaceAll("#/components/schemas/","#/$defs/"));
const schema = (name) => z.fromJSONSchema({ $ref:`#/$defs/${name}`, $defs:schemas });
const results = [];
async function check(name, run) {
  try { await run(); results.push({name,status:"PASS"}); }
  catch (error) { results.push({name,status:"FAIL",reason: error instanceof assert.AssertionError ? "HTTP contract assertion failed" : error.code ?? error.name}); }
}
const get = (path, headers={}) => fetch(`${base}/api/v1${path}`,{headers,signal:AbortSignal.timeout(10000)});
const post = (data) => fetch(`${base}/api/v1/numerology/calculate`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
for (const [path,name] of [["/health","HealthResponse"],["/config","ConfigResponse"],["/numerology/definitions?locale=vi","DefinitionsResponse"]]) {
  await check(`GET ${path}: 200 and OpenAPI schema`,async()=>{ const response=await get(path);assert.equal(response.status,200);schema(name).parse(await response.json()); });
}
let calculated;
await check("Calculate fixture A: all nine constants, complete steps, versions and no-store",async()=>{
  const response=await post(fixture.input);assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");assert.equal(response.headers.get("etag"),null);
  const body=await response.json();schema("CalculateResponse").parse(body);calculated=body;
  assert.equal(body.data.referenceDate,fixture.input.referenceDate);assert.equal(body.data.calculationVersion,"v1");assert.equal(body.data.contentVersion,"v1.0.0-draft");
  for (const [type,expected] of Object.entries(fixture.expected)) {
    assert.equal(body.data.indices[type].value,expected.value);assert.equal(body.data.indices[type].baseValue,expected.baseValue);assert.deepEqual(body.data.indices[type].steps,steps[type]);
    assert.equal(body.data.interpretations[type].value,expected.value);assert.equal(body.data.interpretations[type].index,type);assert.equal("essence" in body.data.interpretations[type],false);
  }
});
await check("Calculate repeated requests are identical",async()=>{
  assert.ok(calculated);for(let repeat=0;repeat<2;repeat++)assert.deepEqual(await (await post(fixture.input)).json(),calculated);
});
await check("Calculate omitted referenceDate uses UTC calendar date",async()=>{
  const before=new Date().toISOString().slice(0,10);const input={...fixture.input};delete input.referenceDate;
  const response=await post(input);assert.equal(response.status,200);const body=await response.json();const after=new Date().toISOString().slice(0,10);assert.ok([before,after].includes(body.data.referenceDate));
});
for (const [type,value,file] of [["lifePath",8,"life-path"],["personality",11,"personality"],["personalYear",8,"personal-year"],["personalMonth",1,"personal-month"]]) {
  await check(`Full ${type}/${value}: exact source article and schema`,async()=>{
    const response=await get(`/numerology/interpretations/${type}/${value}?locale=vi`);assert.equal(response.status,200);const body=await response.json();schema("FullContentResponse").parse(body);
    const source=JSON.parse(readFileSync(new URL(`../lib/interpretations/content/vi/${file}.json`,import.meta.url),"utf8"));
    assert.deepEqual(body.data.interpretation,source.items.find((item)=>item.value===value));
    assert.equal(body.data.contentVersion,calculated.data.contentVersion);
    assert.equal(body.data.interpretation.summary,calculated.data.interpretations[type].summary);
  });
}
for (const path of ["/numerology/definitions?locale=vi","/numerology/interpretations/personality/11?locale=vi"]) {
  await check(`ETag 304 ${path}`,async()=>{
    const first=await get(path);assert.equal(first.status,200);const etag=first.headers.get("etag");assert.ok(etag);assert.equal(first.headers.get("cache-control"),"public, max-age=0, must-revalidate");
    const second=await get(path,{"if-none-match":etag});assert.equal(second.status,304);assert.equal(await second.text(),"");assert.equal(second.headers.get("etag"),etag);
  });
}
for(const [path,status,code] of [
 ["/numerology/interpretations/invalid/8",400,"VALIDATION_ERROR"],["/numerology/interpretations/lifePath/10",400,"VALIDATION_ERROR"],["/numerology/interpretations/lifePath/8?locale=en",400,"VALIDATION_ERROR"],
 ["/numerology/interpretations/birthday/11",404,"INTERPRETATION_NOT_FOUND"],["/numerology/interpretations/birthday/22",404,"INTERPRETATION_NOT_FOUND"],["/numerology/definitions?locale=en",400,"VALIDATION_ERROR"],
 ["/numerology/definitions?locale=vi&locale=vi",400,"VALIDATION_ERROR"],
])await check(`Error ${path}: ${status} ${code}`,async()=>{const response=await get(path);assert.equal(response.status,status);assert.equal(response.headers.get("cache-control"),"no-store");const body=await response.json();schema("Error").parse(body);assert.equal(body.error.code,code);});
for(const [label,extra,status,code] of [
 ["invalid birth",{birthDate:"1900-02-29"},400,"VALIDATION_ERROR"],["invalid reference",{referenceDate:"2026-02-29"},400,"VALIDATION_ERROR"],["unknown locale",{locale:"en"},400,"VALIDATION_ERROR"],["unknown field",{extra:true},400,"VALIDATION_ERROR"],
 ["Birthday 11",{birthDate:"1998-02-11"},500,"INTERPRETATION_CONTENT_MISSING"],["Birthday 22",{birthDate:"1990-05-22"},500,"INTERPRETATION_CONTENT_MISSING"],["day 29",{birthDate:"2000-02-29"},500,"INTERPRETATION_CONTENT_MISSING"],
 ["zero vowel group",{fullName:"Lynn"},422,"CALCULATION_RULE_UNSPECIFIED"],
])await check(`Calculate ${label}: ${status} ${code}`,async()=>{const response=await post({...fixture.input,...extra});assert.equal(response.status,status);assert.equal(response.headers.get("cache-control"),"no-store");const body=await response.json();schema("Error").parse(body);assert.equal(body.error.code,code);});
for(const [name,body,contentType,status,code] of [["malformed JSON","{","application/json",400,"INVALID_JSON"],["oversized body","x".repeat(16385),"application/json",413,"PAYLOAD_TOO_LARGE"],["wrong media type","{}","text/plain",415,"UNSUPPORTED_MEDIA_TYPE"]])await check(name,async()=>{const response=await fetch(`${base}/api/v1/numerology/calculate`,{method:"POST",headers:{"content-type":contentType},body,signal:AbortSignal.timeout(10000)});assert.equal(response.status,status);const result=await response.json();schema("Error").parse(result);assert.equal(result.error.code,code);});
const report={transport:"actual HTTP against next start from the Webpack production build",baseUrl:base,passed:results.filter((item)=>item.status==="PASS").length,failed:results.filter((item)=>item.status==="FAIL").length,results};
writeFileSync(new URL(process.env.QA_REPORT_SCOPE === "security" ? "../docs/security/http-qa-results.json" : "../docs/qa/http-results.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({passed:report.passed,failed:report.failed}));
if(report.failed)process.exitCode=1;
