import { parseCalendarDate } from "../date";
import { analyzeName } from "../name";
import { reduceNumber, sumAndReduce } from "../reduction";
import { UnspecifiedCalculationRuleError, type CalculationEngine, type CalculationStep } from "../types";

export const v1Engine: CalculationEngine = {
  version: "v1",
  calculate(input) {
    const birth = parseCalendarDate(input.birthDate);
    const name = analyzeName(input.fullName);
    if (!name.vowelTotal || !name.consonantTotal) throw new UnspecifiedCalculationRuleError();
    const componentSteps: CalculationStep[] = [];
    const reduceComponent = (value: number, preserve: boolean, label: string) => {
      const reduced = reduceNumber(value, preserve, label);
      componentSteps.push(...reduced.steps);
      return reduced.value;
    };
    const lifeComponents = [
      reduceComponent(birth.month, true, "birthMonth"),
      reduceComponent(birth.day, true, "birthDay"),
      reduceComponent(birth.year, true, "birthYear"),
    ];
    const lifePath = sumAndReduce("lifePath", lifeComponents, true, [...componentSteps]);
    const expression = sumAndReduce("expression", name.letters.map((item) => item.value));
    const indices = {
      lifePath, expression,
      soulUrge: sumAndReduce("soulUrge", name.letters.filter((item) => item.group === "vowel").map((item) => item.value)),
      personality: sumAndReduce("personality", name.letters.filter((item) => item.group === "consonant").map((item) => item.value)),
      birthday: sumAndReduce("birthday", [birth.day]),
      attitude: sumAndReduce("attitude", [birth.month, birth.day]),
      maturity: sumAndReduce("maturity", [lifePath.value, expression.value]),
    };
    const target = parseCalendarDate(input.referenceDate);
    componentSteps.length = 0;
    const personalComponents = [
      reduceComponent(birth.month, false, "birthMonth"),
      reduceComponent(birth.day, false, "birthDay"),
      reduceComponent(target.year, false, "referenceYear"),
    ];
    const personalYear = sumAndReduce("personalYear", personalComponents, false, [...componentSteps], input.referenceDate);
    const personalMonth = sumAndReduce("personalMonth", [personalYear.value, target.month], false, [], input.referenceDate);
    return { calculationVersion: "v1", referenceDate: input.referenceDate, name, indices: { ...indices, personalYear, personalMonth } };
  },
};
