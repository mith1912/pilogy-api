import { INDEX_IDS, type IndexId } from "@/lib/numerology/types";

// Describes the existing V1 formulas, independently of article availability.
const metadata: Record<IndexId, [string, string, string, string]> = {
  lifePath: ["Số chủ đạo", "Life Path", "Tổng rút gọn các thành phần ngày sinh.", "birthDate"],
  expression: ["Số biểu đạt", "Expression", "Tổng giá trị tất cả chữ cái trong họ tên.", "fullName"],
  soulUrge: ["Số linh hồn", "Soul Urge", "Tổng giá trị nguyên âm trong họ tên.", "fullName"],
  personality: ["Số nhân cách", "Personality", "Tổng giá trị phụ âm trong họ tên.", "fullName"],
  birthday: ["Số ngày sinh", "Birthday", "Giá trị rút gọn của ngày sinh.", "birthDate"],
  attitude: ["Số thái độ", "Attitude", "Tổng rút gọn tháng và ngày sinh.", "birthDate"],
  maturity: ["Số trưởng thành", "Maturity", "Tổng rút gọn số chủ đạo và số biểu đạt.", "lifePath,expression"],
  personalYear: ["Năm cá nhân", "Personal Year", "Chu kỳ theo năm của ngày tham chiếu.", "birthDate,referenceDate"],
  personalMonth: ["Tháng cá nhân", "Personal Month", "Chu kỳ theo năm cá nhân và tháng tham chiếu.", "personalYear,referenceDate"],
};
const singles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export function getSupportedValues(type: IndexId): number[] {
  return type === "personalYear" || type === "personalMonth" ? [...singles]
    : [...singles, ...(type === "birthday" ? [11, 22] : [11, 22, 33])];
}
export function buildDefinitions(hasContent: (type: IndexId, value: number) => boolean) {
  return INDEX_IDS.map((type, order) => {
    const [title, englishTitle, description, source] = metadata[type];
    const supportedValues = getSupportedValues(type);
    return { type, title, englishTitle, description, source, displayOrder: order + 1,
      supportsMasterNumbers: supportedValues.some((value) => value > 9),
      availableValues: supportedValues.filter((value) => hasContent(type, value)), supportedValues };
  });
}
