import { CALCULATION_VERSION } from "@/lib/config";
import type { CalculateInput } from "@/lib/validation/calculate";
import type { CalculationEngine, CalculationVersion } from "./types";
import { v1Engine } from "./versions/v1";

const engines: Record<CalculationVersion, CalculationEngine> = { v1: v1Engine };
export function calculateNumerology(input: CalculateInput) {
  return engines[CALCULATION_VERSION].calculate(input);
}
