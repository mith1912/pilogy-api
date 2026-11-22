import { expect, it } from "vitest";
import { classifyYInName } from "@/lib/numerology/versions/y-classification";
import { analyzeName } from "@/lib/numerology/name";

it.each([
  ["Mỹ", "vi-vowel-nucleus"], ["Lý", "vi-vowel-nucleus"], ["Kỳ", "vi-vowel-nucleus"],
  ["Thy", "vi-vowel-nucleus"], ["Thúy", "vi-vowel-nucleus"], ["Thủy", "vi-vowel-nucleus"],
  ["Yến", "vi-compound-nucleus"], ["Yên", "vi-compound-nucleus"], ["Yêu", "vi-compound-nucleus"],
  ["Uyên", "vi-compound-nucleus"], ["Nguyễn", "vi-compound-nucleus"], ["Nguyệt", "vi-compound-nucleus"],
  ["Tây", "vi-final-glide"], ["Máy", "vi-final-glide"], ["Xoáy", "vi-final-glide"],
  ["Yvonne", "legacy-fallback"], ["Lynn", "legacy-fallback"], ["Ryan", "legacy-fallback"],
  ["May", "legacy-fallback"], ["Nguyen", "legacy-fallback"], ["Tãý", "legacy-fallback"],
  ["Ýến", "legacy-fallback"], ["Nguyêt", "legacy-fallback"],
])("classifies %s as %s in both cases and Unicode forms", (token, ruleId) => {
  const classification = ["vi-vowel-nucleus", "vi-compound-nucleus"].includes(ruleId) ? "vowel" : "consonant";
  for (const form of [token.toLowerCase(), token.toUpperCase()]) {
    for (const input of [form.normalize("NFC"), form.normalize("NFD")]) {
      const originalCharacter = input.match(/[yýỳỷỹỵ]\p{M}*/iu)?.[0];
      expect(classifyYInName(input, "auto")).toMatchObject({
        fallbackUsed: ruleId === "legacy-fallback",
        yOccurrences: [{ originalCharacter, ruleId, classification, numericValue: 7 }],
      });
    }
  }
});

it.each(["Y", "Ý", "Ỳ", "Ỷ", "Ỹ", "Ỵ"])("retains all Vietnamese Y forms, including %s", (letter) => {
  expect(classifyYInName(letter, "auto").yOccurrences).toEqual([
    { originalCharacter: letter, classification: "vowel", numericValue: 7, ruleId: "vi-vowel-nucleus" },
  ]);
});

it("handles punctuation, astral characters, mixed rules and repeated unsupported Ys", () => {
  const name = "🌿Mỹ-Tây Yyy";
  const result = analyzeName(name, "auto");
  expect(result.calculationOptions.fallbackUsed).toBe(true);
  expect(result.calculationOptions.yOccurrences.map((item) => item.originalCharacter)).toEqual(["ỹ", "y", "Y", "y", "y"]);
  expect(result.letters.filter((item) => item.letter === "Y").map((item) => item.group))
    .toEqual(["vowel", "consonant", "consonant", "consonant", "consonant"]);
});
