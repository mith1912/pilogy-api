import { CONTENT_VERSION, getInterpretationSummaries } from "@/lib/interpretations/catalog";
import type { CalculateApiData } from "@/lib/types/api";
import { ApiError } from "@/lib/api/errors";
import { assertNoQuery, readJson } from "@/lib/api/request";
import { failure, success } from "@/lib/api/response";
import { UnspecifiedCalculationRuleError } from "@/lib/numerology/types";
import { calculateNumerology } from "@/lib/numerology/service";
import { calculateSchema } from "@/lib/validation/calculate";

export async function POST(request: Request) {
  try {
    assertNoQuery(request);
    // Before public release, enforce distributed/platform rate limits here,
    // before parsing the body. Never use instance-local counters on Vercel.
    const parsed = calculateSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.",
        parsed.error.issues.map((issue) => ({
          // Only known field paths are exposed; never echo user input or unknown keys.
          field: ["fullName", "birthDate", "referenceDate", "targetDate", "locale"].includes(String(issue.path[0]))
            ? String(issue.path[0]) : "body",
          code: issue.code,
        })),
      );
    }
    const result = calculateNumerology(parsed.data);
    return success<CalculateApiData>({ ...result, locale: parsed.data.locale, contentVersion: CONTENT_VERSION,
      interpretations: getInterpretationSummaries(result.indices) });
  } catch (error) {
    if (error instanceof UnspecifiedCalculationRuleError) {
      return failure(new ApiError(422, "CALCULATION_RULE_UNSPECIFIED", error.message));
    }
    return failure(error);
  }
}
