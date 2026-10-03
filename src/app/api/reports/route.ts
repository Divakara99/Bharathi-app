import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { findOrCreateEmployee } from "@/lib/employees";
import { parseReportInput, periodLabel } from "@/lib/report-input";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const emp = req.nextUrl.searchParams.get("emp");

  const filters = [];
  if (yearParam && !Number.isNaN(Number(yearParam))) {
    filters.push(eq(reports.year, Number(yearParam)));
  }
  if (emp && emp.trim() !== "") {
    filters.push(sql`lower(${reports.empName}) = ${emp.trim().toLowerCase()}`);
  }

  const base = db.select().from(reports);
  const rows = await (filters.length
    ? base.where(and(...filters))
    : base
  ).orderBy(desc(reports.year), desc(reports.month), desc(reports.cycle), desc(reports.id));

  return NextResponse.json({ reports: rows });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = parseReportInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const d = parsed.data;

    // One entry per employee per 15-day period
    const [dup] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
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
          error: `${d.empName} already has an entry for ${periodLabel(d.year, d.month, d.cycle)}. Edit it instead.`,
        },
        { status: 409 },
      );
    }

    const empName = await findOrCreateEmployee(d.empName);
    const totalValue = d.deliveries * d.pricePerDelivery;

    const [row] = await db
      .insert(reports)
      .values({
        empName,
        year: d.year,
        month: d.month,
        cycle: d.cycle,
        deliveries: d.deliveries,
        pricePerDelivery: d.pricePerDelivery.toFixed(2),
        totalValue: totalValue.toFixed(2),
        notes: d.notes,
      })
      .returning();

    return NextResponse.json({ report: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
