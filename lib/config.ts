export const API_VERSION = "v1";
export const CALCULATION_VERSION = "v1";
export const SUPPORTED_LOCALES = ["vi"] as const;
export const DEFAULT_LOCALE = "vi";
export const MAX_REQUEST_BYTES = resolveMaxRequestBytes(process.env.NUMEROLOGY_MAX_REQUEST_BYTES);

export function resolveMaxRequestBytes(value: string | undefined): number {
  if (value === undefined) return 4 * 1024;
  const bytes = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(bytes) || bytes < 2048 || bytes > 16384) {
    throw new Error("Invalid maximum request byte configuration.");
  }
  return bytes;
}
export const REQUEST_BODY_TIMEOUT_MS = 5000;
