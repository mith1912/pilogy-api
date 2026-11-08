# Calculation verification — Task 05

Status: **PASS for executed arithmetic tests**. Release completeness is assessed separately.

43 independent full-profile fixtures (mandatory A/B plus 41 additional profiles), 387 value/base-value comparisons, all step arithmetic, and 101 explicit reachable index/value witnesses. Expected values are literal constants in [independent-v1.json](../../tests/fixtures/independent-v1.json); no production function generated them. [domain-witnesses.json](../../tests/fixtures/domain-witnesses.json) provides one explicit witness for every supported combination. Synthetic names deliberately isolate letter groups; they are test data, not proposed real profiles.

## Conventions and independence

The fixtures were derived from the documented Pythagorean mapping, A/E/I/O/U vowels, Y consonant, ordered NFD Vietnamese normalization and Đ/đ conversion. Core reductions preserve intermediate 11/22/33; personal cycles do not. Components are reduced separately for Life Path. Calendar cycles change on January 1 and the first day of each month, not birthdays. No convention was changed.

The test calls production only for actual values. It compares expected values and bases to explicit fixture constants, verifies name totals and independently tabulated letter mappings, checks exact sum operands from explicit component fixtures, and reconstructs each digitSum from the preceding number. It requires exactly one index sum and a last normal step equal to value, followed only by a base reduction for masters. Component chains are tracked independently by label. The general checker does not use production reduction/name/date helpers to calculate expected values.

## All-profile results

Tuple order: **lifePath, expression, soulUrge, personality, birthday, attitude, maturity, personalYear, personalMonth**. Actual tuples below matched the literal expected tuples in executed Vitest assertions; they are not separate engine-generated expected fixtures. Base values are independently stored per index in the fixture file.

| ID | Name | Birth | Reference | Expected values | Actual values | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A | Nguyễn Văn An | 1990-05-20 | 2026-11-08 | 8, 3, 1, 11, 2, 7, 11, 8, 1 | 8, 3, 1, 11, 2, 7, 11, 8, 1 | PASS |
| B | Nguyễn Văn An | 1998-02-11 | 2026-11-08 | 22, 3, 1, 11, 11, 4, 7, 5, 7 | 22, 3, 1, 11, 11, 4, 7, 5, 7 | PASS |
| D29 | A J | 2000-01-29 | 2026-11-08 | 5, 2, 1, 1, 11, 3, 7, 4, 6 | 5, 2, 1, 1, 11, 3, 7, 4, 6 | PASS |
| D30 | A J | 2000-01-30 | 2026-11-08 | 6, 2, 1, 1, 3, 4, 8, 5, 7 | 6, 2, 1, 1, 3, 4, 8, 5, 7 | PASS |
| D31 | A J | 2000-01-31 | 2026-11-08 | 7, 2, 1, 1, 4, 5, 9, 6, 8 | 7, 2, 1, 1, 4, 5, 9, 6, 8 | PASS |
| LEAP400 | A J | 2000-02-29 | 2026-11-08 | 6, 2, 1, 1, 11, 4, 8, 5, 7 | 6, 2, 1, 1, 11, 4, 8, 5, 7 | PASS |
| LEAP4 | A J | 2024-02-29 | 2026-11-08 | 3, 2, 1, 1, 11, 4, 5, 5, 7 | 3, 2, 1, 1, 11, 4, 5, 5, 7 | PASS |
| LP33 | A J | 1998-02-22 | 2026-11-08 | 33, 2, 1, 1, 22, 6, 8, 7, 9 | 33, 2, 1, 1, 22, 6, 8, 7, 9 | PASS |
| YEAR22 | A J | 1984-01-01 | 2026-11-08 | 6, 2, 1, 1, 1, 2, 8, 3, 5 | 6, 2, 1, 1, 1, 2, 8, 3, 5 | PASS |
| YEAR11 | A J | 2009-01-01 | 2026-11-08 | 4, 2, 1, 1, 1, 2, 6, 3, 5 | 4, 2, 1, 1, 1, 2, 6, 3, 5 | PASS |
| MINYEAR | A J | 0001-01-01 | 2026-11-08 | 3, 2, 1, 1, 1, 2, 5, 3, 5 | 3, 2, 1, 1, 1, 2, 5, 3, 5 | PASS |
| MAXYEAR | A J | 9999-12-31 | 2026-11-08 | 7, 2, 1, 1, 4, 7, 9, 8, 1 | 7, 2, 1, 1, 4, 7, 9, 8, 1 | PASS |
| DEC | A J | 2000-01-07 | 2026-12-31 | 1, 2, 1, 1, 7, 8, 3, 9, 3 | 1, 2, 1, 1, 7, 8, 3, 9, 3 | PASS |
| JAN | A J | 2000-01-07 | 2027-01-01 | 1, 2, 1, 1, 7, 8, 3, 1, 2 | 1, 2, 1, 1, 7, 8, 3, 1, 2 | PASS |
| ATT33 | A J | 2000-11-22 | 2026-11-08 | 8, 2, 1, 1, 22, 33, 1, 7, 9 | 8, 2, 1, 1, 22, 33, 1, 7, 9 | PASS |
| EX11 | E F | 2000-01-08 | 2026-11-08 | 11, 11, 5, 6, 8, 9, 22, 1, 3 | 11, 11, 5, 6, 8, 9, 22, 1, 3 | PASS |
| EX22 | I D I | 2000-01-08 | 2026-11-08 | 11, 22, 9, 4, 8, 9, 33, 1, 3 | 11, 22, 9, 4, 8, 9, 33, 1, 3 | PASS |
| EX33 | I I I F | 2000-01-01 | 2026-11-08 | 4, 33, 9, 6, 1, 2, 1, 3, 5 | 4, 33, 9, 6, 1, 2, 1, 3, 5 | PASS |
| SOUL11 | AAI B | 2000-01-01 | 2026-11-08 | 4, 4, 11, 2, 1, 2, 8, 3, 5 | 4, 4, 11, 2, 1, 2, 8, 3, 5 | PASS |
| SOUL22 | IIAAAA B | 2000-01-01 | 2026-11-08 | 4, 6, 22, 2, 1, 2, 1, 3, 5 | 4, 6, 22, 2, 1, 2, 1, 3, 5 | PASS |
| SOUL33 | IIIAAAAAA B | 2000-01-01 | 2026-11-08 | 4, 8, 33, 2, 1, 2, 3, 3, 5 | 4, 8, 33, 2, 1, 2, 3, 3, 5 | PASS |
| PERS11 | A KR | 2000-01-01 | 2026-11-08 | 4, 3, 1, 11, 1, 2, 7, 3, 5 | 4, 3, 1, 11, 1, 2, 7, 3, 5 | PASS |
| PERS22 | A RR D | 2000-01-01 | 2026-11-08 | 4, 5, 1, 22, 1, 2, 9, 3, 5 | 4, 5, 1, 22, 1, 2, 9, 3, 5 | PASS |
| PERS33 | A RRR F | 2000-01-01 | 2026-11-08 | 4, 7, 1, 33, 1, 2, 11, 3, 5 | 4, 7, 1, 33, 1, 2, 11, 3, 5 | PASS |
| INTER11 | I I I B | 2000-01-01 | 2026-11-08 | 4, 11, 9, 2, 1, 2, 6, 3, 5 | 4, 11, 9, 2, 1, 2, 6, 3, 5 | PASS |
| VIET | đẶng | 2000-01-01 | 2026-11-08 | 4, 8, 1, 7, 1, 2, 3, 3, 5 | 4, 8, 1, 7, 1, 2, 3, 3, 5 | PASS |
| YCONS | Y An | 2000-01-01 | 2026-11-08 | 4, 4, 1, 3, 1, 2, 8, 3, 5 | 4, 4, 1, 3, 1, 2, 8, 3, 5 | PASS |
| SINGLE1 | A J | 2000-01-01 | 2026-11-08 | 4, 2, 1, 1, 1, 2, 6, 3, 5 | 4, 2, 1, 1, 1, 2, 6, 3, 5 | PASS |
| SINGLE2 | A J | 2000-01-02 | 2026-11-08 | 5, 2, 1, 1, 2, 3, 7, 4, 6 | 5, 2, 1, 1, 2, 3, 7, 4, 6 | PASS |
| SINGLE3 | A J | 2000-01-03 | 2026-11-08 | 6, 2, 1, 1, 3, 4, 8, 5, 7 | 6, 2, 1, 1, 3, 4, 8, 5, 7 | PASS |
| SINGLE4 | A J | 2000-01-04 | 2026-11-08 | 7, 2, 1, 1, 4, 5, 9, 6, 8 | 7, 2, 1, 1, 4, 5, 9, 6, 8 | PASS |
| SINGLE5 | A J | 2000-01-05 | 2026-11-08 | 8, 2, 1, 1, 5, 6, 1, 7, 9 | 8, 2, 1, 1, 5, 6, 1, 7, 9 | PASS |
| SINGLE6 | A J | 2000-01-06 | 2026-11-08 | 9, 2, 1, 1, 6, 7, 11, 8, 1 | 9, 2, 1, 1, 6, 7, 11, 8, 1 | PASS |
| SINGLE7 | A J | 2000-01-07 | 2026-11-08 | 1, 2, 1, 1, 7, 8, 3, 9, 2 | 1, 2, 1, 1, 7, 8, 3, 9, 2 | PASS |
| SINGLE8 | A J | 2000-01-08 | 2026-11-08 | 11, 2, 1, 1, 8, 9, 4, 1, 3 | 11, 2, 1, 1, 8, 9, 4, 1, 3 | PASS |
| SINGLE9 | A J | 2000-01-09 | 2026-11-08 | 3, 2, 1, 1, 9, 1, 5, 2, 4 | 3, 2, 1, 1, 9, 1, 5, 2, 4 | PASS |
| LP2 | A J | 2000-11-07 | 2026-11-08 | 2, 2, 1, 1, 7, 9, 4, 1, 3 | 2, 2, 1, 1, 7, 9, 4, 1, 3 | PASS |
| YEAR33 | A J | 9996-01-01 | 2026-11-08 | 8, 2, 1, 1, 1, 2, 1, 3, 5 | 8, 2, 1, 1, 1, 2, 1, 3, 5 | PASS |
| JUNE | A J | 2000-01-07 | 2026-06-30 | 1, 2, 1, 1, 7, 8, 3, 9, 6 | 1, 2, 1, 1, 7, 8, 3, 9, 6 | PASS |
| JULY | A J | 2000-01-07 | 2026-07-01 | 1, 2, 1, 1, 7, 8, 3, 9, 7 | 1, 2, 1, 1, 7, 8, 3, 9, 7 | PASS |
| ATT11 | A J | 2000-02-09 | 2026-11-08 | 4, 2, 1, 1, 9, 11, 6, 3, 5 | 4, 2, 1, 1, 9, 11, 6, 3, 5 | PASS |
| ATT22 | A J | 2000-02-20 | 2026-11-08 | 6, 2, 1, 1, 2, 22, 8, 5, 7 | 6, 2, 1, 1, 2, 22, 8, 5, 7 | PASS |
| SEGMENT | A J | 1990-02-01 | 2026-11-08 | 4, 2, 1, 1, 1, 3, 6, 4, 6 | 4, 2, 1, 1, 1, 3, 6, 4, 6 | PASS |

## Arithmetic derivations by fixture

Every row below accompanies the explicit expected constants; the test also verifies each emitted step, not just this explanatory text.

| ID | Reduced Life Path components | Personal Year components | Manual arithmetic / purpose |
| --- | --- | --- | --- |
| A | 5 + 2 + 1 | 5 + 2 + 1 | 1990→19→10→1; 5+2+1=8; 48→12→3; 38→11; 8+3=11; 8+11=19→10→1 |
| B | 2 + 11 + 9 | 2 + 2 + 1 | 1998→27→9; 2+11+9=22; 2+11=13→4; 22+3=25→7; 2+2+1=5; 5+11=16→7 |
| D29 | 1 + 11 + 2 | 1 + 2 + 1 | 29→11; 1+11+2=14→5; direct digit total is also 14→5; Birthday still preserves 11; 1+29=30→3; 1+2+1=4 |
| D30 | 1 + 3 + 2 | 1 + 3 + 1 | 30→3; 1+3+2=6; 1+30=31→4; 1+3+1=5 |
| D31 | 1 + 4 + 2 | 1 + 4 + 1 | 31→4; 1+4+2=7; 1+31=32→5; 1+4+1=6 |
| LEAP400 | 2 + 11 + 2 | 2 + 2 + 1 | 2000 divisible by 400; 29→11; 2+11+2=15→6; 2+29=31→4 |
| LEAP4 | 2 + 11 + 8 | 2 + 2 + 1 | 2024→8; 2+11+8=21→3; 2+2+1=5 |
| LP33 | 2 + 22 + 9 | 2 + 4 + 1 | 2+22+9=33; 2+22=24→6; 33+2=35→8; 2+4+1=7 |
| YEAR22 | 1 + 1 + 22 | 1 + 1 + 1 | 1984→22; 1+1+22=24→6 whereas direct digit total 24 also 6; retained year component 22 differs from 4 |
| YEAR11 | 1 + 1 + 11 | 1 + 1 + 1 | 2009→11; 1+1+11=13→4; year component remains 11 |
| MINYEAR | 1 + 1 + 1 | 1 + 1 + 1 | 0001→1; 1+1+1=3 |
| MAXYEAR | 3 + 4 + 9 | 3 + 4 + 1 | 9999→36→9; 12→3; 31→4; 3+4+9=16→7; 12+31=43→7 |
| DEC | 1 + 7 + 2 | 1 + 7 + 1 | 1+7+1=9; personal month 9+12=21→3 |
| JAN | 1 + 7 + 2 | 1 + 7 + 2 | 2027→11→2 without masters; 1+7+2=10→1; 1+1=2; year 9→1 |
| ATT33 | 11 + 22 + 2 | 2 + 4 + 1 | 11+22+2=35→8; attitude 11+22=33; maturity 8+2=10→1 |
| EX11 | 1 + 8 + 2 | 1 + 8 + 1 | E5+F6=11; life 1+8+2=11; maturity 11+11=22 |
| EX22 | 1 + 8 + 2 | 1 + 8 + 1 | I9+D4+I9=22; vowels18→9; maturity 11+22=33 |
| EX33 | 1 + 1 + 2 | 1 + 1 + 1 | 9+9+9+6=33; vowels27→9; maturity 4+33=37→10→1 |
| SOUL11 | 1 + 1 + 2 | 1 + 1 + 1 | vowels1+1+9=11; total13→4; maturity4+4=8 |
| SOUL22 | 1 + 1 + 2 | 1 + 1 + 1 | vowels9+9+1+1+1+1=22; total24→6; maturity4+6=10→1 |
| SOUL33 | 1 + 1 + 2 | 1 + 1 + 1 | vowels27+6=33; total35→8; maturity4+8=12→3 |
| PERS11 | 1 + 1 + 2 | 1 + 1 + 1 | consonants2+9=11; total12→3 |
| PERS22 | 1 + 1 + 2 | 1 + 1 + 1 | consonants9+9+4=22; total23→5 |
| PERS33 | 1 + 1 + 2 | 1 + 1 + 1 | consonants9+9+9+6=33; total34→7; maturity4+7=11 |
| INTER11 | 1 + 1 + 2 | 1 + 1 + 1 | total29→11; maturity4+11=15→6 |
| VIET | 1 + 1 + 2 | 1 + 1 + 1 | D4+A1+N5+G7=17; consonants16→7; maturity4+8=12→3 |
| YCONS | 1 + 1 + 2 | 1 + 1 + 1 | Y7+A1+N5=13; consonants12→3; Y is not a vowel |
| SINGLE1 | 1 + 1 + 2 | 1 + 1 + 1 | life components 1+1+2; attitude 1+1; maturity 4+2; personal year 1+1+1; personal month 3+11 |
| SINGLE2 | 1 + 2 + 2 | 1 + 2 + 1 | life components 1+2+2; attitude 1+2; maturity 5+2; personal year 1+2+1; personal month 4+11 |
| SINGLE3 | 1 + 3 + 2 | 1 + 3 + 1 | life components 1+3+2; attitude 1+3; maturity 6+2; personal year 1+3+1; personal month 5+11 |
| SINGLE4 | 1 + 4 + 2 | 1 + 4 + 1 | life components 1+4+2; attitude 1+4; maturity 7+2; personal year 1+4+1; personal month 6+11 |
| SINGLE5 | 1 + 5 + 2 | 1 + 5 + 1 | life components 1+5+2; attitude 1+5; maturity 8+2; personal year 1+5+1; personal month 7+11 |
| SINGLE6 | 1 + 6 + 2 | 1 + 6 + 1 | life components 1+6+2; attitude 1+6; maturity 9+2; personal year 1+6+1; personal month 8+11 |
| SINGLE7 | 1 + 7 + 2 | 1 + 7 + 1 | life components 1+7+2; attitude 1+7; maturity 1+2; personal year 1+7+1; personal month 9+11 |
| SINGLE8 | 1 + 8 + 2 | 1 + 8 + 1 | life components 1+8+2; attitude 1+8; maturity 11+2; personal year 1+8+1; personal month 1+11 |
| SINGLE9 | 1 + 9 + 2 | 1 + 9 + 1 | life components 1+9+2; attitude 1+9; maturity 3+2; personal year 1+9+1; personal month 2+11 |
| LP2 | 11 + 7 + 2 | 2 + 7 + 1 | 11+7+2=20→2; attitude11+7=18→9; maturity2+2=4; personal2+7+1=10→1 |
| YEAR33 | 1 + 1 + 33 | 1 + 1 + 1 | 9996→33; 1+1+33=35→8; maturity8+2=10→1 |
| JUNE | 1 + 7 + 2 | 1 + 7 + 1 | personal year1+7+1=9; month9+6=15→6 |
| JULY | 1 + 7 + 2 | 1 + 7 + 1 | personal year1+7+1=9; month9+7=16→7 |
| ATT11 | 2 + 9 + 2 | 2 + 9 + 1 | 2+9+2=13→4; attitude2+9=11; maturity4+2=6; personal2+9+1=12→3 |
| ATT22 | 2 + 2 + 2 | 2 + 2 + 1 | 20→2; 2+2+2=6; attitude2+20=22; personal2+2+1=5 |
| SEGMENT | 2 + 1 + 1 | 2 + 1 + 1 | 1990→19→10→1; segmented2+1+1=4, whereas direct unreduced birth digits sum19+2+1=22; attitude2+1=3; maturity4+2=6; personal2+1+1=4 |

## Mandatory fixture A — complete steps

Normalized name: NGUYEN VAN AN; all letters in order: N5 G7 U3 Y7 E5 N5 V4 A1 N5 A1 N5. Vowels U3 E5 A1 A1 total 10; consonants N5 G7 Y7 N5 V4 N5 N5 total 38; total 48.

All nine complete expected step arrays are hand-transcribed in [fixture-a-steps.json](../../tests/fixtures/fixture-a-steps.json) and compared for exact equality through both pure engine and native POST route tests. The same steps passed actual HTTP verification.

| Index | Full arithmetic chain | value / baseValue |
| --- | --- | --- |
| lifePath | birthDay 20→2; birthYear 1990→19→10→1; sum 5+2+1=8 | 8 / 8 |
| expression | 5+7+3+7+5+5+4+1+5+1+5=48→12→3 | 3 / 3 |
| soulUrge | 3+5+1+1=10→1 | 1 / 1 |
| personality | 5+7+7+5+4+5+5=38→11; base 11→2 | 11 / 2 |
| birthday | sum [20]=20→2 | 2 / 2 |
| attitude | 5+20=25→7 | 7 / 7 |
| maturity | 8+3=11; base 11→2 | 11 / 2 |
| personalYear | birthDay20→2; referenceYear2026→10→1; 5+2+1=8 | 8 / 8 |
| personalMonth | 8+11=19→10→1 | 1 / 1 |

## Mandatory fixture B and segmentation

1998-02-11: month 2; day 11; year 1998→27→9; final 2+11+9=22, base 4. The existing exact-step regression and the independent B vector both pass. Direct digit summation would give 31→4 and is not the agreed Life Path convention.

SEGMENT additionally proves that 1990-02-01 has Life Path 4: 1990→19→10→1, then 2+1+1=4. Adding all original date digits directly would give 22; the engine correctly does not use that alternative. YEAR11/YEAR22/YEAR33 retain birth-year intermediate masters. D29 preserves Birthday 11 although Personal Year reduces that day to 2.

DEC/JAN prove Personal Year 9→1 across 2026-12-31 / 2027-01-01. JUNE/JULY prove calendar-month boundaries with unchanged Personal Year. Leap fixtures exercise 2000 and 2024; invalid 1900/2100 and valid 2400 are covered by route validation tests. Year bounds 0001/9999 are explicit fixtures.

Explicit reference dates are checked under UTC, Pacific/Honolulu, Pacific/Kiritimati and Asia/Ho_Chi_Minh with a fixed unrelated server clock. Omitted dates are tested separately against a frozen clock and actual HTTP UTC date.

## Reachability

All 101 supported combinations have executed witnesses, not just declared domains. Core index domains are 1–9/11/22/33 except Birthday 1–9/11/22. Birthday 33 cannot be reached because days are at most 31 and further digit sums cannot increase them to 33. Personal cycles never preserve masters; 11/22/33 are unreachable outputs there. Name sums can reach all masters within the 200-character input limit; witnesses use short letter-group probes. No unsupported values have been added.

| Type | Verified values | Status |
| --- | --- | --- |
| lifePath | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| expression | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| soulUrge | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| personality | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| birthday | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22 | PASS |
| attitude | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| maturity | 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33 | PASS |
| personalYear | 1, 2, 3, 4, 5, 6, 7, 8, 9 | PASS |
| personalMonth | 1, 2, 3, 4, 5, 6, 7, 8, 9 | PASS |
