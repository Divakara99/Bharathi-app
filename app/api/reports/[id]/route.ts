import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await db.delete(reports).where(eq(reports.id, numId));
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();
  const deliveries = Number(body.deliveries ?? 0);
  const pricePerDelivery = Number(body.pricePerDelivery ?? 0);
  const totalValue = deliveries * pricePerDelivery;

  const [row] = await db
    .update(reports)
    .set({
      empName: String(body.empName ?? "").trim(),
      year: Number(body.year),
      month: Number(body.month),
      cycle: Number(body.cycle),
      deliveries,
      pricePerDelivery: pricePerDelivery.toFixed(2),
      totalValue: totalValue.toFixed(2),
      notes: body.notes ? String(body.notes) : null,
    })
    .where(eq(reports.id, numId))
    .returning();

  return NextResponse.json({ report: row });
}
