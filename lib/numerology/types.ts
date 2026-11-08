import type { CalculateInput } from "@/lib/validation/calculate";

export const INDEX_IDS = [
  "lifePath", "soulUrge", "personality", "expression", "birthday",
  "attitude", "maturity", "personalYear", "personalMonth",
] as const;
export type IndexId = (typeof INDEX_IDS)[number];
export type CalculationVersion = "v1";
export type CalculationStep = {
  label: string;
  operation: "sum" | "digitSum";
  inputs: number[];
  result: number;
};
export type IndexResult = {
  type: IndexId;
  value: number;
  baseValue: number;
  steps: CalculationStep[];
  referenceDate?: string;
};
export type CalculationResult = {
  calculationVersion: CalculationVersion;
  name: ReturnType<typeof import("./name").analyzeName>;
  referenceDate: string;
  indices: Record<IndexId, IndexResult>;
};
export interface CalculationEngine {
  readonly version: CalculationVersion;
  calculate(input: CalculateInput): CalculationResult;
}

export class UnspecifiedCalculationRuleError extends Error {
  constructor() {
    super("Calculation rules for names without vowels or consonants have not been specified.");
    this.name = "UnspecifiedCalculationRuleError";
  }
}
