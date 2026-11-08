# Vietnamese editorial review — Task 05

Recommendation: **FAIL for release**. The catalog is technically well-formed but incomplete and extensively templated. No source interpretation JSON was rewritten. This is an assisted editorial QA review, not native-editor approval or proof of semantic quality.

## Scope and method

All 99 records and every nested string were included in automated review, including summaries, full narrative fields, strengths/challenges, reflection, affirmation, keywords and periodFocus. The review below combines all-record diagnostics with qualitative inspection of shared templates, all 12 numeric themes, nine index scopes, dedicated master themes and flagged claim sentences. It does not claim 99 independent, human-reviewed article sign-offs. A record-level review queue is included at the end.

Reproduce using `node scripts/qa-content.mjs`. Complete field references, similarity pairs, repeated text, length measurements and claim candidates are in [content-audit.json](content-audit.json). Paths below are relative to `lib/interpretations/content/vi/`.

Normalization uses NFKC, Vietnamese lowercase and Unicode letter/number tokens; punctuation and repeated whitespace collapse, accents remain significant. Similarity is Jaccard overlap of sets of **five-token shingles**, separately for summary and essence. The warning threshold is **0.65**. There are 4,851 unordered record pairs per field. This is a lexical heuristic, not an embedding or semantic judgment. Cross-index duplication can exist in other fields even when summary/essence similarity is below this threshold.

“Word” counts here mean whitespace-separated Vietnamese tokens, often syllables, not linguistically segmented words. Short warnings use fewer than 35 summary tokens, 70 essence tokens, or 25 tokens in relationships/careerAndGrowth/lifeLesson. Long warnings use more than 250 tokens in those fields. Repeated sentences have at least eight tokens and occur at least five times; repetitions include multiple fields in one record. Exact repeated field-text groups likewise may include titles and keywords rather than full narrative paragraphs. These counts must not be presented as counts of copied articles.

## Findings overview

| Severity | ID | Finding | Evidence / action |
| --- | --- | --- | --- |
| CRITICAL | C-01 | Missing Birthday 11 and 22 | Reachable numeric outputs have no articles; obtain approved content |
| HIGH | H-01 | Challenge explanations extensively duplicated | One description is used 198 times, twice in each of 99 records; revise with index/value-specific context |
| MEDIUM | M-01 | Generic scaffolding and reused advice | 263 essence-pair warnings; 76 repeated field-text groups; differentiate explanation and actions |
| MEDIUM | M-02 | Expression terminology differs across metadata/content | API definition says “Số biểu đạt”; articles say “Số sứ mệnh”; approve a glossary and aliases |
| MEDIUM | M-03 | Master 22 keywords are whole descriptive phrases | Six records have a single 13-token phrase; review concise meaningful tags |
| LOW | L-01 | Repeated titles and capitalization style | 12 title groups reused by numeric value across index types; decide intentional naming/display context |
| LOW | L-02 | Awkward repeated phrasing and embedded sentence casing | “những lần mình nhìn…” and “Một gợi ý thực hành: Khởi động…” need copyediting |

C-01 and H-01 block the QA release gate. Other issues remain an editorial review queue. Severity is a reviewer judgment grounded in the examples, not automatically inferred from a similarity score.

## Automated measurements

| Check | Result |
| --- | --- |
| Exact normalized duplicate summaries | 0 |
| Duplicate field-text groups of at least eight tokens | 76 |
| Repeated sentence groups, at least five occurrences | 206 |
| Repeated title groups | 12 |
| Summary pairs with Jaccard >=0.65 | 0 |
| Essence pairs with Jaccard >=0.65 | 263 |
| Cross-index summary/essence pairs >=0.65 | 0 |
| Short / unusually long narrative warnings | 0 / 0 |
| Keyword warnings | 6 |
| Empty / placeholder / invalid Unicode issues | 0 |
| Claim-candidate occurrences | 255 |
| Candidates without the scanner’s simple negation words | 23; contextual inspection found false positives, not established promises |

Observed token ranges: summary 87–101; essence 177–197; relationships 70–74; careerAndGrowth 67–77; lifeLesson 63–76. Similar section lengths across all records support the templating concern. Passing a minimum-length check does not establish sufficient depth.

## H-01 — challenge descriptions provide no differentiated explanation

Every record has the same description in both challenge entries:

> Đây là một khả năng để tự quan sát, không phải điểm yếu được định sẵn. Khi nhận ra dấu hiệu này, hãy thử dừng lại và cân nhắc lựa chọn khác.

Examples: `life-path.json` lifePath/1 challenges[0].description; `personality.json` personality/11 challenges[1].description; `personal-month.json` personalMonth/9 challenges[0].description. The complete 198 references are in the audit artifact.

The disclaimer is appropriately non-deterministic, but repeating it as the entire explanation of every challenge supplies little practical insight. Keep an appropriate caveat while commissioning distinct situations, observable signs and small responses relevant to the index and numeric theme. This requires approved editorial work; QA has not generated replacements.

## M-01 — reuse across indices and generic padding

`life-path.json` lifePath/1, `soul-urge.json` soulUrge/1 and `personal-month.json` personalMonth/1 reuse the action:

> Khởi động một việc bạn đã trì hoãn, rồi mời một người góp ý trước khi đi quá xa.

The same reflection and affirmation also recur across nine indices for value 1. Common numeric symbolism can be intentional, but identical actions do not distinguish long-term development, private motivation and a single-month habit. Titles, numeric themes and several field sentences are keyed primarily by number rather than index.

Within a single index, `expression.json` expression/2 versus expression/9 has essence Jaccard **0.6786**; expression/6 versus expression/33 is also **0.6786**. Much of the shared essay is the surrounding scaffold. Master 33 has a distinct compassion/guidance theme, but its full explanation needs to be distinguishable from value 6 beyond a short theme substitution.

All essence entries repeat constructions such as “Dù điều đó có quen thuộc hay không…” and “Điều thú vị ở chủ đề này không nằm ở việc tìm một nhãn dán…”. These disclaimers are sensible in moderation; across the whole library they occupy substantial space. Review whether a common introductory note can reduce repetition while preserving the necessary caveat in each standalone article. Do not delete safety context merely to reduce similarity scores.

Recommended review order: challenge descriptions first; then long essence scaffolding; then reflection/actions for the same value across unrelated indices; then master-versus-base differentiation. Re-run the audit after approved revisions, but assess improved specificity rather than optimizing only for a threshold.

## Scope and theme review

The index-specific scaffolds align with the documented role at a broad level. No confirmed swapped index/value mapping or incorrect calendar convention was found. The shared numeric themes are: 1 initiative, 2 connection, 3 expression/creativity, 4 structure, 5 exploration, 6 care, 7 inquiry, 8 organization/results, 9 compassion, 11 sensitivity/inspiration, 22 vision/structure, 33 compassionate guidance. These are descriptions of the supplied draft, not new calculation conventions or asserted scientific facts.

| Index | Content evidence | Assessment and human-review recommendation |
| --- | --- | --- |
| lifePath | “Trên hành trình dài”; essence discusses choices across life stages | Long-term development is present; “thành tựu dài hạn” can narrow the emphasis to achievement. Review growth beyond career/results. |
| soulUrge | “Ở tầng động lực cá nhân”; vowels linked to an inner-motivation metaphor | Appropriate internal focus; make examples about private needs rather than reused outward actions. |
| personality | “Trong cách bạn xuất hiện trước người khác”; acknowledges image is partial and contextual | Outward presentation is present; distinguish perception from claiming to know what others think. |
| expression | “Khi biến năng lực thành việc làm”; full-name derivation and abilities/contribution | Broadly fits self-expression; resolve “sứ mệnh” versus “biểu đạt” naming without implying predetermined destiny. |
| birthday | “Như một điểm nhấn từ ngày sinh”; denies a complete or predetermined description | Appropriate symbolism for 1–9; the absence of 11/22 is a critical coverage issue. |
| attitude | “Khi có điều bất ngờ xảy đến”; discusses initial responses and adjustment | Appropriate situational approach; differentiate examples from Personality’s outward presentation. |
| maturity | “Khi kinh nghiệm sống dày lên”; combines Life Path and Expression, avoids fixed-age promises | Growth over time is present; ask for more concrete integration scenarios. No new age boundary should be invented. |
| personalYear | Explicit January 1–December 31 cycle and quarterly review | Correct calendar-year framing; annual actions need longer planning horizons than monthly actions. |
| personalMonth | One-month rhythm, small habit, weekly tracking | Appropriate monthly scope; periodFocus largely reuses annual/value advice and needs differentiation. |

All 18 existing core master entries have dedicated titles and summaries and correct base values. For example, personality/11 is “Người Đánh Thức Trực Giác”, not the personality/2 article. Dedicated records are not proof of sufficient editorial differentiation; inspect 11 versus 2, 22 versus 4 and 33 versus 6 in every supported core index. Birthday 11/22 require new approved source content; Birthday 33 and personal-cycle masters do not.

## Claims, predictions and scientific framing

The scan flags words such as “chắc chắn”, “bảo đảm”, “định mệnh”, “khoa học”, “dự báo” and “sẽ xảy ra”. A match is a review candidate, not a violation. The negation heuristic only detects “không/chưa/chẳng” and misses safe constructions such as “Thay vì…”.

Reviewed examples:

- `attitude.json` attitude/4 lifeLesson: “Một nền móng chắc chắn…” uses an adjective for a foundation, not a guaranteed outcome.
- `personal-month.json` personalMonth/1 periodFocus: “Thay vì chờ một sự kiện định mệnh…” discourages fatalistic prediction; it is not a promise of a fated event.
- careerAndGrowth sections say “không có con số nào quyết định nghề nghiệp hay bảo đảm thành tựu”; this explicitly rejects guarantees.
- personalYear essence says not to treat the theme as a prediction of events.

No explicit guarantee of wealth, romantic outcomes, a specific future event or scientifically proven personality was established by these checks and the inspected text. This is a limited negative finding, not proof that automated checks can certify every implication. An independent Vietnamese editor should review the full flagged sentence list and the final mobile presentation, where titles or extracted snippets may lose their caveats.

## M-02/M-03 and low-severity copyediting

`lib/interpretations/definitions.ts` defines Expression as “Số biểu đạt”, while all 12 `expression.json` articles use “Số sứ mệnh”; `maturity.json` also refers to “sứ mệnh”. These may be accepted aliases, but Flutter should not appear to expose two different indices. Obtain a product glossary decision; do not rewrite source articles automatically.

The six value-22 records (lifePath, expression, soulUrge, personality, attitude, maturity) use one keyword: “khả năng kết hợp tầm nhìn lớn với hành động có cấu trúc”. It is meaningful, not empty, but at 13 whitespace tokens it functions as a sentence-like phrase rather than a compact tag. Review short approved tags suitable for small screens.

Repeated title groups are “Người Mở Lối” (1), “Người Dệt Kết Nối” (2), through dedicated master titles. This can be intentional numeric archetype reuse; retain the index label next to the title in UI and approve capitalization consistently. The current Title Case is a stylistic choice, not a detected encoding error.

“những lần mình nhìn ra…” is awkward/redundant in the surrounding essence template; “Một gợi ý thực hành: Khởi động…” embeds a capitalized sentence after a colon. These merit natural Vietnamese copyediting, but no spelling dictionary or native-editor sign-off has been run. Do not claim spell-check PASS. No unambiguous spelling defect was established that warrants an automatic source edit.

## Record-level review queue

Every row below passed data integrity checks. Every row carries H-01 because both challenge explanations are identical. Similarity counts refer only to >=0.65 summary/essence pairs involving that record. They prioritize review; they do not independently determine semantic quality. M-03 applies to all six master-22 rows. M-02 applies to Expression terminology and its Maturity references. All rows remain pending human editorial approval.

| File | Index/value | Similarity warnings | Editorial queue |
| --- | --- | ---: | --- |
| attitude.json | attitude/1 | 2 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/2 | 2 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/3 | 4 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/4 | 2 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/5 | 3 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/6 | 3 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/7 | 2 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/8 | 1 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/9 | 3 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/11 | 0 | H-01, M-01, L-01, L-02 |
| attitude.json | attitude/22 | 1 | H-01, M-01, M-03, L-01, L-02 |
| attitude.json | attitude/33 | 3 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/1 | 6 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/2 | 4 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/3 | 7 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/4 | 6 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/5 | 6 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/6 | 7 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/7 | 5 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/8 | 3 | H-01, M-01, L-01, L-02 |
| birthday.json | birthday/9 | 8 | H-01, M-01, L-01, L-02 |
| expression.json | expression/1 | 10 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/2 | 11 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/3 | 11 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/4 | 11 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/5 | 9 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/6 | 10 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/7 | 9 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/8 | 8 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/9 | 11 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/11 | 10 | H-01, M-01, M-02, L-01, L-02 |
| expression.json | expression/22 | 5 | H-01, M-01, M-02, M-03, L-01, L-02 |
| expression.json | expression/33 | 11 | H-01, M-01, M-02, L-01, L-02 |
| life-path.json | lifePath/1 | 8 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/2 | 4 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/3 | 10 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/4 | 8 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/5 | 8 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/6 | 9 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/7 | 7 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/8 | 3 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/9 | 10 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/11 | 8 | H-01, M-01, L-01, L-02 |
| life-path.json | lifePath/22 | 1 | H-01, M-01, M-03, L-01, L-02 |
| life-path.json | lifePath/33 | 8 | H-01, M-01, L-01, L-02 |
| maturity.json | maturity/1 | 2 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/2 | 2 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/3 | 5 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/4 | 3 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/5 | 3 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/6 | 4 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/7 | 2 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/8 | 1 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/9 | 8 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/11 | 1 | H-01, M-01, M-02, L-01, L-02 |
| maturity.json | maturity/22 | 1 | H-01, M-01, M-02, M-03, L-01, L-02 |
| maturity.json | maturity/33 | 4 | H-01, M-01, M-02, L-01, L-02 |
| personal-month.json | personalMonth/1 | 2 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/2 | 2 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/3 | 3 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/4 | 2 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/5 | 3 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/6 | 3 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/7 | 2 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/8 | 1 | H-01, M-01, L-01, L-02 |
| personal-month.json | personalMonth/9 | 6 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/1 | 3 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/2 | 3 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/3 | 4 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/4 | 3 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/5 | 4 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/6 | 6 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/7 | 3 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/8 | 2 | H-01, M-01, L-01, L-02 |
| personal-year.json | personalYear/9 | 8 | H-01, M-01, L-01, L-02 |
| personality.json | personality/1 | 3 | H-01, M-01, L-01, L-02 |
| personality.json | personality/2 | 3 | H-01, M-01, L-01, L-02 |
| personality.json | personality/3 | 7 | H-01, M-01, L-01, L-02 |
| personality.json | personality/4 | 5 | H-01, M-01, L-01, L-02 |
| personality.json | personality/5 | 4 | H-01, M-01, L-01, L-02 |
| personality.json | personality/6 | 8 | H-01, M-01, L-01, L-02 |
| personality.json | personality/7 | 3 | H-01, M-01, L-01, L-02 |
| personality.json | personality/8 | 2 | H-01, M-01, L-01, L-02 |
| personality.json | personality/9 | 10 | H-01, M-01, L-01, L-02 |
| personality.json | personality/11 | 5 | H-01, M-01, L-01, L-02 |
| personality.json | personality/22 | 1 | H-01, M-01, M-03, L-01, L-02 |
| personality.json | personality/33 | 5 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/1 | 9 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/2 | 9 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/3 | 10 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/4 | 9 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/5 | 8 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/6 | 10 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/7 | 8 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/8 | 3 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/9 | 10 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/11 | 9 | H-01, M-01, L-01, L-02 |
| soul-urge.json | soulUrge/22 | 2 | H-01, M-01, M-03, L-01, L-02 |
| soul-urge.json | soulUrge/33 | 9 | H-01, M-01, L-01, L-02 |
