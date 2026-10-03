"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type Report = {
  id: number;
  empName: string;
  year: number;
  month: number;
  cycle: number;
  deliveries: number;
  pricePerDelivery: string;
  expenses: string;
  totalValue: string;
  netValue: string;
  notes: string | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Home() {
  const now = new Date();
  const [empName, setEmpName] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cycle, setCycle] = useState(now.getDate() <= 15 ? 1 : 2);
  const [deliveries, setDeliveries] = useState("");
  const [price, setPrice] = useState("");
  const [expenses, setExpenses] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [rows, setRows] = useState<Report[]>([]);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const total = (Number(deliveries) || 0) * (Number(price) || 0);
  const net = total - (Number(expenses) || 0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?year=${filterYear}`, { cache: "no-store" });
    const data = await res.json();
    setRows(data.reports ?? []);
    setLoading(false);
  }, [filterYear]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setDeliveries("");
    setPrice("");
    setExpenses("");
    setNotes("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      setMsg("Please enter employee name");
      return;
    }
    const payload = {
      empName,
      year,
      month,
      cycle,
      deliveries: Number(deliveries) || 0,
      pricePerDelivery: Number(price) || 0,
      expenses: Number(expenses) || 0,
      notes,
    };
    const res = await fetch(
      editingId ? `/api/reports/${editingId}` : "/api/reports",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (res.ok) {
      setMsg(editingId ? "Report updated ✅" : "Report saved ✅");
      resetForm();
      setFilterYear(year);
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "Failed to save");
    }
    setTimeout(() => setMsg(""), 2500);
  };

  const edit = (r: Report) => {
    setEditingId(r.id);
    setEmpName(r.empName);
    setYear(r.year);
    setMonth(r.month);
    setCycle(r.cycle);
    setDeliveries(String(r.deliveries));
    setPrice(String(Number(r.pricePerDelivery)));
    setExpenses(String(Number(r.expenses)));
    setNotes(r.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this cycle report?")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    await load();
  };

  const summary = useMemo(() => {
    const d = rows.reduce((a, r) => a + r.deliveries, 0);
    const t = rows.reduce((a, r) => a + Number(r.totalValue), 0);
    const e = rows.reduce((a, r) => a + Number(r.expenses), 0);
    return { d, t, e, n: t - e };
  }, [rows]);

  const byMonth = useMemo(() => {
    return MONTHS.map((name, i) => {
      const m = rows.filter((r) => r.month === i + 1);
      return {
        name,
        deliveries: m.reduce((a, r) => a + r.deliveries, 0),
        total: m.reduce((a, r) => a + Number(r.totalValue), 0),
        expenses: m.reduce((a, r) => a + Number(r.expenses), 0),
        net: m.reduce((a, r) => a + Number(r.netValue), 0),
        count: m.length,
      };
    }).filter((m) => m.count > 0);
  }, [rows]);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-600 text-white shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bharathi Enterprises
          </h1>
          <p className="text-sm text-indigo-100">
            Ekart Delivery Monitor · 15-day cycle reports (2 per month)
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Form */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? "Edit Cycle Report" : "New 15-Day Cycle Entry"}
          </h2>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Employee Name">
              <input
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="e.g. Ramesh"
                className={inputCls}
              />
            </Field>
            <Field label="Year">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Month">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Cycle (15 days)">
              <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className={inputCls}>
                <option value={1}>1st Cycle (1 – 15)</option>
                <option value={2}>2nd Cycle (16 – End)</option>
              </select>
            </Field>
            <Field label="No. of Deliveries">
              <input
                type="number" min="0" inputMode="numeric"
                value={deliveries}
                onChange={(e) => setDeliveries(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Per Delivery Price (₹)">
              <input
                type="number" min="0" step="0.01" inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Expenses (₹)">
              <input
                type="number" min="0" step="0.01" inputMode="decimal"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Notes (optional)">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fuel, incentive, etc."
                className={inputCls}
              />
            </Field>

            <div className="flex flex-col justify-end">
              <div className="rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Value</span>
                  <span className="font-semibold text-indigo-700">{inr(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Net (after expenses)</span>
                  <span className="font-semibold text-emerald-700">{inr(net)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow hover:bg-indigo-700"
              >
                {editingId ? "Update Report" : "Save Report"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-lg bg-slate-200 px-4 py-2.5 font-medium text-slate-700">
                  Cancel
                </button>
              )}
              {msg && <span className="text-sm font-medium text-emerald-700">{msg}</span>}
            </div>
          </form>
        </section>

        {/* Year summary */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total Deliveries" value={summary.d.toLocaleString("en-IN")} color="text-slate-900" />
          <Stat label="Total Value" value={inr(summary.t)} color="text-indigo-700" />
          <Stat label="Total Expenses" value={inr(summary.e)} color="text-rose-600" />
          <Stat label="Net Earnings" value={inr(summary.n)} color="text-emerald-700" />
        </section>

        {/* Records */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Cycle Records</h2>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2 text-right">Deliveries</th>
                  <th className="px-3 py-2 text-right">Per Delivery</th>
                  <th className="px-3 py-2 text-right">Total Value</th>
                  <th className="px-3 py-2 text-right">Expenses</th>
                  <th className="px-3 py-2 text-right">Net</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">Loading…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">No records for {filterYear}. Add your first cycle above.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium">{MONTHS[r.month - 1]} {r.year}</div>
                      <div className="text-xs text-slate-500">{r.cycle === 1 ? "1 – 15" : "16 – End"}</div>
                    </td>
                    <td className="px-3 py-2">{r.empName}</td>
                    <td className="px-3 py-2 text-right">{r.deliveries}</td>
                    <td className="px-3 py-2 text-right">{inr(Number(r.pricePerDelivery))}</td>
                    <td className="px-3 py-2 text-right font-semibold text-indigo-700">{inr(Number(r.totalValue))}</td>
                    <td className="px-3 py-2 text-right text-rose-600">{inr(Number(r.expenses))}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">{inr(Number(r.netValue))}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => edit(r)} className="mr-2 text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                      <button onClick={() => remove(r.id)} className="text-xs font-medium text-rose-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Monthly rollup */}
        {byMonth.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-semibold">Monthly Summary · {filterYear}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byMonth.map((m) => (
                <div key={m.name} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-slate-500">{m.count}/2 cycles</span>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    <Row k="Deliveries" v={String(m.deliveries)} />
                    <Row k="Total" v={inr(m.total)} />
                    <Row k="Expenses" v={inr(m.expenses)} />
                    <Row k="Net" v={inr(m.net)} strong />
                  </dl>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{k}</dt>
      <dd className={strong ? "font-semibold text-emerald-700" : "text-slate-800"}>{v}</dd>
    </div>
  );
}
