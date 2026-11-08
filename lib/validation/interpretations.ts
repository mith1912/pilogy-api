import { z } from "zod";
import { INDEX_IDS } from "@/lib/numerology/types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/config";

const text = z.string().refine((value) => value.trim().length > 0, "Text must not be blank.");
const value = z.union([z.number().int().min(1).max(9), z.literal(11), z.literal(22), z.literal(33)]);
const point = z.strictObject({ title: text, description: text });
export const interpretationSchema = z.strictObject({
  index: z.enum(INDEX_IDS), value, baseValue: z.number().int().min(1).max(9),
  title: text, subtitle: text, tagline: text, summary: text, essence: text,
  strengths: z.array(point).min(1), challenges: z.array(point).min(1),
  relationships: text, careerAndGrowth: text, lifeLesson: text, reflection: text,
  affirmation: text, keywords: z.array(text).min(1), suggestedAction: text,
  periodFocus: text.optional(),
}).superRefine((item, ctx) => {
  const base = item.value > 9 ? ({ 11: 2, 22: 4, 33: 6 } as Record<number, number>)[item.value] : item.value;
  if (item.baseValue !== base) ctx.addIssue({ code: "custom", message: "Invalid base value." });
  if (item.index === "birthday" && item.value === 33) ctx.addIssue({ code: "custom", message: "Birthday 33 is not reachable under V1 rules." });
  const cycle = item.index === "personalYear" || item.index === "personalMonth";
  if (cycle && (item.value > 9 || !item.periodFocus)) ctx.addIssue({ code: "custom", message: "Invalid cycle content." });
});
export const interpretationFileSchema = z.strictObject({
  locale: z.enum(SUPPORTED_LOCALES), contentVersion: text, index: z.enum(INDEX_IDS),
  items: z.array(interpretationSchema).min(1),
}).superRefine((file, ctx) => {
  const seen = new Set<number>();
  for (const item of file.items) {
    if (item.index !== file.index || seen.has(item.value)) ctx.addIssue({ code: "custom", message: "Duplicate or mismatched content index." });
    seen.add(item.value);
  }
});
export const interpretationParamsSchema = z.strictObject({
  index: z.enum(INDEX_IDS), value: z.string().regex(/^(?:[1-9]|11|22|33)$/).transform(Number),
});
export const interpretationQuerySchema = z.strictObject({ locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE) });
export type Interpretation = z.infer<typeof interpretationSchema>;
