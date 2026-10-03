# Bharathi Enterprises — Ekart Delivery Monitor

A 15-day cycle delivery reporting app (2 cycles per month × 12 months) for an Ekart vendor.

Track per cycle: **Employee Name, No. of Deliveries, Per Delivery Price, Expenses**.
The app auto-calculates **Total Value = deliveries × price** and **Net = Total − Expenses**,
saves it, and rolls everything up into monthly and yearly summaries.

## Tech
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Drizzle ORM

## Local setup
```bash
npm install
cp .env.example .env        # then put your DATABASE_URL in .env
npx drizzle-kit push        # creates the `reports` table
npm run dev
```

## API
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/reports?year=2026` | List cycle reports |
| POST | `/api/reports` | Create a cycle report |
| PATCH | `/api/reports/:id` | Update a cycle report |
| DELETE | `/api/reports/:id` | Delete a cycle report |
| GET | `/api/health` | Health check |

## Deploy on Vercel
1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project → import the repo**.
3. Add env var `DATABASE_URL` (Neon / Vercel Postgres connection string, ending in `?sslmode=require`).
4. Deploy, then run `DATABASE_URL="<cloud-url>" npx drizzle-kit push` once to create the table.
5. Open the site on your phone → browser menu → **Add to Home screen** to use it like an app.
