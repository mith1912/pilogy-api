export const API_ERROR_CODES = [
  "VALIDATION_ERROR", "INVALID_JSON", "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE",
  "CALCULATION_RULE_UNSPECIFIED", "INTERPRETATION_NOT_FOUND", "INTERPRETATION_CONTENT_MISSING", "INTERNAL_ERROR", "RATE_LIMIT_EXCEEDED",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export type ErrorDetail = { field: string; code: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: ErrorDetail[],
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
