export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: import("@/lib/api/errors").ApiErrorCode; message: string; details: import("@/lib/api/errors").ErrorDetail[] } };

export type CalculateApiData = import("@/lib/numerology/types").CalculationResult & {
  locale: (typeof import("@/lib/config").SUPPORTED_LOCALES)[number];
  contentVersion: string;
  interpretations: Record<import("@/lib/numerology/types").IndexId, import("@/lib/interpretations/catalog").InterpretationSummary>;
};
