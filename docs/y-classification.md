# Automatic Y classification

V1 trims the input, normalizes its letters to uppercase A–Z and assigns a Pythagorean value to each retained letter. A, E, I, O and U contribute to Soul Urge. Y is grouped using the effective mode. Other retained letters contribute to Personality. Y contributes 7 to Expression in all modes. Soul Urge and Personality sum their respective groups and preserve 11, 22 and 33 during reduction.

Send an optional `yMode` in the JSON body of `POST /api/v1/numerology/calculate`.

```json
{
  "fullName": "Nguyễn Thị Mỹ Lan",
  "birthDate": "2000-01-04",
  "referenceDate": "2026-11-22",
  "locale": "vi"
}
```

| Request mode | Behavior |
| --- | --- |
| Omitted | Apply `auto` to each Y. |
| `auto` | Recognize supported Vietnamese syllable spellings and apply the rule for each occurrence. |
| `vowel` | Put every Y in the vowel group. |
| `consonant` | Put every Y in the consonant group. |

## Rules in `vi-y-v1`

The classifier works on tokens of Unicode letters, marks and numbers, with spaces and punctuation acting as boundaries. It reads the submitted spelling before Pythagorean normalization. It sets aside Vietnamese tone marks for pattern matching, checks their placement, and retains vowel-quality distinctions such as `â` and `ê`. NFC and NFD produce the same classification, while each returned `originalCharacter` retains its submitted case and combining marks.

| Rule ID | Syllable pattern | Examples | Numerology group |
| --- | --- | --- | --- |
| `vi-vowel-nucleus` | Y is the nucleus in a supported open syllable or in a recognized `uy` rhyme. The U in these `uy` forms serves as a medial. | Mỹ, Lý, Kỳ, Thy, Thúy, Thủy | Vowel |
| `vi-compound-nucleus` | Y participates in the nucleus of a supported `yê` or `uyê` rhyme. Where a tone is present, this pattern expects it on Ê. | Yến, Yên, Yêu, Uyên, Nguyễn, Nguyệt | Vowel |
| `vi-final-glide` | Y ends a supported `ay`, `ây`, `oay` or `uây` rhyme. | Tây, Máy, Xoáy | Consonant |
| `legacy-fallback` | The token or mark pattern falls outside the recognized subset. | Yvonne, Lynn, Ryan, May, Nguyen | Consonant |

Vietnamese distinguishes a vowel nucleus, an optional medial glide, and a syllable coda that can include /j/. PILOGY maps a nuclear Y to the numerology vowel group and a recognized final-glide Y to the consonant group. Sources for the linguistic distinction are [Kirby’s Hanoi Vietnamese IPA illustration](https://www.phonetik.uni-muenchen.de/~jkirby/docs/kirby2011vietnamese.pdf) and [Kirby and Alves’ description of Vietnamese syllable structure](https://iris.unive.it/bitstream/10278/5039801/1/Phan%20et%20al%20-%20JSEALS_Special_Publication_9_ISVL1%20UPDATED.pdf#page=112).

Unmarked forms that fit the spelling of many languages are limited to the exact case-insensitive tokens `Y`, `My`, `Ly`, `Ky` and `Thy`. These conventional spellings can overlap with names in other languages. The classifier estimates roles from written tokens and has no language or pronunciation detection. Diacritic-stripped forms such as `Nguyen` fall back. A future caller that knows the intended grouping can choose a forced mode.

## Response and compatibility

`data.calculationOptions` for the example request contains:

```json
{
  "yModeRequested": null,
  "yModeApplied": "auto",
  "classificationRulesVersion": "vi-y-v1",
  "fallbackUsed": false,
  "yOccurrences": [
    {
      "originalCharacter": "y",
      "classification": "vowel",
      "numericValue": 7,
      "ruleId": "vi-compound-nucleus"
    },
    {
      "originalCharacter": "ỹ",
      "classification": "vowel",
      "numericValue": 7,
      "ruleId": "vi-vowel-nucleus"
    }
  ]
}
```

Entries follow the order of Y letters in `data.name.letters`. A name with no Y yields an empty array. Omitted mode returns `yModeRequested: null` and `yModeApplied: "auto"`. Explicit `auto` produces identical calculations and records `yModeRequested: "auto"`. Explicit overrides use `forced-vowel` or `forced-consonant`. Only an automatic fallback sets `fallbackUsed` to true.

For Nguyễn Thị Mỹ Lan, the former all-consonant default gave Soul Urge 9 and Personality 8. The automatic default gives Soul Urge 5 and Personality 3, with Expression unchanged at 8 (raw total 71). The date-based indices and reduction rules remain the same. If the resulting vowel or consonant group is empty, the existing HTTP 422 `CALCULATION_RULE_UNSPECIFIED` applies.

Existing mobile clients that omit `yMode` will use the new default on their next calculation after release. Previously saved results can differ from newly calculated results for the same input. Send `"yMode": "consonant"` to reproduce the former policy. Invalid values, including null, return a validation error.

For saved results, record the effective mode, classification rules version, effective date, locale and calculation version. Treat results stored before this change without mode metadata as prior consonant-mode results. Keep a local identity representing the submitted name and birth date. An ASCII-normalized name alone is insufficient because removing Vietnamese marks can change auto classification. The `vi-y-v1` version still identifies the same classification rules. This change selects those rules by default.
