import { ApiError } from "@/lib/api/errors";
import { buildDefinitions } from "./definitions";
import { CALCULATION_VERSION, DEFAULT_LOCALE } from "@/lib/config";
import { INDEX_IDS, type CalculationResult, type IndexId } from "@/lib/numerology/types";
import { interpretationFileSchema, type Interpretation } from "@/lib/validation/interpretations";
import lifePath from "./content/vi/life-path.json";
import expression from "./content/vi/expression.json";
import soulUrge from "./content/vi/soul-urge.json";
import personality from "./content/vi/personality.json";
import birthday from "./content/vi/birthday.json";
import attitude from "./content/vi/attitude.json";
import maturity from "./content/vi/maturity.json";
import personalYear from "./content/vi/personal-year.json";
import personalMonth from "./content/vi/personal-month.json";

const files = [lifePath, expression, soulUrge, personality, birthday, attitude, maturity, personalYear, personalMonth]
  .map((file) => interpretationFileSchema.parse(file));
export const CONTENT_VERSION = files[0].contentVersion;
if (new Set(files.map((file) => file.index)).size !== INDEX_IDS.length
  || files.some((file) => file.contentVersion !== CONTENT_VERSION || file.locale !== DEFAULT_LOCALE)) {
  throw new Error("Inconsistent interpretation catalog metadata.");
}
function freezePublicData<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezePublicData(child);
    Object.freeze(value);
  }
  return value;
}
export const interpretationCatalog: readonly Interpretation[] = freezePublicData(files.flatMap((file) => file.items));
// This immutable public-content index is not a request counter or user-data cache.
const byKey = new Map(interpretationCatalog.map((item) => [`${item.index}/${item.value}`, item]));
export function getInterpretation(index: IndexId, value: number) {
  return byKey.get(`${index}/${value}`);
}
export function summarizeInterpretation(item: Interpretation) {
  const { index, value, baseValue, title, subtitle, tagline, summary, keywords } = item;
  return { index, value, baseValue, title, subtitle, tagline, summary, keywords };
}
export type InterpretationSummary = ReturnType<typeof summarizeInterpretation>;
const summariesByKey = new Map(interpretationCatalog.map((item) => [
  `${item.index}/${item.value}`, freezePublicData(summarizeInterpretation(item)),
]));
export function getInterpretationSummaries(indices: CalculationResult["indices"]) {
  return Object.fromEntries(INDEX_IDS.map((index) => {
    const item = summariesByKey.get(`${index}/${indices[index].value}`);
    if (!item) throw new ApiError(500, "INTERPRETATION_CONTENT_MISSING", "Required interpretation content is unavailable.");
    return [index, item];
  })) as Record<IndexId, InterpretationSummary>;
}
const definitions = freezePublicData({
  calculationVersion: CALCULATION_VERSION, locale: DEFAULT_LOCALE,
  contentVersion: CONTENT_VERSION, status: "draft" as const,
  plannedIndices: [...INDEX_IDS],
  definitions: buildDefinitions((type, value) => Boolean(getInterpretation(type, value))),
  missingContent: [{ index: "birthday", values: [11, 22] }],
});
export function getDefinitions() { return definitions; }
