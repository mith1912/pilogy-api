import { expect, it } from "vitest";
import { benchmarkSettings } from "@/scripts/benchmark.mjs";
it("bounds benchmark concurrency, count and targets without running network load",()=>{
  expect(benchmarkSettings({})).toMatchObject({count:60,concurrency:2,warmups:5});
  for(const env of [{BENCHMARK_BASE_URL:"https://example.com"},{BENCHMARK_BASE_URL:"http://127.0.0.1:3105/private"},{BENCHMARK_REQUESTS:"1000"},{BENCHMARK_CONCURRENCY:"8"}])expect(()=>benchmarkSettings(env)).toThrow();
});
