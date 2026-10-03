import { NextRequest, NextResponse } from "next/server";
import { checkDeletePin } from "@/lib/pin";
import { deleteRecord, type DeleteTarget } from "@/lib/delete-record";
import { inputInteger, MAX_DB_INTEGER } from "@/lib/input-validation";
import { inputFailure, readInput } from "@/lib/api-input";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await readInput(req);
    const denied = checkDeletePin(body.pin);
    if (denied) return denied;
    let target: DeleteTarget;
    if (body.kind === "report" || body.kind === "employee") {
      target = { kind: body.kind, id: inputInteger(body.id, "Record ID", 1, MAX_DB_INTEGER) };
    } else if (body.kind === "expense") {
      target = Object.prototype.hasOwnProperty.call(body, "id")
        ? { kind: "expense", id: inputInteger(body.id, "Expense ID", 1, MAX_DB_INTEGER) }
        : {
            kind: "expense", year: inputInteger(body.year, "Year", 2000, 2100), month: inputInteger(body.month, "Month", 1, 12),
            employeeId: body.employeeId == null ? null : inputInteger(body.employeeId, "Employee ID", 1, MAX_DB_INTEGER),
          };
    } else return NextResponse.json({ error: "Invalid record type", code: "INVALID_TARGET" }, { status: 400 });
    return deleteRecord(target);
  } catch (error) { return inputFailure(error, "Could not process deletion. Please try again."); }
}
