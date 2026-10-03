import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";
import { findOrCreateEmployee, lockEmployee } from "@/lib/employees";
import { parseReportInput, periodLabel } from "@/lib/report-input";
import { inputFailure, readInput } from "@/lib/api-input";
import { inputInteger, MAX_DB_INTEGER } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requirePin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  return deleteRecord({ kind: "report", id: Number(id) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const reportId = inputInteger(id, "Report ID", 1, MAX_DB_INTEGER);
    const parsed = parseReportInput(await readInput(req));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const data = parsed.data;
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: reports.id }).from(reports).where(eq(reports.id, reportId)).limit(1).for("update");
      if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });
      await lockEmployee(tx, data.empName);
      const [duplicate] = await tx.select({ id: reports.id }).from(reports).where(and(
        ne(reports.id, reportId), sql`lower(${reports.empName}) = lower(${data.empName})`,
        eq(reports.year, data.year), eq(reports.month, data.month), eq(reports.cycle, data.cycle),
      )).limit(1);
      if (duplicate) return NextResponse.json({
        error: `${data.empName} already has an entry for ${periodLabel(data.year, data.month, data.cycle)}.`,
      }, { status: 409 });
      const empName = await findOrCreateEmployee(data.empName, tx);
      const [report] = await tx.update(reports).set({
        empName, year: data.year, month: data.month, cycle: data.cycle, deliveries: data.deliveries,
        pricePerDelivery: data.pricePerDelivery.toFixed(2), totalValue: data.totalValue, notes: data.notes,
      }).where(eq(reports.id, reportId)).returning();
      return NextResponse.json({ report });
    });
  } catch (error) { return inputFailure(error, "Could not update the delivery report. Please try again."); }
}
