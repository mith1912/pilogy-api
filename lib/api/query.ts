import { ApiError } from "./errors";
import { interpretationQuerySchema } from "@/lib/validation/interpretations";

export function readLocaleQuery(request: Request) {
  const url = new URL(request.url);
  if (url.search.length > 256) throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.");
  const search = url.searchParams;
  const parsed = interpretationQuerySchema.safeParse(Object.fromEntries(search));
  if (!parsed.success || Array.from(search.keys()).some((key) => search.getAll(key).length > 1)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.");
  }
  return parsed.data;
}
