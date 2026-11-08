import { failure, preparePublicContent, preparedPublicContent } from "@/lib/api/response";
import { getDefinitions } from "@/lib/interpretations/catalog";
import { readLocaleQuery } from "@/lib/api/query";

const representation = preparePublicContent(getDefinitions());
export function GET(request: Request) {
  try {
    readLocaleQuery(request);
    return preparedPublicContent(request, representation);
  } catch (error) {
    return failure(error);
  }
}
