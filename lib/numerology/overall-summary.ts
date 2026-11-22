import { overallSummaryContent } from "@/lib/interpretations/overall/vi";
import { overallSummarySectionIds } from "@/lib/validation/overall-summary";
import type { Interpretation } from "@/lib/validation/interpretations";
import type { CalculationResult, IndexId } from "./types";

type SectionId = (typeof overallSummarySectionIds)[number];
type Section = { title: string; content: string };
type SourceIndex = { type: IndexId; value: number };
type SummaryInput = Pick<CalculationResult, "referenceDate"> & { indices: Partial<CalculationResult["indices"]> };

export function generateOverallSummary(
  { indices, referenceDate }: SummaryInput,
  getInterpretation: (index: IndexId, value: number) => Interpretation | undefined,
  content = overallSummaryContent,
) {
  const find = (type: IndexId) => {
    const index = indices[type];
    return index && getInterpretation(type, index.value);
  };
  const lifePath = find("lifePath");
  const expression = find("expression");
  const soulUrge = find("soulUrge");
  const personality = find("personality");
  const birthday = find("birthday");
  const maturity = find("maturity");
  const personalYear = find("personalYear");
  const personalMonth = find("personalMonth");

  const { sections: copy, overviewCombinations, version, locale, title, contentVersion } = content;
  const sections: Partial<Record<SectionId, Section>> = {};
  const sources = new Map<IndexId, SourceIndex>();
  const add = (id: SectionId, title: string, content: string, ...articles: Interpretation[]) => {
    sections[id] = { title, content };
    for (const { index, value } of articles) sources.set(index, { type: index, value });
  };

  if (copy.overview && lifePath && expression) {
    const combination = overviewCombinations.find((rule) => rule.lifePath === lifePath.value && rule.expression === expression.value);
    const [direction] = lifePath.keywords;
    const [style] = expression.keywords;
    add("overview", copy.overview.title, combination?.content ?? (direction === style
      ? copy.overview.repeat({ theme: direction })
      : copy.overview.explore({ direction, expression: style })), lifePath, expression);
  }
  if (copy.challenges && lifePath) {
    const [challenge] = lifePath.challenges;
    add("challenges", copy.challenges.title, copy.challenges.compose({ challenge: challenge.title.toLocaleLowerCase("vi"), action: challenge.description }), lifePath);
  }
  if (copy.strengths && birthday && expression) {
    add("strengths", copy.strengths.title, copy.strengths.compose({ strength: birthday.keywords[0], action: expression.suggestedAction }), birthday, expression);
  }
  if (copy.innerSelf && soulUrge && personality) {
    const [inner] = soulUrge.keywords;
    const [outward] = personality.keywords;
    add("innerSelf", copy.innerSelf.title, inner === outward ? copy.innerSelf.repeat({ theme: inner })
      : copy.innerSelf.explore({ inner, outward }), soulUrge, personality);
  }
  if (copy.relationships && soulUrge && personality) {
    add("relationships", copy.relationships.title, copy.relationships.compose({ theme: personality.keywords[0], reflection: soulUrge.reflection }), personality, soulUrge);
  }
  if (copy.growthAdvice && maturity) {
    add("growthAdvice", copy.growthAdvice.title, copy.growthAdvice.compose({ theme: maturity.keywords[0], reflection: maturity.reflection }), maturity);
  }
  const [year, month] = referenceDate.split("-");
  if (copy.currentCycle && personalYear && personalMonth) {
    const [yearTheme] = personalYear.keywords;
    const [monthTheme] = personalMonth.keywords;
    const monthText = yearTheme === monthTheme
      ? copy.currentCycle.repeat({ month: Number(month), year, action: personalMonth.suggestedAction })
      : copy.currentCycle.month({ month: Number(month), year, theme: monthTheme, action: personalMonth.suggestedAction });
    add("currentCycle", copy.currentCycle.title, `${copy.currentCycle.year({ year, theme: yearTheme })} ${monthText}`, personalYear, personalMonth);
  } else if (copy.currentCycle && personalYear) {
    add("currentCycle", copy.currentCycle.title, copy.currentCycle.year({ year, theme: personalYear.keywords[0] }), personalYear);
  } else if (copy.currentCycle && personalMonth) {
    add("currentCycle", copy.currentCycle.title, copy.currentCycle.month({ month: Number(month), year, theme: personalMonth.keywords[0], action: personalMonth.suggestedAction }), personalMonth);
  }

  const available = { lifePath, expression, birthday, soulUrge, personality, maturity, personalYear, personalMonth };

  return {
    version,
    locale,
    title,
    ...sections,
    sourceIndices: [...sources.values()],
    contentVersion,
    completeness: {
      missingSections: overallSummarySectionIds.filter((id) => !sections[id]),
      missingIndices: (Object.keys(available) as (keyof typeof available)[]).filter((index) => !available[index]),
    },
  };
}
