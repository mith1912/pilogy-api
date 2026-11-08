import { ApiError } from "@/lib/api/errors";
import { failure, preparePublicContent, preparedPublicContent } from "@/lib/api/response";
import { CALCULATION_VERSION, DEFAULT_LOCALE } from "@/lib/config";
import { CONTENT_VERSION, interpretationCatalog } from "@/lib/interpretations/catalog";
import { interpretationParamsSchema } from "@/lib/validation/interpretations";
import { readLocaleQuery } from "@/lib/api/query";

// Fixed, public-only representations: one per supplied article, never user profiles.
const representations = new Map(interpretationCatalog.map((interpretation) => [
  `${interpretation.index}/${interpretation.value}`,
  preparePublicContent({ calculationVersion: CALCULATION_VERSION, locale: DEFAULT_LOCALE, contentVersion: CONTENT_VERSION, interpretation }),
]));
export async function GET(request: Request, context: { params: Promise<{ index: string; value: string }> }) {
  try {
    const params = interpretationParamsSchema.safeParse(await context.params);
    readLocaleQuery(request);
    if (!params.success) throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.");
    const representation = representations.get(`${params.data.index}/${params.data.value}`);
    if (!representation) throw new ApiError(404, "INTERPRETATION_NOT_FOUND", "Interpretation content is not available.");
    return preparedPublicContent(request, representation);
  } catch (error) {
    return failure(error);
  }
}
