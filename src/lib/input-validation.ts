import { normalizeName } from "@/lib/employee-name";

export class InputError extends Error {
  constructor(message: string) { super(message); this.name = "InputError"; }
}
export const MAX_DB_INTEGER = 2147483647;
export const MAX_PRICE = 99999999.99;
export const MAX_MONEY = 9999999999.99;

export function inputObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Enter a valid record.");
  return value as Record<string, unknown>;
}
export function inputNumber(value: unknown, label: string): number {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) {
    throw new InputError(`${label} is required and must be a number.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new InputError(`Enter a valid ${label.toLowerCase()}.`);
  return number;
}
export function inputInteger(value: unknown, label: string, min: number, max: number): number {
  const number = inputNumber(value, label);
  if (!Number.isInteger(number) || number < min || number > max) throw new InputError(`${label} must be a whole number between ${min} and ${max}.`);
  return number;
}
export function inputMoney(value: unknown, label: string, max = MAX_MONEY): number {
  const number = inputNumber(value, label);
  if (number < 0 || number > max) throw new InputError(`${label} must be between 0 and ${max}.`);
  const paise = Math.round(number * 100);
  if (Math.abs(number * 100 - paise) > 0.00001) throw new InputError(`${label} can have at most 2 decimal places.`);
  return paise / 100;
}
export function inputEmployeeName(value: unknown): string {
  if (typeof value !== "string") throw new InputError("Employee name is required.");
  const name = normalizeName(value);
  if (!name) throw new InputError("Employee name is required.");
  if (name.length > 60) throw new InputError("Employee name is too long (maximum 60 characters).");
  return name;
}
export function inputNotes(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new InputError("Notes must be text.");
  return value.trim().slice(0, 300) || null;
}
export function deliveryTotal(deliveries: number, price: number): string {
  const paise = deliveries * Math.round(price * 100);
  if (!Number.isSafeInteger(paise) || paise > Math.round(MAX_MONEY * 100)) throw new InputError("Total value is too large. Reduce the delivery count or price.");
  return (paise / 100).toFixed(2);
}
