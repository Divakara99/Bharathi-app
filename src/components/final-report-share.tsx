"use client";

import { useMemo, useState } from "react";
import type { EmployeeRow, ExpenseRow, ReportRow } from "@/lib/delivery-totals";
import { cycleDayRange } from "@/lib/report-period";
import {
  buildFinalReport, buildWhatsAppMessage, reportMoney, REPORT_MONTHS, whatsAppShareUrl,
  type FinalReportEmployee, type FinalReportMonth,
} from "@/lib/final-report";

export default function FinalReportShare({ year, employees, reports, expenses, selectedEmployee, fromMonth = 1, toMonth = 12, disabled = false }: {
  year: number;
  employees: EmployeeRow[];
  reports: ReportRow[];
  expenses: ExpenseRow[];
  selectedEmployee?: EmployeeRow;
  fromMonth?: number;
  toMonth?: number;
  disabled?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const report = useMemo(() => buildFinalReport({ year, fromMonth, toMonth, employees, reports, expenses, selectedEmployee }),
    [year, fromMonth, toMonth, employees, reports, expenses, selectedEmployee]);
  const message = useMemo(() => buildWhatsAppMessage(report), [report]);
  const canShare = !disabled && report.hasData;
  const copyReport = async () => {
    if (!canShare) return;
    try {
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(message); }
        catch { legacyCopy(message); }
      } else legacyCopy(message);
      setCopyStatus("Report copied. Paste it into your WhatsApp chat.");
    } catch { setCopyStatus("Copy was blocked by your browser. Open the message preview below to select the text."); }
  };

  return <section aria-labelledby="share-report-title" data-testid="final-report-share" className="my-5 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
    <div className="bg-gradient-to-br from-indigo-800 to-slate-900 px-4 py-5 text-white sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">Bharathi Enterprises · Ekart</p>
          <h3 id="share-report-title" className="text-lg font-bold">Final report & WhatsApp</h3>
          <p className="mt-1 text-xs leading-relaxed text-indigo-100">Every delivery entry, monthly expenses and the final remaining value—in one readable report.</p>
        </div>
        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-indigo-100">Saved data only</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2"><p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">Selected report period</p>
          <p data-testid="whatsapp-range-label" className="mt-1 text-sm font-semibold">{report.period}</p>
          <p className="mt-1 text-[10px] text-indigo-200">Uses the From month → To month selection above.</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2"><p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">Employees in this report</p>
          <p className="mt-1 break-words text-sm font-semibold">{report.names.join(", ") || (report.generalExpenses.length ? "General business expenses" : selectedEmployee?.name ?? "No saved entries")}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        {canShare ? <a href={whatsAppShareUrl(message)} target="_blank" rel="noopener noreferrer" onClick={() => setCopyStatus("")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700">
          <WhatsAppIcon />Send on WhatsApp
        </a> : <button disabled type="button" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500/40 px-4 py-3 text-sm font-bold text-white"><WhatsAppIcon />{disabled ? "Loading saved report…" : "Send on WhatsApp"}</button>}
        <button type="button" disabled={!canShare} onClick={() => void copyReport()} className="min-h-12 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white active:bg-white/20 disabled:opacity-40">Copy report</button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-indigo-200">One tap opens WhatsApp with this report ready. Choose a contact and tap Send in WhatsApp.</p>
    </div>
    {copyStatus && <p role="status" className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-800">{copyStatus}</p>}
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div><p className="text-xs font-medium text-slate-400">REPORT PREVIEW</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{report.period}</p></div>
        <span className="text-xs text-slate-500">{report.totals.entries} delivery {report.totals.entries === 1 ? "entry" : "entries"} · {report.totals.expenseEntries} expense {report.totals.expenseEntries === 1 ? "entry" : "entries"}</span>
      </div>
      {disabled ? <p className="py-5 text-center text-sm text-slate-400">Waiting for saved data. The report cannot be shared while records are loading.</p>
        : !report.hasData ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No saved entries for this selection. Choose another month or add delivery/expense entries first.</p>
        : <div className="space-y-4">
          {report.employees.map((person) => <EmployeeReport key={person.employee.id} person={person} />)}
          {!!report.generalExpenses.length && <section aria-label="General business expense report" className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 sm:p-4"><h4 className="mb-2 text-sm font-semibold text-amber-900">General business expenses</h4>
            <ul className="space-y-2">{report.generalExpenses.map((expense) => <li key={expense.id} className="flex flex-wrap justify-between gap-2 text-sm"><div className="min-w-0"><p className="text-slate-700">{REPORT_MONTHS[expense.month - 1]} {expense.year}</p>{expense.notes && <p className="mt-0.5 break-words text-xs text-slate-500">{expense.notes}</p>}</div><span className="font-semibold text-rose-700">{reportMoney(Number(expense.amount))}</span></li>)}</ul>
            <p className="mt-3 text-[11px] text-amber-800">Deducted once from the final business total, not from each employee.</p>
          </section>}
          <section aria-label="Final report totals" data-testid="final-report-totals" className="rounded-xl border border-indigo-100 bg-slate-50 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700">Final totals</h4>
            <dl className="space-y-2.5 text-sm"><AmountRow label="Total deliveries" value={report.totals.deliveries.toLocaleString("en-IN")} />
              <AmountRow label="Total value" value={reportMoney(report.totals.total)} />
              <AmountRow label="Total expenses value" value={reportMoney(report.totals.expenses)} expense />
              <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-3 ${report.totals.net < 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"}`}><dt className="text-sm font-semibold">Remaining value</dt><dd className="break-all text-xl font-bold tabular-nums">{reportMoney(report.totals.net)}</dd></div>
            </dl><p className="mt-2 text-[11px] text-slate-500">Remaining = Total value − Total expenses</p>
          </section>
        </div>}
      {report.missingExpenses && !disabled && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">Some monthly expenses are not entered yet. They are shown as “Not entered”, and remaining value may change.</p>}
      {message.length > 8000 && canShare && <p className="mt-3 text-xs leading-relaxed text-slate-500">This is a long report. If WhatsApp does not open the full message, use Copy report or select one month.</p>}
      {canShare && <details className="mt-4 rounded-xl border border-slate-200"><summary className="cursor-pointer px-3 py-3 text-xs font-semibold text-slate-600">View WhatsApp message</summary><pre data-testid="whatsapp-message-preview" className="max-h-80 select-text overflow-y-auto whitespace-pre-wrap break-words border-t border-slate-100 px-3 py-3 font-sans text-xs leading-relaxed text-slate-700">{message}</pre></details>}
    </div>
  </section>;
}

function EmployeeReport({ person }: { person: FinalReportEmployee }) {
  let entry = 0;
  return <article data-testid={`share-employee-${person.employee.id}`} className="overflow-hidden rounded-xl border border-slate-200">
    <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/70 px-3 py-3 sm:px-4"><h4 className="break-words text-sm font-bold text-indigo-900">{person.employee.name}</h4><span className="text-xs text-indigo-700">{person.totals.deliveries.toLocaleString("en-IN")} deliveries</span></div>
    <div className="divide-y divide-slate-100">{person.months.map((month) => {
      const firstEntry = entry + 1; entry += month.reports.length;
      return <MonthReport key={month.month} month={month} firstEntry={firstEntry} />;
    })}</div>
    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50 px-3 py-3 sm:grid-cols-3 sm:px-4">
      <SmallTotal label="Total value" value={person.totals.total} />
      <SmallTotal label="Total expenses" value={person.totals.expenses} expense />
      <SmallTotal label="Remaining value" value={person.totals.net} remaining />
    </div>
  </article>;
}
function MonthReport({ month, firstEntry }: { month: FinalReportMonth; firstEntry: number }) {
  return <section data-testid={`share-month-${month.month}`} className="px-3 py-4 sm:px-4">
    <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">{month.label}</h5>
    {month.reports.length ? <ol className="space-y-3">{month.reports.map((row, index) => <li key={row.id} className="rounded-lg border border-slate-100 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">Entry {firstEntry + index} · {cycleDayRange(row.cycle, row.year, row.month)}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">Cycle {row.cycle}</span></div>
      <dl className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3"><EntryValue label="Deliveries" value={row.deliveries.toLocaleString("en-IN")} /><EntryValue label="Price / delivery" value={reportMoney(Number(row.pricePerDelivery))} /><EntryValue label="Total price" value={reportMoney(Number(row.totalValue))} strong /></dl>
      {row.notes && <p className="mt-2 break-words text-[11px] leading-relaxed text-slate-500">Note: {row.notes}</p>}
    </li>)}</ol> : <p className="mb-3 text-xs text-slate-400">No delivery entries for this month.</p>}
    <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-3"><div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-medium text-slate-600">Monthly expenses</span><strong className={month.expenses.length ? "text-rose-700" : "text-amber-700"}>{month.expenses.length ? reportMoney(month.totals.expenses) : "Not entered"}</strong></div>
      {month.expenses.map((expense) => expense.notes ? <p key={expense.id} className="mt-1 break-words text-[11px] text-slate-500">{expense.notes}</p> : null)}
    </div>
    <dl className="mt-3 space-y-1.5 text-xs"><AmountRow label="Month delivery value" value={reportMoney(month.totals.total)} /><AmountRow label="Month remaining" value={reportMoney(month.totals.net)} /></dl>
  </section>;
}
function EntryValue({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="min-w-0"><dt className="text-[10px] text-slate-500">{label}</dt><dd className={`mt-0.5 break-all text-sm font-semibold tabular-nums ${strong ? "text-indigo-700" : "text-slate-800"}`}>{value}</dd></div>;
}
function AmountRow({ label, value, expense = false }: { label: string; value: string; expense?: boolean }) {
  return <div className="flex items-start justify-between gap-3"><dt className="min-w-0 text-slate-500">{label}</dt><dd className={`break-all text-right font-semibold tabular-nums ${expense ? "text-rose-700" : "text-slate-800"}`}>{value}</dd></div>;
}
function SmallTotal({ label, value, expense, remaining }: { label: string; value: number; expense?: boolean; remaining?: boolean }) {
  return <div className="min-w-0"><p className="text-[10px] text-slate-500">{label}</p><p className={`mt-0.5 break-all text-sm font-bold tabular-nums ${expense || value < 0 ? "text-rose-700" : remaining ? "text-emerald-700" : "text-indigo-700"}`}>{reportMoney(value)}</p></div>;
}
function WhatsAppIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.3-4.5a8.5 8.5 0 1 1 16.2-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8.4 7.4c-.6 0-1 1-1 1.6 0 2.8 4 6.4 6.7 6.4.9 0 1.8-.8 1.8-1.5 0-.3-1.8-1.2-2.1-1.2-.4 0-.7.8-1 .8-.9 0-3.2-2-3.2-2.8 0-.3.7-.7.7-1.1 0-.3-.8-2.2-1.2-2.2Z" fill="currentColor" /></svg>;
}
function legacyCopy(text: string) {
  const input = document.createElement("textarea"); input.value = text; input.readOnly = true;
  input.style.position = "fixed"; input.style.left = "-9999px";
  document.body.appendChild(input); input.select();
  const copied = document.execCommand("copy"); input.remove();
  if (!copied) throw new Error("Clipboard blocked");
}
