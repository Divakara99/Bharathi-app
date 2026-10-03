import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { withEmployeeLock } from "@/lib/employees";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";
import { inputFailure, readInput } from "@/lib/api-input";
import { inputEmployeeName } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Preserve the existing upgrade behavior for older named delivery reports.
    await db.execute(sql`
      insert into employees (name)
      select min(r.emp_name) from reports r
      where not exists (select 1 from employees e where lower(e.name) = lower(r.emp_name))
      group by lower(r.emp_name) on conflict do nothing
    `);
    const rows = await db.select().from(employees).orderBy(sql`lower(${employees.name})`);
    return NextResponse.json({ employees: rows });
  } catch (error) { return inputFailure(error, "Could not load employees. Please try again."); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readInput(req);
    const name = inputEmployeeName(body.name);
    return await withEmployeeLock(name, async (tx) => {
      const [existing] = await tx.select().from(employees).where(sql`lower(${employees.name}) = lower(${name})`).limit(1);
      if (existing) return NextResponse.json({ error: `${existing.name} is already in the list` }, { status: 409 });
      const [employee] = await tx.insert(employees).values({ name }).returning();
      return NextResponse.json({ employee }, { status: 201 });
    });
  } catch (error) { return inputFailure(error, "Could not add the employee. Please try again."); }
}

export async function DELETE(req: NextRequest) {
  const denied = requirePin(req);
  if (denied) return denied;
  return deleteRecord({ kind: "employee", id: Number(req.nextUrl.searchParams.get("id")) });
}
