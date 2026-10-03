import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { findOrCreateEmployee, normalizeName, withEmployeeLock } from "@/lib/employees";
import { parseReportInput, periodLabel } from "@/lib/report-input";
import { inputFailure, readInput } from "@/lib/api-input";
import { inputInteger } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const filters: SQL[] = [];
    const yearParam = req.nextUrl.searchParams.get("year");
    if (yearParam !== null) filters.push(eq(reports.year, inputInteger(yearParam, "Year", 2000, 2100)));
    const employeeParam = req.nextUrl.searchParams.get("emp");
    if (employeeParam?.trim()) filters.push(sql`lower(${reports.empName}) = lower(${normalizeName(employeeParam)})`);
    const rows = await db.select().from(reports).where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(reports.year), desc(reports.month), desc(reports.cycle), desc(reports.id));
    return NextResponse.json({ reports: rows });
  } catch (error) { return inputFailure(error, "Could not load delivery reports. Please try again."); }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = parseReportInput(await readInput(req));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const data = parsed.data;
    return await withEmployeeLock(data.empName, async (tx) => {
      const [duplicate] = await tx.select({ id: reports.id }).from(reports).where(and(
        sql`lower(${reports.empName}) = lower(${data.empName})`,
        eq(reports.year, data.year), eq(reports.month, data.month), eq(reports.cycle, data.cycle),
      )).limit(1);
      if (duplicate) return NextResponse.json({
        error: `${data.empName} already has an entry for ${periodLabel(data.year, data.month, data.cycle)}. Edit it instead.`,
      }, { status: 409 });
      const empName = await findOrCreateEmployee(data.empName, tx);
      const [report] = await tx.insert(reports).values({
        empName, year: data.year, month: data.month, cycle: data.cycle, deliveries: data.deliveries,
        pricePerDelivery: data.pricePerDelivery.toFixed(2), totalValue: data.totalValue, notes: data.notes,
      }).returning();
      return NextResponse.json({ report }, { status: 201 });
    });
  } catch (error) { return inputFailure(error, "Could not save the delivery report. Please try again."); }
}
