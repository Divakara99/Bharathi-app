import { sql } from "drizzle-orm";
import {
  pgTable, serial, text, integer, numeric, timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Delivery reports remain one entry per employee per half-month.
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  empName: text("emp_name").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  cycle: integer("cycle").notNull(),
  deliveries: integer("deliveries").notNull().default(0),
  pricePerDelivery: numeric("price_per_delivery", { precision: 10, scale: 2 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("reports_period_idx").on(t.year, t.month, t.cycle)]);

// One expense row per employee per month. NULL preserves older business-wide expenses.
export const monthlyExpenses = pgTable("monthly_expenses", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "restrict" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("monthly_expenses_employee_period_uq").on(t.employeeId, t.year, t.month),
  uniqueIndex("monthly_expenses_general_period_uq").on(t.year, t.month).where(sql`${t.employeeId} is null`),
]);

export type Employee = typeof employees.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type MonthlyExpense = typeof monthlyExpenses.$inferSelect;
