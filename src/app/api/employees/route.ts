import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { normalizeName } from "@/lib/employees";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";

export const dynamic = "force-dynamic";

export async function GET() {
  // Make sure anyone who already has saved reports is also in the list
  await db.execute(sql`
    insert into employees (name)
    select min(r.emp_name) from reports r
    where not exists (
      select 1 from employees e where lower(e.name) = lower(r.emp_name)
    )
    group by lower(r.emp_name)
    on conflict do nothing
  `);

  const rows = await db
    .select()
    .from(employees)
    .orderBy(sql`lower(${employees.name})`);
  return NextResponse.json({ employees: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = normalizeName(String(body.name ?? ""));
    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "Employee name is too long" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(employees)
      .where(sql`lower(${employees.name}) = ${name.toLowerCase()}`)
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: `${existing.name} is already in the list` },
        { status: 409 },
      );
    }

    const [row] = await db.insert(employees).values({ name }).returning();
    return NextResponse.json({ employee: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add employee" }, { status: 500 });
  }
}

// PIN protected. An employee with saved entries cannot be removed.
export async function DELETE(req: NextRequest) {
  const denied = requirePin(req);
  if (denied) return denied;

  return deleteRecord({ kind: "employee", id: Number(req.nextUrl.searchParams.get("id")) });
}
