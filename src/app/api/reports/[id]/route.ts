import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { requirePin } from "@/lib/pin";
import { deleteRecord } from "@/lib/delete-record";
import { findOrCreateEmployee } from "@/lib/employees";
import { parseReportInput, periodLabel } from "@/lib/report-input";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = requirePin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  return deleteRecord({ kind: "report", id: Number(id) });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const parsed = parseReportInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const d = parsed.data;

    const [dup] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          ne(reports.id, numId),
          sql`lower(${reports.empName}) = ${d.empName.toLowerCase()}`,
          eq(reports.year, d.year),
          eq(reports.month, d.month),
          eq(reports.cycle, d.cycle),
        ),
      )
      .limit(1);
    if (dup) {
      return NextResponse.json(
        {
          error: `${d.empName} already has an entry for ${periodLabel(d.year, d.month, d.cycle)}.`,
        },
        { status: 409 },
      );
    }

    const empName = await findOrCreateEmployee(d.empName);
    const totalValue = d.deliveries * d.pricePerDelivery;

    const [row] = await db
      .update(reports)
      .set({
        empName,
        year: d.year,
        month: d.month,
        cycle: d.cycle,
        deliveries: d.deliveries,
        pricePerDelivery: d.pricePerDelivery.toFixed(2),
        totalValue: totalValue.toFixed(2),
        notes: d.notes,
      })
      .where(eq(reports.id, numId))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ report: row });
  } catch {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
