import { cycleDayRange } from "@/lib/report-period";
import {
  deliveryTotal, InputError, inputEmployeeName, inputInteger, inputMoney, inputNotes, inputObject,
  MAX_DB_INTEGER, MAX_PRICE,
} from "@/lib/input-validation";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const periodLabel = (year: number, month: number, cycle: number) => `${MONTH_NAMES[month - 1]} ${year} (${cycleDayRange(cycle, year, month)})`;
export type ReportInput = {
  empName: string; year: number; month: number; cycle: number; deliveries: number; pricePerDelivery: number; totalValue: string; notes: string | null;
};
export function parseReportInput(body: unknown): { ok: true; data: ReportInput } | { ok: false; error: string } {
  try {
    const value = inputObject(body);
    const empName = inputEmployeeName(value.empName);
    const year = inputInteger(value.year, "Year", 2000, 2100);
    const month = inputInteger(value.month, "Month", 1, 12);
    const cycle = inputInteger(value.cycle, "Cycle", 1, 2);
    const deliveries = inputInteger(value.deliveries, "Deliveries", 0, MAX_DB_INTEGER);
    const pricePerDelivery = inputMoney(value.pricePerDelivery, "Per delivery price", MAX_PRICE);
    const totalValue = deliveryTotal(deliveries, pricePerDelivery);
    const notes = inputNotes(value.notes);
    return { ok: true, data: { empName, year, month, cycle, deliveries, pricePerDelivery, totalValue, notes } };
  } catch (error) {
    return { ok: false, error: error instanceof InputError ? error.message : "Enter a valid delivery record." };
  }
}
