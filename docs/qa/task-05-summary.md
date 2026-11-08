# Task 05 QA summary

Overall recommendation: **FAIL for production release**. Technical arithmetic/API checks pass, but two reachable Birthday master interpretations are missing and extensive editorial duplication is unresolved. Task 06 has not been started.

## Executed verification

| Command / check | Result | Evidence |
| --- | --- | --- |
| npx vitest run --reporter=default --reporter=json --outputFile=/private/tmp/numerology-qa-vitest.json | PASS | 310 tests, 12 files, 0 failures |
| npm test | PASS | 310 tests, 0 failures |
| npx tsc --noEmit | PASS | Exit 0 |
| npm run type-check | PASS | Next type generation and TypeScript exit 0 |
| npm run lint | PASS | Final run exit 0, no warnings; an unused QA-script binding was corrected |
| npm run build | BLOCKED | Exit 1: Turbopack CSS worker cannot bind a local port, Operation not permitted, including elevated execution |
| npm run build -- --webpack | PASS | Production compilation, TypeScript, static generation and build traces complete |
| node scripts/qa-http.mjs | PASS | Actual production-server HTTP: 30 checks passed, 0 failed; see http-results.json |
| node scripts/qa-content.mjs | PASS for audit execution | Produces content-audit.json; this is not an editorial approval |
| npm run qa | FAIL at release gate | 310 tests pass; content gate exits 1 for missing Birthday content and extensive duplicated challenge descriptions |

The initial sandboxed HTTP client attempt was BLOCKED by localhost access; the permitted rerun passed. Turbopack is explicitly BLOCKED, not reported as PASS because Webpack passed. No external editorial service, spell-check dictionary or native-human approval was executed; those are not claimed as completed checks.

## Calculation results

**43 full-profile independent fixtures** include mandatory A/B plus 41 additional cases; every fixture checks all nine values and base values (387 index comparisons), name order/mapping/group totals and all emitted step arithmetic. All fixture A step arrays are manually transcribed and compared exactly. Fixed expected data is in tests/fixtures/independent-v1.json and fixture-a-steps.json.

**101 explicit index/value witnesses** cover every supported domain combination. They are not 101 additional full-profile assertions: each witness targets one value and has independently specified arithmetic. Reachable master values, intermediate masters, segmented versus direct date sums, day 29/30/31, leap days, years 0001/9999, month/year boundaries, and Personal Year 9→1 are exercised. No convention disagreement requiring a formula change was found.

Mandatory A matches NGUYEN VAN AN; total/vowels/consonants 48/10/38; values 8, 3, 1, 11, 2, 7, 11, 8, 1 in lifePath/expression/soulUrge/personality/birthday/attitude/maturity/personalYear/personalMonth order. Mandatory B preserves Life Path 22 from 2+11+9.

## Content and editorial results

99 valid unique records loaded from nine content files; coverage.json is the tenth JSON file. The actual reachable domain has 101 combinations: coverage is **98.02%**, with **birthday/11 and birthday/22 missing**, no unused/unreachable articles, no malformed JSON, schema errors, placeholders or detected Unicode defects in the imported content. Birthday 33 and personal-cycle masters are unreachable and do not require content.

All 18 available core master records are dedicated entries with correct bases and no fallback. The two Birthday masters remain absent. Day 29 also reduces to Birthday 11, so the missing-content policy affects more than birthdays on the 11th and 22nd.

Editorial diagnostics: zero exact duplicate summaries; 76 repeated field-text groups; 206 repeated sentence groups; 12 repeated title groups; 263 essence pairs at five-token-shingle Jaccard >=0.65; zero summary pairs or cross-index summary/essence pairs at that threshold. Both challenge descriptions are identical in all 99 records (198 copies). Six master-22 keyword phrases are unusually long. No explicit future-event/wealth/romance/scientific-personality guarantee was established in the checks, but this is not proof of editorial quality. The detailed report includes claim false positives, scope review for all nine indices and a 99-record review queue.

## Confirmed implementation defects fixed

1. **T-01 (MEDIUM):** a rejecting oversized-stream cancel callback masked the verified size violation as 500. Preserve 413 PAYLOAD_TOO_LARGE after best-effort cancellation.
2. **T-02 (MEDIUM):** content item validation accepted unreachable Birthday 33. Reject that content value without changing valid imported data or path syntax.

Both regressions were observed failing before the fix and passing afterward. Also froze a clock-sensitive test and removed an obsolete successful-null-summary assertion. No formulas, imported article text, routes, API fields, authentication or storage architecture were changed.

## Outstanding issues and release decision

| Severity | Issue | Required next action |
| --- | --- | --- |
| CRITICAL | C-01: Birthday 11/22 content missing | Supply and approve dedicated Vietnamese articles; version the catalog, update audited counts and rerun the suite |
| HIGH | H-01: extensive duplicate challenge explanations | Human editorial revision with index/value-specific examples and actions; do not generate filler merely to pass a metric |
| MEDIUM | Generic templating and insufficient differentiation | Review essence, reflection and suggested actions across indices and master/base pairs |
| MEDIUM | Expression terminology mismatch | Approve “Số biểu đạt” / “Số sứ mệnh” glossary and display aliases |
| MEDIUM | Six long master-22 keyword phrases | Review concise approved tags for Flutter |
| LOW | Capitalization and repeated phrasing | Native Vietnamese copyedit, retaining appropriate caveats |
| BLOCKED | Default Turbopack build | Re-run on a host that permits the CSS worker port; Webpack success is separately verified |
| Release prerequisite | Platform rate limits and deployment smoke tests | Configure distributed/platform limiting, no request-body capture, and validate deployed caching/limits/compression |

Do not claim production readiness with C-01/H-01 unresolved. The QA suite intentionally diagnoses known gaps separately from the failing release gate; 310 passing assertions are not a release approval. No source JSON was rewritten to make counts or similarity checks pass.

## Files changed or added by Task 05

- Production fixes: lib/api/request.ts; lib/validation/interpretations.ts.
- Test hygiene: tests/unit/validation.test.ts; tests/integration/interpretations.test.ts.
- New independent data: tests/fixtures/independent-v1.json; fixture-a-steps.json; domain-witnesses.json.
- New QA tests: tests/qa/calculation.test.ts; domains.test.ts; defects.test.ts; api.test.ts; content.test.ts.
- QA tooling: scripts/qa-content.mjs; scripts/qa-http.mjs; package.json adds qa; README documents commands.
- Reports/evidence: docs/qa/calculation-verification.md; content-coverage.md; content-editorial-review.md; api-verification.md; task-05-summary.md; content-audit.json; http-results.json.

Pre-existing uncommitted project files were preserved. AGENTS.md's generated instruction block was not removed. No src directory, database, authentication, Flutter code or infrastructure was introduced.

## Reproduction

`npm run qa` is the full automated test/content-gate command and currently exits 1 for the documented release blockers. `npm test` or `npx vitest run` runs the technical suite alone. `node scripts/qa-content.mjs` refreshes the diagnostic artifact without applying the gate. `node scripts/qa-content.mjs --check` runs the gate alone.

For real HTTP checks, first complete a production build and run `npm run start -- --hostname 127.0.0.1 --port 3105`, then `node scripts/qa-http.mjs`. QA_BASE_URL can select another explicitly authorized test deployment. The script submits only fixed documentation fixtures, saves check outcomes rather than response bodies, and exits nonzero on failure. Shut down the temporary server after testing. These scripts require no new package dependencies.
