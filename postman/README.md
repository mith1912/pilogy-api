# Pilogy API V1 — Postman

Importable artifacts for the existing stateless backend. No backend source, calculation rules or Vietnamese articles were changed.

- `Pilogy-API-v1.postman_collection.json`: Postman Collection v2.1.
- `Pilogy-Local.postman_environment.json`: local environment with enabled `baseUrl = http://localhost:3000/api/v1`.

## Import and select an environment

1. Open Postman and choose **Import**. Select `Pilogy-API-v1.postman_collection.json`.
2. Import `Pilogy-Local.postman_environment.json` the same way.
3. Select **Pilogy Local** as the active environment. Confirm that its enabled `baseUrl` value is `http://localhost:3000/api/v1` with no trailing slash.
4. Use the Postman desktop application or a desktop agent that can reach localhost. A remote cloud agent cannot reach your machine's localhost service.

Every request uses `{{baseUrl}}`; individual requests contain no production origin. The collection also has a local fallback value. The selected environment overrides that fallback.

For Production, duplicate the local environment, rename the copy **Pilogy Production**, and set its `baseUrl` to `https://pilogy.vercel.app/api/v1`. Select that environment without changing requests. No auth token, API key, cookie, SSO bypass or other credential is included or required for the public production domain. Keep HTTPS for production. Do not use a protected deployment URL as the public mobile API origin.

## Requests included

| Folder | Requests | Coverage |
| --- | ---: | --- |
| System | 2 | Health, Config |
| Numerology | 2 | Calculate Numerology, Numerology Definitions |
| Interpretations | 11 | All nine index types; Life Path 22 and 33 additionally exercise dedicated master articles |
| Negative Tests | 14 | Body/path/locale validation plus documented missing-content, rule, media-type, malformed-JSON and byte-limit failures |
| Total | **29** | All five implemented API endpoints |

The five endpoint patterns are GET `/health`, GET `/config`, POST `/numerology/calculate`, GET `/numerology/definitions`, and GET `/numerology/interpretations/{type}/{value}`, relative to `baseUrl`.

The Calculate request uses only the fixed documentation fixture:

```json
{
  "fullName": "Nguyễn Văn An",
  "birthDate": "1990-05-20",
  "referenceDate": "2026-11-08",
  "locale": "vi"
}
```

Expected values are explicit constants: lifePath 8, expression 3, soulUrge 1, personality 11, birthday 2, attitude 7, maturity 11, personalYear 8, personalMonth 1. Tests check all nine values/base values, operation arithmetic, final/base steps, effective date, normalization/totals, versions, summary identity, required text fields and the absence of full article sections in summaries. No Vietnamese article is compared in full or printed by scripts. Full-article requests check identity, master bases and required structure instead of exact editorial wording.

Common tests check JSON media/parseability, success/error envelopes, safe structured error details, API security headers, and the appropriate no-store or public ETag-revalidation policy. Successful public requests are unconditional, so they expect 200 rather than 304; the collection does not send If-None-Match.

## Run locally

Start the existing backend on port 3000. With dependencies installed:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

If this environment blocks the default Turbopack CSS worker, the previously verified supported build alternative is `npm run build -- --webpack`. An already-built compatible local production build can also be started directly. This collection task did not alter the build configuration.

Select the collection, open **Run collection**, choose **Pilogy Local**, and run one iteration. Review assertions in the runner or the response's test results. Use the supplied sample data; do not insert real profiles into shared collection exports or runner reports.

For a reproducible CLI run with Newman 6.2.3:

```sh
npx --yes newman@6.2.3 run postman/Pilogy-API-v1.postman_collection.json \
  --environment postman/Pilogy-Local.postman_environment.json \
  --iteration-count 1 \
  --delay-request 100 \
  --timeout-request 10000
```

Newman is optional tooling and was not added to package.json or package-lock.json. The collection makes one sequential request at a time, has no loops issuing extra HTTP calls, and contains no load test, rate-limit stress test, destructive operation, or persistent profile operation. The oversized-body case is a **single 16,385-byte JSON body** exceeding every supported configured size limit, not a stress test. Use Local first. Negative cases intentionally exercise server errors and can appear in platform error metrics if run against Production; do not repeatedly run the suite against a live service.

## Interpret failures

Expected negative responses are assertions of the current implementation, not failed collection tests:

| Request(s) | Expected HTTP | Stable error code |
| --- | ---: | --- |
| Missing fullName; invalid birth/reference dates; unknown body field; unsupported Calculate locale; invalid interpretation type/value; unsupported interpretation locale | 400 | VALIDATION_ERROR |
| Malformed JSON | 400 | INVALID_JSON |
| Missing Birthday 11 article | 404 | INTERPRETATION_NOT_FOUND |
| Oversized JSON body | 413 | PAYLOAD_TOO_LARGE |
| Unsupported Content-Type | 415 | UNSUPPORTED_MEDIA_TYPE |
| Unspecified zero-vowel calculation rule | 422 | CALCULATION_RULE_UNSPECIFIED |
| Missing required Birthday summary | 500 | INTERPRETATION_CONTENT_MISSING |

The last 404/500 cases reflect the known imported draft content gap for Birthday 11, rather than inventing a failure fixture or substituting its base number. They need review when approved Birthday 11 content is added: a newly successful 200 is then an intentional catalog change, and the outdated negative expectations must be updated. Do not change the backend merely to retain an obsolete failing-content fixture. The zero-vowel case uses `Lynn`; Y is a consonant under V1.

- Connection errors usually mean the local server is not running, the port is wrong, or the chosen Postman agent cannot reach localhost.
- A prerequest-script error means `baseUrl` is missing or malformed. It must include `/api/v1` and must not contain credentials, a query, or a trailing slash.
- Unexpected 404 commonly means a wrong base path or deployment. Do not append `/api/v1` twice.
- HTML, redirects or SSO pages fail JSON/status assertions. Use the public production alias and inspect deployment protection; do not add bypass secrets to this collection.
- HTTP 429 may come from WAF and may not use the application's JSON envelope. Stop/retry later according to Retry-After or bounded backoff; this suite does not stress or prove enforcement.
- A failed Calculate value/step test is a numerical regression or incompatible calculation version. A structure/summary test failure may indicate a contract/content regression.
- `contentVersion` is required and nonempty but is deliberately not pinned to the current draft string. Versioned editorial updates should not fail solely because wording or the content version changed.

Scripts do not log request bodies, save names/dates, export responses to environment variables, call external services or modify server data. Postman itself can retain request/history/workspace data; use synthetic fixtures only and review workspace/report sharing separately. No request is authorized by CORS or a mobile-embedded secret.

## Validation performed

Executed successfully against the real local Next.js API at localhost:3000 using the existing production build:

- Both files parse as valid JSON; environment structure, enabled baseUrl and local default were checked.
- Collection validated with AJV against the [official Postman Collection v2.1 schema](https://schema.getpostman.com/json/collection/v2.1.0/collection.json).
- All 29 methods/URLs resolve correctly from the environment. No individual request hardcodes an origin.
- All 31 stored event scripts compiled successfully (two collection events and 29 item events).
- Newman 6.2.3: **29 requests, 264 assertions, zero failed assertions or request/script failures**, one iteration. Shared collection tests and index loops account for the per-run assertion count.
- All request routes and expected statuses/codes were checked against the actual routes, validation/error utilities and `docs/openapi.yaml`/`docs/api-contract.md`. No endpoint or response-field discrepancy was found for this collection. The public `{type}` path parameter corresponds to the internal `[index]` directory; this is an existing documented naming difference, not a different endpoint.

`docs/flutter/api-handoff.md` was not present. The existing `docs/flutter-integration.md` was reviewed instead. Framework TRACE behavior and provider-generated errors remain outside this JSON collection's scope; no active rate limiter or general production readiness is claimed by a passing collection run. No production requests were sent during Task 08 validation.
