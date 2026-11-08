# Numerology API

Stateless Next.js App Router / TypeScript backend for a Flutter Android/iOS app, deployable on Vercel. Profiles stay on the device. There is no database, authentication, or server-side persistence. The deterministic Pythagorean V1 engine implements the supplied rules; valid requests return structured calculation results. Vietnamese interpretation summaries and full content are served from the imported draft JSON catalog.

## Development

Use Node.js 22 LTS or newer supported by the installed Next.js version.

```sh
npm ci
npm run dev
npm run lint
npm run type-check
npm test
npm run build
```

`npm run test:watch` runs Vitest interactively. Unit tests cover schemas, service behavior, and response utilities; integration tests compose actual route handlers with native Request/Response objects. These do not replace deployed HTTP smoke tests.

## Structure

- `app/api/v1/`: thin HTTP route handlers.
- `lib/numerology/`: HTTP-independent service, engine contracts and versioned engines.
- `lib/validation/`: Zod input contracts.
- `lib/interpretations/`: validated imported Vietnamese draft content, coverage metadata and catalog.
- `lib/types/`, `lib/api/`: shared response types, errors, bounded JSON reading and response utilities.
- `tests/unit/`, `tests/integration/`: Vitest suites.
- `docs/`: [API contract](docs/api-contract.md), [Flutter integration](docs/flutter-integration.md), [OpenAPI 3.1](docs/openapi.yaml), and [calculation rules](docs/calculation-rules.md).

API version and calculation version are independent. New formulas belong to versioned engine modules, never route handlers. Numerology conventions and approved examples are recorded in docs/calculation-rules.md. Interpretation content remains unchanged in `lib/interpretations/content/vi/`; its draft version and known coverage gaps are exposed in the API. See the API contract for summary and full-content endpoints.

## Deployment and reliability

Import this repository into Vercel using its Next.js preset and `npm run build`. No secrets are needed. The optional NUMEROLOGY_MAX_REQUEST_BYTES deployment setting overrides the bounded request-size limit. Config exposes an explicit public allowlist with capability flags; never spread `process.env` into responses or prefix secrets with `NEXT_PUBLIC_`.

Bodies are limited to 4 KiB by default (private NUMEROLOGY_MAX_REQUEST_BYTES override: 2–16 KiB) by actual streamed bytes, with an early Content-Length check. Personalized calculations and errors use `Cache-Control: no-store`; public definitions and interpretation articles use ETag revalidation. Validation errors contain only safe field identifiers/codes. Do not log names, birth dates, raw bodies, calculation results, or raw exceptions that could contain personal information. Disable request-body capture in any future telemetry; review platform access-log retention separately.

Before public release, configure Vercel Firewall rate limits (or another distributed limiter) on `/api/v1`, especially calculate. The calculate handler marks the pre-parsing integration point. No in-memory counters are used because Vercel instances do not share state. Return 429 with the standard error envelope and Retry-After if implementing application throttling. Rate limiting is **not enabled** by this foundation. Also configure platform request/time limits and deployed HTTP smoke tests. Native Flutter clients need no CORS policy; review explicit origins if a web client is introduced.

## Quality assurance

`npm run qa` runs the entire Vitest suite, then the content release gate. It currently exits nonzero for missing Birthday 11/22 articles and extensive repeated challenge text; passing technical tests alone is not release approval. `node scripts/qa-content.mjs` regenerates the audit without gating; `node scripts/qa-content.mjs --check` gates content alone.

For actual HTTP QA, build the app, start `npm run start -- --hostname 127.0.0.1 --port 3105`, then run `node scripts/qa-http.mjs`. Set `QA_BASE_URL` only to an authorized test server if using a different base URL. The scripts use fixed documentation fixtures and write only audit/check artifacts under `docs/qa/`; they do not edit imported content. Stop the temporary server afterward.

See [Task 05 QA summary](docs/qa/task-05-summary.md), [calculation verification](docs/qa/calculation-verification.md), [content coverage](docs/qa/content-coverage.md), [editorial review](docs/qa/content-editorial-review.md), and [API verification](docs/qa/api-verification.md). The default Turbopack build remains blocked by this environment's worker-port permissions; `npm run build -- --webpack` was verified separately.

## Security and performance

See [Task 06 security review](docs/security/security-review.md), [manual Vercel WAF setup](docs/security/vercel-waf-setup.md), [benchmark results](docs/performance/benchmark-results.md), and [Task 06 summary](docs/security/task-06-summary.md). No WAF rule or monitoring alert was enabled by this task.

`npm run benchmark` targets localhost:3105 by default, uses 60 measured requests plus five warmups per endpoint and concurrency two, and writes aggregate data to docs/performance/benchmark-results.json. BENCHMARK_REQUESTS is bounded to 20–100, BENCHMARK_CONCURRENCY to 1–4, and BENCHMARK_BASE_URL must be a localhost origin. Run a production server first; never use this as a production load test. Optional BENCHMARK_SERVER_PID captures local server RSS snapshots. `node scripts/security-http.mjs` performs localhost-only method/header/body-limit checks. The scripts log no calculation bodies.

Task 06's expanded HTTP method checks retain a known failure: the installed Next.js adapter returns generic 500 for raw TRACE before route handlers. Other tested unsupported methods return 405. See the security review for the unresolved finding and manual edge-deny proposal; `scripts/security-http.mjs` intentionally exits nonzero for those five TRACE assertions.
