# Numerology V1 API contract

Base path: `/api/v1`. Stateless, no authentication, database, or profile persistence. Flutter owns local profiles. The executable contract is [openapi.yaml](openapi.yaml), OpenAPI 3.1, encoded using JSON-compatible YAML 1.2. See [flutter-integration.md](flutter-integration.md) for client behavior.

## Responses and endpoints

Success: `{ "success": true, "data": {} }`.
Error: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": [] } }`.

Every application error includes `details`, either empty or safe `{ field, code }` entries; never submitted values, stack traces, or private configuration. Clients branch on HTTP status and stable `error.code`, not message text or Zod detail codes. Framework/platform failures (404 for unknown routes, 405, automatic OPTIONS, proxy/body limits) can have different or non-JSON bodies.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/health` | `{ status: "ok", apiVersion: "v1" }`, liveness only |
| GET | `/config` | Public configuration and capability flags |
| POST | `/numerology/calculate` | All nine numerical indices and all nine short summaries |
| GET | `/numerology/definitions?locale=vi` | Metadata for all nine index types and coverage |
| GET | `/numerology/interpretations/{type}/{value}?locale=vi` | One complete imported article |

Normal success is 200; public content may return bodyless 304 when its ETag matches. No personalized response is publicly cacheable.

## Calculate

```http
POST /api/v1/numerology/calculate
Content-Type: application/json
```

```json
{
  "fullName": "Nguyễn Văn An",
  "birthDate": "1990-05-20",
  "referenceDate": "2026-11-08",
  "locale": "vi"
}
```

| Field | Contract |
| --- | --- |
| fullName | Required string, trimmed, 1–200 UTF-16 code units; must contain letters after V1 normalization |
| birthDate | Required real Gregorian YYYY-MM-DD, years 0001–9999 |
| referenceDate | Optional real Gregorian YYYY-MM-DD; defaults to current UTC calendar date |
| locale | Optional `vi`, default `vi` |
| targetDate | Deprecated compatibility alias; used when referenceDate is omitted; both must agree if supplied |

Timestamps, impossible dates, null values, unknown fields and non-object bodies are rejected. Future birth dates remain accepted. JSON charset parameters are accepted; actual streamed UTF-8 bytes are limited to 4,096, regardless of Content-Length. No raw payloads or validation exceptions are logged.

Successful `data` contains `calculationVersion`, `contentVersion`, `locale`, effective `referenceDate`, `name`, `indices`, and `interpretations`. The original calculation fields and steps are unchanged. `name` includes `normalizedName`, `nameTotal`, `vowelTotal`, `consonantTotal`, and `letters` with `{ letter, value, group: "vowel" | "consonant" }`.

`indices` and `interpretations` both have all nine keys, listed below. Each numerical index has `{ type, value, baseValue, steps }`; personal cycles also retain `referenceDate`. Each step has `{ label, operation: "sum" | "digitSum", inputs: number[], result }`. Steps include reductions, component sums and master base reductions. No steps are removed for payload optimization.

Each short interpretation has `{ index, value, baseValue, title, subtitle, tagline, summary, keywords }`. The required title/subtitle/tagline/summary are copied from the exact index/value article. `baseValue` and `keywords` remain for compatibility. Full article paragraphs are loaded separately. A missing required article fails the entire request with HTTP 500 `INTERPRETATION_CONTENT_MISSING`, never success with null, fallback or omitted summaries.

For the example above, `calculationVersion` is `v1`, `contentVersion` is `v1.0.0-draft`, effective `referenceDate` is `2026-11-08`, and values are:

| Index | Value | Base value |
| --- | --- | --- |
| lifePath | 8 | 8 |
| expression | 3 | 3 |
| soulUrge | 1 | 1 |
| personality | 11 | 2 |
| birthday | 2 | 2 |
| attitude | 7 | 7 |
| maturity | 11 | 2 |
| personalYear | 8 | 8 |
| personalMonth | 1 | 1 |

For example, `data.indices.personalMonth` is exactly:

```json
{
  "type": "personalMonth",
  "value": 1,
  "baseValue": 1,
  "steps": [
    { "label": "personalMonth.sum", "operation": "sum", "inputs": [8, 11], "result": 19 },
    { "label": "personalMonth", "operation": "digitSum", "inputs": [1, 9], "result": 10 },
    { "label": "personalMonth", "operation": "digitSum", "inputs": [1, 0], "result": 1 }
  ],
  "referenceDate": "2026-11-08"
}
```

Numerical results are deterministic for the same input and explicit reference date. Omission intentionally depends on the UTC date. Calculation version and content version evolve independently; content changes can change summaries without changing numeric results. Formula details remain in [calculation-rules.md](calculation-rules.md).

## Full interpretation and content versions

Example: `GET /api/v1/numerology/interpretations/personality/11?locale=vi`.

The public path parameter `type` is the stable camelCase index ID; the existing internal route directory remains `[index]` to preserve structure. `value` is exactly 1–9, 11, 22, or 33, without leading zeros. Invalid type/value syntax returns 400; a syntactically valid lookup without an article returns 404. Locale defaults to `vi`; unsupported locales, duplicate parameters, or unknown query fields return 400. Master articles are retrieved by master value, never substituted with base content.

Successful data is `{ calculationVersion: "v1", locale: "vi", contentVersion: "v1.0.0-draft", interpretation }`. The interpretation is the full unmodified JSON item, with:

- index, value, baseValue, title, subtitle, tagline, summary, essence
- strengths and challenges: arrays of `{ title, description }`
- relationships, careerAndGrowth, lifeLesson, reflection, affirmation
- keywords (string array), suggestedAction, periodFocus when present

The 99 imported entries are statically imported and validated once per module initialization, not reparsed per request. Content is draft and must be editorially reviewed before release. Birthday 11/22 articles are missing, even though the engine can return those values (day 29 also reduces to Birthday 11). Full lookup returns 404 and Calculate returns 500 for those missing articles. No JSON text or formulas have been changed.

## Definitions

`GET /api/v1/numerology/definitions?locale=vi` returns `calculationVersion`, `contentVersion`, `locale`, draft `status`, legacy `plannedIndices`, nine `definitions`, and `missingContent`.

Every definition has `type`, Vietnamese `title`, `englishTitle`, formula-based `description`, `source` (comma-separated contributing field/index IDs), `displayOrder` (1–9 in INDEX_IDS order), `supportsMasterNumbers`, `availableValues`, and `supportedValues`. `supportedValues` describes engine outputs; `availableValues` is their intersection with actual content. The previous list of per-value summary definitions has been replaced by the requested per-type metadata.

| Types | Engine values | Available article values |
| --- | --- | --- |
| lifePath, expression, soulUrge, personality, attitude, maturity | 1–9, 11, 22, 33 | 1–9, 11, 22, 33 |
| birthday | 1–9, 11, 22 | 1–9 |
| personalYear, personalMonth | 1–9 | 1–9 |

Birthday cannot return 33 because its input day is at most 31. Personal cycles never preserve masters. The response explicitly includes `missingContent: [{ index: "birthday", values: [11, 22] }]`. Definitions locale validation matches the full-content endpoint.

## Public configuration

`GET /api/v1/config` returns:

```json
{
  "success": true,
  "data": {
    "apiVersion": "v1",
    "calculationVersion": "v1",
    "defaultLocale": "vi",
    "supportedLocales": ["vi"],
    "maxRequestBytes": 4096,
    "calculationAvailable": true,
    "features": {
      "calculations": true,
      "interpretationSummaries": true,
      "fullInterpretations": true,
      "definitions": true
    }
  }
}
```

The extra legacy public calculationVersion, maxRequestBytes, and calculationAvailable fields are retained for compatibility. Capability flags describe implemented APIs, not universal article completeness. Internal rate-limiter state is no longer exposed. There is no advertising, payment, authentication, environment or secret configuration.

## Error codes

| HTTP | Stable code | Meaning / client action |
| --- | --- | --- |
| 400 | INVALID_JSON | Empty/malformed JSON or invalid UTF-8; fix encoding/body |
| 400 | VALIDATION_ERROR | Invalid fields, dates, type, value, locale or query; fix request |
| 404 | INTERPRETATION_NOT_FOUND | Valid lookup has no supplied article; show unavailable state |
| 413 | PAYLOAD_TOO_LARGE | Body exceeds 4 KiB; reduce request |
| 429 | RATE_LIMIT_EXCEEDED | Application formatter support only; WAF enforcement must be configured separately |
| 415 | UNSUPPORTED_MEDIA_TYPE | Send application/json |
| 422 | CALCULATION_RULE_UNSPECIFIED | Name has no vowel or consonant total; zero-group conventions are unspecified |
| 500 | INTERPRETATION_CONTENT_MISSING | Required summary missing; no partial Calculate data returned |
| 500 | INTERNAL_ERROR | Unexpected failure; generic safe message |

No application rate limiter is implemented. The shared error utility can format HTTP 429 RATE_LIMIT_EXCEEDED with a bounded Retry-After header; no endpoint currently triggers that code from a deployed limiter. WAF-generated 429 bodies are platform-controlled and may not be JSON. See security/vercel-waf-setup.md.

## Caching and payload sizes

Calculate, config, health, and every application error use `Cache-Control: no-store`. Calculate never emits an ETag. Definitions and full articles use `Cache-Control: public, max-age=0, must-revalidate` and a weak SHA-256 `ETag` covering the entire response including metadata. Send `If-None-Match`; a match returns 304 with no JSON body and the same cache policy/ETag. Reuse the stored successful body. Unknown validators return a normal 200.

These URLs are mutable, so they are never marked immutable. Content version is included in the representation and validator. Flutter can keep local articles keyed by `(contentVersion, locale, type, value)` and revalidate when retrieving the current public URL. Deploy content changes with a new contentVersion; calculations remain independently versioned. No cache, CDN or database infrastructure is required by this implementation.

Measured compact UTF-8 envelopes using the example Calculate request, lifePath/8 article and current definitions/config:

| Response | Uncompressed bytes | Approximate gzip bytes |
| --- | --- | --- |
| Calculate | 11,469 | 2,620 |
| Full interpretation | 5,219 | 1,940 |
| Definitions | 3,035 | 772 |
| Config | 277 | 179 |

Sizes include JSON envelopes but exclude HTTP headers. Compression is a local estimate, not a guarantee that the hosting platform enables gzip. Name length and steps change Calculate size. The measurement test uses only the fixed documentation fixture and logs byte counts, never submitted names, dates or results.

## Task 06 hardening and compatibility notes

The default Calculate body limit is now **4,096 bytes** (previously 16,384). This deliberately rejects previously accepted whitespace-heavy requests above 4 KiB. Valid inputs remain compatible: a 200-code-unit ASCII-letter name serialized entirely as Unicode escapes, both date fields, locale and the legacy alias fit below 2 KiB. Private deployment setting `NUMEROLOGY_MAX_REQUEST_BYTES` accepts integers 2,048–16,384; invalid configuration fails initialization without echoing its value. Config reports the effective limit. Body reads use a fixed buffer, a 5-second deadline and a maximum of twice the byte limit in chunks; incomplete/excessively fragmented streams return 400 INVALID_JSON. Hosting connection/request limits must still be configured.

Health, config and Calculate now reject all query fields with 400 VALIDATION_ERROR. Public locale endpoints retain strict unknown/duplicate query rejection and cap the query string at 256 characters. This changes previously ignored, undocumented query inputs; no documented request fields or successful calculation data changed.

All application responses and framework responses under /api receive X-Content-Type-Options: nosniff and Referrer-Policy: no-referrer. No browser CORS origin is granted. Next.js continues to enforce method restrictions with framework 405 and automatic OPTIONS/HEAD where applicable; those framework bodies may not use the application envelope. HSTS is left to the HTTPS hosting layer and is not emitted on local HTTP by application code. No blanket API Content-Security-Policy was added.

Static public articles/summaries are deeply frozen and indexed once; full article/definition JSON and ETags are precomputed once per module instance. Calculate still serializes each personalized result and never enters the public cache path. Config intentionally retains no-store compatibility. The fixed immutable content maps are not rate limiters and contain no user data.

Local Task 06 HTTP testing found a framework exception for raw TRACE: the installed Next.js Web Request adapter returns generic 500 before handlers, rather than 405. This is tracked in docs/security/security-review.md and the failing HTTP evidence. Other tested unsupported methods correctly return 405. No TRACE handler or echo behavior is implemented; edge rejection/upstream remediation remains pending.
