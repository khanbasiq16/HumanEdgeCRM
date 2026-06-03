"use client";
import React, { useMemo, useState } from "react";
import CheckInTable  from "../Tables/CheckInTable";
import CheckOutTable from "../Tables/CheckOutTable";
import AttendanceGraphs from "@/app/utils/basecomponents/AttendanceGraphs";
import {
  CalendarDays, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight, TrendingUp,
  Download, FileSpreadsheet, FileText, ChevronDown,
} from "lucide-react";

/* working days in a given month (Mon–Sat, excludes Sundays) */
const getWorkingDays = (month, year) => {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() !== 0) count++;
  }
  return count;
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];


const STATUS_STYLE = {
  "On Time":           "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Late":              "bg-amber-50 text-amber-700 border-amber-200",
  "Half Day":          "bg-blue-50 text-blue-700 border-blue-200",
  "Short Day":         "bg-violet-50 text-violet-700 border-violet-200",
  "Early Check Out":   "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Late Check Out":    "bg-violet-50 text-violet-700 border-violet-200",
  "On Time Check Out": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Absent":            "bg-red-50 text-red-700 border-red-200",
};


const Listattendance = ({ attendance, employee }) => {
  const now = new Date();

  const [selMonth, setSelMonth] = useState(now.getMonth() + 1); // 1-12
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("checkin");

  /* ── month navigation ─────────────────────────────────── */
  const isCurrentMonth =
    selYear === now.getFullYear() && selMonth === now.getMonth() + 1;

  const goPrev = () => {
    if (selMonth === 1) { setSelMonth(12); setSelYear((y) => y - 1); }
    else setSelMonth((m) => m - 1);
  };

  const goNext = () => {
    if (isCurrentMonth) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear((y) => y + 1); }
    else setSelMonth((m) => m + 1);
  };

  /* ── filtered data for selected month ────────────────── */
  const monthAttendance = useMemo(() =>
    (attendance || []).filter((a) => {
      const [, m, y] = a.date.split("/").map(Number);
      return m === selMonth && y === selYear;
    }),
  [attendance, selMonth, selYear]);

  const monthCheckins = useMemo(() =>
    monthAttendance
      .map((item) => ({
        id: item.id,
        date: item.date,
        ...item.checkin,
        checkoutTime: item.checkout?.time || null,
      }))
      .reverse(),
  [monthAttendance]);

  const monthCheckouts = useMemo(() =>
    monthAttendance
      .map((item) => ({ id: item.id, date: item.date, ...item.checkout }))
      .reverse(),
  [monthAttendance]);

  /* ── stats ────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const workDays   = getWorkingDays(selMonth, selYear);
    const present    = monthAttendance.filter((a) => a.checkin?.status && a.checkin?.status !== "Absent").length;
    return {
      total:  monthAttendance.length,
      onTime: monthAttendance.filter((a) => a.checkin?.status === "On Time").length,
      late:   monthAttendance.filter((a) =>
        ["Late", "Short Day", "Half Day"].includes(a.checkin?.status)
      ).length,
      absent:  monthAttendance.filter((a) => a.checkin?.status === "Absent").length,
      rate:    workDays > 0 ? Math.round((present / workDays) * 100) : 0,
    };
  }, [monthAttendance, selMonth, selYear]);

  /* ── status chips for selected month ─────────────────── */
  const statusCounts = useMemo(() => {
    const counts = {};
    monthAttendance.forEach((a) => {
      const s = activeTab === "checkin" ? a.checkin?.status : a.checkout?.status;
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [monthAttendance, activeTab]);

  /* ── export helpers ──────────────────────────────────── */
  const [exportOpen, setExportOpen] = useState(false);

  const parseMins = (str) => {
    if (!str || str === "N/A" || str === "—") return null;
    const parts = str.trim().split(" ");
    if (parts.length < 2) return null;
    let [h, m] = parts[0].split(":").map(Number);
    const mer = parts[1].toUpperCase();
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const duration = (ci, co) => {
    const a = parseMins(ci), b = parseMins(co);
    if (a === null || b === null) return "—";
    let d = b - a;
    if (d < 0) d += 1440;
    return `${Math.floor(d / 60)}h ${(d % 60).toString().padStart(2, "0")}m`;
  };

  const exportRows = () =>
    monthAttendance.map((a) => ({
      Date:               a.date,
      "Check In Time":    a.checkin?.time    || "—",
      "Check In Status":  a.checkin?.status  || "—",
      "Check Out Time":   a.checkout?.time   || "—",
      "Check Out Status": a.checkout?.status || "—",
      "Hours Worked":     duration(a.checkin?.time, a.checkout?.time),
      "Note":             a.checkin?.note    || "—",
    }));

  const handleExcelExport = async () => {
    const xlsxModule = await import("xlsx");
    const XLSX = xlsxModule.default ?? xlsxModule;
    const ws   = XLSX.utils.json_to_sheet(exportRows());
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${MONTH_NAMES[selMonth - 1]}_${selYear}.xlsx`);
    setExportOpen(false);
  };

  const handlePDFExport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc  = new jsPDF({ orientation: "landscape" });
    const cols = ["Date", "Check In", "CI Status", "Check Out", "CO Status", "Hours", "Note"];
    const widths = [22, 22, 28, 22, 32, 20, 50];

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Attendance Report — ${MONTH_NAMES[selMonth - 1]} ${selYear}`, 14, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total: ${stats.total}   On Time: ${stats.onTime}   Late/Short: ${stats.late}   Absent: ${stats.absent}   Rate: ${stats.rate}%`,
      14, 21
    );

    let y = 33;
    // header row
    doc.setFillColor(37, 99, 235);
    doc.rect(14, y - 5, 269, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let x = 14;
    cols.forEach((c, i) => { doc.text(c, x + 1, y); x += widths[i]; });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    exportRows().forEach((row, idx) => {
      y += 7;
      if (y > 190) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y - 5, 269, 7, "F");
      }
      x = 14;
      Object.values(row).forEach((val, i) => {
        const txt = String(val).slice(0, i === 6 ? 28 : 16);
        doc.setFontSize(8);
        doc.text(txt, x + 1, y);
        x += widths[i];
      });
    });

    doc.save(`Attendance_${MONTH_NAMES[selMonth - 1]}_${selYear}.pdf`);
    setExportOpen(false);
  };

  const STAT_CARDS = [
    { label: "This Month",   value: stats.total,       icon: CalendarDays, bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100"    },
    { label: "On Time",      value: stats.onTime,      icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    { label: "Late / Short", value: stats.late,        icon: Clock,        bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100"   },
    { label: "Absent",       value: stats.absent,      icon: XCircle,      bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100"     },
    { label: "Attendance %", value: `${stats.rate}%`,  icon: TrendingUp,   bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-100"  },
  ];

  /* ── empty state ──────────────────────────────────────── */
  if (!attendance?.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center py-20 gap-3 text-slate-400">
        <CalendarDays size={36} className="text-slate-200" />
        <p className="text-sm font-semibold">No attendance records yet</p>
        <p className="text-xs">Records will appear here once you start checking in</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Export button ─────────────────────────────── */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setExportOpen((o) => !o)}
            className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          >
            <Download size={14} />
            Export
            <ChevronDown size={13} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                <button
                  onClick={handleExcelExport}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet size={14} className="text-emerald-500 shrink-0" />
                  Export Excel
                </button>
                <button
                  onClick={handlePDFExport}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText size={14} className="text-red-500 shrink-0" />
                  Export PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, bg, text, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} px-4 py-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={18} className={text} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Absence formula rules ─────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Absence Rules:</span>
        {[
          { label: "Late",      count: 3, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Half Day",  count: 2, color: "bg-blue-50 border-blue-200 text-blue-700"   },
          { label: "Short Day", count: 3, color: "bg-violet-50 border-violet-200 text-violet-700" },
        ].map(({ label, count, color }) => (
          <span key={label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${color}`}>
            {count} {label} = 1 Absent
          </span>
        ))}
      </div>

      {/* ── Main card ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80">

        {/* Header: tabs + month nav */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-wrap gap-3">

          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {[
                { id: "checkin",  label: "Check In"  },
                { id: "checkout", label: "Check Out" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                    ${activeTab === id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status chips */}
            {Object.keys(statusCounts).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    {status} <span className="font-extrabold">·{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-sm font-bold text-slate-700 min-w-[110px] text-center tabular-nums">
              {MONTH_NAMES[selMonth - 1]} {selYear}
            </span>

            <button
              onClick={goNext}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">

          {/* Chart — passes selected month/year */}
          <AttendanceGraphs
            data={attendance}
            activeTab={activeTab}
            selMonth={selMonth}
            selYear={selYear}
          />

          <div className="border-t border-slate-100" />

          {/* Table — pre-filtered to selected month */}
          {activeTab === "checkin"
            ? <CheckInTable  data={monthCheckins}  />
            : <CheckOutTable data={monthCheckouts} />
          }

        </div>
      </div>

    </div>
  );
};

export default Listattendance;
