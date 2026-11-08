# Task 06 completion summary

Production-readiness recommendation: **FAIL / NOT READY for general public release**. The application hardening and warm-performance checks succeed, but WAF enforcement is not configured/verified, a framework TRACE-status defect is unresolved, and Task 05's critical/high content blockers remain. No Task 07 or new product feature work was started.

## Implemented and tested

- Configurable Calculate body size: default 4,096 bytes; private override 2,048–16,384. Fixed-buffer streaming, declared/actual byte checks, a five-second read deadline and bounded fragmentation. Oversize errors remain 413, malformed/incomplete bodies 400, non-JSON media 415.
- Existing strict Zod bodies, 200-code-unit name cap, real Gregorian dates, locale validation and all nine numeric algorithms/steps remain unchanged.
- Health/config/Calculate reject undeclared query fields; public locale queries are length-bounded and still reject unknown/duplicate fields.
- nosniff and no-referrer on application responses and framework API responses; X-Powered-By disabled. No wildcard browser CORS grant or Flutter-embedded key. Normal unsupported methods remain framework 405.
- Typed RATE_LIMIT_EXCEEDED formatting with safe Retry-After for future real application integration. **This is formatting support only, not active enforcement.**
- Static public articles/summaries and definitions deeply frozen and indexed once. Full articles/definitions use precomputed JSON/ETags; Calculate remains personalized no-store, preserves all steps and has no public result cache.
- Removed unused gh production dependency and 281 transitive packages, with no major framework upgrade. The final production audit reports zero known vulnerabilities.
- Local-only bounded benchmark and security HTTP tools, deterministic resource/cache regression tests, updated API/OpenAPI/Flutter docs and manual security/deployment guidance.

## Executed checks and limitations

| Check | Result | Evidence |
| --- | --- | --- |
| npx vitest run | PASS | 323 tests, 14 files, 0 failures |
| npx tsc --noEmit | PASS | Final exit 0 |
| npm run type-check | PASS | Next-generated types plus TypeScript exit 0 |
| npm run lint | PASS | Final exit 0, no warnings |
| npm run build | BLOCKED | Turbopack CSS-worker local-port permission failure, including elevated execution |
| npm run build -- --webpack | PASS | Production compilation, TypeScript, static generation and build traces completed |
| npm audit --omit=dev --json | PASS after removal | Initially 24 findings (6 critical/7 high); finally 0; registry access required permitted retry |
| Existing actual HTTP QA | PASS | 30 passed, 0 failed; docs/security/http-qa-results.json |
| Expanded security HTTP | PARTIAL FAIL | 29 passed, 5 failed; the five failures are raw TRACE status mismatches across all routes |
| Local performance benchmark | PASS for this run | 240 measured requests, 0 measured errors/5xx, plus 20 excluded warmups, concurrency two |
| WAF/HTTPS/custom-domain/CDN deployment checks | NOT EXECUTED / manual | No live account/rules/deployment was modified or claimed verified |

Type checks initially caught two optional route-request signatures and a benchmark-helper environment annotation mismatch introduced during this task; these were corrected and the final checks pass. The 5 TRACE failures are preserved, not removed or relabeled PASS. No strict latency threshold was added to CI.

The unchanged independent suite verifies 43 full-profile fixtures, every fixture A step, 101 domain witnesses and source-exact content mapping. All 99 imported records remain unchanged. The application still intentionally rejects complete-profile delivery when required Birthday 11/22 content is absent; zero normal-fixture benchmark errors does not erase those known cases.

## Performance measurements

Production next start on localhost, Next 16.4.5 / Node v22.23.4, Intel i5-8257U, macOS/Darwin x64, 8 logical CPUs, 8 GiB RAM. Sixty measured requests and five excluded warmups per endpoint, concurrency two, keep-alive, identity encoding, complete-body latency.

| Endpoint | Mean ms | P50 ms | P95 ms | P99 ms | Bytes | Measured errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Health | 3.714 | 3.384 | 7.017 | 8.210 | 57 | 0 |
| Calculate | 3.941 | 3.737 | 5.163 | 7.037 | 11,469 | 0 |
| Interpretation | 3.513 | 3.426 | 4.396 | 6.540 | 5,219 | 0 |
| Definitions | 3.284 | 3.114 | 4.498 | 6.588 | 3,035 | 0 |

Local target comparisons pass for this small warm sample. They do not establish Vercel capacity, internet/mobile latency, cold-start or sustained-load guarantees. Server RSS snapshots rose from 76.35 to 95.72 MiB; this is neither peak nor retained-heap measurement and cannot establish a memory leak or attribute changes to one optimization. See [benchmark-results.md](../performance/benchmark-results.md) and its raw JSON.

## Rate limiting and manual configuration

**No rate limiter is active in application code, and no Vercel WAF rule was enabled by this task.** No in-memory request Map, database, Redis/Upstash or paid monitoring service was added. Public-content maps are fixed immutable lookup structures, not rate counters.

The [WAF guide](vercel-waf-setup.md) contains exact proposed predicates and dashboard publication steps for Calculate 30/minute/IP and combined public content 120/minute/IP, log-first rollout, carrier-NAT false-positive review, authorized-preview testing and rollback. Current public documentation supports fixed-window limiting across plans but Hobby's one-rule allowance cannot express both independent rate policies. The actual account's plan, available slots and billing are unverified; do not assume entitlement or report a plan restriction as an inspected fact.

An operator must approve/publish rules, verify enforcement and costs, and decide any plan upgrade or external alternative. Additional infrastructure/services need explicit approval. Monitoring dimensions, safe logging guidance and dashboard checks are documentation only; no alert or export was enabled. Hosting-layer HSTS/custom-domain HTTPS must also be verified manually.

## Unresolved issues

| Severity / status | Finding | Required action |
| --- | --- | --- |
| CRITICAL, pre-existing | Birthday 11 and 22 articles missing; some valid profiles intentionally return 500 | Approved editorial content and versioned catalog update; no generated filler |
| HIGH, pre-existing | Extensive duplicated challenge/article scaffolding | Human editorial revision and repeat QA |
| HIGH operational risk, enforcement unverified | Repeated valid requests can consume serverless resources/budget | Configure and verify WAF; review carrier-NAT impact, spending and quotas |
| MEDIUM, new verified finding | Raw TRACE returns framework 500 before route handlers, not 405; plain generic body with no observed stack/path leakage | Review compatible upstream fix and/or manual edge-deny mitigation; retain failing HTTP assertions |
| BLOCKED environment | Default Turbopack build cannot bind its CSS-worker port | Verify on an appropriate build host; Webpack path passed separately |
| Manual verification | TLS/HSTS, CDN behavior, provider metadata retention, logs/alerts, live rule order/bypasses | Review actual project/deployment configuration without collecting profiles |

No node_modules patch, unreviewed major upgrade or custom production server was introduced to hide TRACE behavior. The installed Next Web Request adapter fails before application dispatch; details and a narrow edge-deny proposal are in [security-review.md](security-review.md). Edge denial may be 403 rather than 405 and is not currently active.

## Changed files

- Production: lib/config.ts; lib/api/request.ts, response.ts, errors.ts, query.ts (new); lib/interpretations/catalog.ts; all five API route modules; next.config.ts.
- Dependencies/tooling: package.json and package-lock.json remove gh; package.json adds benchmark; scripts/benchmark.mjs and security-http.mjs (new); qa-http.mjs can save Task 06 evidence without overwriting Task 05 evidence.
- Tests: tests/security/hardening.test.ts and benchmark-safety.test.ts (new); existing integration tests now supply native Request objects to health/config to match the typed route signatures.
- Docs: README.md, docs/api-contract.md, docs/openapi.yaml, docs/flutter-integration.md; security-review.md, vercel-waf-setup.md, task-06-summary.md, dependency-audit.json, http-security-results.json, http-qa-results.json; docs/performance/benchmark-results.md and benchmark-results.json.

Pre-existing workspace changes and the generated AGENTS.md instruction block are preserved. No src directory, interpretation JSON rewrite, calculation change, profile management, authentication or database was introduced.

## Reproduction

Run npx vitest run, npx tsc --noEmit, npm run lint and npm audit --omit=dev. Run npm run build; if this specific environment blocks Turbopack, record BLOCKED and verify npm run build -- --webpack separately.

For localhost checks, start the production server on 127.0.0.1:3105, then run `QA_REPORT_SCOPE=security node scripts/qa-http.mjs`, `node scripts/security-http.mjs`, and `npm run benchmark`. Scripts keep request count/concurrency bounded and print only aggregate/fixed-fixture check metadata. Use the actual local server PID only if requesting optional RSS snapshots. Stop the temporary server afterward. The TRACE assertions intentionally keep the security HTTP script nonzero until resolved; that is distinct from the passing Vitest suite.
