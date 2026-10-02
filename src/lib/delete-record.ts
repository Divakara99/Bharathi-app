import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, monthlyExpenses, reports } from "@/db/schema";

export type DeleteTarget =
  | { kind: "report"; id: number }
  | { kind: "expense"; id: number }
  | { kind: "expense"; year: number; month: number; employeeId: number | null }
  | { kind: "employee"; id: number };

const validId = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;
const invalid = (error: string) => NextResponse.json({ error, code: "INVALID_TARGET" }, { status: 400 });

// Only call after PIN verification. An expense deletion always targets one employee's row.
export async function deleteRecord(target: DeleteTarget): Promise<NextResponse> {
  try {
    if (target.kind === "report") {
      if (!validId(target.id)) return invalid("Invalid report");
      const deleted = await db.delete(reports).where(eq(reports.id, target.id)).returning({ id: reports.id });
      if (!deleted.length) {
        return NextResponse.json({ error: "This report has already been deleted. Refresh your records.", code: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }
    if (target.kind === "expense") {
      let filter;
      if ("id" in target) {
        if (!validId(target.id)) return invalid("Invalid expense entry");
        filter = eq(monthlyExpenses.id, target.id);
      } else {
        if (!Number.isInteger(target.year) || target.year < 2000 || target.year > 2100 ||
            !Number.isInteger(target.month) || target.month < 1 || target.month > 12 ||
            (target.employeeId !== null && !validId(target.employeeId))) return invalid("Invalid expense month or employee");
        filter = and(
          eq(monthlyExpenses.year, target.year),
          eq(monthlyExpenses.month, target.month),
          target.employeeId === null ? isNull(monthlyExpenses.employeeId) : eq(monthlyExpenses.employeeId, target.employeeId),
        );
      }
      const deleted = await db.delete(monthlyExpenses).where(filter).returning({ id: monthlyExpenses.id });
      if (!deleted.length) {
        return NextResponse.json({ error: "These expenses have already been deleted. Refresh the summary.", code: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }
    if (!validId(target.id)) return invalid("Invalid employee");
    const [employee] = await db.select().from(employees).where(eq(employees.id, target.id)).limit(1);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found. Refresh the employee list.", code: "NOT_FOUND" }, { status: 404 });
    }
    const [[reportCount], [expenseCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(reports)
        .where(sql`lower(${reports.empName}) = ${employee.name.toLowerCase()}`),
      db.select({ count: sql<number>`count(*)::int` }).from(monthlyExpenses)
        .where(eq(monthlyExpenses.employeeId, employee.id)),
    ]);
    if (reportCount.count > 0 || expenseCount.count > 0) {
      return NextResponse.json({
        error: `${employee.name} has ${reportCount.count} delivery reports and ${expenseCount.count} monthly expense entries. Delete those first.`,
        code: "EMPLOYEE_HAS_DATA",
      }, { status: 409 });
    }
    await db.delete(employees).where(eq(employees.id, target.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Record deletion failed", error instanceof Error ? error.message : "Database error");
    return NextResponse.json({ error: "Could not delete the record. Please try again.", code: "DELETE_FAILED" }, { status: 500 });
  }
}
