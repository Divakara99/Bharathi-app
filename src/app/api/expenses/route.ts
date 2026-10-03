import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { employees, monthlyExpenses } from "@/db/schema";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";
import { lockEmployee } from "@/lib/employees";
import { inputFailure, readInput } from "@/lib/api-input";
import { InputError, inputInteger, inputMoney, inputNotes, MAX_DB_INTEGER } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const filters: SQL[] = [];
    const year = req.nextUrl.searchParams.get("year");
    const employee = req.nextUrl.searchParams.get("employeeId");
    if (year !== null) filters.push(eq(monthlyExpenses.year, inputInteger(year, "Year", 2000, 2100)));
    if (employee !== null) filters.push(employee === "general" ? isNull(monthlyExpenses.employeeId) : eq(monthlyExpenses.employeeId, inputInteger(employee, "Employee ID", 1, MAX_DB_INTEGER)));
    const rows = await db.select({
      id: monthlyExpenses.id, employeeId: monthlyExpenses.employeeId, employeeName: employees.name,
      year: monthlyExpenses.year, month: monthlyExpenses.month, amount: monthlyExpenses.amount,
      notes: monthlyExpenses.notes, updatedAt: monthlyExpenses.updatedAt,
    }).from(monthlyExpenses).leftJoin(employees, eq(monthlyExpenses.employeeId, employees.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(monthlyExpenses.year), desc(monthlyExpenses.month), asc(employees.name));
    return NextResponse.json({ expenses: rows });
  } catch (error) { return inputFailure(error, "Could not load expenses. Please try again."); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readInput(req);
    if (!Object.prototype.hasOwnProperty.call(body, "employeeId")) throw new InputError("Select an employee for these expenses.");
    const employeeId = body.employeeId === null ? null : inputInteger(body.employeeId, "Employee ID", 1, MAX_DB_INTEGER);
    const year = inputInteger(body.year, "Year", 2000, 2100);
    const month = inputInteger(body.month, "Month", 1, 12);
    const amount = inputMoney(body.amount, "Expense amount");
    const notes = inputNotes(body.notes);
    return await db.transaction(async (tx) => {
      let employeeName: string | null = null;
      if (employeeId !== null) {
        const [found] = await tx.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
        if (!found) return NextResponse.json({ error: "Employee not found. Add the employee in Staff first." }, { status: 404 });
        await lockEmployee(tx, found.name);
        const [confirmed] = await tx.select().from(employees).where(eq(employees.id, employeeId)).limit(1).for("update");
        if (!confirmed) return NextResponse.json({ error: "This employee was removed. Refresh the list." }, { status: 404 });
        employeeName = confirmed.name;
      }
      const values = { employeeId, year, month, amount: amount.toFixed(2), notes };
      const set = { amount: amount.toFixed(2), notes, updatedAt: new Date() };
      const rows = employeeId === null
        ? await tx.insert(monthlyExpenses).values(values).onConflictDoUpdate({
            target: [monthlyExpenses.year, monthlyExpenses.month], targetWhere: sql`${monthlyExpenses.employeeId} is null`, set,
          }).returning()
        : await tx.insert(monthlyExpenses).values(values).onConflictDoUpdate({
            target: [monthlyExpenses.employeeId, monthlyExpenses.year, monthlyExpenses.month], set,
          }).returning();
      return NextResponse.json({ expense: { ...rows[0], employeeName } }, { status: 201 });
    });
  } catch (error) { return inputFailure(error, "Could not save expenses. Please try again."); }
}

export async function DELETE(req: NextRequest) {
  const denied = requirePin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (id !== null) return deleteRecord({ kind: "expense", id: Number(id) });
  const employee = req.nextUrl.searchParams.get("employeeId");
  return deleteRecord({
    kind: "expense", year: Number(req.nextUrl.searchParams.get("year")), month: Number(req.nextUrl.searchParams.get("month")),
    employeeId: employee === null || employee === "general" ? null : Number(employee),
  });
}
