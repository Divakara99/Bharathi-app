export const RANGE_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export type MonthRange = { fromMonth: number; toMonth: number };

export function monthRange(fromMonth = 1, toMonth = 12): MonthRange {
  if (!Number.isInteger(fromMonth) || !Number.isInteger(toMonth) || fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
    throw new Error("Choose valid From and To months.");
  }
  if (fromMonth > toMonth) throw new Error("To month must be the same as or later than From month. Select the report year above.");
  return { fromMonth, toMonth };
}

export function isInMonthRange(month: number, range: MonthRange): boolean {
  return month >= range.fromMonth && month <= range.toMonth;
}

export function monthRangeLabel(year: number | null, range: MonthRange): string {
  const months = range.fromMonth === range.toMonth ? RANGE_MONTHS[range.fromMonth - 1] : `${RANGE_MONTHS[range.fromMonth - 1]} – ${RANGE_MONTHS[range.toMonth - 1]}`;
  return year === null ? `${months} in each saved year` : `${months} ${year}`;
}

export function monthRangeFileLabel(range: MonthRange): string {
  const from = RANGE_MONTHS[range.fromMonth - 1].slice(0, 3);
  return range.fromMonth === range.toMonth ? from : `${from}-to-${RANGE_MONTHS[range.toMonth - 1].slice(0, 3)}`;
}
