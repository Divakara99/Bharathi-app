"use client";

import { useState } from "react";
import type { EmployeeRow } from "@/lib/delivery-totals";

export default function FullExportDownloads({ year, employees }: { year: number; employees: EmployeeRow[] }) {
  const [allYears, setAllYears] = useState(true);
  const [employeeId, setEmployeeId] = useState("all");
  const [busy, setBusy] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectCls = "h-12 w-full min-w-0 rounded-xl border border-indigo-200 bg-white px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 md:h-10 md:text-sm";

  const download = async (format: "csv" | "xlsx") => {
    if (busy) return;
    setBusy(format); setError(""); setMessage("");
    try {
      const params = new URLSearchParams({ format, year: allYears ? "all" : String(year), employeeId });
      const response = await fetch(`/api/export?${params}`, { cache: "no-store", signal: AbortSignal.timeout(90000) });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Download failed. Please try again.");
      }
      const blob = await response.blob();
      const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `Bharathi-Enterprises-Full-Details.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(`${format === "xlsx" ? "Excel" : "CSV"} download started. Check your device’s Downloads folder.`);
    } catch (err) {
      setError(err instanceof Error && err.name === "TimeoutError" ? "The export took too long. Try selecting a single year." : err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally { setBusy(null); }
  };

  return <section aria-labelledby="full-export-title" className="my-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
    <h3 id="full-export-title" className="text-base font-semibold text-indigo-900">Download all details</h3>
    <p className="mb-3 mt-1 text-xs leading-relaxed text-indigo-800">Employee list, every 15-day delivery report, per-delivery prices, monthly expenses, notes, dates, and monthly/yearly totals with net earnings. Excel includes separate sheets; CSV includes all sections.</p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block min-w-0"><span className="mb-1 block text-xs font-medium text-indigo-900">Export period</span>
        <select aria-label="Full export period" disabled={!!busy} value={allYears ? "all" : "selected"} onChange={(event) => setAllYears(event.target.value === "all")} className={selectCls}>
          <option value="all">All saved years — complete details</option><option value="selected">Selected year ({year})</option>
        </select>
      </label>
      <label className="block min-w-0"><span className="mb-1 block text-xs font-medium text-indigo-900">Export employees</span>
        <select aria-label="Full export employees" disabled={!!busy} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className={selectCls}>
          <option value="all">All employees + general expenses</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
      </label>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" disabled={!!busy} onClick={() => void download("csv")} className="min-h-12 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow active:bg-indigo-800 disabled:opacity-60">{busy === "csv" ? "Preparing CSV…" : "Download full CSV"}</button>
      <button type="button" disabled={!!busy} onClick={() => void download("xlsx")} className="min-h-12 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow active:bg-emerald-800 disabled:opacity-60">{busy === "xlsx" ? "Preparing Excel…" : "Download full Excel (.xlsx)"}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
    {message && <p role="status" className="mt-3 text-xs font-medium text-emerald-800">{message}</p>}
  </section>;
}
