import { NextRequest, NextResponse } from "next/server";
import { checkDeletePin } from "@/lib/pin";
import { deleteRecord, type DeleteTarget } from "@/lib/delete-record";

export const dynamic = "force-dynamic";

// Keep the PIN in the JSON body, never in a URL or client-side validation.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid delete request", code: "INVALID_REQUEST" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Could not read the delete request. Please try again.", code: "INVALID_REQUEST" }, { status: 400 });
  }
  const denied = checkDeletePin(body.pin);
  if (denied) return denied;
  let target: DeleteTarget;
  if (body.kind === "report" || body.kind === "employee") {
    target = { kind: body.kind, id: Number(body.id) };
  } else if (body.kind === "expense") {
    if (Object.prototype.hasOwnProperty.call(body, "id")) {
      target = { kind: "expense", id: Number(body.id) };
    } else {
      target = {
        kind: "expense", year: Number(body.year), month: Number(body.month),
        employeeId: body.employeeId == null ? null : Number(body.employeeId),
      };
    }
  } else {
    return NextResponse.json({ error: "Invalid record type", code: "INVALID_TARGET" }, { status: 400 });
  }
  return deleteRecord(target);
}
