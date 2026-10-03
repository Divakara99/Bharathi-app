import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const emp = req.nextUrl.searchParams.get("emp");

  const filters = [];
  if (yearParam && !Number.isNaN(Number(yearParam))) {
    filters.push(eq(reports.year, Number(yearParam)));
  }
  if (emp && emp.trim() !== "") {
    filters.push(eq(reports.empName, emp.trim()));
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
    const body = await req.json();
    const empName = String(body.empName ?? "").trim();
    const year = Number(body.year);
    const month = Number(body.month);
    const cycle = Number(body.cycle);
    const deliveries = Number(body.deliveries ?? 0);
    const pricePerDelivery = Number(body.pricePerDelivery ?? 0);
    const expenses = Number(body.expenses ?? 0);
    const notes = body.notes ? String(body.notes) : null;

    if (!empName) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }
    if (!year || month < 1 || month > 12 || (cycle !== 1 && cycle !== 2)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    if (deliveries < 0 || pricePerDelivery < 0 || expenses < 0) {
      return NextResponse.json({ error: "Values cannot be negative" }, { status: 400 });
    }

    const totalValue = deliveries * pricePerDelivery;
    const netValue = totalValue - expenses;

    const [row] = await db
      .insert(reports)
      .values({
        empName,
        year,
        month,
        cycle,
        deliveries,
        pricePerDelivery: pricePerDelivery.toFixed(2),
        expenses: expenses.toFixed(2),
        totalValue: totalValue.toFixed(2),
        netValue: netValue.toFixed(2),
        notes,
      })
      .returning();

    return NextResponse.json({ report: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
