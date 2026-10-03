# Bharathi Enterprises — Project Check

Review scope: the current project in this workspace. These results do not claim that another Vercel deployment has already received the changes.

## Issues fixed
- Updated Next.js and its ESLint configuration to 16.3.8, Drizzle Kit to 0.31.11 and PostCSS to 8.5.28. Refreshed compatible lockfile dependencies without forced downgrades.
- Fixed React lint errors in report numbering, expense-form state and installation state subscriptions. Initial loading has cancellable asynchronous callbacks.
- Strengthened delivery/expense/employee API validation: malformed JSON and non-object inputs, invalid field types, invalid years/months/IDs, fractional deliveries, out-of-range numbers and currency amounts with more than two decimals return clear 400 responses.
- Calculate delivery value in paise from the same two-decimal price that is saved. Database numeric/integer limits are enforced before saving.
- Case-insensitive employee creation and delivery writes use PostgreSQL transaction-level advisory locks. Ten simultaneous attempts to save one employee/period produce exactly one report; duplicate attempts return 409.
- Missing-report edits return 404 without creating an unwanted employee.
- Employee deletion checks reports and expenses within the same transaction/lock as the deletion; it remains PIN protected and refuses employees with saved data.
- Prevent prior-year records appearing under a newly selected year while the next response is loading. Form controls cannot change midway through a save.
- Successful saves followed by a failed refresh are labelled as saved, rather than failed. Retry reloads employees and records. Sharing remains disabled until data refresh succeeds.
- Summary-only CSV now uses the same formula-safe text escaping as full CSV. Numeric amounts, negative balances, Tamil text and quotes are preserved.

## Checks passed
- `npm run lint`: no errors or warnings.
- `npx next typegen`, `npm exec tsc -- --noEmit --pretty false` and `npm run build`.
- Application startup and PostgreSQL `/api/health` check.
- Unit tests: currency precision, monthly/employee/business balances, general expenses, month-range inclusion, actual month-end dates and name-based filenames.
- API tests: invalid inputs, malformed requests, concurrent saves, case-insensitive names, create/update, missing records, monthly expense upserts, PIN rejection and safe single-record deletion.
- Read-only CSV/XLSX comparisons against saved data; all detail rows, notes, prices and totals match. Excel files open as real 9-sheet workbooks.
- Browser checks: mobile entry/expense edits, save-to-Summary, employee filters, From/To months, WhatsApp handoff, Copy report, negative/empty reports, CSV and Excel downloads, and 320/390/720/1024px layouts.
- Failure simulation: delayed year loading, failed refresh after a successful save, safe CSV employee names. Simulation uses browser-intercepted responses only.
- PWA checks: manifest, exact-size icons, service worker, Chrome installability, install-button events and offline notice. No installation explanations were reintroduced. This is a browser installability check, not proof that a native Android device installation was performed.

## Data preservation
Only exact IDs belonging to uniquely labelled test records were removed. An independent snapshot before/after the complete review checks employees, reports and expenses. No existing business data is edited, merged or deleted. No schema change is required for this review update.

## Remaining security limitations
- **There is no user login.** Anyone who can reach the app can currently view, export, create or edit records. The 9676 deletion PIN is an accidental-deletion safeguard, not account authentication or strong access control. Add authentication or suitable deployment access protection before using a publicly accessible URL for private employee/business data.
- After patch updates, `npm audit --omit=dev` reports **zero high/critical findings** and **two moderate findings**, in the ExcelJS/uuid dependency chain. The flagged UUID advisory concerns v3/v5/v6 custom buffers; this app exports workbooks and does not expose spreadsheet uploads. The warnings are still unresolved, not a clean security audit.
- The full audit additionally reports upstream development-tool warnings from ESLint's glob/braces dependencies and Drizzle Kit's loader/esbuild chain. Current npm suggestions require old major-version downgrades; `npm audit fix --force` was deliberately not used because it can break this project. Recheck upstream patches periodically.
- Long WhatsApp reports may require Copy report or a smaller month range. WhatsApp still requires the recipient selection and final Send action inside WhatsApp.
- Internet is required for saved data, downloads and mutations. The service worker only caches icons and an offline notice, never employee data, PINs or financial API responses.

## Deploy this reviewed version
Push/upload the current code and redeploy the same Vercel project used on your phone. Do not clear/recreate the database. Updating the Arena preview or another option does not automatically update an existing Vercel deployment.
