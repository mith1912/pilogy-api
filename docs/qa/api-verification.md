# API verification — Task 05

Status: **PASS for executed API behavior and regression checks**. Content completeness remains FAIL; environment-dependent Turbopack build verification is BLOCKED. No endpoint fields, formulas or interpretation text were changed during QA.

## Execution evidence

- Actual native Next.js handlers were exercised by existing Task 04 integration tests plus tests/qa/api.test.ts. No calculation service was mocked.
- A Webpack production build completed successfully and was served with `npm run start -- --hostname 127.0.0.1 --port 3105`.
- `node scripts/qa-http.mjs` executed **30 actual HTTP checks: 30 PASS, 0 FAIL** against http://127.0.0.1:3105. Results are recorded in [http-results.json](http-results.json).
- The first sandboxed HTTP client could not access localhost and was BLOCKED, not an API failure. Re-execution outside the sandbox succeeded. The production server also required permitted local-port access.
- OpenAPI 3.1 response schemas were used for actual HTTP success/error bodies and existing native response tests. The specification is JSON-compatible YAML 1.2; local JSON Schema references are resolved using the installed Zod converter.

## Endpoint verification

| Endpoint | Actual HTTP result | Checked behavior |
| --- | --- | --- |
| GET /api/v1/health | PASS: 200 | Liveness body and HealthResponse schema |
| GET /api/v1/config | PASS: 200 | Public flags, vi locale, ConfigResponse schema; native test checks exact allowlist |
| POST /api/v1/numerology/calculate | PASS: 200 for A | Nine independent expected values/bases, complete exact step arrays, summaries, versions, requested referenceDate, no full essence/article payload, no-store and no ETag |
| GET /api/v1/numerology/definitions?locale=vi | PASS: 200/304 | Nine definitions, domain/coverage data, version metadata, ETag and mandatory revalidation |
| GET /api/v1/numerology/interpretations/{type}/{value}?locale=vi | PASS: 200/304 | Requested four articles exactly match source JSON; master personality/11 remains dedicated; contentVersion consistent; ETag reuse |

The four required detailed articles were lifePath/8, personality/11, personalYear/8 and personalMonth/1. Existing native tests additionally retrieve all 99 source articles verbatim. Regression tests preserve the stable type, value, baseValue and steps fields. Fixture A is explicitly checked against independent constants, beyond Task 04's engine-versus-handler compatibility assertion.

## HTTP error matrix

| Trigger | Expected / observed status and code | Result |
| --- | --- | --- |
| Unknown type | 400 VALIDATION_ERROR | PASS |
| Invalid numeric value 10 | 400 VALIDATION_ERROR | PASS |
| Unsupported full-content/definitions locale | 400 VALIDATION_ERROR | PASS |
| Duplicate definitions locale parameter | 400 VALIDATION_ERROR | PASS |
| Missing Birthday 11/22 full article | 404 INTERPRETATION_NOT_FOUND | PASS for error behavior; coverage remains CRITICAL |
| Invalid birth date 1900-02-29 | 400 VALIDATION_ERROR | PASS |
| Invalid reference date 2026-02-29 | 400 VALIDATION_ERROR | PASS |
| Unsupported Calculate locale / unexpected field | 400 VALIDATION_ERROR | PASS |
| Calculate with Birthday 11, 22 or day 29→11 | 500 INTERPRETATION_CONTENT_MISSING | PASS for documented all-or-error policy; release still FAIL |
| Zero vowel name group | 422 CALCULATION_RULE_UNSPECIFIED | PASS |
| Malformed JSON | 400 INVALID_JSON | PASS |
| 16,385-byte request | 413 PAYLOAD_TOO_LARGE | PASS |
| text/plain body | 415 UNSUPPORTED_MEDIA_TYPE | PASS |

Error envelopes include success false and `{ code, message, details }`, no data, no stack trace or reflected submitted fields. Actual HTTP checks validate the shared Error schema. Native tests additionally exercise invalid UTF-8, falsified/absent Content-Length, multichunk limits, missing/null/blank fields, excessive name length, precomposed/decomposed Unicode, Đ/đ and punctuation-removal behavior. Invalid pure date and lookup strings with trailing line terminators are rejected; no defect was found there.

## Determinism, locale and reference dates

Three repeated fixture A requests are byte-structure equal through both native handlers and HTTP. All nine numeric values match the required example. Explicit referenceDate survives in data and personal-cycle indices. Independent engine tests use four TZ settings and a fixed unrelated clock. Omitted-date tests use a frozen UTC instant in the native suite; actual HTTP checks compare the returned date to the UTC calendar date before/after the request to tolerate midnight crossing.

Only vi is accepted; omitted locales default to vi. Newline, null, invalid leap days, timestamps and unexpected fields are rejected according to the existing contract. Real leap dates 2000/2024/2400-02-29 pass date validation, then intentionally report missing Birthday 11 content; a missing-content 500 is not mislabeled a date-validation failure.

## Confirmed fixes

**T-01, MEDIUM — oversized-stream cancellation masked 413.** A native ReadableStream with more than 16 KiB and a rejecting cancel callback reproduced 500 INTERNAL_ERROR instead of 413 PAYLOAD_TOO_LARGE. lib/api/request.ts now treats cancellation as best-effort and preserves the established byte-limit error. The new regression failed before the fix and passes after it. Normal byte limits and shared safe envelopes remain unchanged.

**T-02, MEDIUM — content validator accepted Birthday 33.** The item schema accepted a lifePath/33-shaped record relabeled birthday, despite documented unreachable Birthday 33. lib/validation/interpretations.ts now rejects that invalid content value. The regression failed before the fix and passes after it. No currently imported record was invalid; request lookup syntax and responses remain compatible.

Test hygiene improvements: froze the existing default-date test instead of comparing two real clock reads, and removed a stale null-summary success branch from an existing integration assertion. No field removals, formula changes or calculation convention changes were introduced.

## Privacy and persistence review

Application source inspection found no profile/result writes, database/authentication clients, outgoing calculation requests, submitted-payload logs or profile caches. Calculation request variables remain scoped to each handler; shared state is static public content. The native fixture A test also checks no console.log/error/warn calls during repeated requests. This is application-code evidence, not proof about platform access logs or future observability integrations. Production body capture must remain disabled and hosting retention must be reviewed separately. QA artifacts contain documented synthetic fixtures and check outcomes, not collected user profiles.

## Cache regression

Calculate has no-store and no ETag. Config and health remain no-store. Errors are no-store. Public definitions/full articles have `public, max-age=0, must-revalidate`; matching If-None-Match gives 304, empty body and the same ETag. Unknown validators return 200. Mutable URLs are not advertised as immutable. HTTP and native tests both passed these checks. A successful local check does not verify the deployment CDN, proxy compression or configured public rate limits.

## Contract comparison

No new disagreement between current responses, docs/api-contract.md and docs/openapi.yaml was found in executed response-schema tests. All eight stable error codes match the typed code list. The deliberately compatible legacy targetDate alias, extra summary baseValue/keywords, config compatibility fields and per-type definitions metadata remain intact.

The full-content route directory is still [index]/[value] while the public OpenAPI parameter is type; both identify the same unchanged URL segment. Missing Birthday content remains correctly documented rather than hidden by a schema-only PASS.
