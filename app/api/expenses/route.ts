import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyExpenses } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const base = db.select().from(monthlyExpenses);
  const rows = await (yearParam && !Number.isNaN(Number(yearParam))
    ? base.where(eq(monthlyExpenses.year, Number(yearParam)))
    : base
  ).orderBy(asc(monthlyExpenses.year), asc(monthlyExpenses.month));
  return NextResponse.json({ expenses: rows });
}

// Create or update the single expense entry for a month
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    const amount = Number(body.amount ?? 0);
    const notes = body.notes ? String(body.notes) : null;

    if (!year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    if (Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Invalid expense amount" }, { status: 400 });
    }

    const existing = await db
      .select({ id: monthlyExpenses.id })
      .from(monthlyExpenses)
      .where(and(eq(monthlyExpenses.year, year), eq(monthlyExpenses.month, month)))
      .limit(1);

    const [row] = existing.length
      ? await db
          .update(monthlyExpenses)
          .set({ amount: amount.toFixed(2), notes, updatedAt: new Date() })
          .where(eq(monthlyExpenses.id, existing[0].id))
          .returning()
      : await db
          .insert(monthlyExpenses)
          .values({ year, month, amount: amount.toFixed(2), notes })
          .returning();

    return NextResponse.json({ expense: row }, { status: existing.length ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  if (!year || !month) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }
  await db
    .delete(monthlyExpenses)
    .where(and(eq(monthlyExpenses.year, year), eq(monthlyExpenses.month, month)));
  return NextResponse.json({ ok: true });
}
