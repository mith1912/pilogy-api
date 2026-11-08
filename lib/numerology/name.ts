const VOWELS = new Set("AEIOU");

export function normalizeName(name: string): string {
  return name.replace(/[Đđ]/g, "D").normalize("NFD").replace(/\p{M}/gu, "")
    .toUpperCase().replace(/[^A-Z\s]/g, "").trim().replace(/\s+/g, " ");
}
export function letterValue(letter: string): number {
  if (!/^[A-Z]$/.test(letter)) throw new Error("Expected one ASCII letter.");
  return (letter.charCodeAt(0) - 65) % 9 + 1;
}
export function analyzeName(name: string) {
  const normalizedName = normalizeName(name);
  const letters = [...normalizedName.replace(/ /g, "")].map((letter) => ({
    letter, value: letterValue(letter), group: VOWELS.has(letter) ? "vowel" as const : "consonant" as const,
  }));
  if (!letters.length) throw new Error("Name must contain at least one A–Z letter after normalization.");
  const vowelTotal = letters.filter((item) => item.group === "vowel").reduce((sum, item) => sum + item.value, 0);
  const consonantTotal = letters.filter((item) => item.group === "consonant").reduce((sum, item) => sum + item.value, 0);
  return { normalizedName, letters, nameTotal: vowelTotal + consonantTotal, vowelTotal, consonantTotal };
}
