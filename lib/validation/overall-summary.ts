import { z } from "zod";
import { getSupportedValues } from "@/lib/interpretations/definitions";

const copy = z.string().trim().min(1).refine((text) => !/\b(?:TODO|TBD|lorem ipsum)\b/iu.test(text));
const slot = /\{([a-z]+)\}/g;

function template<const Variable extends string>(...variables: Variable[]) {
  return copy.refine((text) => {
    const names = new Set([...text.matchAll(slot)].map((match) => match[1]));
    return names.size === variables.length && variables.every((name) => names.has(name))
      && !/[{}]/u.test(text.replace(slot, ""));
  }, "Template must use exactly the declared variables.").transform((text) =>
    (values: Record<Variable, string | number>) => text.replace(slot, (_, name: string) => String(values[name as Variable])));
}

const sectionSchema = z.strictObject({
  overview: z.strictObject({ title: copy, repeat: template("theme"), explore: template("direction", "expression") }),
  strengths: z.strictObject({ title: copy, compose: template("strength", "action") }),
  challenges: z.strictObject({ title: copy, compose: template("challenge", "action") }),
  innerSelf: z.strictObject({ title: copy, repeat: template("theme"), explore: template("inner", "outward") }),
  relationships: z.strictObject({ title: copy, compose: template("theme", "reflection") }),
  growthAdvice: z.strictObject({ title: copy, compose: template("theme", "reflection") }),
  currentCycle: z.strictObject({
    title: copy,
    year: template("year", "theme"),
    month: template("month", "year", "theme", "action"),
    repeat: template("month", "year", "action"),
  }),
});
export const overallSummarySectionIds = sectionSchema.keyof().options;

export const overallSummaryContentSchema = z.strictObject({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  contentVersion: z.string().regex(/^v\d+\.\d+\.\d+$/),
  locale: z.literal("vi"),
  title: copy,
  sections: sectionSchema.partial(),
  overviewCombinations: z.array(z.strictObject({
    lifePath: z.number().refine((value) => getSupportedValues("lifePath").includes(value)),
    expression: z.number().refine((value) => getSupportedValues("expression").includes(value)),
    content: copy.refine((text) => !/[{}]/u.test(text)),
  })).refine((rules) => new Set(rules.map(({ lifePath, expression }) => `${lifePath}/${expression}`)).size === rules.length),
});
