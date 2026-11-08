import type { CalculationStep, IndexId, IndexResult } from "./types";

export function reduceNumber(input: number, preserveMasters = true, label = "reduce"): { value: number; baseValue: number; steps: CalculationStep[]; baseSteps: CalculationStep[] } {
  if (!Number.isSafeInteger(input) || input < 0) throw new Error("Expected a non-negative safe integer.");
  const steps: CalculationStep[] = [];
  let value = input;
  while (value > 9 && !(preserveMasters && [11, 22, 33].includes(value))) {
    const inputs = String(value).split("").map(Number);
    value = inputs.reduce((sum, digit) => sum + digit, 0);
    steps.push({ label, operation: "digitSum", inputs, result: value });
  }
  const base = value > 9 ? reduceNumber(value, false, `${label}.base`) : undefined;
  return { value, baseValue: base?.value ?? value, steps, baseSteps: base?.steps ?? [] };
}

export function sumAndReduce(type: IndexId, inputs: number[], preserveMasters = true,
  prefix: CalculationStep[] = [], referenceDate?: string): IndexResult {
  const total = inputs.reduce((sum, value) => sum + value, 0);
  const reduction = reduceNumber(total, preserveMasters, type);
  return {
    type, value: reduction.value, baseValue: reduction.baseValue,
    steps: [...prefix, { label: `${type}.sum`, operation: "sum", inputs, result: total },
      ...reduction.steps, ...reduction.baseSteps],
    ...(referenceDate ? { referenceDate } : {}),
  };
}
