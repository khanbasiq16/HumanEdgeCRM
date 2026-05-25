"use client";
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";

const COLOR_MAP = {
  "On Time":           "#22c55e",
  "Late":              "#eab308",
  "Half Day":          "#f97316",
  "Short Day":         "#a855f7",
  "Early Check Out":   "#3b82f6",
  "Late Check Out":    "#a855f7",
  "On Time Check Out": "#22c55e",
  "Absent":            "#ef4444",
};

const LEGEND = [
  { label: "On Time",      color: "#22c55e" },
  { label: "Late",         color: "#eab308" },
  { label: "Half / Short", color: "#a855f7" },
  { label: "Absent",       color: "#ef4444" },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CustomTooltip = ({ active, payload, selMonth, selYear }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-800">
        {String(d.date).padStart(2, "0")}/{String(selMonth).padStart(2, "0")}/{selYear}
      </p>
      <p className="mt-0.5 font-semibold" style={{ color: d.color }}>
        {d.status || "No Data"}
      </p>
    </div>
  );
};

const AttendanceGraphs = ({ data, activeTab = "checkin", selMonth, selYear }) => {
  if (!data || data.length === 0) return null;

  /* fall back to current month if props not provided */
  const now   = new Date();
  const month = selMonth ?? (now.getMonth() + 1);
  const year  = selYear  ?? now.getFullYear();

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName   = MONTH_NAMES[month - 1];

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const rec = data.find((a) => {
      const [d, m, y] = a.date.split("/").map(Number);
      return d === day && m === month && y === year;
    });
    const status = rec
      ? activeTab === "checkin" ? rec.checkin?.status : rec.checkout?.status
      : null;
    return {
      date:  day,
      status,
      count: status ? 1 : 0,
      color: status ? (COLOR_MAP[status] || "#94a3b8") : "#e2e8f0",
    };
  });

  const presentDays = chartData.filter((d) => d.status && d.status !== "Absent").length;

  return (
    <div className="space-y-3">

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-700">
            {monthName} {year} &mdash; {activeTab === "checkin" ? "Check-In" : "Check-Out"} Overview
          </span>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {presentDays} / {daysInMonth} days
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGEND.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} maxBarSize={16} barCategoryGap="30%">
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis hide domain={[0, 1]} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
              content={<CustomTooltip selMonth={month} selYear={year} />}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default AttendanceGraphs;
