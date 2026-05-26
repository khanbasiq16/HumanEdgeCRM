"use client";
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Download, Users, Calendar, CheckCircle2, XCircle,
  Clock, AlertTriangle, TrendingDown, Search,
} from "lucide-react";
import MonthPicker from "../basecomponent/MonthPicker";

/* ── helpers ──────────────────────────────────────────────── */
const getDaysInMonth = (monthStr) => {
  if (!monthStr) return 30;
  const [y, m] = monthStr.split("-");
  return new Date(Number(y), Number(m), 0).getDate();
};

const ABSENT_CONV = {
  Late:        { count: 3, toAbsent: 1 },
  "Half Day":  { count: 2, toAbsent: 1 },
  "Short Day": { count: 3, toAbsent: 1 },
};

const calcStats = (attendance, monthStr) => {
  const list = monthStr
    ? attendance.filter((a) => {
        const parts = a.date?.split("/");
        if (!parts || parts.length < 3) return false;
        return `${parts[2]}-${parts[1]}` === monthStr;
      })
    : attendance;

  const c = {
    total: list.length,
    onTime: 0, late: 0, halfDay: 0, shortDay: 0, absent: 0,
    earlyOut: 0, lateOut: 0, onTimeOut: 0,
  };

  list.forEach((a) => {
    const ci = a.checkin?.status  || "Absent";
    const co = a.checkout?.status || "";
    if (ci === "On Time")   c.onTime++;
    else if (ci === "Late")       c.late++;
    else if (ci === "Half Day")   c.halfDay++;
    else if (ci === "Short Day")  c.shortDay++;
    else if (ci === "Absent")     c.absent++;

    if (co === "Early Check Out")    c.earlyOut++;
    else if (co === "Late Check Out")  c.lateOut++;
    else if (co === "On Time Check Out") c.onTimeOut++;
  });

  c.present = c.onTime + c.late + c.halfDay + c.shortDay;

  let effectiveAbsent = c.absent;
  Object.entries(ABSENT_CONV).forEach(([status, { count, toAbsent }]) => {
    effectiveAbsent += Math.floor(c[status === "Half Day" ? "halfDay" : status === "Short Day" ? "shortDay" : "late"] / count) * toAbsent;
  });
  c.effectiveAbsent = effectiveAbsent;

  return c;
};

/* ── stat chip ────────────────────────────────────────────── */
const Chip = ({ label, val, cls }) => (
  <div className={`rounded-xl border px-3 py-2.5 text-center min-w-[70px] ${cls}`}>
    <p className="text-lg font-extrabold tabular-nums leading-tight">{val}</p>
    <p className="text-[10px] font-semibold opacity-70 mt-0.5 whitespace-nowrap">{label}</p>
  </div>
);

/* ── CSV export ───────────────────────────────────────────── */
const exportCSV = (rows, month) => {
  const headers = [
    "Employee", "Department", "Total Days", "Present", "Absent",
    "On Time", "Late", "Half Day", "Short Day",
    "Early Checkout", "Late Checkout", "Effective Absent",
    "Salary (PKR)", "Deduction (PKR)", "Net Salary (PKR)",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.name}"`, `"${r.department}"`, r.total, r.present, r.absent,
        r.onTime, r.late, r.halfDay, r.shortDay,
        r.earlyOut, r.lateOut, r.effectiveAbsent,
        r.salary, r.deduction, r.netSalary,
      ].join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `attendance-report-${month || "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── main component ───────────────────────────────────────── */
export default function MonthlyAttendanceReport() {
  const { employees } = useSelector((s) => s.Employee);
  const [month,  setMonth]  = useState("");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!employees?.length) return [];
    const daysInMonth = getDaysInMonth(month);

    return employees
      .filter((e) => e.status !== "deactivate")
      .map((emp) => {
        const s = calcStats(emp.Attendance || [], month);
        const salary    = parseFloat(emp.employeeSalary) || 0;
        const perDay    = salary / daysInMonth;
        const deduction = Math.round(perDay * s.effectiveAbsent);
        return {
          id:             emp.employeeId || emp.id,
          name:           emp.employeeName || "—",
          department:     emp.department?.departmentName || emp.department || "—",
          salary,
          deduction,
          netSalary:      salary - deduction,
          ...s,
        };
      })
      .filter((r) =>
        !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase())
      );
  }, [employees, month, search]);

  const totals = useMemo(() => ({
    present:        rows.reduce((a, r) => a + r.present, 0),
    absent:         rows.reduce((a, r) => a + r.absent,  0),
    late:           rows.reduce((a, r) => a + r.late,    0),
    halfDay:        rows.reduce((a, r) => a + r.halfDay, 0),
    effectiveAbsent:rows.reduce((a, r) => a + r.effectiveAbsent, 0),
    deduction:      rows.reduce((a, r) => a + r.deduction, 0),
    netSalary:      rows.reduce((a, r) => a + r.netSalary, 0),
  }), [rows]);

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="pl-8 h-9 w-48 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">{rows.length} employees</span>
          <button
            onClick={() => exportCSV(rows, month)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Chip label="Present"    val={totals.present}         cls="bg-emerald-50  border-emerald-200 text-emerald-700" />
        <Chip label="Absent"     val={totals.absent}          cls="bg-red-50      border-red-200     text-red-700"     />
        <Chip label="Late"       val={totals.late}            cls="bg-amber-50    border-amber-200   text-amber-700"   />
        <Chip label="Half Day"   val={totals.halfDay}         cls="bg-blue-50     border-blue-200    text-blue-700"    />
        <Chip label="Eff. Absent" val={totals.effectiveAbsent} cls="bg-orange-50  border-orange-200  text-orange-700"  />
        <Chip label="Deduction"  val={`PKR ${totals.deduction.toLocaleString()}`}  cls="bg-rose-50   border-rose-200   text-rose-700"    />
        <Chip label="Net Salary" val={`PKR ${totals.netSalary.toLocaleString()}`}  cls="bg-violet-50 border-violet-200 text-violet-700"  />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  "Employee", "Department", "Total Days",
                  "Present", "Absent", "On Time", "Late", "Half Day", "Short Day",
                  "Early Out", "Late Out", "Eff. Absent",
                  "Salary", "Deduction", "Net Salary",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-14 text-center text-sm text-slate-400">
                    {month ? "No records for this month." : "Select a month to view the report."}
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.department}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{r.total}</td>
                  {/* Present */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} />{r.present}
                    </span>
                  </td>
                  {/* Absent */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                      <XCircle size={10} />{r.absent}
                    </span>
                  </td>
                  {/* On Time */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{r.onTime}</span>
                  </td>
                  {/* Late */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{r.late}</span>
                  </td>
                  {/* Half Day */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{r.halfDay}</span>
                  </td>
                  {/* Short Day */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">{r.shortDay}</span>
                  </td>
                  {/* Early Out */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">{r.earlyOut}</span>
                  </td>
                  {/* Late Out */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">{r.lateOut}</span>
                  </td>
                  {/* Effective Absent */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      r.effectiveAbsent > 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {r.effectiveAbsent > 0 && <AlertTriangle size={9} />}{r.effectiveAbsent}
                    </span>
                  </td>
                  {/* Salary */}
                  <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {r.salary.toLocaleString()}
                  </td>
                  {/* Deduction */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={`font-bold ${r.deduction > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {r.deduction > 0 ? `- ${r.deduction.toLocaleString()}` : "—"}
                    </span>
                  </td>
                  {/* Net Salary */}
                  <td className="px-4 py-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {r.netSalary.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals row */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-700" colSpan={3}>Totals</td>
                  <td className="px-4 py-3 text-center text-emerald-700">{totals.present}</td>
                  <td className="px-4 py-3 text-center text-red-600">{totals.absent}</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-center text-amber-700">{totals.late}</td>
                  <td className="px-4 py-3 text-center text-blue-700">{totals.halfDay}</td>
                  <td className="px-4 py-3" colSpan={3} />
                  <td className="px-4 py-3 text-center text-orange-700">{totals.effectiveAbsent}</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-red-600">- {totals.deduction.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{totals.netSalary.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><TrendingDown size={11} className="text-orange-500" /> <strong>Eff. Absent</strong> = Absent + Late÷3 + HalfDay÷2 + ShortDay÷3</span>
        <span><strong>Deduction</strong> = (Salary ÷ Days in month) × Eff. Absent</span>
      </div>
    </div>
  );
}
