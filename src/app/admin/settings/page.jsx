"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import Ipwhitelistdialog from "@/app/utils/superadmin/components/dialog/Ipwhitelistdialog";
import { Switch } from "@/components/ui/switch";

import { createcompany }    from "@/features/Slice/CompanySlice";
import { createdepartment } from "@/features/Slice/DepartmentSlice";
import { createemployees }  from "@/features/Slice/EmployeeSlice";
import { getallipwhitelist } from "@/features/Slice/IpwhiteSlice";

import {
  Users, Layers, Building2, Wifi, Calendar, CheckCircle2,
  XCircle, Shield, ToggleLeft, ArrowRight, UserPlus,
  ShieldCheck, RefreshCw, Copy, Check, X, Link2, Globe,
} from "lucide-react";
import Link from "next/link";

/* ── Page Link Dialog (auto-close) ──────────────────────── */
const PageLinkDialog = ({ open, onClose, title, url }) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(onClose, 8000);
    }
    return () => clearTimeout(timerRef.current);
  }, [open, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Auto-close progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-emerald-400 origin-left"
            style={{ animation: "shrink 8s linear forwards" }}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Link2 size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{title} Enabled</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Share this link to allow access</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
          <p className="text-xs text-slate-600 font-mono break-all leading-relaxed">{url}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            copied
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-3">Auto-closes in 8 seconds</p>
      </div>
      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  );
};

/* ── Skeleton helpers ───────────────────────────────────── */
const Sk = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

const SettingsSkeleton = () => (
  <div className="space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4">
          <Sk className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Sk className="h-3 w-16" />
            <Sk className="h-7 w-10" />
          </div>
        </div>
      ))}
    </div>

    {/* System controls + IP whitelist */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Sk className="w-4 h-4 rounded" />
            <Sk className="h-4 w-36" />
          </div>
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Sk className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-3.5 w-40" />
                  <Sk className="h-3 w-52" />
                </div>
                <Sk className="w-10 h-5 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Admin members */}
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sk className="w-4 h-4 rounded" />
          <Sk className="h-4 w-36" />
        </div>
        <Sk className="h-8 w-32 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Sk className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-3.5 w-32" />
              <Sk className="h-3 w-44" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sk className="h-5 w-18 rounded-full" />
              <Sk className="h-5 w-20 rounded-full" />
              <Sk className="w-7 h-7 rounded-lg" />
              <Sk className="w-7 h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Recent employees table */}
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sk className="w-4 h-4 rounded" />
          <Sk className="h-4 w-36" />
        </div>
        <Sk className="h-4 w-28 rounded" />
      </div>
      <div className="px-5 py-4 space-y-3.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Sk className="w-8 h-8 rounded-full shrink-0" />
            <Sk className="h-3.5 w-28 flex-none" />
            <Sk className="h-3.5 w-20 flex-none" />
            <Sk className="h-3.5 w-24 flex-none" />
            <Sk className="h-5 w-16 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>

    {/* Maintenance */}
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Sk className="w-4 h-4 rounded" />
        <Sk className="h-4 w-40" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="space-y-2 flex-1">
            <Sk className="h-4 w-44" />
            <Sk className="h-3 w-72" />
          </div>
          <Sk className="h-9 w-24 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  </div>
);

/* ── Stat card ─────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent, href }) => {
  const content = (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 transition-all ${href ? "hover:border-blue-200 hover:shadow-[0_4px_20px_0_rgba(59,130,246,0.08)] cursor-pointer group" : ""}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">{value}</p>
      </div>
      {href && (
        <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
};

/* ── Section header ─────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-slate-400" />
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
    {action}
  </div>
);

const MODULE_LABELS = {
  employees:     "Employees",
  companies:     "Companies",
  attendance:    "Attendance",
  accounts:      "Accounts",
  invoice:       "Invoices",
  tasks:         "Tasks",
  announcements: "Announcements",
  members:       "Members",
  templates:     "Templates",
  settings:      "Settings",
};

const Page = () => {
  const [ipdialog, setIpdialog]             = useState(false);
  const [signupAccess, setSignupAccess]     = useState(false);
  const [toggling, setToggling]             = useState(false);
  const [empRegAccess, setEmpRegAccess]     = useState(false);
  const [empRegToggling, setEmpRegToggling] = useState(false);
  const [fixingStuck,   setFixingStuck]       = useState(false);
  const [linkDialog, setLinkDialog] = useState({ open: false, title: "", url: "" });
  const [loading, setLoading]       = useState(true);
  const router  = useRouter();
  const dispatch = useDispatch();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const { user }        = useSelector((s) => s.User);
  const { department }  = useSelector((s) => s.Department);
  const { ipwhitelist } = useSelector((s) => s.Ipwhitelist);
  const { employees }   = useSelector((s) => s.Employee);
  const { companies }   = useSelector((s) => s.Company);


  useEffect(() => {
    Promise.allSettled([
      axios.get("/api/get-all-department").then((r) => dispatch(createdepartment(r.data.departments))),
      axios.get("/api/get-all-employees").then((r)  => dispatch(createemployees(r.data.employees))),
      axios.get("/api/get-all-companies").then((r)  => dispatch(createcompany(r.data.companies))),
      axios.get("/api/get-ipwhitelist").then((r)    => dispatch(getallipwhitelist(r.data.whitelist))),
      axios.get("/api/get-signup-access").then((r)      => setSignupAccess(r.data.signupAccess)),
      axios.get("/api/get-employee-reg-access").then((r) => setEmpRegAccess(r.data.employeeRegAccess)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleToggleSignup = async () => {
    setToggling(true);
    const newVal = !signupAccess;
    try {
      await axios.post("/api/update-signup-access", { signupAccess: newVal });
      setSignupAccess(newVal);
      if (newVal) {
        setLinkDialog({ open: true, title: "Admin Signup Page", url: `${origin}/superadmin/sign-up` });
      } else {
        toast.success("Signup page disabled");
      }
    } catch {
      toast.error("Failed to update signup setting");
    } finally {
      setToggling(false);
    }
  };

  const handleToggleEmpReg = async () => {
    setEmpRegToggling(true);
    const newVal = !empRegAccess;
    try {
      await axios.post("/api/update-employee-reg-access", { employeeRegAccess: newVal });
      setEmpRegAccess(newVal);
      if (newVal) {
        setLinkDialog({ open: true, title: "Employee Registration Page", url: `${origin}/register` });
      } else {
        toast.success("Employee registration disabled");
      }
    } catch {
      toast.error("Failed to update employee registration setting");
    } finally {
      setEmpRegToggling(false);
    }
  };

  const handleFixStuck = async () => {
    setFixingStuck(true);
    try {
      const res = await axios.post("/api/attendance/fix-stuck");
      if (res.data.success) {
        const count = res.data.reset?.length || 0;
        toast.success(count > 0 ? `Reset ${count} stuck employee(s)` : "No stuck employees found");
      }
    } catch {
      toast.error("Failed to fix stuck employees");
    } finally {
      setFixingStuck(false);
    }
  };

  const activeEmployees   = employees?.filter((e) => e.status?.toLowerCase() === "active").length || 0;
  const inactiveEmployees = (employees?.length || 0) - activeEmployees;

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Settings" />

      {loading ? <SettingsSkeleton /> : null}

      <div className={`space-y-6 ${loading ? "hidden" : ""}`}>

        {/* ── Stats row ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Employees"
            value={employees?.length || 0}
            accent="bg-blue-50 text-blue-500"
            href="/admin/employees"
          />
          <StatCard
            icon={Layers}
            label="Departments"
            value={department?.length || 0}
            accent="bg-violet-50 text-violet-500"
            href="/admin/departments"
          />
          <StatCard
            icon={Building2}
            label="Companies"
            value={companies?.length || 0}
            accent="bg-emerald-50 text-emerald-500"
            href="/admin/companies"
          />
          <StatCard
            icon={Wifi}
            label="Networks"
            value={ipwhitelist?.length || 0}
            accent="bg-amber-50 text-amber-500"
          />
        </div>

        {/* ── System controls ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Signup access */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <SectionHeader icon={ToggleLeft} title="System Controls" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${signupAccess ? "bg-emerald-100" : "bg-slate-100"}`}>
                    <Shield size={16} className={signupAccess ? "text-emerald-600" : "text-slate-400"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Admin Signup Page</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {signupAccess ? "Public signup is currently enabled" : "Public signup is disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggling && (
                    <span className="text-[11px] text-slate-400 font-medium">Updating…</span>
                  )}
                  <Switch
                    checked={signupAccess}
                    onCheckedChange={handleToggleSignup}
                    disabled={toggling}
                  />
                </div>
              </div>

              {/* Employee Registration toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${empRegAccess ? "bg-blue-100" : "bg-slate-100"}`}>
                    <UserPlus size={16} className={empRegAccess ? "text-blue-600" : "text-slate-400"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Employee Registration Page</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {empRegAccess ? "Public registration is currently enabled" : "Public registration is disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {empRegToggling && (
                    <span className="text-[11px] text-slate-400 font-medium">Updating…</span>
                  )}
                  <Switch
                    checked={empRegAccess}
                    onCheckedChange={handleToggleEmpReg}
                    disabled={empRegToggling}
                  />
                </div>
              </div>

              {/* Holiday Setter */}
              <button
                onClick={() => router.push("/admin/holidays")}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">Holiday Setter</p>
                    <p className="text-xs text-slate-400 mt-0.5">Manage company holidays and off days</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* IP Whitelist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <SectionHeader
              icon={Wifi}
              title="IP Whitelist"
              action={<Ipwhitelistdialog open={ipdialog} setOpen={setIpdialog} />}
            />

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {ipwhitelist?.length > 0 ? (
                ipwhitelist.map((item, i) => {
                  const isAnywhere = item.ip === "0.0.0.0/0";
                  return (
                    <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${isAnywhere ? "bg-emerald-50/60" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAnywhere ? "bg-emerald-100" : "bg-amber-50"}`}>
                        {isAnywhere
                          ? <Globe size={14} className="text-emerald-600" />
                          : <Wifi size={14} className="text-amber-500" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isAnywhere ? "text-emerald-800" : "text-slate-700"}`}>
                            {item.networkName}
                          </p>
                          {isAnywhere && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Anywhere
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-mono truncate ${isAnywhere ? "text-emerald-500" : "text-slate-400"}`}>
                          {item.ip}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Wifi size={24} className="text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">No IPs whitelisted</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Employees ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <SectionHeader
            icon={Users}
            title="Recent Employees"
            action={
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">
                  {activeEmployees} active · {inactiveEmployees} inactive
                </span>
                <Link
                  href="/admin/employees"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  View all <ArrowRight size={11} />
                </Link>
              </div>
            }
          />

          {/* Table */}
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Employee", "Department", "Company", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.slice(0, 8).map((emp) => {
                  const isActive = emp.status?.toLowerCase() === "active";
                  const initials = (emp.employeeName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={emp.employeeId}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 truncate">{emp.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500">{emp.department || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500 truncate">{emp.employeeAddress || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border
                          ${isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"}
                        `}>
                          {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!employees?.length && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── System Maintenance ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <SectionHeader icon={RefreshCw} title="System Maintenance" />
          <div className="p-5">
            <div className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-800">Reset Stuck Attendance</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fixes employees stuck as checked-in from a previous day so they can check in again.
                </p>
              </div>
              <button
                onClick={handleFixStuck}
                disabled={fixingStuck}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <RefreshCw size={13} className={fixingStuck ? "animate-spin" : ""} />
                {fixingStuck ? "Fixing…" : "Fix Now"}
              </button>
            </div>
          </div>
        </div>

      </div>
      {/* Page link dialog */}
      <PageLinkDialog
        open={linkDialog.open}
        onClose={() => setLinkDialog((p) => ({ ...p, open: false }))}
        title={linkDialog.title}
        url={linkDialog.url}
      />

    </SuperAdminlayout>
  );
};

export default Page;
