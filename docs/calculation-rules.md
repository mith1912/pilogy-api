# Pythagorean calculation rules — V1

The rules supplied in Task 02 are implemented in deterministic TypeScript. No LLM, storage, HTTP API, implicit clock or random input participates in arithmetic. Interpretations are resolved separately from the imported Vietnamese catalog; they do not participate in arithmetic.

## Names

Replace Đ/đ with D, decompose Unicode using NFD, remove combining marks, uppercase, and retain ASCII A–Z and whitespace only. Display normalization trims and collapses whitespace to one space (`Nguyễn Văn An` → `NGUYEN VAN AN`). Punctuation is removed rather than converted to spaces. Whitespace is ignored by calculations. Names with no remaining A–Z letters are invalid. No additional transliteration table is used.

The supplied rules do not define a zero-total vowel or consonant group. Until that convention is specified, full-profile calculation for such names raises UnspecifiedCalculationRuleError (HTTP 422), rather than inventing a numeric index. Name analysis can still report their raw totals.

Vowels: A E I O U. Y is always a consonant. Letter values:

| Value | Letters |
| --- | --- |
| 1 | A J S |
| 2 | B K T |
| 3 | C L U |
| 4 | D M V |
| 5 | E N W |
| 6 | F O X |
| 7 | G P Y |
| 8 | H Q Z |
| 9 | I R |

## Reduction and dates

Repeatedly sum decimal digits. Core calculations stop at 1–9 or 11, 22, 33, including intermediate masters. The baseValue continues reduction of the final master to one digit. Base reduction steps are labeled `.base` and do not replace the preserved final value. Personal Year and Personal Month never preserve masters.

Dates are Gregorian YYYY-MM-DD strings (0001–9999), parsed as integer components. Leap years are divisible by 4 except centuries not divisible by 400. Pure calculations use no Date object, timezone conversion or server clock. Request validation resolves the default reference date using the current UTC calendar date. Future dates are permitted; no age limits are introduced.

`referenceDate` is optional in requests and defaults to the current UTC calendar date. All nine indices are always returned, with the effective referenceDate in the result and both personal cycles. Personal cycles use its calendar year and month, regardless of whether the birthday has occurred. The pure engine receives an explicit referenceDate.

## Formulas

| Index | Calculation |
| --- | --- |
| Life Path | Reduce birth month, day, year separately preserving masters; sum those final values and reduce preserving masters |
| Expression | Sum all letter values; reduce preserving masters |
| Soul Urge | Sum vowels; reduce preserving masters |
| Personality | Sum consonants; reduce preserving masters |
| Birthday | Reduce birth day preserving masters |
| Attitude | Sum birth month and day, then reduce preserving masters |
| Maturity | Sum final Life Path and Expression values (including masters), then reduce preserving masters |
| Personal Year | Reduce birth month, birth day, reference year separately to single digits; sum and reduce to one digit |
| Personal Month | Sum final Personal Year and reference month, then reduce to one digit |

## Approved examples

Nguyễn Văn An, born 1990-05-20, target 2026-11-08:

- Normalized: NGUYEN VAN AN; total 48; vowels 10; consonants 38.
- Life Path: month 5 + day (20→2) + year (1990→19→10→1) = 8.
- Expression: 48→12→3. Soul Urge: 10→1. Personality: 38→11 (base 2).
- Birthday: 20→2. Attitude: 5+20=25→7. Maturity: 8+3=11 (base 2).
- Personal Year: 5+2+(2026→10→1)=8. Personal Month: 8+11=19→10→1.

1998-02-11: 2+11+(1998→27→9)=22, base 4.

## Architecture and extensions

`lib/numerology/name.ts`, `date.ts` and `reduction.ts` contain pure helpers. `versions/v1.ts` composes indices; `service.ts` selects the versioned engine. Routes validate with Zod, call the service, and wrap results. Pure engine callers must provide validated input; date and name helpers independently reject impossible dates and names without letters.

Each index returns type, value, baseValue, and steps (`label`, `operation`, `inputs`, `result`). Steps preserve component reductions, input sums, repeated digit sums and final master base reductions. Unchanged date components appear in the final sum. Name analysis includes letter/group/value entries to explain totals.

Add new indices only with specified rules and worked examples, extend IndexId/result types, implement pure modules, and test approved fixtures and edge cases. Formula changes after release require a new versioned engine and explicit registry/selection policy; the HTTP API version is independent. Do not overwrite released conventions silently. Interpretation content belongs separately in lib/interpretations. The imported Vietnamese draft catalog is validated and served unchanged; missing entries are reported without changing calculations.
