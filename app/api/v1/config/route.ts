import { assertNoQuery } from "@/lib/api/request";
import { failure, success } from "@/lib/api/response";
import { API_VERSION, CALCULATION_VERSION, DEFAULT_LOCALE, SUPPORTED_LOCALES, MAX_REQUEST_BYTES } from "@/lib/config";

export function GET(request: Request) {
  try {
    assertNoQuery(request);
    return success({
      apiVersion: API_VERSION,
      calculationVersion: CALCULATION_VERSION,
      defaultLocale: DEFAULT_LOCALE,
      supportedLocales: SUPPORTED_LOCALES,
      maxRequestBytes: MAX_REQUEST_BYTES,
      calculationAvailable: true,
      features: { calculations: true, interpretationSummaries: true, fullInterpretations: true, definitions: true },
    });
  } catch (error) { return failure(error); }
}
