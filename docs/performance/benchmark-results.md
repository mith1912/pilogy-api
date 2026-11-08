# Local benchmark results — Task 06

Status: **executed successfully** against the Webpack production build. No production/preview load test or Vercel capacity claim is made. Raw measurements: [benchmark-results.json](benchmark-results.json).

## Environment and reproduction

Run timestamp: 2026-11-08T02:14:50.970Z. Node v22.23.4; Next 16.4.5; darwin 24.6.0 x64; Intel(R) Core(TM) i5-8257U CPU @ 1.40GHz; 8 logical CPUs; 8192.0 MiB total system RAM.

Commands used:

```sh
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3105
BENCHMARK_SERVER_PID=7233 npm run benchmark
```

PID 7233 was the task-owned local Next server observed with lsof during this run; use the actual new server PID on a rerun, or omit BENCHMARK_SERVER_PID. The command is not a hardcoded deployment PID. The default npm run build was separately attempted and BLOCKED by Turbopack CSS-worker port permissions, including elevated execution; Webpack is the successful production-build path here.

The script only accepts localhost origins, 20–100 measured requests per endpoint, and concurrency 1–4. Defaults: 60 measured requests per endpoint, concurrency two, five excluded warmups per endpoint, a five-second client timeout, and redirect rejection. Total in this run: **240 measured requests + 20 warmups = 260 attempts**. The request body is the fixed approved documentation fixture. No real user profiles, headers, raw queries, request/response bodies or raw exceptions are logged.

## Results

Latency includes consuming the complete uncompressed response body over HTTP keep-alive on localhost. Requests send Accept-Encoding: identity. Percentiles use nearest rank; with 60 samples, P99 is the observed sample maximum. Error count means non-200 or transport failure. The status distribution was 60 HTTP 200 responses for each measured endpoint. Warmup statuses are excluded from the stored sample results.

| Endpoint | Measured requests | Mean ms | P50 ms | P95 ms | P99 ms | UTF-8 response bytes | Errors / 5xx |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /api/v1/health | 60 | 3.714 | 3.384 | 7.017 | 8.21 | 57 | 0 / 0 |
| POST /api/v1/numerology/calculate | 60 | 3.941 | 3.737 | 5.163 | 7.037 | 11469 | 0 / 0 |
| GET /api/v1/numerology/interpretations/:type/:value | 60 | 3.513 | 3.426 | 4.396 | 6.54 | 5219 | 0 / 0 |
| GET /api/v1/numerology/definitions | 60 | 3.284 | 3.114 | 4.498 | 6.588 | 3035 | 0 / 0 |

The provisional warm targets were met **in this local sample**: Calculate P95 <300 ms, interpretation P95 <150 ms, Calculate <30 KB, and zero measured 5xx for the complete-content fixture. This does not establish a production SLO. Profiles hitting the known missing Birthday articles intentionally return 500 and were not disguised as normal successful benchmark traffic. The later TRACE security tests separately reproduced framework 500 responses; they are not part of this normal-request latency sample.

## Memory snapshots

Benchmark-client RSS: 31.61 → 69.35 MiB. Client heap used: 5.01 → 13.34 MiB. Local Next-server RSS via ps: 76.36 → 95.72 MiB.

These are before/after process snapshots, not peak usage, retained heap, per-request memory or Vercel function allocation. The client and server share the same host. A short warming run cannot prove absence of leaks or attribute RSS growth to one optimization. No heap snapshots containing profile data were collected.

## Performance changes and limits

- Static JSON imports and strict content validation still occur at module initialization. No per-request disk reads or external calculations.
- Articles and summaries use private constant lookup maps instead of repeated array scans. Public objects are recursively frozen to prevent one request from mutating another response. These maps contain no rate counters or user data.
- Definitions and full-article JSON/ETags are prepared once per module instance. A deterministic test proves ten prepared deliveries invoke serialization once; no flaky CI timing limit was added.
- Personalized Calculate JSON is serialized per request, preserving all steps and short summaries. It remains no-store and never enters the public prepared-content path.
- Body reading uses one configured-size buffer and bounded work; name normalization remains bounded by the existing 200-code-unit field rule. No formula or profile-output change was made.

Preparing 99 public articles adds bounded serialized copies and some initialization work. This tradeoff benefits warm public delivery; cold-start performance was not measured. No pre-change benchmark baseline was captured, so no percentage speedup or memory reduction is claimed.

This is a short low-concurrency test, not saturation, sustained-load, internet latency, mobile-radio, TLS, CDN, WAF, regional routing or cold-start measurement. Repeat on an authorized preview with a separately approved procedure and representative traffic before adopting capacity limits. Do not relax security or increase concurrency blindly to chase these numbers.
