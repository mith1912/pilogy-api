export const Y_MODES = ["auto", "vowel", "consonant"] as const;
export type YMode = (typeof Y_MODES)[number];
export const DEFAULT_Y_MODE = "auto" satisfies YMode;
export const Y_RULES_VERSION = "vi-y-v1";

const toneMarks = /[\u0300\u0301\u0303\u0309\u0323]/gu;
const onset = "(?:ch|gh|gi|kh|ngh?|nh|ph|qu|th|tr|[bcdđghklmnpqrstvx])?";
const medialOnset = "(?:ch|gh|gi|kh|ngh?|nh|ph|th|tr|[bcdđghklmnpqrstvx])?";
const nucleus = new RegExp(`^(?:${onset}y|${medialOnset}uy(?:ch|nh|t)?|quy(?:nh|t)?)$`, "u");
const compound = new RegExp(`^(?:yê(?:m|n|ng|u|t)|${medialOnset}uyê(?:n|t)|quyê(?:n|t))$`, "u");
const finalGlide = new RegExp(`^${onset}(?:ay|ây|oay|uây)$`, "u");

function autoRule(token: string) {
  const decomposed = token.toLowerCase().normalize("NFD");
  const tones = decomposed.match(toneMarks) ?? [];
  const spelling = decomposed.replace(toneMarks, "").normalize("NFC");
  // Tone-free ASCII overlaps heavily with non-Vietnamese names. Recognize only
  // a small set of documented spellings in addition to tokens with Vietnamese marks.
  if (tones.length > 1 || (!tones.length && !/[âê]/u.test(spelling) && !/^(?:y|ly|ky|my|thy)$/u.test(spelling))) {
    return "legacy-fallback";
  }
  if (tones.length && !/[aeiouy]\p{M}*[\u0300\u0301\u0303\u0309\u0323]/u.test(decomposed)) {
    return "legacy-fallback";
  }
  if (/(?:ch|t)$/u.test(spelling) && !tones.some((tone) => tone === "\u0301" || tone === "\u0323")) {
    return "legacy-fallback";
  }
  if (nucleus.test(spelling)) return "vi-vowel-nucleus";
  if (compound.test(spelling) && !/[uy][\u0300\u0301\u0303\u0309\u0323]/u.test(decomposed)) return "vi-compound-nucleus";
  if (finalGlide.test(spelling) && !/y\p{M}/u.test(decomposed)) return "vi-final-glide";
  return "legacy-fallback";
}

export function classifyYInName(name: string, requestedMode?: YMode | null) {
  const mode = requestedMode ?? DEFAULT_Y_MODE;
  const yOccurrences = [...name.matchAll(/[\p{L}\p{M}\p{N}]+/gu)].flatMap(([token]) => {
    const characters = [...token.matchAll(/\p{L}\p{M}*/gu)]
      .map(([character]) => character)
      .filter((character) => character.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase() === "Y");
    if (!characters.length) return [];

    const ruleId = mode === "auto" ? autoRule(token)
      : mode === "vowel" ? "forced-vowel" : "forced-consonant";
    const classification = ruleId === "vi-vowel-nucleus" || ruleId === "vi-compound-nucleus" || ruleId === "forced-vowel"
      ? "vowel" as const : "consonant" as const;
    return characters.map((originalCharacter) => ({ originalCharacter, classification, numericValue: 7 as const, ruleId }));
  });
  return {
    yModeRequested: requestedMode ?? null,
    yModeApplied: mode,
    classificationRulesVersion: Y_RULES_VERSION,
    fallbackUsed: yOccurrences.some((item) => item.ruleId === "legacy-fallback"),
    yOccurrences,
  };
}
