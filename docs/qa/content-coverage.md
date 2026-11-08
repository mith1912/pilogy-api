# Interpretation coverage — Task 05

**FAIL: two reachable combinations are missing.** The expected draft count of 99 matches the files, but completeness requires 101 current V1 combinations.

## Executed checks

All 10 JSON files (nine content groups plus coverage.json) parse as fatal-checked UTF-8 and JSON. All 99 articles pass the existing strict Zod file/item schemas, including nonblank fields, locale/version, duplicate value checks, matching file/index, and base values. All 99 index/value pairs are unique. No placeholder, replacement character or unpaired surrogate was detected. All nine content-group files use locale vi; their contentVersion and the coverage manifest version are consistently v1.0.0-draft. The manifest counts match actual per-file counts.

| Index | Loaded | Reachable domain | Missing | Unreachable/unused records | Result |
| --- | ---: | --- | --- | --- | --- |
| lifePath | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| expression | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| soulUrge | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| personality | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| birthday | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22 | birthday/11, birthday/22 | none | FAIL |
| attitude | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| maturity | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | none | none | PASS |
| personalYear | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | none | none | PASS |
| personalMonth | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | none | none | PASS |

Coverage: **99 / 101 = 98.02%** of reachable index/value combinations. No unreachable content records were found. The 101 domains are independently established by fixed witnesses in tests/fixtures/domain-witnesses.json and executed against the engine. Birthday 33 and all personal-cycle masters are unreachable and do not require articles.

## CRITICAL C-01 — missing Birthday master articles

- birthday/11: reachable on day 11 and day 29; e.g. 1998-02-11, 2000-02-29.
- birthday/22: reachable on day 22; e.g. 1998-02-22.
- Full lookups correctly return 404 INTERPRETATION_NOT_FOUND. Calculate correctly returns 500 INTERPRETATION_CONTENT_MISSING and no partial data. Native handler and actual HTTP tests verify this policy; correct error handling does not make coverage complete.
- Required action: obtain approved dedicated Vietnamese Birthday 11 and 22 articles, review and version them. Do not change Birthday arithmetic, substitute base values, or generate filler.

## Schema defect fixed

The content item validator previously accepted an article with index birthday, value 33, baseValue 6. A new regression initially failed, then passed after adding a Birthday-domain constraint. Existing imported records were valid and unchanged. Lookup syntax remains compatible: a syntactically valid Birthday/33 URL still returns 404 because no article exists.

## Master content

All 18 reachable master combinations for lifePath, expression, soulUrge, personality, attitude and maturity have dedicated records with correct 11→2, 22→4, 33→6 bases. The source-exact full-content test loops through all 99 records, including these masters. Explicit fixture/domain tests verify their numeric values; no base-value article fallback is used. Two reachable Birthday masters remain missing.

## Reproduction and release gate

`node scripts/qa-content.mjs` regenerates [content-audit.json](content-audit.json) without changing source content. `npm run qa` first runs all Vitest tests, then runs the content audit with --check. The gate exits 1 for actual missing content or extensive duplicated challenge descriptions. Diagnostic tests intentionally verify the observed gap; their PASS is not a claim of content completeness. The separate failing gate prevents a green technical test suite from being mistaken for editorial release approval.

## Source fingerprints

SHA-256 fingerprints for reproducibility; no source JSON was edited by Task 05.

| File | SHA-256 |
| --- | --- |
| attitude.json | 28da9c71d18c610385f5be3d2b481eb781ea14d0a1863a7cc39907b8e92fadc5 |
| birthday.json | 2534c71c2182e5398c5750c0cde2ce3629381afc06c780c09a7cb351dc609e05 |
| coverage.json | 9bc733d6dc650f4cfe4ed7a4d5ba1c7e59f9d41cdb677f5a903cdbc3cbfc7cf9 |
| expression.json | c3b66938c50ec77daf280724d1e871699160b057ae954f666a6b417ac426d8fa |
| life-path.json | 2df9f896ab074b4ef21523109bafae8f5dae0772f8fd92eb44a41b0bffbabada |
| maturity.json | 404d72ce85f392c16bed7f02fa052af3dff3f9cce1419d3fbe4095e686f37ee5 |
| personal-month.json | af1d91d1dbcb6759678186db0848db55bc62ef82cb9252371c869efc98345c5f |
| personal-year.json | 1ece304c7e3c807f174ea770239b243fbac005cbfd192af1ddea9f3f3f8d8a0a |
| personality.json | 978cfd19098a50e5cc665d55773f7fd17a4bfa8821675d7e49f33bae69099200 |
| soul-urge.json | 444e867e71beb4bb0e8b3ca4a00a41209ccface5d7e51000caffb728853bdf4c |
