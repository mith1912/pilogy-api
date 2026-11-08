import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const directory = new URL("../lib/interpretations/content/vi/", import.meta.url);
const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const tokens = (value) => normalize(value).split(/\s+/u).filter(Boolean);
function strings(value, prefix = "") {
  if (typeof value === "string") return [[prefix, value]];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => strings(child, prefix ? `${prefix}.${key}` : key));
}
function shingles(value) {
  const words = tokens(value);
  return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(" ")));
}
function similarity(left, right) {
  let common = 0;
  for (const value of left) if (right.has(value)) common++;
  return common / (left.size + right.size - common || 1);
}
function groups(entries, minimum = 2) {
  const grouped = new Map();
  for (const [text, ref] of entries) {
    const key = normalize(text);
    const group = grouped.get(key) ?? { text, references: [] };
    group.references.push(ref);
    grouped.set(key, group);
  }
  return [...grouped.values()].filter((group) => group.references.length >= minimum)
    .sort((a,b) => b.references.length-a.references.length);
}
export function auditContent() {
  const records = [];
  const files = [];
  const integrityIssues = [];
  for (const filename of readdirSync(directory).filter((name) => name.endsWith(".json"))) {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(new URL(filename, directory)));
    const data = JSON.parse(raw);
    files.push({ file: filename, locale: data.locale ?? null, contentVersion: data.contentVersion, records: data.items?.length ?? 0 });
    for (const item of data.items ?? []) records.push({ file: filename, ...item });
  }
  const paragraphEntries = [], sentenceEntries = [], lengths = [], keywordIssues = [], claimCandidates = [];
  const narrative = new Set(["summary","essence","relationships","careerAndGrowth","lifeLesson"]);
  for (const item of records) {
    const id = `${item.index}/${item.value}`;
    for (const [field, text] of strings(item)) {
      const ref = `${id}:${field}`;
      if (!text.trim() || /\b(?:TODO|TBD|lorem ipsum)\b/iu.test(text) || /\uFFFD|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text)) integrityIssues.push({ ref, issue: "blank, placeholder or invalid Unicode" });
      if (field === "file" || field === "index") continue;
      if (tokens(text).length >= 8) {
        paragraphEntries.push([text, ref]);
        for (const sentence of text.split(/[.!?…]+/u).map((part) => part.trim()).filter((part) => tokens(part).length >= 8)) sentenceEntries.push([sentence, ref]);
      }
      if (narrative.has(field)) {
        const words = tokens(text).length;
        lengths.push({ ref, words, characters: text.length, warning: words < (field === "essence" ? 70 : field === "summary" ? 35 : 25) ? "short" : words > 250 ? "long" : null });
      }
      for (const sentence of text.split(/(?<=[.!?])\s+/u)) {
        if (/chắc chắn|đảm bảo|bảo đảm|giàu có|khoa học|định mệnh|dự báo|sẽ xảy ra/iu.test(sentence)) claimCandidates.push({ ref, sentence, hasNegation: /không|chưa|chẳng/iu.test(sentence) });
      }
    }
    const keys = item.keywords.map(normalize);
    if (new Set(keys).size !== keys.length || keys.some((key) => !key || tokens(key).length > 12 || /^(?:từ khóa|keyword|test)$/u.test(key))) keywordIssues.push({ ref: id, keywords: item.keywords });
  }
  const summaryDuplicates = groups(records.map((item) => [item.summary, `${item.index}/${item.value}`]));
  const paragraphDuplicates = groups(paragraphEntries).map((group) => ({ ...group, text: group.text.slice(0, 240) }));
  const repeatedSentences = groups(sentenceEntries, 5).map((group) => ({ ...group, text: group.text.slice(0, 240) }));
  const titleDuplicates = groups(records.map((item) => [item.title, `${item.index}/${item.value}`]));
  const similarities = [];
  for (const field of ["summary", "essence"]) {
    const sets = records.map((item) => shingles(item[field]));
    for (let left = 0; left < records.length; left++) for (let right = left+1; right < records.length; right++) {
      const score = similarity(sets[left], sets[right]);
      if (score >= 0.65) similarities.push({ field, left: `${records[left].index}/${records[left].value}`, right: `${records[right].index}/${records[right].value}`, score: Number(score.toFixed(4)), crossIndex: records[left].index !== records[right].index });
    }
  }
  const witnesses = JSON.parse(readFileSync(new URL("../tests/fixtures/domain-witnesses.json", import.meta.url), "utf8"));
  const required = new Set(witnesses.map((item) => `${item.type}/${item.value}`));
  const available = new Set(records.map((item) => `${item.index}/${item.value}`));
  const missing = [...required].filter((key) => !available.has(key)).sort();
  const unused = [...available].filter((key) => !required.has(key)).sort();
  const counts = Object.fromEntries(files.filter((file) => file.records).map((file) => [records.find((item) => item.file === file.file).index, file.records]));
  return { method: { normalization: "NFKC, Vietnamese lowercase, Unicode letter/number tokens; accents retained", similarity: "Jaccard of sets of five-token shingles; warn at >=0.65; summary and essence compared separately", shortWords: { summary:35, essence:70, otherNarrative:25 }, longWords:250, sentenceMinimumWords:8, repeatedSentenceMinimumOccurrences:5 }, files, total:records.length, requiredCombinations:required.size, missing, unused, counts, integrityIssues, summaryDuplicates, paragraphDuplicates, repeatedSentences, titleDuplicates, similarities, lengths, keywordIssues, claimCandidates };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const audit = auditContent();
  writeFileSync(new URL("../docs/qa/content-audit.json", import.meta.url), JSON.stringify(audit, null, 2)+"\n");
  console.log(JSON.stringify({ total:audit.total, requiredCombinations:audit.requiredCombinations, missing:audit.missing, unused:audit.unused, counts:audit.counts, integrityIssues:audit.integrityIssues.length, duplicateSummaries:audit.summaryDuplicates.length, duplicateParagraphGroups:audit.paragraphDuplicates.length, repeatedSentenceGroups:audit.repeatedSentences.length, duplicateTitleGroups:audit.titleDuplicates.length, highSimilarityPairs:audit.similarities.length, crossIndexPairs:audit.similarities.filter((item) => item.crossIndex).length, shortSections:audit.lengths.filter((item) => item.warning === "short").length, longSections:audit.lengths.filter((item) => item.warning === "long").length, keywordIssues:audit.keywordIssues.length, claimCandidates:audit.claimCandidates.length, candidatesWithoutNegation:audit.claimCandidates.filter((item) => !item.hasNegation).length }, null, 2));
  if (process.argv.includes("--check")) {
    const blockers = [];
    if (audit.missing.length) blockers.push(`CRITICAL missing articles: ${audit.missing.join(", ")}`);
    if (audit.integrityIssues.length || audit.unused.length) blockers.push("CRITICAL invalid or unreachable content");
    if (audit.paragraphDuplicates.some((group) => group.references.filter((ref) => /:challenges\.\d+\.description$/.test(ref)).length >= audit.total)) blockers.push("HIGH extensive duplicated challenge descriptions; editorial revision required");
    if (blockers.length) { console.error(blockers.join("\n")); process.exitCode = 1; }
  }
}
