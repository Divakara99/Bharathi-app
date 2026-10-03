import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    empName: text("emp_name").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    cycle: integer("cycle").notNull(), // 1 = 1st-15th, 2 = 16th-end
    deliveries: integer("deliveries").notNull().default(0),
    pricePerDelivery: numeric("price_per_delivery", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),
    expenses: numeric("expenses", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalValue: numeric("total_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    netValue: numeric("net_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reports_period_idx").on(t.year, t.month, t.cycle)],
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
