"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import FullExportDownloads from "@/components/full-export-downloads";
import FinalReportShare from "@/components/final-report-share";
import MonthRangeSelector from "@/components/month-range-selector";
import { isInMonthRange, monthRangeLabel } from "@/lib/report-range";
import { cycleDayRange as cycleLabel } from "@/lib/report-period";
import { exportFilename } from "@/lib/export-filenames";
import {
  calculateTotals, employeeExpenses, employeeReports, employeeTotals, sameEmployeeName,
  type EmployeeRow as Employee, type ExpenseRow as Expense, type ReportRow as Report,
} from "@/lib/delivery-totals";

type Tab = "entry" | "expenses" | "records" | "summary" | "staff";
type PinTarget = { kind: "report" | "expense" | "employee"; id: number; label: string; name?: string };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "entry", label: "Entry", icon: "📝" }, { id: "expenses", label: "Expenses", icon: "💰" },
  { id: "records", label: "Records", icon: "📋" }, { id: "summary", label: "Summary", icon: "📊" },
  { id: "staff", label: "Staff", icon: "👥" },
];
const GENERAL = "general";
const NEW_EMPLOYEE = "__new__";
const EMP_KEY = "bharathi_last_emp";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const owner = (expense: Expense) => expense.employeeName ?? "General business expenses";
const inputCls = "h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 md:h-10 md:rounded-lg md:text-sm";
const primaryCls = "min-h-12 rounded-xl bg-indigo-600 px-5 py-2 text-base font-semibold text-white shadow active:bg-indigo-800 disabled:opacity-50 md:min-h-11 md:text-sm";
const panelCls = "scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(data?.error ?? "Could not connect. Please try again.");
  return data as T;
}
const jsonPost = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function Home() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>("entry");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cycle, setCycle] = useState(now.getDate() <= 15 ? 1 : 2);
  const [empName, setEmpName] = useState("");
  const [addingEmp, setAddingEmp] = useState(false);
  const [deliveries, setDeliveries] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingReport, setSavingReport] = useState(false);

  const [expenseEmployee, setExpenseEmployee] = useState("");
  const [expenseMonth, setExpenseMonth] = useState(now.getMonth() + 1);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [scopeName, setScopeName] = useState("");
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const reportRange = useMemo(() => ({ fromMonth, toMonth }), [fromMonth, toMonth]);
  const [recordMonth, setRecordMonth] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestVersion = useRef(0);

  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((text: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const load = useCallback(async (): Promise<Report[] | null> => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const [r, e] = await Promise.all([
        api<{ reports: Report[] }>(`/api/reports?year=${year}`),
        api<{ expenses: Expense[] }>(`/api/expenses?year=${year}`),
      ]);
      if (version === requestVersion.current) {
        setReports(r.reports);
        setExpenses(e.expenses);
      }
      return r.reports;
    } catch (error) {
      if (version === requestVersion.current) setLoadError(error instanceof Error ? error.message : "Could not load records.");
      return null;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [year]);
  const loadEmployees = useCallback(async () => {
    const data = await api<{ employees: Employee[] }>("/api/employees");
    setEmployees(data.employees);
    return data.employees;
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void loadEmployees().then((list) => {
      let saved = "";
      try { saved = localStorage.getItem(EMP_KEY) ?? ""; } catch {}
      const last = list.find((e) => sameEmployeeName(e.name, saved));
      if (last) setEmpName(last.name);
      if (list.length) setExpenseEmployee(String((last ?? list[0]).id));
      else setAddingEmp(true);
    }).catch(() => showToast("Could not load employees. Please refresh.", false));
  }, [loadEmployees, showToast]);

  const go = (next: Tab) => {
    setTab(next);
    requestAnimationFrame(() => {
      if (window.innerWidth >= 768) document.getElementById(`screen-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };
  const visible = (name: Tab) => tab === name ? "" : "hidden md:block";
  const years = Array.from(new Set([...Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i), year])).sort((a, b) => a - b);
  const resetEntry = () => { setEditingId(null); setDeliveries(""); setPrice(""); setNotes(""); };
  const changeYear = (value: number) => { setYear(value); resetEntry(); };
  const periodReports = reports.filter((r) => r.year === year && r.month === month && r.cycle === cycle);
  const duplicate = editingId === null && empName.trim() ? periodReports.find((r) => sameEmployeeName(r.empName, empName)) : undefined;
  const selectedEntryName = employees.find((e) => sameEmployeeName(e.name, empName))?.name ?? "";
  const entryTotal = (Number(deliveries) || 0) * (Number(price) || 0);

  const scopeEmployee = employees.find((e) => sameEmployeeName(e.name, scopeName));
  const scopedReports = useMemo(() => scopeEmployee ? employeeReports(reports, scopeEmployee) : reports, [reports, scopeEmployee]);
  const scopedExpenses = useMemo(() => scopeEmployee ? employeeExpenses(expenses, scopeEmployee) : expenses, [expenses, scopeEmployee]);
  const scopedTotals = useMemo(() => calculateTotals(scopedReports, scopedExpenses), [scopedReports, scopedExpenses]);
  const rangeReports = useMemo(() => scopedReports.filter((row) => isInMonthRange(row.month, reportRange)), [scopedReports, reportRange]);
  const rangeExpenses = useMemo(() => scopedExpenses.filter((row) => isInMonthRange(row.month, reportRange)), [scopedExpenses, reportRange]);
  const rangeTotals = useMemo(() => calculateTotals(rangeReports, rangeExpenses), [rangeReports, rangeExpenses]);
  const filteredReports = recordMonth ? scopedReports.filter((r) => r.month === Number(recordMonth)) : scopedReports;
  const filteredExpenses = recordMonth ? scopedExpenses.filter((e) => e.month === Number(recordMonth)) : scopedExpenses;
  const staffStats = useMemo(() => employees.map((employee) => ({ employee, ...employeeTotals(reports, expenses, employee) })), [employees, reports, expenses]);
  const generalExpenses = expenses.filter((e) => e.employeeId === null);

  const storedExpense = useMemo(() => expenses.find((e) => e.year === year && e.month === expenseMonth &&
    (expenseEmployee === GENERAL ? e.employeeId === null : String(e.employeeId) === expenseEmployee)), [expenses, expenseMonth, expenseEmployee, year]);
  useEffect(() => {
    setExpenseAmount(storedExpense ? String(Number(storedExpense.amount)) : "");
    setExpenseNotes(storedExpense?.notes ?? "");
  }, [expenseEmployee, expenseMonth, year, storedExpense?.id, storedExpense?.amount, storedExpense?.notes]);
  const formEmployee = employees.find((e) => String(e.id) === expenseEmployee);
  const expenseMonthIncome = formEmployee ? calculateTotals(employeeReports(reports, formEmployee).filter((r) => r.month === expenseMonth), []).total : 0;
  const expensePreviewNet = (Math.round(expenseMonthIncome * 100) - Math.round((Number(expenseAmount) || 0) * 100)) / 100;
  const expenseHistory = expenseEmployee === GENERAL ? generalExpenses : formEmployee ? employeeExpenses(expenses, formEmployee) : expenses;

  const months = useMemo(() => MONTHS.map((name, index) => {
    const monthNumber = index + 1;
    const monthReports = rangeReports.filter((r) => r.month === monthNumber);
    const monthExpenses = rangeExpenses.filter((e) => e.month === monthNumber);
    const perEmployee = (scopeEmployee ? [scopeEmployee] : employees).map((employee) => {
      const ownReports = employeeReports(monthReports, employee);
      const ownExpenses = employeeExpenses(monthExpenses, employee);
      return { employee, ...calculateTotals(ownReports, ownExpenses), expense: ownExpenses[0] };
    }).filter((e) => scopeEmployee || e.entries > 0 || e.expenseEntries > 0);
    return { month: monthNumber, name, ...calculateTotals(monthReports, monthExpenses), perEmployee, general: monthExpenses.find((e) => e.employeeId === null) };
  }).filter((period) => isInMonthRange(period.month, reportRange)), [rangeReports, rangeExpenses, scopeEmployee, employees, reportRange]);

  const editReport = (report: Report) => {
    setEditingId(report.id); setEmpName(report.empName);
    setAddingEmp(!employees.some((e) => sameEmployeeName(e.name, report.empName)));
    setMonth(report.month); setCycle(report.cycle);
    setDeliveries(String(report.deliveries)); setPrice(String(Number(report.pricePerDelivery))); setNotes(report.notes ?? "");
    go("entry");
  };
  const enterFor = (employee: Employee) => {
    setEditingId(null); setDeliveries(""); setNotes(""); setEmpName(employee.name); setAddingEmp(false); go("entry");
  };
  const editExpense = (employeeId: number | null, selectedMonth: number) => {
    setExpenseEmployee(employeeId === null ? GENERAL : String(employeeId)); setExpenseMonth(selectedMonth); go("expenses");
  };
  const viewFor = (employee: Employee, next: "records" | "summary") => { setScopeName(employee.name); setRecordMonth(""); go(next); };

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingReport || !empName.trim()) { if (!empName.trim()) showToast("Select or enter an employee name.", false); return; }
    setSavingReport(true);
    try {
      const payload = { empName: empName.trim(), year, month, cycle, deliveries: Number(deliveries), pricePerDelivery: Number(price), notes };
      const { report: saved } = await api<{ report: Report }>(editingId ? `/api/reports/${editingId}` : "/api/reports", { ...jsonPost(payload), method: editingId ? "PATCH" : "POST" });
      try { localStorage.setItem(EMP_KEY, saved.empName); } catch {}
      const wasEditing = editingId !== null;
      await Promise.all([load(), loadEmployees()]);
      setEditingId(null); setDeliveries(""); setNotes(""); setAddingEmp(false);
      setEmpName(saved.empName);
      setScopeName(saved.empName);
      setFromMonth((value) => Math.min(value, saved.month));
      setToMonth((value) => Math.max(value, saved.month));
      setRecordMonth("");
      showToast(`${saved.empName} ${wasEditing ? "report updated" : "report saved"} ✅`);
      go("summary");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not save report.", false); }
    finally { setSavingReport(false); }
  };

  const submitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingExpense) return;
    if (!expenseEmployee) { showToast("Select an employee for these expenses.", false); return; }
    setSavingExpense(true);
    try {
      await api("/api/expenses", jsonPost({ employeeId: expenseEmployee === GENERAL ? null : Number(expenseEmployee), year, month: expenseMonth, amount: Number(expenseAmount), notes: expenseNotes }));
      await load();
      setScopeName(formEmployee?.name ?? "");
      setFromMonth((value) => Math.min(value, expenseMonth));
      setToMonth((value) => Math.max(value, expenseMonth));
      showToast(`${formEmployee?.name ?? "General business"} · ${MONTHS[expenseMonth - 1]} expenses saved ✅`);
      go("summary");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not save expenses.", false); }
    finally { setSavingExpense(false); }
  };

  const addEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addingStaff || !newStaff.trim()) return;
    setAddingStaff(true);
    try {
      const saved = await api<{ employee: Employee }>("/api/employees", jsonPost({ name: newStaff.trim() }));
      await loadEmployees(); setNewStaff("");
      if (!expenseEmployee) setExpenseEmployee(String(saved.employee.id));
      showToast(`${saved.employee.name} added ✅`);
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not add employee.", false); }
    finally { setAddingStaff(false); }
  };

  const [pinTarget, setPinTarget] = useState<PinTarget | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const closePin = () => { setPinTarget(null); setPin(""); setShowPin(false); setPinError(""); };
  const openPin = (target: PinTarget) => { setPin(""); setShowPin(false); setPinError(""); setPinTarget(target); };
  const deleteExpense = (expense: Expense) => openPin({ kind: "expense", id: expense.id, label: `${owner(expense)} · ${MONTHS[expense.month - 1]} ${expense.year} expenses` });
  const confirmDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pinTarget || pinBusy) return;
    const enteredPin = String(new FormData(event.currentTarget).get("delete-pin") ?? "").normalize("NFKC").replace(/\D/g, "");
    if (!enteredPin) { setPinError("Enter PIN"); return; }
    const target = pinTarget;
    setPinBusy(true); setPinError("");
    try {
      const response = await fetch("/api/delete", { ...jsonPost({ kind: target.kind, id: target.id, pin: enteredPin }), cache: "no-store", signal: AbortSignal.timeout(20000) });
      const data: { ok?: boolean; code?: string; error?: string } | null = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        setPinError(data?.code === "WRONG_PIN" ? "Wrong PIN. Try again." : data?.error ?? (response.status === 403 ? "Delete request was blocked. Refresh and try again." : "Could not confirm deletion. Refresh your records before trying again."));
        return;
      }
      if (target.kind === "employee") {
        if (target.name && sameEmployeeName(scopeName, target.name)) setScopeName("");
        if (target.name && sameEmployeeName(empName, target.name)) setEmpName("");
        if (expenseEmployee === String(target.id)) setExpenseEmployee("");
      }
      closePin(); showToast("Deleted successfully");
      await Promise.all([load(), loadEmployees()]);
    } catch { setPinError("Network error. Refresh your records before trying again."); }
    finally { setPinBusy(false); }
  };

  const exportSummary = () => {
    const table: (string | number)[][] = [["Employee", "Year", "Month", "Deliveries", "Total Value (INR)", "Expenses (INR)", "Net Earnings (INR)"]];
    for (const employee of scopeEmployee ? [scopeEmployee] : employees) {
      MONTHS.forEach((name, i) => {
        if (!isInMonthRange(i + 1, reportRange)) return;
        const totals = employeeTotals(rangeReports.filter((r) => r.month === i + 1), rangeExpenses.filter((e) => e.month === i + 1), employee);
        table.push([employee.name, year, name, totals.deliveries, totals.total.toFixed(2), totals.expenses.toFixed(2), totals.net.toFixed(2)]);
      });
    }
    if (!scopeEmployee) generalExpenses.filter((e) => isInMonthRange(e.month, reportRange)).forEach((e) => table.push(["General business expenses", year, MONTHS[e.month - 1], 0, "0.00", e.amount, (-Number(e.amount)).toFixed(2)]));
    const csv = "\uFEFF" + table.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = exportFilename((scopeEmployee ? [scopeEmployee] : employees).map((employee) => employee.name), year, "csv", "Summary", reportRange);
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const employeeFilter = (label: string) => <select aria-label={label} value={scopeName} onChange={(e) => setScopeName(e.target.value)} className={inputCls}>
    <option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
  </select>;

  return (
    <main className="min-h-screen bg-slate-100 pb-28 md:pb-16">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-indigo-700 to-violet-600 pt-[env(safe-area-inset-top)] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-5">
          <div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight md:text-3xl">Bharathi Enterprises</h1>
            <p className="text-xs text-indigo-100 md:text-sm">Ekart Delivery Monitor <span className="hidden md:inline">· Employee-wise delivery reports & monthly expenses</span></p></div>
          <select aria-label="Report year" value={year} onChange={(e) => changeYear(Number(e.target.value))} className="h-11 shrink-0 rounded-lg border border-white/30 bg-white/15 px-2 text-base font-semibold text-white outline-none [&>option]:text-slate-900">
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 md:space-y-6 md:px-4 md:py-6">
        {loadError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{loadError} <button onClick={() => void load()} className="ml-2 font-semibold underline">Retry</button></div>}
        <section id="screen-entry" className={`${visible("entry")} ${panelCls}`}>
          <h2 className="text-lg font-semibold">{editingId ? "Edit Cycle Report" : "New 15-Day Cycle Entry"}</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">Two entries per employee per month. Monthly expenses are entered separately.</p>
          <form onSubmit={submitReport} className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="col-span-2 md:col-span-1"><Field label="Employee">
              {addingEmp || !employees.length ? <div className="flex gap-2"><input required maxLength={60} value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="New employee name" className={inputCls} />
                {!!employees.length && <button type="button" onClick={() => { setAddingEmp(false); setEmpName(""); }} className="shrink-0 rounded-lg bg-slate-200 px-3 text-sm font-semibold">List</button>}</div>
                : <select required value={selectedEntryName} onChange={(e) => { if (e.target.value === NEW_EMPLOYEE) { setAddingEmp(true); setEmpName(""); } else setEmpName(e.target.value); }} className={inputCls}>
                  <option value="">Select employee…</option>{employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}<option value={NEW_EMPLOYEE}>➕ Add new employee…</option>
                </select>}
            </Field></div>
            <Field label="Year"><select value={year} onChange={(e) => changeYear(Number(e.target.value))} className={inputCls}>{years.map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Month"><select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></Field>
            <div className="col-span-2 md:col-span-1"><Field label="Cycle (15 days)"><select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className={inputCls}><option value={1}>1st Cycle (1 – 15)</option><option value={2}>2nd Cycle ({cycleLabel(2, year, month)})</option></select></Field></div>
            <Field label="No. of Deliveries"><input required type="number" min="0" step="1" inputMode="numeric" value={deliveries} onChange={(e) => setDeliveries(e.target.value)} placeholder="0" className={inputCls} /></Field>
            <Field label="Price / Delivery (₹)"><input required type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputCls} /></Field>
            <div className="col-span-2 md:col-span-1"><Field label="Notes (optional)"><input value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} placeholder="Incentive, remarks, etc." className={inputCls} /></Field></div>
            <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200"><span className="text-sm text-slate-600">Total Value<span className="block text-xs text-slate-400">{Number(deliveries) || 0} × {inr(Number(price) || 0)}</span></span><strong className="break-all text-2xl text-indigo-700">{inr(entryTotal)}</strong></div>
            {duplicate && <div className="col-span-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 md:col-span-3">This employee already has {duplicate.deliveries} deliveries entered for this period. <button type="button" onClick={() => editReport(duplicate)} className="font-semibold underline">Edit it</button></div>}
            <div className="col-span-2 flex flex-col gap-2 md:col-span-3 md:flex-row"><button disabled={savingReport || !!duplicate} type="submit" className={primaryCls}>{savingReport ? "Saving…" : editingId ? "Update Report" : "Save Report"}</button>
              {editingId && <Action type="button" tone="slate" onClick={() => { resetEntry(); setEmpName(""); }}>Cancel</Action>}</div>
          </form>
          {!!employees.length && <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-3 flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold">{MONTHS[month - 1]} {year} · {cycleLabel(cycle, year, month)}</h3><span className="text-xs text-slate-500">{employees.filter((e) => periodReports.some((r) => sameEmployeeName(r.empName, e.name))).length}/{employees.length} entered</span></div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{employees.map((employee) => { const saved = periodReports.find((r) => sameEmployeeName(r.empName, employee.name)); return <li key={employee.id}><button onClick={() => saved ? editReport(saved) : enterFor(employee)} className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm ${saved ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><span className="min-w-0 truncate font-medium">{employee.name}</span><span className={`shrink-0 text-xs font-semibold ${saved ? "text-emerald-700" : "text-amber-700"}`}>{saved ? `✓ ${inr(Number(saved.totalValue))}` : "Pending"}</span></button></li>; })}</ul>
          </div>}
        </section>

        <section id="screen-expenses" className={`${visible("expenses")} ${panelCls}`}>
          <h2 className="text-lg font-semibold">Employee Monthly Expenses</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">One entry per employee per month—not per 15-day cycle. Saving the same employee and month updates only that entry.</p>
          <form onSubmit={submitExpense} className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="col-span-2 md:col-span-1"><Field label="Expense employee"><select required value={expenseEmployee} onChange={(e) => setExpenseEmployee(e.target.value)} className={inputCls}><option value="">Select employee…</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}<option value={GENERAL}>General business expenses</option></select></Field></div>
            <Field label="Expense year"><select value={year} onChange={(e) => changeYear(Number(e.target.value))} className={inputCls}>{years.map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Expense month"><select value={expenseMonth} onChange={(e) => setExpenseMonth(Number(e.target.value))} className={inputCls}>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></Field>
            <div className="col-span-2 md:col-span-1"><Field label="Monthly expense amount (₹)"><input required type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" className={inputCls} /></Field></div>
            <div className="col-span-2 md:col-span-2"><Field label="Expense notes (optional)"><input maxLength={300} value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} placeholder="Fuel, salary, advance, etc." className={inputCls} /></Field></div>
            {formEmployee && <div className="col-span-2 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100 md:col-span-3"><p className="mb-2 text-sm font-semibold">{formEmployee.name} · {MONTHS[expenseMonth - 1]} {year}</p><dl className="space-y-1 text-sm"><Row label="Delivery total (both cycles)" value={inr(expenseMonthIncome)} /><Row label="Monthly expenses" value={inr(Number(expenseAmount) || 0)} tone="expense" /><Row label="Net earnings" value={inr(expensePreviewNet)} tone={expensePreviewNet < 0 ? "expense" : "net"} /></dl></div>}
            {expenseEmployee === GENERAL && <p className="col-span-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 md:col-span-3">General expenses affect business totals only. They are not deducted from any employee’s individual net.</p>}
            {storedExpense && <p className="col-span-2 text-xs font-medium text-amber-700 md:col-span-3">An entry is already saved for this employee and month. Saving will update it, not add it twice.</p>}
            <button type="submit" disabled={savingExpense} className="col-span-2 min-h-12 rounded-xl bg-amber-500 px-5 py-2 font-semibold text-white shadow active:bg-amber-700 disabled:opacity-50 md:col-span-3 md:w-fit">{savingExpense ? "Saving…" : storedExpense ? "Update Monthly Expenses" : "Save Monthly Expenses"}</button>
          </form>
          <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="mb-3 text-sm font-semibold">Saved expenses · {formEmployee?.name ?? (expenseEmployee === GENERAL ? "General business" : "All employees")} · {year}</h3><ExpenseList rows={expenseHistory} onEdit={(expense) => editExpense(expense.employeeId, expense.month)} onDelete={deleteExpense} /></div>
        </section>

        <section id="screen-records" className={`${visible("records")} ${panelCls}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Cycle Records · {year}</h2><div className="grid w-full grid-cols-2 gap-2 sm:w-auto"><div>{employeeFilter("Records employee filter")}</div><select aria-label="Records month filter" value={recordMonth} onChange={(e) => setRecordMonth(e.target.value)} className={inputCls}><option value="">All months</option>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></div></div>
          <p className="mb-2 text-xs font-medium text-slate-500">Year totals · {scopeEmployee?.name ?? "All employees"}</p><TotalsCards totals={scopedTotals} />
          <p className="my-4 text-xs text-slate-500">{filteredReports.length} delivery reports shown. Monthly expenses are listed separately below and are never deducted twice.</p>
          {loading ? <Empty>Loading records…</Empty> : !filteredReports.length ? <Empty>No delivery reports for this selection.</Empty> : <>
            <ul className="space-y-3 md:hidden">{filteredReports.map((report) => <li key={report.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-words font-semibold">{report.empName}</p><p className="text-xs text-slate-500">{MONTHS[report.month - 1]} {report.year} · {cycleLabel(report.cycle, report.year, report.month)}</p></div><strong className="break-all text-lg text-indigo-700">{inr(Number(report.totalValue))}</strong></div><p className="mt-2 text-sm text-slate-600">{report.deliveries} deliveries × {inr(Number(report.pricePerDelivery))}</p>{report.notes && <p className="mt-1 break-words text-xs text-slate-500">{report.notes}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><Action onClick={() => editReport(report)}>Edit</Action><Action tone="rose" onClick={() => openPin({ kind: "report", id: report.id, label: `${report.empName} · ${MONTHS[report.month - 1]} ${report.year} · ${cycleLabel(report.cycle, report.year, report.month)}` })}>Delete</Action></div></li>)}</ul>
            <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Period</th><th className="p-3">Employee</th><th className="p-3 text-right">Deliveries</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Total Value</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredReports.map((report) => <tr key={report.id}><td className="p-3">{MONTHS[report.month - 1]}<span className="block text-xs text-slate-500">{cycleLabel(report.cycle, report.year, report.month)}</span></td><td className="p-3">{report.empName}</td><td className="p-3 text-right">{report.deliveries}</td><td className="p-3 text-right">{inr(Number(report.pricePerDelivery))}</td><td className="p-3 text-right font-semibold text-indigo-700">{inr(Number(report.totalValue))}</td><td className="p-3"><div className="flex gap-2"><Action onClick={() => editReport(report)}>Edit</Action><Action tone="rose" onClick={() => openPin({ kind: "report", id: report.id, label: `${report.empName} · ${MONTHS[report.month - 1]} ${report.year} · ${cycleLabel(report.cycle, report.year, report.month)}` })}>Delete</Action></div></td></tr>)}</tbody></table></div>
          </>}
          <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="mb-3 text-sm font-semibold">Monthly expense records · {scopeEmployee?.name ?? "All employees"}</h3><ExpenseList rows={filteredExpenses} onEdit={(expense) => editExpense(expense.employeeId, expense.month)} onDelete={deleteExpense} /></div>
        </section>

        <section id="screen-summary" className={`${visible("summary")} ${panelCls}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Monthly & Yearly Summary · {year}</h2><div className="w-full sm:w-60">{employeeFilter("Summary employee filter")}</div></div>
          <MonthRangeSelector year={year} fromMonth={fromMonth} toMonth={toMonth} onChange={(from, to) => { setFromMonth(from); setToMonth(to); }} />
          <p className="mb-3 text-sm font-semibold text-slate-600">{scopeEmployee?.name ?? "All employees"} · {monthRangeLabel(year, reportRange)} totals</p><TotalsCards totals={rangeTotals} />
          {!scopeEmployee && rangeExpenses.some((row) => row.employeeId === null) && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Includes {inr(calculateTotals([], rangeExpenses.filter((row) => row.employeeId === null)).expenses)} in general business expenses for this range. Individual employee totals include only their own expenses.</p>}
          <FinalReportShare key={`${year}-${fromMonth}-${toMonth}-${scopeEmployee?.id ?? "all"}`} year={year} fromMonth={fromMonth} toMonth={toMonth} employees={employees} reports={reports} expenses={expenses} selectedEmployee={scopeEmployee} disabled={loading || Boolean(loadError)} />
          <FullExportDownloads year={year} fromMonth={fromMonth} toMonth={toMonth} employees={employees} />
          <div className="my-4"><Action onClick={exportSummary}>Download summary CSV</Action></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{months.map((monthly) => <article key={monthly.month} data-testid={`month-${monthly.month}`} className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{monthly.name}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{scopeEmployee ? `${monthly.entries}/2 cycles` : `${monthly.entries} delivery reports`}</span></div><dl className="space-y-1.5 text-sm"><Row label="Deliveries" value={String(monthly.deliveries)} /><Row label="Total Value" value={inr(monthly.total)} /><Row label="Monthly Expenses" value={monthly.expenseEntries ? inr(monthly.expenses) : "Not entered"} tone="expense" /><Row label="Net Earnings" value={inr(monthly.net)} tone={monthly.net < 0 ? "expense" : "net"} /></dl>
            {scopeEmployee ? <div className="mt-3 grid grid-cols-2 gap-2"><Action tone="amber" onClick={() => editExpense(scopeEmployee.id, monthly.month)}>{monthly.perEmployee[0]?.expense ? "Edit expenses" : "Add expenses"}</Action>{monthly.perEmployee[0]?.expense && <Action tone="rose" onClick={() => deleteExpense(monthly.perEmployee[0].expense!)}>Delete expenses</Action>}</div> : <>
              {!!monthly.perEmployee.length && <details className="mt-3 rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Employee breakdown ({monthly.perEmployee.length})</summary><ul className="mt-3 space-y-3">{monthly.perEmployee.map((person) => <li key={person.employee.id} className="border-t border-slate-200 pt-2"><p className="mb-1 break-words text-sm font-semibold">{person.employee.name}</p><dl className="space-y-1 text-xs"><Row label="Deliveries" value={String(person.deliveries)} /><Row label="Total" value={inr(person.total)} /><Row label="Expenses" value={person.expense ? inr(person.expenses) : "Not entered"} tone="expense" /><Row label="Net" value={inr(person.net)} tone={person.net < 0 ? "expense" : "net"} /></dl><div className="mt-2 grid grid-cols-2 gap-2"><Action tone="amber" onClick={() => editExpense(person.employee.id, monthly.month)}>{person.expense ? "Edit expenses" : "Add expenses"}</Action>{person.expense && <Action tone="rose" onClick={() => deleteExpense(person.expense!)}>Delete</Action>}</div></li>)}</ul></details>}
              {monthly.general && <div className="mt-3 rounded-lg bg-amber-50 p-3"><p className="mb-1 text-xs font-semibold text-amber-800">General business expenses: {inr(Number(monthly.general.amount))}</p><div className="grid grid-cols-2 gap-2"><Action tone="amber" onClick={() => editExpense(null, monthly.month)}>Edit general</Action><Action tone="rose" onClick={() => deleteExpense(monthly.general!)}>Delete</Action></div></div>}
              <div className="mt-3"><Action tone="amber" onClick={() => { setExpenseMonth(monthly.month); setExpenseEmployee(""); go("expenses"); }}>Add employee expenses</Action></div>
            </>}
          </article>)}</div>
        </section>

        <section id="screen-staff" className={`${visible("staff")} ${panelCls}`}>
          <h2 className="text-lg font-semibold">Employees</h2><p className="mb-4 mt-1 text-xs text-slate-500">Every employee’s delivery total, expenses and net earnings for {year}. Choose Totals to see all 12 months.</p>
          <form onSubmit={addEmployee} className="mb-4 flex gap-2"><input required aria-label="New employee name" maxLength={60} value={newStaff} onChange={(e) => setNewStaff(e.target.value)} placeholder="New employee name" className={inputCls} /><button disabled={addingStaff} className={`${primaryCls} shrink-0`}>{addingStaff ? "Adding…" : "Add"}</button></form>
          {!employees.length ? <Empty>No employees yet. Add your first employee above.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{staffStats.map((person) => <article key={person.employee.id} data-testid={`staff-${person.employee.id}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><h3 className="break-words font-semibold">{person.employee.name}</h3><span className="shrink-0 text-xs text-slate-500">{person.entries} reports</span></div><dl className="mt-3 space-y-1.5 text-sm"><Row label="Deliveries" value={person.deliveries.toLocaleString("en-IN")} /><Row label="Total Value" value={inr(person.total)} /><Row label="Monthly Expenses" value={inr(person.expenses)} tone="expense" /><Row label="Net Earnings" value={inr(person.net)} tone={person.net < 0 ? "expense" : "net"} /></dl><p className="mt-2 text-xs text-slate-400">{person.expenseEntries}/12 months of expenses entered</p><div className="mt-3 grid grid-cols-2 gap-2"><Action onClick={() => viewFor(person.employee, "summary")}>Totals</Action><Action onClick={() => viewFor(person.employee, "records")}>Records</Action><Action onClick={() => enterFor(person.employee)}>Delivery entry</Action><Action tone="amber" onClick={() => editExpense(person.employee.id, expenseMonth)}>Expenses</Action><Action tone="rose" onClick={() => openPin({ kind: "employee", id: person.employee.id, name: person.employee.name, label: person.employee.name })}>Delete employee</Action></div></article>)}</div>}
        </section>
      </div>

      {pinTarget && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center" onClick={() => { if (!pinBusy) closePin(); }}><form onSubmit={confirmDelete} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape" && !pinBusy) closePin(); }} role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-busy={pinBusy} className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h2 id="delete-title" className="mb-1 text-lg font-bold text-rose-600">🔒 Enter PIN to delete</h2><p className="mb-4 break-words text-sm text-slate-600">You are deleting: <strong>{pinTarget.label}</strong></p>
        <div className="relative"><input autoFocus name="delete-pin" type={showPin ? "text" : "password"} inputMode="numeric" enterKeyHint="done" autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={12} disabled={pinBusy} value={pin} onChange={(e) => { setPin(e.target.value.normalize("NFKC").replace(/\D/g, "")); setPinError(""); }} aria-label="PIN" aria-describedby="delete-pin-error" aria-invalid={Boolean(pinError)} className="h-14 w-full rounded-xl border border-slate-300 px-14 text-center text-3xl tracking-[0.4em] outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200" /><button type="button" disabled={pinBusy} onClick={() => setShowPin((shown) => !shown)} aria-label={showPin ? "Hide PIN" : "Show PIN"} aria-pressed={showPin} className="absolute inset-y-0 right-1 my-auto h-11 rounded-lg px-3 text-xs font-semibold text-slate-500 active:bg-slate-100">{showPin ? "Hide" : "Show"}</button></div>
        <p id="delete-pin-error" role="alert" className="mt-2 min-h-5 text-center text-sm font-medium text-rose-600">{pinError}</p><div className="mt-3 grid grid-cols-2 gap-3"><Action tone="slate" disabled={pinBusy} onClick={closePin}>Cancel</Action><button type="submit" disabled={pinBusy} className="min-h-12 rounded-xl bg-rose-600 font-semibold text-white disabled:opacity-60">{pinBusy ? "Deleting…" : "Delete"}</button></div>
      </form></div>}
      {toast && <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6"><div role="status" className={`max-w-sm rounded-2xl px-5 py-3 text-center text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-slate-900" : "bg-rose-600"}`}>{toast.text}</div></div>}
      <nav aria-label="App navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><div className="grid grid-cols-5">{TABS.map((item) => <button key={item.id} onClick={() => go(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${tab === item.id ? "text-indigo-700" : "text-slate-500"}`}><span className={`flex h-7 w-11 items-center justify-center rounded-full text-base ${tab === item.id ? "bg-indigo-100" : ""}`}>{item.icon}</span>{item.label}</button>)}</div></nav>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}
function Action({ children, tone = "indigo", type = "button", onClick, disabled = false }: { children: ReactNode; tone?: "indigo" | "rose" | "amber" | "slate"; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-700 active:bg-indigo-100", rose: "bg-rose-50 text-rose-600 active:bg-rose-100", amber: "bg-amber-50 text-amber-700 active:bg-amber-100", slate: "bg-slate-200 text-slate-700 active:bg-slate-300" };
  return <button type={type} onClick={onClick} disabled={disabled} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${colors[tone]}`}>{children}</button>;
}
function Row({ label, value, tone }: { label: string; value: string; tone?: "net" | "expense" }) {
  return <div className="flex items-start justify-between gap-3"><dt className="min-w-0 text-slate-500">{label}</dt><dd className={`break-all text-right ${tone === "net" ? "font-semibold text-emerald-700" : tone === "expense" ? "text-rose-600" : "font-medium text-slate-800"}`}>{value}</dd></div>;
}
function TotalsCards({ totals }: { totals: ReturnType<typeof calculateTotals> }) {
  const items = [
    { label: "Total Deliveries", value: totals.deliveries.toLocaleString("en-IN"), color: "text-slate-900" },
    { label: "Total Value", value: inr(totals.total), color: "text-indigo-700" },
    { label: "Total Expenses", value: inr(totals.expenses), color: "text-rose-600" },
    { label: "Net Earnings", value: inr(totals.net), color: totals.net < 0 ? "text-rose-600" : "text-emerald-700" },
  ];
  return <div data-testid="totals-cards" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map((item) => <div key={item.label} className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p><p className={`mt-1 break-all text-base font-bold md:text-lg ${item.color}`}>{item.value}</p></div>)}</div>;
}
function Empty({ children }: { children: ReactNode }) { return <p className="py-6 text-center text-sm text-slate-400">{children}</p>; }
function ExpenseList({ rows, onEdit, onDelete }: { rows: Expense[]; onEdit: (expense: Expense) => void; onDelete: (expense: Expense) => void }) {
  if (!rows.length) return <Empty>No monthly expenses saved for this selection.</Empty>;
  return <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((expense) => <li key={expense.id} data-testid={`expense-${expense.id}`} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-semibold">{owner(expense)}</p><p className="text-xs text-slate-500">{MONTHS[expense.month - 1]} {expense.year} · Monthly expenses</p></div><strong className="break-all text-rose-600">{inr(Number(expense.amount))}</strong></div>{expense.notes && <p className="mt-2 break-words text-xs text-slate-500">{expense.notes}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><Action tone="amber" onClick={() => onEdit(expense)}>Edit expenses</Action><Action tone="rose" onClick={() => onDelete(expense)}>Delete expenses</Action></div></li>)}</ul>;
}
