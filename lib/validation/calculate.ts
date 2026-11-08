import { z } from "zod";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/config";
import { isCalendarDate } from "@/lib/numerology/date";
import { normalizeName } from "@/lib/numerology/name";

const dateOnly = z.string().refine(isCalendarDate, "Must be a real calendar date in YYYY-MM-DD format.");
export const calculateSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(200).refine((name) => /[A-Z]/.test(normalizeName(name)), "Name must contain letters."),
  birthDate: dateOnly,
  referenceDate: dateOnly.optional(),
  targetDate: dateOnly.optional(),
  locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
}).refine((input) => !input.referenceDate || !input.targetDate || input.referenceDate === input.targetDate, {
  message: "referenceDate and targetDate must match when both are supplied.",
  path: ["referenceDate"],
}).transform(({ targetDate, referenceDate, ...input }) => ({
  ...input,
  referenceDate: referenceDate ?? targetDate ?? new Date().toISOString().slice(0, 10),
}));
export type CalculateInput = z.infer<typeof calculateSchema>;
