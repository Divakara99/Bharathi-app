import { sql } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { normalizeName } from "@/lib/employee-name";

export { normalizeName } from "@/lib/employee-name";
export type EmployeeTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockEmployee(tx: EmployeeTransaction, rawName: string): Promise<void> {
  const name = normalizeName(rawName);
  // PostgreSQL transaction lock works across Vercel instances, not only this process.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('bharathi-employee:' || lower(${name}), 0))`);
}
export async function withEmployeeLock<T>(rawName: string, action: (tx: EmployeeTransaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await lockEmployee(tx, rawName);
    return action(tx);
  });
}

/** Case-insensitive saved spelling; caller's transaction keeps name creation and report saving atomic. */
export async function findOrCreateEmployee(rawName: string, transaction?: EmployeeTransaction): Promise<string> {
  const name = normalizeName(rawName);
  if (!transaction) return withEmployeeLock(name, (tx) => findOrCreateEmployee(name, tx));
  const lookup = () => transaction.select().from(employees)
    .where(sql`lower(${employees.name}) = lower(${name})`).limit(1);
  const [existing] = await lookup();
  if (existing) return existing.name;
  const [created] = await transaction.insert(employees).values({ name }).onConflictDoNothing().returning();
  if (created) return created.name;
  const [again] = await lookup();
  if (!again) throw new Error("Employee creation was not confirmed.");
  return again.name;
}
