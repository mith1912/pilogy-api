# Security review — Task 06

Scope: the five root-level App Router endpoints, shared API utilities, calculation/validation modules, static Vietnamese catalog, package manifests, ignore rules and local QA tooling. No product features, authentication, database, profile persistence, external calculations or interpretation changes were introduced.

## Threat model and OWASP mapping

An unauthenticated caller can submit arbitrary JSON, dates, Unicode names, methods, query strings and concurrent/slow requests. The primary assets are name/birth-date confidentiality, deterministic arithmetic, availability, hosting budget and public-content integrity. Personal data belongs in the HTTPS request body, never a URL. Public interpretation content is not secret.

OWASP API4 identifies resource consumption and associated operating cost as API risks. Our controls bound input size, stream duration/chunk count, string length and work per calculation; edge quotas remain a separate deployment requirement. This is an application-specific mapping, not an OWASP certification. [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).

| Risk | Finding / mitigation | Status |
| --- | --- | --- |
| Resource exhaustion / API4 | Lower default from 16 KiB to 4 KiB; fixed buffer; early and streamed limits; bounded chunk count; body-read deadline | Implemented and tested |
| Repeated requests / budget abuse | Vercel WAF policies proposed at 30/minute Calculate and 120/minute public content | Manual configuration required, not active |
| Security misconfiguration / API8 | API nosniff/no-referrer headers, strict query policy, framework method restrictions, no permissive browser CORS | Implemented and tested locally |
| Information disclosure | Safe error allowlist, no raw errors/payloads, no stack/path/environment reflection | Regression-tested and source-reviewed |
| Dependency supply chain / inventory | Unused gh production CLI carried 24 advisory findings; remove it and 281 transitive packages | Fixed; final production audit zero known findings |
| Sensitive-data retention | No application storage, profile cache, request logging or external analytics calls in lib/app/api | Source-reviewed; platform retention remains outside application control |
| Public content corruption | Deep-freeze validated articles and metadata; private immutable lookup maps | Implemented and tested |
| CDN disclosure | Calculate always no-store, no ETag, no shared input/result cache | Implemented and tested |
| Unauthorized privileged function | No private objects or authenticated administrative endpoints exist in V1 | Architecture preserved; no authorization added |
| SSRF / unsafe external APIs | Request handlers make no outgoing HTTP requests or AI calls | Source-reviewed |

## Bounded request handling

MAX_REQUEST_BYTES defaults to 4,096. Private NUMEROLOGY_MAX_REQUEST_BYTES accepts only integer strings in 2,048–16,384; invalid deployment values fail module initialization with a generic configuration error. The public config reports the effective byte limit but never reads or spreads arbitrary environment variables.

readJson requires application/json (charset parameters accepted), rejects an oversized declared Content-Length before reading, and checks actual bytes even if the header is absent or false. One fixed Uint8Array replaces per-chunk storage plus a second assembled copy. Data beyond the limit is never copied. It cancels an oversized stream without awaiting a potentially hanging or rejecting cancel callback.

A five-second deadline covers body reading. At most twice the configured byte limit in chunks are processed, also bounding empty/tiny-fragment streams and queued deadline reactions. Incomplete/timed-out/excessively fragmented streams return existing 400 INVALID_JSON, not partial success even if the bytes so far happen to form valid JSON. The upstream HTTP server/platform can already hold incoming data; these application checks do not replace connection, header, duration or concurrency limits at the host.

A valid 200-code-unit ASCII-letter name serialized entirely as Unicode escapes plus date metadata fits under 2 KiB. The 4 KiB default does not exclude documented compact valid requests. Redundant whitespace above the new limit is now intentionally rejected; this tightening is documented in the API contract. Existing Zod strict bodies, name bounds, normalization rules, leap-date validation and locale behavior are unchanged.

## Query and HTTP policy

Calculate, health and config reject query fields; putting PII in their query strings is not supported. Definitions/articles accept only a single optional vi locale, reject duplicates/unknown keys and cap the query string at 256 characters before materializing an object. Unknown fields were previously ignored on health/config/Calculate; this is documented hardening of undocumented requests.

All application success/error/304 responses carry X-Content-Type-Options: nosniff and Referrer-Policy: no-referrer. Next configuration adds the same headers under /api so framework 405/OPTIONS responses also receive them. X-Powered-By is disabled. Supported application methods remain GET plus automatic HEAD/OPTIONS for read routes, and POST plus automatic OPTIONS for Calculate. Normal unsupported GET/POST/PUT/PATCH/DELETE combinations return framework 405. Raw TRACE is an observed exception: all five routes return a generic framework 500 before handlers run; see the unresolved finding below. No new mutation method was enabled.

No Access-Control-Allow-Origin grant is emitted. Native Flutter and direct HTTP callers are unaffected by browser CORS; CORS is neither authentication nor abuse prevention. No browser client origin has been approved. If one is added later, define an explicit origin list, necessary methods/headers and correct Vary behavior; do not default to wildcard access or embed a secret in Flutter.

HSTS is left to Vercel's HTTPS hosting layer. Official response-header documentation lists HSTS with a default two-year max-age; confirm it on the actual deployment/custom domain. It was not verified on a live HTTPS project, and our localhost HTTP responses do not add it. No includeSubDomains/preload policy was imposed on domains we do not control. [Vercel response headers](https://vercel.com/docs/headers/response-headers).

CSP was not blindly added to JSON APIs. The existing rendered root page has no submitted-profile rendering or untrusted HTML injection in the reviewed implementation; a page-specific CSP would require separately testing the Next/React scripts/styles. No browser-wide policy was added without that validation.

## Error behavior and 429

The existing envelope and codes are preserved. RATE_LIMIT_EXCEEDED is added to the typed error-code inventory and OpenAPI error schema for formatter support. A future genuine application-origin 429 uses the same envelope with a validated Retry-After delta in 1–86,400 seconds (safe default 60). Unit tests prove formatting only; no endpoint currently enforces an application quota. No instance-local rate counter was implemented.

WAF is outside the handler, so its 429 may not be JSON and may not carry our headers. Flutter must inspect status before decoding, honor valid Retry-After if present and apply capped backoff/jitter otherwise. No rate-limit headers or active enforcement claims are fabricated by the application. The WAF setup guide is a manual deliverable, not an applied configuration.

## Privacy review and platform boundary

A source scan of lib/ and app/api/ found no console payload/error logging, request/result writes, outgoing analytics or external calculation calls. Only the explicit size-setting environment allowlist is read. No submitted profile or calculation result is retained in module state. Public lookup/serialization caches hold only validated static articles/metadata, never names, dates or calculated indices. Request error details contain safe field identifiers and Zod codes, not raw values or unknown keys.

.gitignore excludes .env*, .vercel, build output and debug logs; git's tracked-file inventory contains no .env file. No secret values were printed during review. Ignore rules do not prove that a credential has never existed in repository history; no full-history secret-scanning service was claimed. Do not commit platform tokens or add request-body capture to telemetry.

Use HTTPS on deployed clients. Vercel/provider access metadata can include IPs, paths, user agents and timing; malicious or incorrect callers can put personal data into URLs before application validation. The application cannot promise no retention anywhere. Project owners must review provider logging, access controls, exports/drains and retention, and keep body capture disabled. The existing development agent-feedback/Next telemetry settings were not silently changed; they require separate owner review if development-source telemetry policy changes.

## Lightweight observability plan — documentation only

No paid monitoring product, export integration, runtime payload logger, alert or live dashboard setting was added. Proposed metric dimensions are deliberately bounded:

| Metric | Allowed labels / fields | Excluded |
| --- | --- | --- |
| Request count and duration histogram | Fixed route pattern, method, HTTP status | Full dynamic URL, raw query, name/date/body |
| Application error count | Typed error.code, fixed route pattern | Error object, stack, submitted fields |
| Response bytes | Numeric approximate UTF-8 bytes and route pattern | Serialized response, normalized input identity |
| WAF threshold/block count | Rule identifier, action and aggregate region/network context | Personal profile data, user-generated counter keys |

Use the project Logs view to inspect sanitized function failures and duration/status trends; check function usage and spend in the project dashboard. Inspect the project's current permissions, retention and available filters before enabling exports or alerts. Vercel runtime logs and retention capabilities vary by plan; this review did not inspect account settings. [Runtime logs](https://vercel.com/docs/logs/runtime).

In Firewall, inspect each custom rule's matching/threshold traffic and false positives before enabling enforcement; correlate aggregate rejection rates with function usage rather than capturing profiles. Check representative carrier-NAT traffic. [Firewall observability](https://vercel.com/docs/vercel-firewall/firewall-observability).

Suggested operational review: rising 400/413 suggests malformed/abusive traffic; 500 INTERPRETATION_CONTENT_MISSING identifies the known editorial gap rather than infrastructure instability; unexpected INTERNAL_ERROR needs investigation without logging input. Configure alert thresholds only after baseline traffic and operator approval. No alerts are currently claimed enabled.

## Dependency audit

Initial permitted npm audit --omit=dev --json reported **24 findings: 6 critical, 7 high, 9 moderate, 2 low**. Package gh was the only unused direct production dependency and pulled in legacy tooling (including request, vulnerable template/utility packages and old GitHub clients). No runtime imports or npm scripts referenced it. Uninstalling gh with lifecycle scripts disabled removed 281 packages. This reduced dependency exposure; it does not assert that an exploitable API call path to every advisory existed.

The final production audit returned **zero known vulnerabilities**, with no Next/React/Zod major upgrade and no audit fix --force. The first sandboxed audit could not reach the registry; the permitted network rerun succeeded. Audit findings are time-dependent and do not prove absence of unknown vulnerabilities. Re-run the audit before deployment and maintain scheduled update review. Dev/build dependencies require their own continued review; this report's zero result is specifically --omit=dev.

## Remaining release risks

1. WAF enforcement, billing consent, rule slots and account plan are unverified and require manual configuration. Without it, valid repeated requests can still consume serverless capacity/budget.
2. Task 05's missing Birthday 11/22 content remains CRITICAL, and extensive article duplication remains HIGH. Normal fixture A succeeds, but affected valid profiles intentionally return missing-content 500. No content was fabricated.
3. Default Turbopack build remains blocked by this environment's CSS-worker port permissions; the supported Webpack production build and localhost checks were verified separately.
4. HTTPS/custom-domain headers, regional WAF enforcement, CDN behavior, provider metadata retention, spending controls and alerts require deployment verification.

Recommendation: **do not declare general production readiness** until manual protections and the existing critical/high content issues are resolved. No Task 07 work was started.

## Unresolved S-TRACE — framework method rejection returns 500

The expanded real HTTP test sends TRACE using Node's HTTP client because Fetch itself forbids TRACE. All five tested API routes return **500**, rather than the expected 405. A metadata-only inspection of health's TRACE response found plain text, 21 bytes, and no stack/path disclosure. The other 29 security HTTP assertions pass. The five TRACE checks remain FAIL in http-security-results.json; they were not weakened or removed.

Installed Next.js constructs a Web NextRequest in node_modules/next/dist/server/web/spec-extension/adapters/next-request.js before route-handler dispatch. A forbidden Web Request method fails there, outside our handlers/error utility. This is not TRACE echo support, but it is an incorrect status and creates framework error noise. Handler-level exports cannot safely catch that earlier failure. No node_modules patch, custom production server or unreviewed major framework upgrade was added.

Recommended action: verify an upstream compatible patch and regression-test it, or have the project operator reject unsupported methods at the edge before the function. The manual WAF guide includes a narrowly scoped TRACE-deny proposal, which ordinarily yields an edge denial rather than promising application 405. Neither mitigation is active or deployment-verified. Track this as MEDIUM unresolved framework behavior and preserve the failing HTTP assertion until fixed/explicitly accepted. HSTS/WAF/account checks remain manual and are not proven by localhost tests.
