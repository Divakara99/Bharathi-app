"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";

type Report = {
  id: number;
  empName: string;
  year: number;
  month: number;
  cycle: number;
  deliveries: number;
  pricePerDelivery: string;
  totalValue: string;
  notes: string | null;
};

type Expense = {
  id: number;
  year: number;
  month: number;
  amount: string;
  notes: string | null;
};

type Tab = "entry" | "expenses" | "records" | "summary";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "entry", label: "Entry", icon: "📝" },
  { id: "expenses", label: "Expenses", icon: "💰" },
  { id: "records", label: "Records", icon: "📋" },
  { id: "summary", label: "Summary", icon: "📊" },
];

const EMP_KEY = "bharathi_last_emp";
const TAB_KEY = "bharathi_active_tab";

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Home() {
  const now = new Date();

  const [tab, setTab] = useState<Tab>("entry");

  const setActiveTab = useCallback((nextTab: Tab) => {
    setTab(nextTab);
    try {
      localStorage.setItem(TAB_KEY, nextTab);
    } catch {}
  }, []);

  // ---- 15-day cycle form ----
  const [empName, setEmpName] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cycle, setCycle] = useState(now.getDate() <= 15 ? 1 : 2);
  const [deliveries, setDeliveries] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // ---- monthly expense form ----
  const [expYear, setExpYear] = useState(now.getFullYear());
  const [expMonth, setExpMonth] = useState(now.getMonth() + 1);
  const [expAmount, setExpAmount] = useState("");
  const [expNotes, setExpNotes] = useState("");

  // ---- data ----
  const [rows, setRows] = useState<Report[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);

  // ---- toast ----
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (text: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const total = (Number(deliveries) || 0) * (Number(price) || 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const readJson = async (url: string) => {
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error ?? `Request failed (${response.status})`);
        }
        return data;
      };
      const [r, e] = await Promise.all([
        readJson(`/api/reports?year=${filterYear}`),
        readJson(`/api/expenses?year=${filterYear}`),
      ]);
      setRows(Array.isArray(r.reports) ? r.reports : []);
      setExpenses(Array.isArray(e.expenses) ? e.expenses : []);
    } catch (error) {
      console.error("[v0] Failed to load delivery data:", error);
      showToast("Could not load data. Please refresh and try again.", false);
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem(TAB_KEY);
      if (savedTab && TABS.some((item) => item.id === savedTab)) {
        setActiveTab(savedTab as Tab);
      }
    } catch {}
  }, []);

  // remember last employee name to save typing
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMP_KEY);
      if (saved) setEmpName(saved);
    } catch {}
  }, []);

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const resetForm = () => {
    setEditingId(null);
    setDeliveries("");
    setPrice("");
    setNotes("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      showToast("Please enter employee name", false);
      return;
    }
    const payload = {
      empName,
      year,
      month,
      cycle,
      deliveries: Number(deliveries) || 0,
      pricePerDelivery: Number(price) || 0,
      notes,
    };
    try {
      const res = await fetch(
        editingId ? `/api/reports/${editingId}` : "/api/reports",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        try {
          localStorage.setItem(EMP_KEY, empName.trim());
        } catch {}
        showToast(editingId ? "Report updated ✅" : "Report saved ✅");
        resetForm();
        setFilterYear(year);
        await load();
        setActiveTab("records");
        goTop();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? "Failed to save", false);
      }
    } catch {
      showToast("Network error. Try again.", false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: expYear,
          month: expMonth,
          amount: Number(expAmount) || 0,
          notes: expNotes,
        }),
      });
      if (res.ok) {
        showToast(`${MONTHS[expMonth - 1]} ${expYear} expenses saved ✅`);
        setExpAmount("");
        setExpNotes("");
        setFilterYear(expYear);
        await load();
        setActiveTab("summary");
        goTop();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? "Failed to save", false);
      }
    } catch {
      showToast("Network error. Try again.", false);
    }
  };

  const editExpense = (m: number, ex?: Expense) => {
    setExpYear(filterYear);
    setExpMonth(m);
    setExpAmount(ex ? String(Number(ex.amount)) : "");
    setExpNotes(ex?.notes ?? "");
    setActiveTab("expenses");
    goTop();
  };

  const removeExpense = async (m: number) => {
    if (!confirm(`Delete ${MONTHS[m - 1]} ${filterYear} expenses?`)) return;
    await fetch(`/api/expenses?year=${filterYear}&month=${m}`, { method: "DELETE" });
    showToast("Expenses deleted");
    await load();
  };

  const edit = (r: Report) => {
    setEditingId(r.id);
    setEmpName(r.empName);
    setYear(r.year);
    setMonth(r.month);
    setCycle(r.cycle);
    setDeliveries(String(r.deliveries));
    setPrice(String(Number(r.pricePerDelivery)));
    setNotes(r.notes ?? "");
    setActiveTab("entry");
    goTop();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this cycle report?")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    showToast("Report deleted");
    await load();
  };

  const summary = useMemo(() => {
    const d = rows.reduce((a, r) => a + r.deliveries, 0);
    const t = rows.reduce((a, r) => a + Number(r.totalValue), 0);
    const e = expenses.reduce((a, x) => a + Number(x.amount), 0);
    return { d, t, e, n: t - e };
  }, [rows, expenses]);

  const byMonth = useMemo(() => {
    return MONTHS.map((name, i) => {
      const m = i + 1;
      const cyc = rows.filter((r) => r.month === m);
      const ex = expenses.find((x) => x.month === m);
      const totalVal = cyc.reduce((a, r) => a + Number(r.totalValue), 0);
      const expAmt = ex ? Number(ex.amount) : 0;
      return {
        m,
        name,
        deliveries: cyc.reduce((a, r) => a + r.deliveries, 0),
        total: totalVal,
        expense: ex,
        expenses: expAmt,
        net: totalVal - expAmt,
        count: cyc.length,
      };
    }).filter((m) => m.count > 0 || m.expense);
  }, [rows, expenses]);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  // On phones only the active tab shows; on md+ everything is visible.
  const vis = (...t: Tab[]) => (t.includes(tab) ? "" : "hidden md:block");
  const statsVis = tab === "records" || tab === "summary" ? "grid" : "hidden md:grid";

  return (
    <main className="min-h-screen bg-slate-100 pb-28 md:pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-indigo-700 to-violet-600 text-white shadow-lg pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight md:text-3xl">
              Bharathi Enterprises
            </h1>
            <p className="truncate text-xs text-indigo-100 md:text-sm">
              <span className="md:hidden">Ekart Delivery Monitor</span>
              <span className="hidden md:inline">
                Ekart Delivery Monitor · 15-day cycle reports (2 per month) · monthly expenses
              </span>
            </p>
          </div>
          <label className="shrink-0">
            <span className="sr-only">Year</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="h-10 rounded-lg border border-white/30 bg-white/15 px-2 text-base font-semibold text-white outline-none md:text-sm [&>option]:text-slate-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 md:space-y-6 md:px-4 md:py-6">
        {/* 15-day cycle form */}
        <section className={`${vis("entry")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
          <h2 className="mb-1 text-lg font-semibold">
            {editingId ? "Edit Cycle Report" : "New 15-Day Cycle Entry"}
          </h2>
          <p className="mb-4 text-xs text-slate-500 md:hidden">
            Enter deliveries & price. Total is calculated for you.
          </p>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="col-span-2 md:col-span-1">
              <Field label="Employee Name">
                <input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  autoComplete="off"
                  enterKeyHint="next"
                  className={inputCls}
                />
              </Field>
            </div>
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
            <div className="col-span-2 md:col-span-1">
              <Field label="Cycle (15 days)">
                <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className={inputCls}>
                  <option value={1}>1st Cycle (1 – 15)</option>
                  <option value={2}>2nd Cycle (16 – End)</option>
                </select>
              </Field>
            </div>
            <Field label="No. of Deliveries">
              <input
                type="number" min="0" inputMode="numeric" enterKeyHint="next"
                value={deliveries}
                onChange={(e) => setDeliveries(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Price / Delivery (₹)">
              <input
                type="number" min="0" step="0.01" inputMode="decimal" enterKeyHint="done"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <div className="col-span-2 md:col-span-1">
              <Field label="Notes (optional)">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Incentive, remarks, etc."
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="col-span-2 flex items-center rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-sm text-slate-600">
                  Total Value
                  <span className="block text-xs text-slate-400">
                    {Number(deliveries) || 0} × {inr(Number(price) || 0)}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap pl-1 text-xl font-bold leading-none text-indigo-700 sm:text-2xl">{inr(total)}</span>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-2 md:col-span-3 md:flex-row md:items-center md:gap-3">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white shadow active:bg-indigo-800 md:h-11 md:w-auto md:hover:bg-indigo-700"
              >
                {editingId ? "Update Report" : "Save Report"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-12 w-full rounded-xl bg-slate-200 px-5 text-base font-medium text-slate-700 md:h-11 md:w-auto"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Monthly expense form */}
        <section id="expense-form" className={`${vis("expenses")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-200 md:p-5`}>
          <h2 className="text-lg font-semibold">
            Monthly Expenses{" "}
            <span className="block text-sm font-normal text-slate-500 md:inline">(enter once per month)</span>
          </h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Saving again for the same month updates the existing entry.
          </p>
          <form onSubmit={submitExpense} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Field label="Year">
              <select value={expYear} onChange={(e) => setExpYear(Number(e.target.value))} className={inputCls}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Month">
              <select value={expMonth} onChange={(e) => setExpMonth(Number(e.target.value))} className={inputCls}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-2 md:col-span-1">
              <Field label="Month Expenses (₹)">
                <input
                  type="number" min="0" step="0.01" inputMode="decimal"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-1">
              <Field label="Notes (optional)">
                <input
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Fuel, rent, salary, etc."
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-4">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-amber-500 px-6 text-base font-semibold text-white shadow active:bg-amber-700 md:h-11 md:w-auto md:hover:bg-amber-600"
              >
                Save Monthly Expenses
              </button>
            </div>
          </form>
        </section>

        {/* Year summary */}
        <section className={`${statsVis} grid-cols-2 gap-3 lg:grid-cols-4`}>
          <Stat label="Total Deliveries" value={summary.d.toLocaleString("en-IN")} color="text-slate-900" />
          <Stat label="Total Value" value={inr(summary.t)} color="text-indigo-700" />
          <Stat label="Total Expenses" value={inr(summary.e)} color="text-rose-600" />
          <Stat label="Net Earnings" value={inr(summary.n)} color="text-emerald-700" />
        </section>

        {/* Records */}
        <section className={`${vis("records")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
          <h2 className="mb-3 text-lg font-semibold">Cycle Records · {filterYear}</h2>

          {loading && <p className="py-8 text-center text-slate-400">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No records for {filterYear}. Add your first cycle in the Entry tab.
            </p>
          )}

          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{MONTHS[r.month - 1]} {r.year}</div>
                    <div className="text-xs text-slate-500">
                      {r.cycle === 1 ? "1 – 15" : "16 – End"} · {r.empName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-lg font-bold text-indigo-700">
                    {inr(Number(r.totalValue))}
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {r.deliveries} deliveries × {inr(Number(r.pricePerDelivery))}
                </div>
                {r.notes && <div className="mt-1 text-xs text-slate-500">Note: {r.notes}</div>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => edit(r)}
                    className="h-11 rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700 active:bg-indigo-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="h-11 rounded-lg bg-rose-50 text-sm font-semibold text-rose-600 active:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          {rows.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2 text-right">Deliveries</th>
                    <th className="px-3 py-2 text-right">Per Delivery</th>
                    <th className="px-3 py-2 text-right">Total Value</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <button onClick={() => edit(r)} className="mr-3 text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                        <button onClick={() => remove(r.id)} className="text-xs font-medium text-rose-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Monthly rollup */}
        <section className={`${vis("summary")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
          <h2 className="mb-3 text-lg font-semibold">Monthly Summary · {filterYear}</h2>
          {byMonth.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nothing to summarise for {filterYear} yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byMonth.map((m) => (
                <div key={m.name} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {m.count}/2 cycles
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <Row k="Deliveries" v={String(m.deliveries)} />
                    <Row k="Total Value" v={inr(m.total)} />
                    <Row
                      k="Month Expenses"
                      v={m.expense ? inr(m.expenses) : "Not entered"}
                      warn={!m.expense}
                    />
                    <Row k="Net" v={inr(m.net)} strong />
                  </dl>
                  {m.expense?.notes && (
                    <p className="mt-2 text-xs text-slate-500">Note: {m.expense.notes}</p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                    <button
                      onClick={() => editExpense(m.m, m.expense)}
                      className="h-11 rounded-lg bg-amber-50 text-amber-700 active:bg-amber-100"
                    >
                      {m.expense ? "Edit expenses" : "Add expenses"}
                    </button>
                    {m.expense ? (
                      <button
                        onClick={() => removeExpense(m.m)}
                        className="h-11 rounded-lg bg-rose-50 text-rose-600 active:bg-rose-100"
                      >
                        Delete
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6">
          <div
            role="status"
            className={`rounded-full px-5 py-3 text-sm font-medium text-white shadow-lg ${
              toast.ok ? "bg-slate-900" : "bg-rose-600"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Bottom tab bar (phones only) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  goTop();
                }}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-indigo-700" : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full text-base ${
                    active ? "bg-indigo-100" : ""
                  }`}
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 md:h-10 md:rounded-lg md:text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 md:p-4">
      <div className="truncate text-[11px] uppercase tracking-wide text-slate-500 md:text-xs">{label}</div>
      <div className={`mt-1 truncate text-base font-bold md:text-lg ${color}`}>{value}</div>
    </div>
  );
}

function Row({ k, v, strong, warn }: { k: string; v: string; strong?: boolean; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd
        className={
          strong
            ? "font-semibold text-emerald-700"
            : warn
              ? "text-amber-600"
              : "text-slate-800"
        }
      >
        {v}
      </dd>
    </div>
  );
}
