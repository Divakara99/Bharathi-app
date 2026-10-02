import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { employees, monthlyExpenses, reports } from "@/db/schema";
import { buildExportTables, buildFullCsv, buildFullXlsx } from "@/lib/full-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "xlsx";
  const yearParam = req.nextUrl.searchParams.get("year") ?? "all";
  const employeeParam = req.nextUrl.searchParams.get("employeeId") ?? "all";
  if (format !== "csv" && format !== "xlsx") {
    return NextResponse.json({ error: "Choose CSV or Excel (.xlsx)." }, { status: 400 });
  }
  const year = yearParam === "all" ? null : Number(yearParam);
  const employeeId = employeeParam === "all" ? null : Number(employeeParam);
  if (year !== null && (!/^\d{4}$/.test(yearParam) || !Number.isInteger(year) || year < 2000 || year > 2100)) {
    return NextResponse.json({ error: "Choose a valid year or All years." }, { status: 400 });
  }
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0 || employeeId > 2147483647)) {
    return NextResponse.json({ error: "Choose a valid employee or All employees." }, { status: 400 });
  }
  try {
    // One consistent, read-only snapshot; exporting never changes saved data.
    const result = await db.transaction(async (tx) => {
      const roster = await tx.select().from(employees).orderBy(asc(employees.name));
      const employee = employeeId === null ? null : roster.find((row) => row.id === employeeId);
      if (employeeId !== null && !employee) return null;
      const reportFilters: SQL[] = [];
      const expenseFilters: SQL[] = [];
      if (year !== null) {
        reportFilters.push(eq(reports.year, year));
        expenseFilters.push(eq(monthlyExpenses.year, year));
      }
      if (employee) {
        reportFilters.push(sql`lower(${reports.empName}) = ${employee.name.toLowerCase()}`);
        expenseFilters.push(eq(monthlyExpenses.employeeId, employee.id));
      }
      const deliveryRows = await tx.select().from(reports)
        .where(reportFilters.length ? and(...reportFilters) : undefined)
        .orderBy(asc(reports.year), asc(reports.month), asc(reports.cycle), asc(reports.id));
      const expenseRows = await tx.select({
        id: monthlyExpenses.id, employeeId: monthlyExpenses.employeeId, employeeName: employees.name,
        year: monthlyExpenses.year, month: monthlyExpenses.month, amount: monthlyExpenses.amount,
        notes: monthlyExpenses.notes, updatedAt: monthlyExpenses.updatedAt,
      }).from(monthlyExpenses).leftJoin(employees, eq(monthlyExpenses.employeeId, employees.id))
        .where(expenseFilters.length ? and(...expenseFilters) : undefined)
        .orderBy(asc(monthlyExpenses.year), asc(monthlyExpenses.month), asc(monthlyExpenses.id));
      return { snapshot: { employees: employee ? [employee] : roster, reports: deliveryRows, expenses: expenseRows }, employeeName: employee?.name ?? null };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
    if (!result) return NextResponse.json({ error: "This employee no longer exists. Refresh and try again." }, { status: 404 });
    const generatedAt = new Date();
    const tables = buildExportTables(result.snapshot, { year, employeeName: result.employeeName, generatedAt });
    const body = format === "csv" ? new TextEncoder().encode(buildFullCsv(tables)) : await buildFullXlsx(tables, generatedAt);
    const filename = `Bharathi-Enterprises-Full-Details-${year ?? "All-Years"}-${employeeId === null ? "All-Employees" : `Employee-${employeeId}`}.${format}`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Full details export failed", error instanceof Error ? error.message : "Unknown export error");
    return NextResponse.json({ error: "Could not prepare the download. Please try again." }, { status: 500 });
  }
}
