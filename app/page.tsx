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

type Line = {
  key: number;
  empName: string;
  deliveries: string;
  price: string;
  notes: string;
};

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

const EMP_KEY = "bharathi_known_emps";

// Deleting any record needs this PIN (guard against taps, not real security)
const DELETE_PIN = "9676";

type PendingDelete =
  | { kind: "report"; id: number; label: string; sub: string }
  | { kind: "expense"; month: number; label: string; sub: string };

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let lineSeq = 0;
const newLine = (p: Partial<Line> = {}): Line => ({
  key: ++lineSeq,
  empName: "",
  deliveries: "",
  price: "",
  notes: "",
  ...p,
});

function readSavedEmps(): string[] {
  try {
    const raw = localStorage.getItem(EMP_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function cycleLabel(cycle: number, year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  return cycle === 1 ? "1 – 15" : `16 – ${last}`;
}

export default function Home() {
  const now = new Date();

  const [tab, setTab] = useState<Tab>("entry");

  // ---- shared period ----
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cycle, setCycle] = useState(now.getDate() <= 15 ? 1 : 2);

  // ---- one line per employee ----
  const [lines, setLines] = useState<Line[]>([newLine()]);
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
  const [empFilter, setEmpFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savedEmps, setSavedEmps] = useState<string[]>([]);

  // ---- toast ----
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (text: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const lineTotal = (l: Line) => (Number(l.deliveries) || 0) * (Number(l.price) || 0);
  const grandTotal = useMemo(() => lines.reduce((a, l) => a + lineTotal(l), 0), [lines]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        fetch(`/api/reports?year=${filterYear}`, { cache: "no-store" }).then((x) => x.json()),
        fetch(`/api/expenses?year=${filterYear}`, { cache: "no-store" }).then((x) => x.json()),
      ]);
      setRows(r.reports ?? []);
      setExpenses(e.expenses ?? []);
    } catch {
      showToast("Could not load data. Check your internet.", false);
    }
    setLoading(false);
  }, [filterYear]);

  useEffect(() => {
    load();
  }, [load]);

  // known employee names (localStorage + whatever is in the DB)
  useEffect(() => {
    setSavedEmps(readSavedEmps());
  }, []);

  const allEmps = useMemo(() => {
    const set = new Set<string>(savedEmps);
    rows.forEach((r) => set.add(r.empName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [savedEmps, rows]);

  const patchLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addLine = () => {
    const last = lines[lines.length - 1];
    setLines((prev) => [
      ...prev,
      newLine({ price: last?.price ?? "" }), // same rate is the common case
    ]);
  };

  const removeLine = (key: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const resetForm = () => {
    setEditingId(null);
    setLines([newLine({ price: lines[0]?.price ?? "" })]);
  };

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.empName.trim() !== "");
    if (valid.length === 0) {
      showToast("Enter at least one employee name", false);
      return;
    }

    try {
      if (editingId) {
        const l = valid[0];
        const res = await fetch(`/api/reports/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empName: l.empName,
            year,
            month,
            cycle,
            deliveries: Number(l.deliveries) || 0,
            pricePerDelivery: Number(l.price) || 0,
            notes: l.notes,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          showToast(d.error ?? "Failed to update", false);
          return;
        }
        showToast("Report updated ✅");
      } else {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            cycle,
            entries: valid.map((l) => ({
              empName: l.empName,
              deliveries: Number(l.deliveries) || 0,
              pricePerDelivery: Number(l.price) || 0,
              notes: l.notes,
            })),
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          showToast(d.error ?? "Failed to save", false);
          return;
        }
        const d = await res.json();
        const parts: string[] = [];
        if (d.inserted) parts.push(`${d.inserted} new`);
        if (d.updated) parts.push(`${d.updated} updated`);
        showToast(`Saved ${valid.length} employee${valid.length > 1 ? "s" : ""} ✅ (${parts.join(", ") || "no change"})`);
      }

      // remember names for the next time
      try {
        const set = new Set([...readSavedEmps(), ...valid.map((l) => l.empName.trim())]);
        const list = Array.from(set).sort((a, b) => a.localeCompare(b));
        localStorage.setItem(EMP_KEY, JSON.stringify(list));
        setSavedEmps(list);
      } catch {}

      setEditingId(null);
      setLines([newLine({ price: lines[0]?.price ?? "" })]);
      setFilterYear(year);
      await load();
      setTab("records");
      goTop();
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
        setTab("summary");
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
    setTab("expenses");
    goTop();
  };

  // ---- delete PIN lock ----
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const pinRef = useRef<HTMLInputElement | null>(null);

  const openDelete = (p: PendingDelete) => {
    setPending(p);
    setPin("");
    setPinError("");
    setTimeout(() => pinRef.current?.focus(), 60);
  };

  const closeDelete = () => {
    setPending(null);
    setPin("");
    setPinError("");
  };

  const confirmDelete = async () => {
    if (!pending || deleting) return;
    const cleaned = pin.replace(/\D/g, "");
    if (cleaned !== DELETE_PIN) {
      setPinError("Wrong PIN! Default PIN is 9676");
      return;
    }
    setDeleting(true);
    try {
      if (pending.kind === "report") {
        const res = await fetch(`/api/reports/${pending.id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setPinError(d.error || "Failed to delete record");
          setDeleting(false);
          return;
        }
        showToast("Report deleted ✅");
      } else {
        const res = await fetch(
          `/api/expenses?year=${filterYear}&month=${pending.month}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setPinError(d.error || "Failed to delete expenses");
          setDeleting(false);
          return;
        }
        showToast("Expenses deleted ✅");
      }
      await load();
      closeDelete();
    } catch {
      setPinError("Delete failed. Check internet and retry.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!pending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pending]);

  const edit = (r: Report) => {
    setEditingId(r.id);
    setYear(r.year);
    setMonth(r.month);
    setCycle(r.cycle);
    setLines([
      newLine({
        empName: r.empName,
        deliveries: String(r.deliveries),
        price: String(Number(r.pricePerDelivery)),
        notes: r.notes ?? "",
      }),
    ]);
    setTab("entry");
    goTop();
  };

  const summary = useMemo(() => {
    const d = rows.reduce((a, r) => a + r.deliveries, 0);
    const t = rows.reduce((a, r) => a + Number(r.totalValue), 0);
    const e = expenses.reduce((a, x) => a + Number(x.amount), 0);
    return { d, t, e, n: t - e };
  }, [rows, expenses]);

  const perEmployee = useMemo(() => {
    const map = new Map<string, { deliveries: number; total: number; cycles: number }>();
    rows.forEach((r) => {
      const cur = map.get(r.empName) ?? { deliveries: 0, total: 0, cycles: 0 };
      cur.deliveries += r.deliveries;
      cur.total += Number(r.totalValue);
      cur.cycles += 1;
      map.set(r.empName, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

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
        employees: new Set(cyc.map((r) => r.empName)).size,
        deliveries: cyc.reduce((a, r) => a + r.deliveries, 0),
        total: totalVal,
        expense: ex,
        expenses: expAmt,
        net: totalVal - expAmt,
        count: cyc.length,
      };
    }).filter((m) => m.count > 0 || m.expense);
  }, [rows, expenses]);

  const grouped = useMemo(() => {
    const list =
      empFilter === "all" ? rows : rows.filter((r) => r.empName === empFilter);
    const map = new Map<string, Report[]>();
    list.forEach((r) => {
      const k = `${r.year}|${r.month}|${r.cycle}`;
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [rows, empFilter]);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  const vis = (...t: Tab[]) => (t.includes(tab) ? "" : "hidden md:block");
  const statsVis = tab === "records" || tab === "summary" ? "grid" : "hidden md:grid";

  return (
    <main className="min-h-screen bg-slate-100 pb-28 md:pb-16">
      <datalist id="emp-list">
        {allEmps.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <header className="sticky top-0 z-20 bg-gradient-to-r from-indigo-700 to-violet-600 pt-[env(safe-area-inset-top)] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight md:text-3xl">
              Bharathi Enterprises
            </h1>
            <p className="truncate text-xs text-indigo-100 md:text-sm">
              <span className="md:hidden">Ekart · multiple employees</span>
              <span className="hidden md:inline">
                Ekart Delivery Monitor · 15-day cycles · many employees per cycle · monthly expenses
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
        {/* ---------- Entry: one cycle, many employees ---------- */}
        <section className={`${vis("entry")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
          <h2 className="mb-3 text-lg font-semibold">
            {editingId ? "Edit Cycle Report" : "New 15-Day Cycle Entry"}
          </h2>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Field label="Year">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </Field>
            <Field label="Month">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>
                {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
              </select>
            </Field>
            <Field label="Cycle">
              <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className={inputCls}>
                <option value={1}>1st ({cycleLabel(1, year, month)})</option>
                <option value={2}>2nd ({cycleLabel(2, year, month)})</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Employees <span className="font-normal text-slate-400">({lines.length})</span>
            </span>
            {!editingId && (
              <button
                type="button"
                onClick={addLine}
                className="h-9 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white active:bg-indigo-800"
              >
                + Add employee
              </button>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {lines.map((l, idx) => (
              <div key={l.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {editingId ? "Employee" : `Employee ${idx + 1}`}
                  </span>
                  {!editingId && lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="px-2 py-1 text-xs font-semibold text-rose-600 active:text-rose-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Name">
                  <input
                    value={l.empName}
                    onChange={(e) => patchLine(l.key, { empName: e.target.value })}
                    list="emp-list"
                    placeholder="Type or pick a name"
                    autoComplete="off"
                    enterKeyHint="next"
                    className={inputCls}
                  />
                </Field>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Deliveries">
                    <input
                      type="number" min="0" inputMode="numeric" enterKeyHint="next"
                      value={l.deliveries}
                      onChange={(e) => patchLine(l.key, { deliveries: e.target.value })}
                      placeholder="0"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Price / Delivery (₹)">
                    <input
                      type="number" min="0" step="0.01" inputMode="decimal" enterKeyHint="next"
                      value={l.price}
                      onChange={(e) => patchLine(l.key, { price: e.target.value })}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="mt-2 grid grid-cols-2 items-end gap-2">
                  <Field label="Notes (optional)">
                    <input
                      value={l.notes}
                      onChange={(e) => patchLine(l.key, { notes: e.target.value })}
                      placeholder="Remarks"
                      className={inputCls}
                    />
                  </Field>
                  <div className="flex h-12 items-center justify-end rounded-lg bg-white px-3 ring-1 ring-slate-200">
                    <span className="mr-2 text-xs text-slate-500">Total</span>
                    <span className="text-base font-bold text-indigo-700">{inr(lineTotal(l))}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
              <span className="text-sm text-slate-600">
                Cycle Total
                <span className="block text-xs text-slate-400">
                  {lines.length} employee{lines.length > 1 ? "s" : ""} · {MONTHS[month - 1]} {year}
                </span>
              </span>
              <span className="text-2xl font-bold text-indigo-700">{inr(grandTotal)}</span>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white shadow active:bg-indigo-800 md:h-11 md:w-auto md:hover:bg-indigo-700"
              >
                {editingId ? "Update Report" : `Save ${lines.length} Employee${lines.length > 1 ? "s" : ""}`}
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

        {/* ---------- Monthly expenses ---------- */}
        <section id="expense-form" className={`${vis("expenses")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-200 md:p-5`}>
          <h2 className="text-lg font-semibold">
            Monthly Expenses{" "}
            <span className="block text-sm font-normal text-slate-500 md:inline">(once per month, all employees)</span>
          </h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Saving again for the same month updates the existing entry.
          </p>
          <form onSubmit={submitExpense} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Field label="Year">
              <select value={expYear} onChange={(e) => setExpYear(Number(e.target.value))} className={inputCls}>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </Field>
            <Field label="Month">
              <select value={expMonth} onChange={(e) => setExpMonth(Number(e.target.value))} className={inputCls}>
                {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
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

        {/* ---------- Year stats ---------- */}
        <section className={`${statsVis} grid-cols-2 gap-3 lg:grid-cols-4`}>
          <Stat label="Entries" value={String(rows.length)} color="text-slate-900" />
          <Stat label="Deliveries" value={summary.d.toLocaleString("en-IN")} color="text-slate-900" />
          <Stat label="Total Value" value={inr(summary.t)} color="text-indigo-700" />
          <Stat label="Expenses" value={inr(summary.e)} color="text-rose-600" />
        </section>

        {/* ---------- Per employee ---------- */}
        {perEmployee.length > 0 && (
          <section className={`${vis("summary")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
            <h2 className="mb-3 text-lg font-semibold">By Employee · {filterYear}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {perEmployee.map((p) => (
                <div key={p.name} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEmpFilter(p.name);
                        setTab("records");
                        goTop();
                      }}
                      className="truncate text-left font-semibold text-indigo-700 active:underline"
                    >
                      {p.name}
                    </button>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {p.cycles} cycles
                    </span>
                  </div>
                  <dl className="mt-1.5 space-y-1 text-sm">
                    <Row k="Deliveries" v={p.deliveries.toLocaleString("en-IN")} />
                    <Row k="Total Value" v={inr(p.total)} strong />
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Year Net (all employees)
                  <span className="block text-xs text-slate-500">Total value − monthly expenses</span>
                </span>
                <span className="text-2xl font-bold text-emerald-700">{inr(summary.n)}</span>
              </div>
            </div>
          </section>
        )}

        {/* ---------- Records ---------- */}
        <section className={`${vis("records")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Cycle Records · {filterYear}</h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Employee:</span>
              <select
                value={empFilter}
                onChange={(e) => setEmpFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-sm"
              >
                <option value="all">All ({allEmps.length})</option>
                {allEmps.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {empFilter !== "all" && (
                <button onClick={() => setEmpFilter("all")} className="text-xs font-semibold text-indigo-600">
                  Clear
                </button>
              )}
            </label>
          </div>

          {loading && <p className="py-8 text-center text-slate-400">Loading…</p>}
          {!loading && grouped.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No records for {filterYear}
              {empFilter !== "all" ? ` · ${empFilter}` : ""}. Add them in the Entry tab.
            </p>
          )}

          <div className="space-y-4">
            {grouped.map(([key, list]) => {
              const [, m, c] = key.split("|").map(Number);
              const cycleTotal = list.reduce((a, r) => a + Number(r.totalValue), 0);
              return (
                <div key={key} className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <span className="font-semibold">{MONTHS[m - 1]} {filterYear}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {c === 1 ? "1st" : "2nd"} cycle · {cycleLabel(c, filterYear, m)} · {list.length} emp
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-indigo-700">{inr(cycleTotal)}</span>
                  </div>

                  {/* phones: rows of employees */}
                  <ul className="divide-y divide-slate-100 md:hidden">
                    {list.map((r) => (
                      <li key={r.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{r.empName}</div>
                            <div className="text-xs text-slate-500">
                              {r.deliveries} × {inr(Number(r.pricePerDelivery))}
                            </div>
                            {r.notes && (
                              <div className="mt-0.5 truncate text-xs text-slate-400">Note: {r.notes}</div>
                            )}
                          </div>
                          <div className="shrink-0 text-right text-base font-bold text-indigo-700">
                            {inr(Number(r.totalValue))}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button onClick={() => edit(r)} className="h-11 rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700 active:bg-indigo-100">
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              openDelete({
                                kind: "report",
                                id: r.id,
                                label: `Delete ${r.empName} · ${MONTHS[r.month - 1]} ${r.cycle === 1 ? "1st" : "2nd"} cycle?`,
                                sub: `${r.deliveries} deliveries · ${inr(Number(r.totalValue))}`,
                              })
                            }
                            className="h-11 rounded-lg bg-rose-50 text-sm font-semibold text-rose-600 active:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* desktop: table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Employee</th>
                          <th className="px-3 py-2 text-right">Deliveries</th>
                          <th className="px-3 py-2 text-right">Per Delivery</th>
                          <th className="px-3 py-2 text-right">Total Value</th>
                          <th className="px-3 py-2">Notes</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium">{r.empName}</td>
                            <td className="px-3 py-2 text-right">{r.deliveries}</td>
                            <td className="px-3 py-2 text-right">{inr(Number(r.pricePerDelivery))}</td>
                            <td className="px-3 py-2 text-right font-semibold text-indigo-700">{inr(Number(r.totalValue))}</td>
                            <td className="max-w-40 truncate px-3 py-2 text-slate-500">{r.notes ?? "—"}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">
                              <button onClick={() => edit(r)} className="mr-3 text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                              <button
                                onClick={() =>
                                  openDelete({
                                    kind: "report",
                                    id: r.id,
                                    label: `Delete ${r.empName} · ${MONTHS[r.month - 1]} ${r.cycle === 1 ? "1st" : "2nd"} cycle?`,
                                    sub: `${r.deliveries} deliveries · ${inr(Number(r.totalValue))}`,
                                  })
                                }
                                className="text-xs font-medium text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- Monthly rollup ---------- */}
        {byMonth.length > 0 && (
          <section className={`${vis("summary")} rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`}>
            <h2 className="mb-3 text-lg font-semibold">Monthly Summary · {filterYear}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byMonth.map((m) => (
                <div key={m.name} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {m.count} entries · {m.employees} emp
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <Row k="Deliveries" v={m.deliveries.toLocaleString("en-IN")} />
                    <Row k="Total Value" v={inr(m.total)} />
                    <Row k="Month Expenses" v={m.expense ? inr(m.expenses) : "Not entered"} warn={!m.expense} />
                    <Row k="Net" v={inr(m.net)} strong />
                  </dl>
                  {m.expense?.notes && <p className="mt-2 text-xs text-slate-500">Note: {m.expense.notes}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                    <button onClick={() => editExpense(m.m, m.expense)} className="h-11 rounded-lg bg-amber-50 text-amber-700 active:bg-amber-100">
                      {m.expense ? "Edit expenses" : "Add expenses"}
                    </button>
                    {m.expense ? (
                      <button
                        onClick={() =>
                          openDelete({
                            kind: "expense",
                            month: m.m,
                            label: `Delete ${m.name} ${filterYear} expenses?`,
                            sub: inr(m.expenses),
                          })
                        }
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
          </section>
        )}
      </div>

      {/* ---------- Delete PIN sheet ---------- */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Enter PIN to delete"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <h3 className="text-lg font-bold">Enter PIN to delete</h3>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-700">{pending.label}</p>
            <p className="text-xs text-slate-500">{pending.sub}</p>

            <div className="relative mt-4">
              <input
                ref={pinRef}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setPinError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmDelete();
                  if (e.key === "Escape") closeDelete();
                }}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                name="delete-pin"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
                autoFocus
                placeholder="9676"
                aria-label="4 digit PIN"
                aria-invalid={pinError ? "true" : "false"}
                className={`h-14 w-full rounded-xl border-2 pr-14 text-center text-3xl font-bold tracking-[0.4em] outline-none transition ${
                  pin === DELETE_PIN
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                    : pinError || (pin.length === 4 && pin !== DELETE_PIN)
                      ? "border-rose-400 bg-rose-50/50 text-rose-800"
                      : "border-slate-300 bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-500"
              >
                {showPin ? "Hide" : "Show"}
              </button>
            </div>
            <p
              className={`mt-2 min-h-5 text-center text-xs font-semibold ${
                pin === DELETE_PIN
                  ? "text-emerald-700"
                  : pinError || (pin.length === 4 && pin !== DELETE_PIN)
                    ? "text-rose-600"
                    : "text-slate-500"
              }`}
            >
              {pin === DELETE_PIN
                ? "✓ PIN 9676 verified! Tap Delete to confirm"
                : pinError || (pin.length === 4 ? "Wrong PIN! Default PIN is 9676" : "Enter PIN 9676 to confirm deletion")}
            </p>

            {/* Standard 3-column phone keypad */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setPin((p) => (p + d).slice(0, 4));
                    setPinError("");
                  }}
                  className="h-11 rounded-xl bg-slate-100 text-lg font-bold text-slate-800 active:bg-slate-200 transition"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPin("");
                  setPinError("");
                }}
                className="h-11 rounded-xl bg-slate-100 text-xs font-bold text-slate-500 active:bg-slate-200 uppercase tracking-wider"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setPin((p) => (p + "0").slice(0, 4));
                  setPinError("");
                }}
                className="h-11 rounded-xl bg-slate-100 text-lg font-bold text-slate-800 active:bg-slate-200 transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setPin((p) => p.slice(0, -1));
                  setPinError("");
                }}
                className="h-11 rounded-xl bg-slate-100 text-base font-bold text-slate-600 active:bg-slate-200"
                aria-label="Backspace"
              >
                ⌫
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDelete}
                className="h-12 rounded-xl bg-slate-200 text-base font-semibold text-slate-700 active:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pin.length < 4 || deleting}
                className="h-12 rounded-xl bg-rose-600 text-base font-semibold text-white shadow disabled:bg-rose-300 active:bg-rose-700"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  setTab(t.id);
                  goTop();
                }}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-indigo-700" : "text-slate-500"
                }`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full text-base ${active ? "bg-indigo-100" : ""}`}>
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
      <dd className={strong ? "font-semibold text-emerald-700" : warn ? "text-amber-600" : "text-slate-800"}>{v}</dd>
    </div>
  );
}
