"use client";
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Download, Calendar, CheckCircle2, XCircle,
  AlertTriangle, TrendingDown, Search, ChevronDown,
  Landmark, CreditCard, Building2,
} from "lucide-react";
import MonthPicker from "../basecomponent/MonthPicker";
import * as XLSX from "xlsx";

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

const calculateTax = (basicSalary) => {
  const annualSalary = basicSalary * 12;
  let annualTax = 0;
  if      (annualSalary <= 600000)  annualTax = 0;
  else if (annualSalary <= 1200000) annualTax = (annualSalary - 600000) * 0.01;
  else if (annualSalary <= 2200000) annualTax = 6000   + (annualSalary - 1200000) * 0.11;
  else if (annualSalary <= 3200000) annualTax = 116000  + (annualSalary - 2200000) * 0.23;
  else if (annualSalary <= 4100000) annualTax = 346000  + (annualSalary - 3200000) * 0.30;
  else                              annualTax = 616000  + (annualSalary - 4100000) * 0.35;
  return Math.round(annualTax / 12);
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
    if      (ci === "On Time")   c.onTime++;
    else if (ci === "Late")      c.late++;
    else if (ci === "Half Day")  c.halfDay++;
    else if (ci === "Short Day") c.shortDay++;
    else if (ci === "Absent")    c.absent++;
    if      (co === "Early Check Out")      c.earlyOut++;
    else if (co === "Late Check Out")       c.lateOut++;
    else if (co === "On Time Check Out")    c.onTimeOut++;
  });

  c.present = c.onTime + c.late + c.halfDay + c.shortDay;

  let effectiveAbsent = c.absent;
  Object.entries(ABSENT_CONV).forEach(([status, { count, toAbsent }]) => {
    const key = status === "Half Day" ? "halfDay" : status === "Short Day" ? "shortDay" : "late";
    effectiveAbsent += Math.floor(c[key] / count) * toAbsent;
  });
  c.effectiveAbsent = effectiveAbsent;

  return c;
};

const monthLabel = (monthStr) => {
  if (!monthStr) return "All Months";
  const [y, m] = monthStr.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString("en-PK", { month: "long", year: "numeric" });
};

/* ── stat chip ────────────────────────────────────────────── */
const Chip = ({ label, val, cls }) => (
  <div className={`rounded-xl border px-3 py-2.5 text-center min-w-[70px] ${cls}`}>
    <p className="text-lg font-extrabold tabular-nums leading-tight">{val}</p>
    <p className="text-[10px] font-semibold opacity-70 mt-0.5 whitespace-nowrap">{label}</p>
  </div>
);

/* ── exports ──────────────────────────────────────────────── */
const exportSalaryXLSX = (rows, month) => {
  const data = rows.map((r) => ({
    "Employee":           r.name,
    "Department":         r.department,
    "Bank Name":          r.bankName,
    "Bank Code":          r.bankCode,
    "Account Number":     r.bankAccountNumber,
    "Total Days":         r.total,
    "Present":            r.present,
    "Absent":             r.absent,
    "On Time":            r.onTime,
    "Late":               r.late,
    "Half Day":           r.halfDay,
    "Short Day":          r.shortDay,
    "Early Checkout":     r.earlyOut,
    "Late Checkout":      r.lateOut,
    "Effective Absent":   r.effectiveAbsent,
    "Gross Salary (PKR)": r.salary,
    "Deduction (PKR)":    r.deduction,
    "Tax (PKR)":          r.monthlyTax,
    "Net Payable (PKR)":  r.netPayable,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({
    wch: Math.max(k.length, ...data.map((r) => String(r[k] ?? "").length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
  XLSX.writeFile(wb, `salary-report-${month || "all"}.xlsx`);
};

const exportBankXLSX = (rows, month) => {
  const ref1 = `Salary Payment - ${monthLabel(month)}`;
  const data = rows.map((r) => ({
    "Beneficiary First Name": r.name,
    "Beneficiary Account No": r.bankAccountNumber || "",
    "Bank":                   r.bankCode          || "",
    "Transaction Amount":     r.netPayable,
    "Reference # 1":          ref1,
    "Reference # 9":          r.cnic || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({
    wch: Math.max(k.length, ...data.map((r) => String(r[k] ?? "").length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bank Transfer");
  XLSX.writeFile(wb, `bank-transfer-${month || "all"}.xlsx`);
};

/* ── main component ───────────────────────────────────────── */
export default function MonthlyAttendanceReport() {
  const { employees } = useSelector((s) => s.Employee);
  const [month,      setMonth]      = useState("");
  const [search,     setSearch]     = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTab,  setActiveTab]  = useState("report"); // "report" | "bank"

  const rows = useMemo(() => {
    if (!employees?.length) return [];
    const daysInMonth = getDaysInMonth(month);

    return employees
      .filter((e) => e.status !== "deactivate")
      .map((emp) => {
        const s          = calcStats(emp.Attendance || [], month);
        const salary     = parseFloat(emp.employeeSalary) || 0;
        const perDay     = salary / daysInMonth;
        const deduction  = Math.round(perDay * s.effectiveAbsent);
        const monthlyTax = calculateTax(salary);
        return {
          id:               emp.employeeId || emp.id,
          name:             emp.employeeName      || "—",
          department:       emp.department?.departmentName || emp.department || "—",
          bankName:         emp.bankName          || "—",
          bankCode:         emp.bankCode          || "—",
          bankAccountNumber:emp.bankAccountNumber || "—",
          cnic:             emp.employeeCNIC       || "",
          salary,
          deduction,
          monthlyTax,
          netPayable:       Math.max(0, salary - deduction - monthlyTax),
          ...s,
        };
      })
      .filter((r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase())
      );
  }, [employees, month, search]);

  const totals = useMemo(() => ({
    present:         rows.reduce((a, r) => a + r.present,         0),
    absent:          rows.reduce((a, r) => a + r.absent,          0),
    late:            rows.reduce((a, r) => a + r.late,            0),
    halfDay:         rows.reduce((a, r) => a + r.halfDay,         0),
    effectiveAbsent: rows.reduce((a, r) => a + r.effectiveAbsent, 0),
    deduction:       rows.reduce((a, r) => a + r.deduction,       0),
    monthlyTax:      rows.reduce((a, r) => a + r.monthlyTax,      0),
    netPayable:      rows.reduce((a, r) => a + r.netPayable,      0),
  }), [rows]);

  const tabs = [
    { id: "report", label: "Monthly Report" },
    { id: "bank",   label: "Bank Transfer"  },
  ];

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
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-40"
            >
              <Download size={13} /> Export <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-20 bg-white border border-slate-200 rounded-xl shadow-lg w-52 overflow-hidden">
                <button
                  onClick={() => { exportSalaryXLSX(rows, month); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-emerald-600 font-bold text-xs">XLS</span> Salary Report
                </button>
                <button
                  onClick={() => { exportBankXLSX(rows, month); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <span className="text-blue-600 font-bold text-xs">XLS</span> Bank Transfer Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Chip label="Present"     val={totals.present}          cls="bg-emerald-50  border-emerald-200 text-emerald-700" />
        <Chip label="Absent"      val={totals.absent}           cls="bg-red-50      border-red-200     text-red-700"     />
        <Chip label="Late"        val={totals.late}             cls="bg-amber-50    border-amber-200   text-amber-700"   />
        <Chip label="Half Day"    val={totals.halfDay}          cls="bg-blue-50     border-blue-200    text-blue-700"    />
        <Chip label="Eff. Absent" val={totals.effectiveAbsent}  cls="bg-orange-50   border-orange-200  text-orange-700"  />
        <Chip label="Deduction"   val={`PKR ${totals.deduction.toLocaleString()}`}  cls="bg-rose-50    border-rose-200   text-rose-700"   />
        <Chip label="Tax"         val={`PKR ${totals.monthlyTax.toLocaleString()}`} cls="bg-purple-50  border-purple-200 text-purple-700" />
        <Chip label="Net Payable" val={`PKR ${totals.netPayable.toLocaleString()}`} cls="bg-violet-50  border-violet-200 text-violet-700" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Monthly Report Tab ── */}
      {activeTab === "report" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    "Employee", "Department",
                    "Bank Name", "Bank Code", "Account No",
                    "Total Days", "Present", "Absent", "On Time", "Late",
                    "Half Day", "Short Day", "Early Out", "Late Out", "Eff. Absent",
                    "Gross Salary", "Deduction", "Tax", "Net Payable",
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
                    <td colSpan={19} className="px-4 py-14 text-center text-sm text-slate-400">
                      {month ? "No records for this month." : "Select a month to view the report."}
                    </td>
                  </tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.department}</td>
                    {/* Bank info */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <Landmark size={11} className="text-slate-400 shrink-0" />
                        {r.bankName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{r.bankCode}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                        <CreditCard size={11} className="text-slate-400 shrink-0" />
                        {r.bankAccountNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{r.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} />{r.present}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <XCircle size={10} />{r.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{r.onTime}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{r.late}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{r.halfDay}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">{r.shortDay}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">{r.earlyOut}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">{r.lateOut}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                        r.effectiveAbsent > 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {r.effectiveAbsent > 0 && <AlertTriangle size={9} />}{r.effectiveAbsent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      {r.salary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-bold ${r.deduction > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {r.deduction > 0 ? `- ${r.deduction.toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-bold ${r.monthlyTax > 0 ? "text-purple-600" : "text-slate-400"}`}>
                        {r.monthlyTax > 0 ? `- ${r.monthlyTax.toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {r.netPayable.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bank Transfer Tab ── */}
      {activeTab === "bank" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Bank transfer sheet for <span className="font-semibold text-slate-700">{monthLabel(month)}</span> — {rows.length} employees
            </p>
            <button
              onClick={() => exportBankXLSX(rows, month)}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-40"
            >
              <Download size={13} /> Export Bank Transfer Sheet
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[
                      "#",
                      "Beneficiary First Name",
                      "Beneficiary Account No",
                      "Bank",
                      "Transaction Amount",
                      "Reference # 1",
                      "Reference # 9 (CNIC)",
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
                      <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-400">
                        {month ? "No records for this month." : "Select a month to view the report."}
                      </td>
                    </tr>
                  ) : rows.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm ${r.bankAccountNumber === "—" ? "text-red-400 text-xs" : "text-slate-700"}`}>
                          {r.bankAccountNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${r.bankCode === "—" ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600"}`}>
                          {r.bankCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                        PKR {r.netPayable.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        Salary Payment - {monthLabel(month)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {r.cnic || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Payable</td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-800 whitespace-nowrap">
                        PKR {totals.netPayable.toLocaleString()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {rows.some((r) => r.bankAccountNumber === "—" || r.bankCode === "—") && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              Some employees are missing bank details (shown in red). Update their profiles before exporting.
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><TrendingDown size={11} className="text-orange-500" /> <strong>Eff. Absent</strong> = Absent + Late÷3 + HalfDay÷2 + ShortDay÷3</span>
        <span><strong>Deduction</strong> = (Salary ÷ Days in month) × Eff. Absent</span>
        <span><strong>Tax</strong> = Pakistan Income Tax slab on annual salary ÷ 12</span>
        <span><strong>Net Payable</strong> = Gross − Deduction − Tax</span>
      </div>
    </div>
  );
}
