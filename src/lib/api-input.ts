import { NextResponse } from "next/server";
import { InputError, inputObject } from "@/lib/input-validation";

export async function readInput(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try { value = await request.json(); }
  catch { throw new InputError("Could not read the entry. Send valid JSON and try again."); }
  return inputObject(value);
}
export function inputFailure(error: unknown, fallback: string): NextResponse {
  if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
  console.error(fallback); // Do not log PINs, financial values or database connection strings.
  return NextResponse.json({ error: fallback }, { status: 500 });
}
