import { request as httpRequest } from "node:http";
import assert from "node:assert/strict";
import { readFileSync,writeFileSync } from "node:fs";
const base=process.env.QA_BASE_URL??"http://127.0.0.1:3105";
if(!["localhost","127.0.0.1","[::1]"].includes(new URL(base).hostname))throw new Error("Security HTTP checks require localhost.");
const results=[];
async function check(name,run){try{await run();results.push({name,status:"PASS"});}catch{results.push({name,status:"FAIL"});}}
for(const [path,allowed] of [["/health","GET"],["/config","GET"],["/numerology/definitions","GET"],["/numerology/interpretations/lifePath/8","GET"],["/numerology/calculate","POST"]]){
 for(const method of ["GET","POST","PUT","PATCH","DELETE"]){
  if(method===allowed)continue;
  await check(`${method} ${path}: framework 405`,async()=>{
   const response=await fetch(base+"/api/v1"+path,{method,signal:AbortSignal.timeout(5000)});assert.equal(response.status,405);assert.equal(response.headers.get("x-content-type-options"),"nosniff");assert.equal(response.headers.get("referrer-policy"),"no-referrer");assert.equal(response.headers.has("access-control-allow-origin"),false);
  });
 }
 await check(`OPTIONS ${path}: only required methods, no browser CORS grant`,async()=>{
  const response=await fetch(base+"/api/v1"+path,{method:"OPTIONS",signal:AbortSignal.timeout(5000)});assert.equal(response.status,204);const allow=response.headers.get("allow");assert.ok(allow?.includes(allowed));assert.equal(allow.includes("DELETE"),false);assert.equal(response.headers.has("access-control-allow-origin"),false);
 });
}
for(const path of ["/health","/config","/numerology/definitions","/numerology/interpretations/lifePath/8","/numerology/calculate"]){
 await check(`TRACE ${path}: framework 405`,()=>new Promise((resolve,reject)=>{
  const req=httpRequest(base+"/api/v1"+path,{method:"TRACE",timeout:5000},(response)=>{
   response.resume();try{assert.equal(response.statusCode,405);resolve();}catch(error){reject(error);}
  });req.on("error",reject);req.on("timeout",()=>req.destroy(new Error("timeout")));req.end();
 }));
}
for(const path of ["/health?extra=x","/config?extra=x","/numerology/definitions?locale=vi&locale=vi"]){
 await check(`${path.split("?")[0]}: unexpected query 400`,async()=>{const response=await fetch(base+"/api/v1"+path);assert.equal(response.status,400);assert.equal(response.headers.get("cache-control"),"no-store");assert.equal((await response.json()).error.code,"VALIDATION_ERROR");});
}
const fixture=JSON.parse(readFileSync(new URL("../tests/fixtures/independent-v1.json",import.meta.url),"utf8"))[0].input;
await check("4 KiB boundary and noncacheable Calculate response",async()=>{
 const json=JSON.stringify(fixture),padding=4096-Buffer.byteLength(json);
 for(const [extra,status] of [[0,200],[1,413]]){
  const response=await fetch(base+"/api/v1/numerology/calculate",{method:"POST",headers:{"content-type":"application/json"},body:json+" ".repeat(padding+extra),signal:AbortSignal.timeout(5000)});assert.equal(response.status,status);assert.equal(response.headers.get("cache-control"),"no-store");assert.equal(response.headers.has("etag"),false);
 }
});
const report={passed:results.filter((item)=>item.status==="PASS").length,failed:results.filter((item)=>item.status==="FAIL").length,results};
writeFileSync(new URL("../docs/security/http-security-results.json",import.meta.url),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
