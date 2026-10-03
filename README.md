# Bharathi Enterprises — Ekart Delivery Monitor

Mobile-friendly delivery monitoring for multiple employees.

## What it tracks
- **Delivery reports:** one report per employee per half-month (1–15 and 16–end), with deliveries, per-delivery price, total value and notes.
- **Employee monthly expenses:** one expense entry per employee per month. Saving the same employee/month updates that entry, not another employee's entry.
- **Employee totals:** deliveries, total value, expenses and net earnings, for all 12 months and the selected year.
- **Business totals:** all employees combined, plus any general business expenses.
- **Records:** employee/month filters, editing, and PIN-protected deletion.
- **Staff:** each employee has Delivery entry, Expenses, Records, Totals and Delete options.
- **Full CSV and Excel (.xlsx) exports:** download all saved years and employees, or choose one employee/year. Includes employee IDs/names, every delivery report and per-delivery price, monthly expenses, notes, record dates, employee monthly/yearly totals and business grand totals. Excel has 9 separate worksheets; full CSV has a Record Type column identifying every section.
- **Summary-only CSV:** the existing compact monthly financial summary is still available.
- **Readable final report & WhatsApp:** in Summary, view every delivery entry (deliveries × price = total), monthly employee expenses, and final Total value / Total expenses value / Remaining value. Choose any From month → To month range in the selected year, including a single month or full year. The selected employee filter applies to the report, or select everyone for a combined business report.
- **One-tap WhatsApp preparation:** Send on WhatsApp opens the WhatsApp contact picker with a neatly formatted message. Choose a contact and press Send inside WhatsApp; messages are not sent automatically. Copy report is available as a clipboard backup, particularly for long reports. No WhatsApp API key is needed.

`Total Value = deliveries × per-delivery price`.
`Net Earnings = Total Value − Expenses`.
Monthly expenses are not deducted separately from each 15-day delivery report.

## Existing data
The upgrade adds a nullable employee link to `monthly_expenses`. Older business-wide expenses remain intact as **General business expenses**. They are included once in business totals and are not assigned to employees automatically.

## Technology
Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL and Drizzle ORM.

## Local setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run `npx drizzle-kit push` to apply the database schema.
4. Run `npm run dev`.

Drizzle's config reads `DATABASE_URL`, including when running schema commands against a hosted database.

## API
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/reports?year=2026&emp=NAME` | Delivery reports, optionally filtered by employee |
| POST | `/api/reports` | Create a delivery report |
| PATCH | `/api/reports/:id` | Edit a delivery report |
| GET | `/api/employees` | Employee list |
| POST | `/api/employees` | Add an employee with `name` |
| GET | `/api/expenses?year=2026&employeeId=1` | Employee monthly expenses; omit employeeId to list everyone |
| GET | `/api/expenses?year=2026&employeeId=general` | General business expenses |
| POST | `/api/expenses` | Create/update using `employeeId`, `year`, `month`, `amount`, `notes`; explicit `employeeId: null` means general |
| POST | `/api/delete` | Delete one record: `kind` (report, expense or employee), `id`, and `pin` |
| DELETE | `/api/expenses?id=1` | Legacy expense delete API, requiring `x-delete-pin` |
| GET | `/api/health` | Database health check |
| GET | `/api/export?format=xlsx&year=all&employeeId=all` | Full Excel export; use `format=csv` for CSV, a numeric year/employeeId to filter |

### Download all details
In **Summary**, choose the year above, then select **From month → To month**. Both months are included. The same month range controls Summary totals, the WhatsApp report/Copy message, summary CSV and full CSV/Excel downloads. Choose the same month twice for a single-month report, or tap **Full year** to restore January–December. Range controls stay within the selected calendar year; if an endpoint crosses the other, the other endpoint adjusts to prevent a reversed range.

**Download all details** defaults to the selected year and the complete employee roster plus general expenses. The employee download selector is independent of the Summary employee filter. **All saved years** is still available and applies the selected month range separately to each saved year; that behavior is stated beside the download buttons. Filenames include the selected months for partial-year downloads and actual employee names. Excel Export Info and WhatsApp messages show the chosen period, and yearly/grand totals include only that range. Non-ASCII names are preserved; exceptionally long filenames are shortened while the full name list remains inside the file.

Choose **Download full CSV** or **Download full Excel (.xlsx)**. Excel opens directly on **Delivery Reports**, with employee names in column A, left-aligned values and the name/header columns frozen. All 9 sheets remain available: Delivery Reports, Monthly Expenses, Employee Monthly, Employee Yearly, Monthly Totals, Yearly Totals, Grand Totals, Employees and Export Info. CSV includes those sections in a single table identified by Record Type. Downloads are read-only and do not change saved data. No PIN or secret is exported.

Delivery and expense saves (including edits) open the saved employee's Summary. Second-cycle labels use the actual month-end date: 16–28, 16–29, 16–30 or 16–31, consistently in the form, records, CSV, Excel and API messages.

Every delete is PIN checked on the server. Employee deletion is blocked while delivery reports or expense entries remain, including entries in earlier years. Deleting an expense by its ID only deletes that one employee's expense.

## Delete PIN
The default PIN is **9676**. Set the server-side `DELETE_PIN` environment variable to override it, then redeploy.
The input opens blank, masks typed digits by default, and offers Show/Hide. The PIN is not saved in the browser or placed in URLs.

## Vercel deployment / upgrades
1. Push the project to GitHub and import it on Vercel.
2. Create a hosted PostgreSQL database (for example Neon).
3. Add `DATABASE_URL` to Vercel's server-side Environment Variables. Use the provider's SSL connection string.
4. For a new deployment **or this employee-expenses upgrade**, apply the schema once with `npx drizzle-kit push` using the same cloud `DATABASE_URL` in your terminal environment. Review the plan; this update adds an employee column and changes expense uniqueness indexes, without deleting rows.
5. Deploy/redeploy the updated app.
6. Android Chrome: Add to Home screen. iPhone Safari: Share → Add to Home Screen.

## Validation
- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`
- Pure calculation tests: `npm exec --yes --package=tsx -- tsx scripts/test-totals.ts`.
- API integration tests: `node scripts/test-employee-expenses.mjs` against a running test preview. Only uniquely named fixtures are deleted; existing saved data is compared before and after.
