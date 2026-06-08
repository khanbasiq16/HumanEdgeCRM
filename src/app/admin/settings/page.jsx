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

import { createcompany }     from "@/features/Slice/CompanySlice";
import { createdepartment }  from "@/features/Slice/DepartmentSlice";
import { createemployees }   from "@/features/Slice/EmployeeSlice";
import { getallipwhitelist } from "@/features/Slice/IpwhiteSlice";

import {
  Users, Layers, Building2, Wifi, Calendar, CheckCircle2,
  XCircle, Shield, ArrowRight, UserPlus, RefreshCw,
  Copy, Check, X, Link2, Globe, Settings, Lock,
  Network, Wrench, LayoutDashboard, ChevronRight,
  Bell, BellRing, AlertTriangle, MonitorSmartphone,
  LogIn, ShieldAlert, Mail, Smartphone,
} from "lucide-react";
import Link from "next/link";

/* ── Page Link Dialog ───────────────────────────────────── */
const PageLinkDialog = ({ open, onClose, title, url }) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (open) timerRef.current = setTimeout(onClose, 8000);
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
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl overflow-hidden">
          <div className="h-full bg-emerald-400 origin-left" style={{ animation: "shrink 8s linear forwards" }} />
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
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
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
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

/* ── Skeleton ───────────────────────────────────────────── */
const Sk = ({ className }) => <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />;

const SettingsSkeleton = () => (
  <div className="flex gap-0 min-h-150 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
    <div className="w-56 shrink-0 border-r border-slate-100 p-3 space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Sk className="w-8 h-8 rounded-lg shrink-0" />
          <Sk className="h-3.5 flex-1" />
        </div>
      ))}
    </div>
    <div className="flex-1 p-8 space-y-6">
      <div className="space-y-2">
        <Sk className="h-6 w-48" />
        <Sk className="h-3.5 w-72" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Sk className="h-3.5 w-40" />
                <Sk className="h-3 w-56" />
              </div>
            </div>
            <Sk className="w-10 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Setting Row ────────────────────────────────────────── */
const SettingRow = ({ icon: Icon, iconBg, iconColor, title, description, control, onClick, danger }) => {
  const base = `flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors ${onClick ? "cursor-pointer hover:bg-slate-50/70 group" : ""}`;
  const inner = (
    <div className={base} onClick={onClick}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={17} className={iconColor} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${danger ? "text-red-700" : "text-slate-800"}`}>{title}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        {control ?? (onClick && <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />)}
      </div>
    </div>
  );
  return inner;
};

/* ── Section wrapper ────────────────────────────────────── */
const SettingsSection = ({ title, description, children }) => (
  <div>
    <div className="mb-5">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-50">
      {children}
    </div>
  </div>
);

/* ── Nav items config ───────────────────────────────────── */
const NAV = [
  { id: "general",     label: "General",       icon: Settings,       color: "text-slate-500",  bg: "bg-slate-100" },
  { id: "access",      label: "Access Control", icon: Lock,           color: "text-blue-600",   bg: "bg-blue-50"  },
  { id: "network",     label: "Network",        icon: Network,        color: "text-amber-600",  bg: "bg-amber-50" },
  { id: "maintenance", label: "Maintenance",    icon: Wrench,         color: "text-red-500",    bg: "bg-red-50"   },
  { id: "overview",    label: "Overview",       icon: LayoutDashboard,color: "text-violet-600", bg: "bg-violet-50"},
];

/* ── Main Page ──────────────────────────────────────────── */
const Page = () => {
  const [activeTab, setActiveTab]           = useState("general");
  const [ipdialog, setIpdialog]             = useState(false);
  const [signupAccess, setSignupAccess]     = useState(false);
  const [toggling, setToggling]             = useState(false);
  const [empRegAccess, setEmpRegAccess]     = useState(false);
  const [empRegToggling, setEmpRegToggling] = useState(false);
  const [fixingStuck, setFixingStuck]       = useState(false);
  const [linkDialog, setLinkDialog]         = useState({ open: false, title: "", url: "" });
  const [loading, setLoading]               = useState(true);

  // Access control notification & security toggles
  const [notifToggles, setNotifToggles] = useState({
    loginAlert:       false,
    failedLogin:      false,
    newDeviceLogin:   false,
    ipViolationAlert: false,
  });
  const [notifSaving, setNotifSaving] = useState({});

  const handleNotifToggle = async (key) => {
    setNotifSaving((p) => ({ ...p, [key]: true }));
    const newVal = !notifToggles[key];
    try {
      await axios.post("/api/update-notification-setting", { key, value: newVal });
      setNotifToggles((p) => ({ ...p, [key]: newVal }));
      toast.success(newVal ? "Notification enabled" : "Notification disabled");
    } catch {
      toast.error("Failed to update notification setting");
    } finally {
      setNotifSaving((p) => ({ ...p, [key]: false }));
    }
  };

  const router   = useRouter();
  const dispatch = useDispatch();
  const origin   = typeof window !== "undefined" ? window.location.origin : "";

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
      if (newVal) setLinkDialog({ open: true, title: "Admin Signup Page", url: `${origin}/superadmin/sign-up` });
      else toast.success("Signup page disabled");
    } catch { toast.error("Failed to update signup setting"); }
    finally { setToggling(false); }
  };

  const handleToggleEmpReg = async () => {
    setEmpRegToggling(true);
    const newVal = !empRegAccess;
    try {
      await axios.post("/api/update-employee-reg-access", { employeeRegAccess: newVal });
      setEmpRegAccess(newVal);
      if (newVal) setLinkDialog({ open: true, title: "Employee Registration Page", url: `${origin}/register` });
      else toast.success("Employee registration disabled");
    } catch { toast.error("Failed to update employee registration setting"); }
    finally { setEmpRegToggling(false); }
  };

  const handleFixStuck = async () => {
    setFixingStuck(true);
    try {
      const res = await axios.post("/api/attendance/fix-stuck");
      if (res.data.success) {
        const count = res.data.reset?.length || 0;
        toast.success(count > 0 ? `Reset ${count} stuck employee(s)` : "No stuck employees found");
      }
    } catch { toast.error("Failed to fix stuck employees"); }
    finally { setFixingStuck(false); }
  };

  const activeEmployees   = employees?.filter((e) => e.status?.toLowerCase() === "active").length || 0;
  const inactiveEmployees = (employees?.length || 0) - activeEmployees;

  /* ── Tab content panels ─────────────────────────── */
  const panels = {

    general: (
      <div className="space-y-8">
        <SettingsSection
          title="System Pages"
          description="Control which public-facing pages are accessible"
        >
          <SettingRow
            icon={Shield}
            iconBg={signupAccess ? "bg-emerald-100" : "bg-slate-100"}
            iconColor={signupAccess ? "text-emerald-600" : "text-slate-400"}
            title="Admin Signup Page"
            description={signupAccess ? "Public signup is currently enabled — anyone can sign up as admin" : "Public signup is disabled — only invited users can sign up"}
            control={
              <div className="flex items-center gap-2">
                {toggling && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch checked={signupAccess} onCheckedChange={handleToggleSignup} disabled={toggling} />
              </div>
            }
          />
          <SettingRow
            icon={UserPlus}
            iconBg={empRegAccess ? "bg-blue-100" : "bg-slate-100"}
            iconColor={empRegAccess ? "text-blue-600" : "text-slate-400"}
            title="Employee Registration Page"
            description={empRegAccess ? "Public registration is enabled — employees can self-register" : "Public registration is disabled"}
            control={
              <div className="flex items-center gap-2">
                {empRegToggling && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch checked={empRegAccess} onCheckedChange={handleToggleEmpReg} disabled={empRegToggling} />
              </div>
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Company Settings"
          description="Manage company-wide configurations"
        >
          <SettingRow
            icon={Calendar}
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
            title="Holiday Setter"
            description="Define company holidays and weekly off days for all employees"
            onClick={() => router.push("/admin/holidays")}
          />
        </SettingsSection>
      </div>
    ),

    access: (
      <div className="space-y-8">

        {/* ── Security Notifications ── */}
        <SettingsSection
          title="Security Notifications"
          description="Get alerted when important security events happen in the system"
        >
          <SettingRow
            icon={LogIn}
            iconBg={notifToggles.loginAlert ? "bg-blue-100" : "bg-slate-100"}
            iconColor={notifToggles.loginAlert ? "text-blue-600" : "text-slate-400"}
            title="Admin Login Alert"
            description="Send an email notification whenever an admin account logs in"
            control={
              <div className="flex items-center gap-2">
                {notifSaving.loginAlert && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch
                  checked={notifToggles.loginAlert}
                  onCheckedChange={() => handleNotifToggle("loginAlert")}
                  disabled={notifSaving.loginAlert}
                />
              </div>
            }
          />
          <SettingRow
            icon={ShieldAlert}
            iconBg={notifToggles.failedLogin ? "bg-red-100" : "bg-slate-100"}
            iconColor={notifToggles.failedLogin ? "text-red-600" : "text-slate-400"}
            title="Failed Login Attempts"
            description="Alert when repeated failed login attempts are detected on any account"
            control={
              <div className="flex items-center gap-2">
                {notifSaving.failedLogin && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch
                  checked={notifToggles.failedLogin}
                  onCheckedChange={() => handleNotifToggle("failedLogin")}
                  disabled={notifSaving.failedLogin}
                />
              </div>
            }
          />
          <SettingRow
            icon={MonitorSmartphone}
            iconBg={notifToggles.newDeviceLogin ? "bg-violet-100" : "bg-slate-100"}
            iconColor={notifToggles.newDeviceLogin ? "text-violet-600" : "text-slate-400"}
            title="New Device Login"
            description="Notify when an admin logs in from an unrecognised device or browser"
            control={
              <div className="flex items-center gap-2">
                {notifSaving.newDeviceLogin && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch
                  checked={notifToggles.newDeviceLogin}
                  onCheckedChange={() => handleNotifToggle("newDeviceLogin")}
                  disabled={notifSaving.newDeviceLogin}
                />
              </div>
            }
          />
          <SettingRow
            icon={AlertTriangle}
            iconBg={notifToggles.ipViolationAlert ? "bg-amber-100" : "bg-slate-100"}
            iconColor={notifToggles.ipViolationAlert ? "text-amber-600" : "text-slate-400"}
            title="IP Violation Alert"
            description="Alert when an employee tries to check in from a non-whitelisted IP address"
            control={
              <div className="flex items-center gap-2">
                {notifSaving.ipViolationAlert && <span className="text-[11px] text-slate-400">Saving…</span>}
                <Switch
                  checked={notifToggles.ipViolationAlert}
                  onCheckedChange={() => handleNotifToggle("ipViolationAlert")}
                  disabled={notifSaving.ipViolationAlert}
                />
              </div>
            }
          />
        </SettingsSection>

        {/* ── Notification delivery ── */}
        <SettingsSection
          title="Notification Delivery"
          description="Choose where security alerts are sent"
        >
          <SettingRow
            icon={Mail}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            title="Email Notifications"
            description={`Alerts sent to your admin email address`}
            control={
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={10} /> Enabled
              </span>
            }
          />
          <SettingRow
            icon={Bell}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            title="In-App Notifications"
            description="Show security alerts inside the admin dashboard"
            control={
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={10} /> Enabled
              </span>
            }
          />
        </SettingsSection>

      </div>
    ),

    network: (
      <div className="space-y-8">
        <SettingsSection
          title="IP Whitelist"
          description="Only allow attendance check-ins from approved networks"
        >
          {ipwhitelist?.length > 0 ? (
            <>
              {ipwhitelist.map((item, i) => {
                const isAnywhere = item.ip === "0.0.0.0/0";
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAnywhere ? "bg-emerald-100" : "bg-amber-50"}`}>
                      {isAnywhere ? <Globe size={17} className="text-emerald-600" /> : <Wifi size={17} className="text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${isAnywhere ? "text-emerald-800" : "text-slate-800"}`}>{item.networkName}</p>
                        {isAnywhere && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Anywhere</span>
                        )}
                      </div>
                      <p className={`text-xs font-mono mt-0.5 ${isAnywhere ? "text-emerald-500" : "text-slate-400"}`}>{item.ip}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${isAnywhere ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                );
              })}
              <div className="px-5 py-3 flex justify-end border-t border-slate-100">
                <Ipwhitelistdialog open={ipdialog} setOpen={setIpdialog} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Wifi size={28} className="text-slate-200" />
              <p className="text-sm text-slate-400 font-medium">No IPs whitelisted yet</p>
              <p className="text-xs text-slate-300 mb-3">Add an IP to restrict attendance access</p>
              <Ipwhitelistdialog open={ipdialog} setOpen={setIpdialog} />
            </div>
          )}
        </SettingsSection>
      </div>
    ),

    maintenance: (
      <div className="space-y-8">
        <SettingsSection
          title="Attendance Repair"
          description="Fix data issues related to employee attendance records"
        >
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-6 p-5 bg-red-50 border border-red-200 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-800">Reset Stuck Attendance</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
                  Employees who were checked in from a previous day but never checked out get stuck and cannot check in again. This action resets them.
                </p>
              </div>
              <button
                onClick={handleFixStuck}
                disabled={fixingStuck}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <RefreshCw size={13} className={fixingStuck ? "animate-spin" : ""} />
                {fixingStuck ? "Fixing…" : "Run Fix"}
              </button>
            </div>
          </div>
        </SettingsSection>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Wrench size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Maintenance actions are irreversible. Run them only when you are certain there is an issue.
          </p>
        </div>
      </div>
    ),

    overview: (
      <div className="space-y-8">
        {/* Stats */}
        <SettingsSection title="System Overview" description="Current counts across your organization">
          <div className="px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users,     label: "Employees",   value: employees?.length || 0,  accent: "bg-blue-50 text-blue-500",    href: "/admin/employees" },
              { icon: Layers,    label: "Departments",  value: department?.length || 0,  accent: "bg-violet-50 text-violet-500", href: "/admin/departments" },
              { icon: Building2, label: "Companies",    value: companies?.length || 0,   accent: "bg-emerald-50 text-emerald-500", href: "/admin/companies" },
              { icon: Wifi,      label: "Networks",     value: ipwhitelist?.length || 0, accent: "bg-amber-50 text-amber-500" },
            ].map(({ icon: Icon, label, value, accent, href }) => {
              const card = (
                <div className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 ${href ? "hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer group transition-colors" : ""}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-extrabold text-slate-900 tabular-nums">{value}</p>
                  </div>
                  {href && <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />}
                </div>
              );
              return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
            })}
          </div>
        </SettingsSection>

        {/* Recent employees */}
        <SettingsSection
          title="Recent Employees"
          description={`${activeEmployees} active · ${inactiveEmployees} inactive`}
        >
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/70">
                  {["Employee", "Department", "Address", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.slice(0, 8).map((emp) => {
                  const isActive = emp.status?.toLowerCase() === "active";
                  const initials = (emp.employeeName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={emp.employeeId} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                          <span className="text-sm font-semibold text-slate-700 truncate">{emp.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{emp.department || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 truncate">{emp.employeeAddress || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!employees?.length && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
            <Link href="/admin/employees" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              View all employees <ArrowRight size={11} />
            </Link>
          </div>
        </SettingsSection>
      </div>
    ),
  };

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Settings" />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="flex gap-0 bg-white rounded-2xl border border-slate-200/80 overflow-hidden min-h-150">

          {/* ── Left sidebar ────────────────────────────── */}
          <nav className="w-56 shrink-0 border-r border-slate-100 py-3 flex flex-col gap-0.5">
            {/* <p className="px-4 pt-2 pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</p> */}
            {NAV.map(({ id, label, icon: Icon, color, bg }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 mx-1.5 py-2.5 rounded-xl text-left transition-all text-sm font-medium ${active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                  style={{ width: "calc(100% - 12px)" }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? bg : "bg-transparent"}`}>
                    <Icon size={15} className={active ? color : "text-slate-400"} />
                  </div>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* ── Right content ────────────────────────────── */}
          <div className="flex-1 min-w-0 px-8 py-7 overflow-y-auto">
            {panels[activeTab]}
          </div>

        </div>
      )}

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
