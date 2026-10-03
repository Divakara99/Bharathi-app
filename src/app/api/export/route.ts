import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { employees, monthlyExpenses, reports } from "@/db/schema";
import { buildExportTables, buildFullCsv, buildFullXlsx } from "@/lib/full-export";
import { downloadDisposition, exportFilename } from "@/lib/export-filenames";
import { monthRange } from "@/lib/report-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const format = params.get("format") ?? "xlsx";
  const yearParam = params.get("year") ?? "all";
  const employeeParam = params.get("employeeId") ?? "all";
  if (format !== "csv" && format !== "xlsx") return NextResponse.json({ error: "Choose CSV or Excel (.xlsx)." }, { status: 400 });
  const year = yearParam === "all" ? null : Number(yearParam);
  const employeeId = employeeParam === "all" ? null : Number(employeeParam);
  if (year !== null && (!/^\d{4}$/.test(yearParam) || !Number.isInteger(year) || year < 2000 || year > 2100)) {
    return NextResponse.json({ error: "Choose a valid year or All years." }, { status: 400 });
  }
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0 || employeeId > 2147483647)) {
    return NextResponse.json({ error: "Choose a valid employee." }, { status: 400 });
  }
  if (params.has("fromMonth") !== params.has("toMonth")) {
    return NextResponse.json({ error: "Choose both From month and To month." }, { status: 400 });
  }
  let range;
  try { range = monthRange(Number(params.get("fromMonth") ?? 1), Number(params.get("toMonth") ?? 12)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid month range." }, { status: 400 }); }
  try {
    const result = await db.transaction(async (tx) => {
      const roster = await tx.select().from(employees).orderBy(asc(employees.name));
      const employee = employeeId === null ? null : roster.find((row) => row.id === employeeId);
      if (employeeId !== null && !employee) return null;
      const reportFilters: SQL[] = [gte(reports.month, range.fromMonth), lte(reports.month, range.toMonth)];
      const expenseFilters: SQL[] = [gte(monthlyExpenses.month, range.fromMonth), lte(monthlyExpenses.month, range.toMonth)];
      if (year !== null) {
        reportFilters.push(eq(reports.year, year)); expenseFilters.push(eq(monthlyExpenses.year, year));
      }
      if (employee) {
        reportFilters.push(sql`lower(${reports.empName}) = ${employee.name.toLowerCase()}`);
        expenseFilters.push(eq(monthlyExpenses.employeeId, employee.id));
      }
      const deliveryRows = await tx.select().from(reports).where(and(...reportFilters))
        .orderBy(asc(reports.year), asc(reports.month), asc(reports.cycle), asc(reports.id));
      const expenseRows = await tx.select({
        id: monthlyExpenses.id, employeeId: monthlyExpenses.employeeId, employeeName: employees.name,
        year: monthlyExpenses.year, month: monthlyExpenses.month, amount: monthlyExpenses.amount,
        notes: monthlyExpenses.notes, updatedAt: monthlyExpenses.updatedAt,
      }).from(monthlyExpenses).leftJoin(employees, eq(monthlyExpenses.employeeId, employees.id))
        .where(and(...expenseFilters))
        .orderBy(asc(monthlyExpenses.year), asc(monthlyExpenses.month), asc(monthlyExpenses.id));
      return { snapshot: { employees: employee ? [employee] : roster, reports: deliveryRows, expenses: expenseRows }, employeeName: employee?.name ?? null };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
    if (!result) return NextResponse.json({ error: "This employee no longer exists. Refresh and try again." }, { status: 404 });
    const generatedAt = new Date();
    const tables = buildExportTables(result.snapshot, { year, employeeName: result.employeeName, generatedAt, ...range });
    const body = format === "csv" ? new TextEncoder().encode(buildFullCsv(tables)) : await buildFullXlsx(tables, generatedAt);
    const names = tables.find((table) => table.name === "Employees")!.rows.map((row) => row.employeeName ?? "");
    const filename = exportFilename(names, year, format, "Full-Details", range);
    return new NextResponse(body, { status: 200, headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": downloadDisposition(filename),
      "Content-Length": String(body.byteLength), "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Full details export failed", error instanceof Error ? error.message : "Unknown export error");
    return NextResponse.json({ error: "Could not prepare the download. Please try again." }, { status: 500 });
  }
}
