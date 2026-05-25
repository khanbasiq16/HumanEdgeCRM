"use client";
import React, { useEffect, useState } from "react";
import SuperAdminlayout from "../utils/superadmin/layout/SuperAdmin";
import axios from "axios";
import {
  Building2, Users, ClipboardList, Layers, UserCog, FileText,
  ArrowRight, TrendingUp, Calendar, RefreshCw,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getallzones } from "@/features/Slice/TimeZoneSlice";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Link from "next/link";

/* ─── colour tokens ──────────────────────────────────────── */
const ACCENT = [
  { light: "bg-blue-50",   text: "text-blue-600",   icon: "text-blue-500"   },
  { light: "bg-indigo-50", text: "text-indigo-600",  icon: "text-indigo-500" },
  { light: "bg-violet-50", text: "text-violet-600",  icon: "text-violet-500" },
  { light: "bg-cyan-50",   text: "text-cyan-600",    icon: "text-cyan-500"   },
  { light: "bg-emerald-50",text: "text-emerald-600", icon: "text-emerald-500"},
  { light: "bg-amber-50",  text: "text-amber-600",   icon: "text-amber-500"  },
];
const PIE_COLORS = ["#3B82F6","#6366F1","#8B5CF6","#06B6D4","#10B981","#F59E0B"];

/* ─── KPI Card ───────────────────────────────────────────── */
const KpiCard = ({ title, count, icon: Icon, accent, href, loading }) => (
  <Link href={href || "#"} className="block">
    <div className={`
      relative bg-white rounded-2xl border border-slate-200/80 p-5
      hover:border-slate-300 hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.06)]
      transition-all duration-200 group overflow-hidden
    `}>
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse mt-2" />
          ) : (
            <p className="text-[2rem] font-extrabold text-slate-900 leading-tight mt-1 tabular-nums">
              {count.toLocaleString()}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${accent.light} flex items-center justify-center shrink-0`}>
          <Icon size={22} className={accent.icon} />
        </div>
      </div>

      {/* bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingUp size={12} className="text-emerald-500" />
          <span>Updated just now</span>
        </div>
        <span className={`
          text-[11px] font-semibold ${accent.text}
          flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity
        `}>
          View all <ArrowRight size={10} />
        </span>
      </div>

      {/* decorative corner */}
      <div className={`
        absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${accent.light} opacity-40
      `} />
    </div>
  </Link>
);

/* ─── Custom Tooltip ─────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-lg font-bold text-blue-600 mt-0.5">{payload[0].value}</p>
    </div>
  );
};

/* ─── Greeting ───────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    companies: 0, employees: 0, departments: 0,
    clients: 0, invoices: 0, expenses: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.User);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [a, b, c, d, e, f] = await Promise.all([
        axios.get("/api/get-all-companies"),
        axios.get("/api/get-all-department"),
        axios.get("/api/all-clients"),
        axios.get("/api/all-invoices"),
        axios.get("/api/get-all-expense"),
        axios.get("/api/get-all-employees"),
      ]);

      setCounts({
        companies:   a.data.companies?.length   || 0,
        employees:   f.data.employees?.length   || 0,
        departments: b.data.departments?.length || 0,
        clients:     c.data.clients?.length     || 0,
        invoices:    d.data.invoices?.length    || 0,
        expenses:    e.data.expenses?.length    || 0,
      });
      setRecentEmployees(f.data.employees?.slice(0, 10) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await fetch("https://timeapi.io/api/TimeZone/AvailableTimeZones");
        dispatch(getallzones(await t.json()));
      } catch {
        dispatch(getallzones(["Asia/Karachi", "Europe/London", "America/New_York"]));
      }
    })();
    fetchData();
  }, []);

  /* ─── data shapes ──────────────────────────────────────── */
  const stats = [
    { title: "Companies",   count: counts.companies,   icon: Building2,    accent: ACCENT[0], href: "/admin/companies" },
    { title: "Employees",   count: counts.employees,   icon: Users,        accent: ACCENT[1], href: "/admin/employees" },
    { title: "Departments", count: counts.departments, icon: Layers,       accent: ACCENT[2], href: "#" },
    { title: "Clients",     count: counts.clients,     icon: UserCog,      accent: ACCENT[3], href: "#" },
    { title: "Invoices",    count: counts.invoices,    icon: ClipboardList,accent: ACCENT[4], href: "#" },
    { title: "Expenses",    count: counts.expenses,    icon: FileText,     accent: ACCENT[5], href: "/admin/expenses" },
  ];

  const barData = [
    { label: "Companies",   value: counts.companies },
    { label: "Employees",   value: counts.employees },
    { label: "Clients",     value: counts.clients },
    { label: "Invoices",    value: counts.invoices },
    { label: "Depts",       value: counts.departments },
    { label: "Expenses",    value: counts.expenses },
  ];

  const pieData = barData.filter((d) => d.value > 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  /* ─── render ───────────────────────────────────────────── */
  return (
    <SuperAdminlayout>
      <div className="space-y-6 max-w-screen-2xl mx-auto">

        {/* ── Page Header ───────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {greeting()}, {user?.name?.split(" ")[0] || "Admin"} 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-sm text-slate-400">{today}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              All systems online
            </span>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <KpiCard key={i} {...s} loading={loading} />
          ))}
        </div>

        {/* ── Analytics Section ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Area / Bar chart — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Business Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Key metrics across all entities</p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                Live data
              </span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={32} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc", radius: 4 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary + Donut — 1 col */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Entity breakdown</p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData.length ? pieData : [{ label: "No data", value: 1 }]}
                    innerRadius={52}
                    outerRadius={78}
                    dataKey="value"
                    nameKey="label"
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(pieData.length ? pieData : [{}]).map((_, i) => (
                      <Cell key={i} fill={pieData.length ? PIE_COLORS[i % PIE_COLORS.length] : "#e2e8f0"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px", border: "1px solid #e2e8f0",
                      fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
              {barData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[11px] text-slate-500 truncate">{item.label}</span>
                  <span className="text-[11px] font-bold text-slate-700 ml-auto tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Employees ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">

          {/* table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Employees</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? "Fetching records…" : `Showing ${recentEmployees.length} employees`}
              </p>
            </div>
            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="pl-6 pr-3 py-3 text-left">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      #
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      Employee
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      Status
                    </span>
                  </th>
                  <th className="px-3 pr-6 py-3 text-left">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      Joining Date
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="pl-6 pr-3 py-4">
                        <div className="h-3.5 w-5 bg-slate-100 rounded animate-pulse" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse shrink-0" />
                          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                      </td>
                      <td className="px-3 pr-6 py-4">
                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={32} className="text-slate-200" />
                        <p className="text-sm text-slate-400 font-medium">No employees found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((emp, i) => {
                    const isActive = emp.status?.toLowerCase() === "active";
                    const initials = emp.employeeName
                      ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                    const avatarColors = [
                      "bg-blue-100 text-blue-700",
                      "bg-indigo-100 text-indigo-700",
                      "bg-violet-100 text-violet-700",
                      "bg-cyan-100 text-cyan-700",
                      "bg-emerald-100 text-emerald-700",
                      "bg-amber-100 text-amber-700",
                    ];
                    return (
                      <tr
                        key={i}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="pl-6 pr-3 py-4">
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-9 h-9 rounded-full flex items-center justify-center
                              text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}
                            `}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-none">
                                {emp.employeeName}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {emp.department || emp.role || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                            text-[11px] font-semibold border
                            ${isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"}
                          `}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {emp.status
                              ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase()
                              : "—"}
                          </span>
                        </td>
                        <td className="px-3 pr-6 py-4 text-sm text-slate-500 tabular-nums">
                          {emp.dateOfJoining
                            ? new Date(emp.dateOfJoining).toLocaleDateString("en-US", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </SuperAdminlayout>
  );
}
