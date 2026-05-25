"use client";
import React from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

const COLOR_MAP = {
  "On Time":           "#22c55e",
  "Late":              "#eab308",
  "Half Day":          "#3b82f6",
  "Short Day":         "#a855f7",
  "Early Check Out":   "#06b6d4",
  "Late Check Out":    "#a855f7",
  "On Time Check Out": "#22c55e",
  "Absent":            "#ef4444",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-semibold text-slate-800">{name}</span>
      </div>
      <p className="text-slate-500 mt-0.5 pl-4.5">{value} day{value !== 1 ? "s" : ""}</p>
    </div>
  );
};

const Listallattendancewithgraph = ({ data, activeTab, selectedMonth }) => {
  if (!data || data.length === 0) return null;

  const statusCounts = data.reduce((acc, att) => {
    const status = activeTab === "checkin" ? att.checkin.status : att.checkout.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name:  status,
    value,
    color: COLOR_MAP[status] || "#9ca3af",
  }));

  const monthLabel = selectedMonth
    ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-800">Attendance Breakdown</p>
          {monthLabel && <p className="text-xs text-slate-400 mt-0.5">{monthLabel}</p>}
        </div>
        <span className="text-xs text-slate-400 font-medium">{data.length} total records</span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie chart */}
        <div className="w-full lg:w-72 h-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend grid */}
        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
          {pieData.map((entry) => {
            const pct = ((entry.value / data.length) * 100).toFixed(1);
            return (
              <div key={entry.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{entry.name}</p>
                  <p className="text-[11px] text-slate-400">{entry.value} day{entry.value !== 1 ? "s" : ""} · {pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Listallattendancewithgraph;
