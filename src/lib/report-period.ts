// month is 1–12; UTC avoids device time-zone differences.
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function cycleDayRange(cycle: number, year: number, month: number): string {
  return cycle === 1 ? "1 – 15" : `16 – ${lastDayOfMonth(year, month)}`;
}

export function exportCycleLabel(cycle: number, year: number, month: number): string {
  return `Cycle ${cycle} (${cycle === 1 ? "1–15" : `16–${lastDayOfMonth(year, month)}`})`;
}
