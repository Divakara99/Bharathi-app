import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq, and, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const emp = req.nextUrl.searchParams.get("emp");

  const filters = [];
  if (yearParam && !Number.isNaN(Number(yearParam))) {
    filters.push(eq(reports.year, Number(yearParam)));
  }
  if (emp && emp.trim() !== "" && emp !== "all") {
    filters.push(eq(reports.empName, emp.trim()));
  }

  const base = db.select().from(reports);
  const rows = await (filters.length ? base.where(and(...filters)) : base).orderBy(
    desc(reports.year),
    desc(reports.month),
    desc(reports.cycle),
    asc(reports.empName),
    desc(reports.id),
  );

  return NextResponse.json({ reports: rows });
}

/**
 * Save one 15-day cycle for any number of employees.
 * Body: { year, month, cycle, entries: [{ empName, deliveries, pricePerDelivery, notes }] }
 * A single legacy body ({ empName, deliveries, ... }) is still accepted.
 * Saving the same employee + period again updates that row instead of duplicating it.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    const cycle = Number(body.cycle);

    if (!year || month < 1 || month > 12 || (cycle !== 1 && cycle !== 2)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const raw: unknown[] = Array.isArray(body.entries)
      ? body.entries
      : [body];

    const entries = raw
      .map((e) => {
        const o = e as Record<string, unknown>;
        return {
          empName: String(o.empName ?? "").trim().replace(/\s+/g, " "),
          deliveries: Number(o.deliveries ?? 0),
          pricePerDelivery: Number(o.pricePerDelivery ?? 0),
          notes: o.notes ? String(o.notes) : null,
        };
      })
      .filter((e) => e.empName !== "");

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Enter at least one employee name" },
        { status: 400 },
      );
    }
    if (entries.some((e) => e.deliveries < 0 || e.pricePerDelivery < 0)) {
      return NextResponse.json({ error: "Values cannot be negative" }, { status: 400 });
    }

    const seen = new Set<string>();
    for (const e of entries) {
      const key = e.empName.toLowerCase();
      if (seen.has(key)) {
        return NextResponse.json(
          { error: `${e.empName} is entered twice in this cycle` },
          { status: 400 },
        );
      }
      seen.add(key);
    }

    let inserted = 0;
    let updated = 0;
    const saved: unknown[] = [];

    for (const e of entries) {
      const totalValue = e.deliveries * e.pricePerDelivery;
      const [existing] = await db
        .select({ id: reports.id, empName: reports.empName })
        .from(reports)
        .where(
          and(
            sql`lower(${reports.empName}) = lower(${e.empName})`,
            eq(reports.year, year),
            eq(reports.month, month),
            eq(reports.cycle, cycle),
          ),
        )
        .limit(1);

      const values = {
        // keep the spelling already saved for this employee (match is case-insensitive)
        empName: existing ? existing.empName : e.empName,
        year,
        month,
        cycle,
        deliveries: e.deliveries,
        pricePerDelivery: e.pricePerDelivery.toFixed(2),
        totalValue: totalValue.toFixed(2),
        notes: e.notes,
      };

      if (existing) {
        const [row] = await db
          .update(reports)
          .set(values)
          .where(eq(reports.id, existing.id))
          .returning();
        updated += 1;
        saved.push(row);
      } else {
        const [row] = await db.insert(reports).values(values).returning();
        inserted += 1;
        saved.push(row);
      }
    }

    return NextResponse.json(
      { reports: saved, inserted, updated },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
