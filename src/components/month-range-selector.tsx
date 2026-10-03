"use client";

import { monthRangeLabel, RANGE_MONTHS } from "@/lib/report-range";

export default function MonthRangeSelector({ year, fromMonth, toMonth, onChange }: {
  year: number;
  fromMonth: number;
  toMonth: number;
  onChange: (fromMonth: number, toMonth: number) => void;
}) {
  const selectClass = "h-12 w-full rounded-xl border border-indigo-200 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 md:h-11 md:text-sm";
  return <section aria-label="Report month range" className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="text-sm font-semibold text-indigo-900">From month → To month</h3><p className="mt-1 text-xs leading-relaxed text-slate-600">Used for this summary, WhatsApp, CSV and Excel downloads. Both months included.</p></div>
      <button type="button" onClick={() => onChange(1, 12)} className="min-h-10 rounded-lg bg-white px-3 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 active:bg-indigo-100">Full year</button>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <label className="min-w-0"><span className="mb-1 block text-xs font-medium text-indigo-900">From month</span><select aria-label="Report from month" value={fromMonth} onChange={(event) => { const value = Number(event.target.value); onChange(value, Math.max(value, toMonth)); }} className={selectClass}>
        {RANGE_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
      </select></label>
      <label className="min-w-0"><span className="mb-1 block text-xs font-medium text-indigo-900">To month</span><select aria-label="Report to month" value={toMonth} onChange={(event) => { const value = Number(event.target.value); onChange(Math.min(fromMonth, value), value); }} className={selectClass}>
        {RANGE_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
      </select></label>
    </div>
    <p className="mt-3 break-words text-xs font-semibold text-indigo-800">Selected: {monthRangeLabel(year, { fromMonth, toMonth })}</p>
  </section>;
}
