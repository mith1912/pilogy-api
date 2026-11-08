export type CalendarDate = { year: number; month: number; day: number };

export function parseCalendarDate(value: string): CalendarDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid calendar date.");
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
    throw new Error("Invalid calendar date.");
  }
  return { year, month, day };
}
export function isCalendarDate(value: string): boolean {
  try { parseCalendarDate(value); return true; } catch { return false; }
}
