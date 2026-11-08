import { performance } from "node:perf_hooks";
import { cpus, platform, release, arch, totalmem } from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @param {Record<string, string | undefined>} [env] */
export function benchmarkSettings(env=process.env) {
  const url=new URL(env.BENCHMARK_BASE_URL??"http://127.0.0.1:3105");
  if(!["http:","https:"].includes(url.protocol)||!["localhost","127.0.0.1","[::1]"].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=="/")throw new Error("Benchmark target must be a localhost origin.");
  const count=Number(env.BENCHMARK_REQUESTS??60),concurrency=Number(env.BENCHMARK_CONCURRENCY??2);
  if(!Number.isInteger(count)||count<20||count>100||!Number.isInteger(concurrency)||concurrency<1||concurrency>4)throw new Error("Benchmark bounds: 20–100 requests per endpoint, concurrency 1–4.");
  return {base:url.origin,count,concurrency,warmups:5};
}
function serverRss(pid) {
  if(!pid||!/^\d+$/.test(pid))return null;
  try{return Number(execFileSync("ps",["-p",pid,"-o","rss="],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim())*1024||null;}catch{return null;}
}
/** @param {Record<string, string | undefined>} [env] */
export async function runBenchmark(env=process.env) {
  const settings=benchmarkSettings(env);
  const fixture=JSON.parse(readFileSync(new URL("../tests/fixtures/independent-v1.json",import.meta.url),"utf8"))[0].input;
  const endpoints=[
    {label:"GET /api/v1/health",path:"/api/v1/health"},
    {label:"POST /api/v1/numerology/calculate",path:"/api/v1/numerology/calculate",body:JSON.stringify(fixture)},
    {label:"GET /api/v1/numerology/interpretations/:type/:value",path:"/api/v1/numerology/interpretations/lifePath/8?locale=vi"},
    {label:"GET /api/v1/numerology/definitions",path:"/api/v1/numerology/definitions?locale=vi"},
  ];
  const initialMemory=process.memoryUsage(),initialServerRss=serverRss(env.BENCHMARK_SERVER_PID);
  const results=[];
  for(const endpoint of endpoints){
    const samples=[];
    async function send(measured){
      const start=performance.now();let status=0,bytes=0;
      try{
        const response=await fetch(settings.base+endpoint.path,{method:endpoint.body?"POST":"GET",redirect:"error",headers:{"accept-encoding":"identity",...(endpoint.body?{"content-type":"application/json"}:{})},body:endpoint.body,signal:AbortSignal.timeout(5000)});
        status=response.status;bytes=(await response.arrayBuffer()).byteLength;
      }catch{/* No payloads, full URLs or raw exceptions in benchmark output. */}
      if(measured)samples.push({ms:performance.now()-start,status,bytes});
    }
    for(let warm=0;warm<settings.warmups;warm++)await send(false);
    let next=0;
    await Promise.all(Array.from({length:settings.concurrency},async()=>{while(next++<settings.count)await send(true);}));
    const sorted=samples.map((sample)=>sample.ms).sort((a,b)=>a-b);
    const percentile=(p)=>Number(sorted[Math.ceil(p*sorted.length)-1].toFixed(3));
    results.push({route:endpoint.label,requests:samples.length,errors:samples.filter((sample)=>sample.status!==200).length,serverErrors:samples.filter((sample)=>sample.status>=500).length,statusCounts:Object.fromEntries([...new Set(samples.map((sample)=>sample.status))].map((status)=>[status,samples.filter((sample)=>sample.status===status).length])),averageMs:Number((sorted.reduce((a,b)=>a+b,0)/sorted.length).toFixed(3)),p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),responseBytes:{min:Math.min(...samples.map((sample)=>sample.bytes)),max:Math.max(...samples.map((sample)=>sample.bytes))}});
  }
  const report={timestamp:new Date().toISOString(),environment:{node:process.version,next:JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")).dependencies.next,platform:platform(),release:release(),arch:arch(),cpu:cpus()[0]?.model,cpuCount:cpus().length,totalMemoryBytes:totalmem()},settings,method:"Production next start; localhost; keep-alive; identity encoding; warmups excluded; latency includes reading the complete response body; no conditional cache requests",memory:{scope:"Benchmark client RSS/heap and optional local Next server RSS snapshots, not Vercel memory",clientBefore:initialMemory,clientAfter:process.memoryUsage(),serverRssBefore:initialServerRss,serverRssAfter:serverRss(env.BENCHMARK_SERVER_PID)},results};
  writeFileSync(new URL("../docs/performance/benchmark-results.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({results,memory:report.memory},null,2));
  if(results.some((result)=>result.errors))process.exitCode=1;
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await runBenchmark();
