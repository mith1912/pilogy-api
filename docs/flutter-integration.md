# Flutter V1 integration

Use the HTTPS deployment base URL with `/api/v1`. This backend has no login, profile storage, payments or advertising API. Store user profiles and any saved calculations locally. Do not attach profiles to telemetry, HTTP debug logs or crash breadcrumbs. No Flutter implementation is included in this task.

## Suggested request flow

1. Read `/config` for `defaultLocale`, `supportedLocales` and `features`. These are capability flags; article coverage is provided separately.
2. Read `/numerology/definitions?locale=vi` for the nine types, display metadata, engine values and available content values. Birthday 11/22 content is currently unavailable.
3. Send `POST /numerology/calculate` with JSON `fullName`, `birthDate`, explicit `referenceDate`, and `locale: "vi"`. Use Gregorian date-only strings, never local timestamps. An explicit reference date makes repeat calculations stable. If omitted, the server uses the current UTC calendar date and returns the effective date.
4. Display the nine numerical indices and summaries from the successful response. Keep value and baseValue distinct: Personality 11 has baseValue 2, and its article lookup uses 11. Preserve steps if the UI explains the arithmetic.
5. On detail navigation, request `/numerology/interpretations/{type}/{value}?locale=vi`. This returns all imported sections, including optional periodFocus for personal cycles. Do not request full articles to populate overview cards.

Example request:

```json
{
  "fullName": "Nguyễn Văn An",
  "birthDate": "1990-05-20",
  "referenceDate": "2026-11-08",
  "locale": "vi"
}
```

Expected values: lifePath 8, expression 3, soulUrge 1, personality 11, birthday 2, attitude 7, maturity 11, personalYear 8, personalMonth 1. Both versions and the exact reference date are returned. All nine keys exist in both `indices` and `interpretations`. Calculate is all-or-error; there are no null summaries.

## Models and compatibility

Decode the envelope first: `success: true` contains data; `success: false` contains error with code, message, details. Numeric values and step inputs/results are integers. Steps use only `sum` and `digitSum`. Index IDs are camelCase and must be sent unchanged as path types. Definitions contain type-level metadata; `availableValues` is not the same as `supportedValues`. Display order starts at 1.

Summary fields are index, value, baseValue, title, subtitle, tagline, summary, keywords. Full article fields are documented in [api-contract.md](api-contract.md) and [openapi.yaml](openapi.yaml). Handle optional periodFocus and additive response fields without failing decoding. Do not submit unknown request fields. Request locale defaults to vi; null and unsupported locales are errors. `targetDate` is a deprecated compatibility alias; new clients should send referenceDate.

The versions have different purposes: calculationVersion identifies arithmetic conventions; contentVersion identifies editorial content. When an article response has a newer contentVersion than a previously saved Calculate response, keep the numeric result and refresh the content rather than relabel the old article as the new version. Content may change between requests; there is no version-pinned historical content endpoint.

## Caching

Never place Calculate responses in shared/public caches. The API sends no-store. Profiles and explicitly saved calculation results remain Flutter-owned local data.

Definitions and full articles are public and use ETag revalidation. Save the successful JSON and its ETag locally. On another request to the same URL, send `If-None-Match`. For 304, reuse the stored body; do not attempt to decode an empty response. Without a saved body, perform a normal unconditional GET. Key local articles by contentVersion, locale, type and value and retain the URL-to-current-validator mapping separately. Current URLs require revalidation and must not be treated as permanently immutable.

Calculate is approximately 11.5 KB raw / 2.6 KB gzip for the example. A full article is approximately 5.2 KB raw / 1.9 KB gzip. Actual network compression depends on hosting. Load articles on demand; do not bundle or repeatedly download all 99 articles at startup.

## Errors and retries

Use stable error.code for UI behavior; message is for readable context, and details contains safe field/code pairs rather than raw inputs. See the complete status/code table in [api-contract.md](api-contract.md).

- 400, 413, 415: correct the request; do not retry unchanged.
- 404 INTERPRETATION_NOT_FOUND: show article unavailable.
- 422 CALCULATION_RULE_UNSPECIFIED: explain that the current V1 rules do not support this letter-group case.
- 500 INTERPRETATION_CONTENT_MISSING: required editorial content is unavailable; no partial result is supplied. Repeating unchanged requests will not repair the missing Birthday 11/22 articles.
- 500 INTERNAL_ERROR or transport failures: use bounded retries with backoff and a cancellation/timeout policy. Keep the same explicit referenceDate on retries, especially near UTC midnight.

Handle non-JSON errors from hosting, unsupported methods, gateways or platform rate limiting before decoding the standard envelope. A 304 is a cache hit, not an application error. No authentication headers are required. Native mobile clients do not need browser CORS headers.

## Release readiness

Obtain approved Birthday 11 and 22 articles and editorial review of all `v1.0.0-draft` content before a general public release. Current behavior intentionally returns a clear server error for required missing content rather than inventing an interpretation.

Configure distributed/platform rate limiting, HTTPS, hosting request/time limits, and telemetry that excludes bodies and personal data. No instance-local limiter is present. Run deployed HTTP smoke tests for the example, public ETag/304 behavior, compression, error envelopes and provider limits. Local route integration tests do not validate the deployment proxy or CDN.

## Task 06 transport/security notes

The default JSON body limit is 4 KiB; read maxRequestBytes from config if deployment overrides are used. Keep the name within 200 UTF-16 code units and send compact JSON. Send personal data only in the HTTPS POST body, never URL queries; health/config/Calculate query fields are now rejected. An incomplete request body may return 400 INVALID_JSON after the read deadline. Error messages never include raw input.

Handle HTTP 429 before assuming a JSON body. Vercel WAF may send a platform HTML/text response; the application utility also supports the RATE_LIMIT_EXCEEDED envelope if an actual app-side integration is added later. Neither WAF nor an application limiter is claimed active. Honor valid Retry-After delta seconds or HTTP dates with bounded delays, otherwise back off with jitter. Avoid simultaneous retry storms behind mobile carrier NAT. A Flutter-bundled API key is not a secret or substitute for edge enforcement. See [WAF setup](security/vercel-waf-setup.md).

Locally saved calculations should include calculationVersion, contentVersion, locale, effective referenceDate and a local normalized-input identity so stale records are distinguishable. Treat normalized names, birth dates and identities derived from them as sensitive; do not send those identities to analytics or put them in shared cache keys. Protect local profile/result storage according to the app's device-security policy. Public articles may be cached separately by contentVersion/locale/type/value and revalidated with ETags. CORS is a browser policy, not protection against native or direct HTTP clients.
