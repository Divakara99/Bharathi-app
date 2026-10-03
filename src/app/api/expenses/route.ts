import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { employees, monthlyExpenses } from "@/db/schema";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters: SQL[] = [];
  const yearParam = req.nextUrl.searchParams.get("year");
  const employeeParam = req.nextUrl.searchParams.get("employeeId");
  if (yearParam !== null) {
    const year = Number(yearParam);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    filters.push(eq(monthlyExpenses.year, year));
  }
  if (employeeParam !== null) {
    if (employeeParam === "general") filters.push(isNull(monthlyExpenses.employeeId));
    else {
      const id = Number(employeeParam);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
      }
      filters.push(eq(monthlyExpenses.employeeId, id));
    }
  }
  try {
    const rows = await db.select({
      id: monthlyExpenses.id,
      employeeId: monthlyExpenses.employeeId,
      employeeName: employees.name,
      year: monthlyExpenses.year,
      month: monthlyExpenses.month,
      amount: monthlyExpenses.amount,
      notes: monthlyExpenses.notes,
      updatedAt: monthlyExpenses.updatedAt,
    }).from(monthlyExpenses)
      .leftJoin(employees, eq(monthlyExpenses.employeeId, employees.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(monthlyExpenses.year), desc(monthlyExpenses.month), asc(employees.name));
    return NextResponse.json({ expenses: rows });
  } catch {
    return NextResponse.json({ error: "Could not load expenses" }, { status: 500 });
  }
}

// Monthly upsert is scoped to one employee. Explicit NULL means general business expenses.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid expense entry" }, { status: 400 });
    }
    if (!Object.prototype.hasOwnProperty.call(body, "employeeId")) {
      return NextResponse.json({ error: "Select an employee for these expenses" }, { status: 400 });
    }
    const employeeId = body.employeeId === null ? null : Number(body.employeeId);
    const year = Number(body.year);
    const month = Number(body.month);
    const amount = Number(body.amount);
    const notes = body.notes ? String(body.notes).trim().slice(0, 300) : null;
    if (!Number.isInteger(year) || year < 2000 || year > 2100 ||
        !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }
    if (body.amount === null || body.amount === undefined || body.amount === "" ||
        !Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
      return NextResponse.json({ error: "Enter a valid, non-negative expense amount" }, { status: 400 });
    }
    let employeeName: string | null = null;
    if (employeeId !== null) {
      if (!Number.isInteger(employeeId) || employeeId <= 0 || employeeId > 2147483647) {
        return NextResponse.json({ error: "Select a valid employee" }, { status: 400 });
      }
      const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
      if (!employee) {
        return NextResponse.json({ error: "Employee not found. Add the employee in Staff first." }, { status: 404 });
      }
      employeeName = employee.name;
    }
    const values = { employeeId, year, month, amount: amount.toFixed(2), notes };
    const set = { amount: amount.toFixed(2), notes, updatedAt: new Date() };
    const rows = employeeId === null
      ? await db.insert(monthlyExpenses).values(values).onConflictDoUpdate({
          target: [monthlyExpenses.year, monthlyExpenses.month],
          targetWhere: sql`${monthlyExpenses.employeeId} is null`,
          set,
        }).returning()
      : await db.insert(monthlyExpenses).values(values).onConflictDoUpdate({
          target: [monthlyExpenses.employeeId, monthlyExpenses.year, monthlyExpenses.month],
          set,
        }).returning();
    return NextResponse.json({ expense: { ...rows[0], employeeName } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save expenses. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = requirePin(req);
  if (denied) return denied;
  const idParam = req.nextUrl.searchParams.get("id");
  if (idParam !== null) return deleteRecord({ kind: "expense", id: Number(idParam) });
  const employeeParam = req.nextUrl.searchParams.get("employeeId");
  return deleteRecord({
    kind: "expense",
    year: Number(req.nextUrl.searchParams.get("year")),
    month: Number(req.nextUrl.searchParams.get("month")),
    employeeId: employeeParam === null || employeeParam === "general" ? null : Number(employeeParam),
  });
}
