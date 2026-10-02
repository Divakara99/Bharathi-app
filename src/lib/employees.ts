import { sql } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";

export const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ");

/**
 * Returns the saved spelling of an employee, creating the employee if new.
 * Matching is case-insensitive so "ramesh" and "Ramesh" are the same person.
 */
export async function findOrCreateEmployee(rawName: string): Promise<string> {
  const name = normalizeName(rawName);
  const lookup = () =>
    db
      .select()
      .from(employees)
      .where(sql`lower(${employees.name}) = ${name.toLowerCase()}`)
      .limit(1);

  const [existing] = await lookup();
  if (existing) return existing.name;

  const [created] = await db
    .insert(employees)
    .values({ name })
    .onConflictDoNothing()
    .returning();
  if (created) return created.name;

  const [again] = await lookup();
  return again?.name ?? name;
}
