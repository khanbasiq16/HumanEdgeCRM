"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import {
  User, Mail, Phone, CreditCard, MapPin,
  CalendarDays, Clock, Timer, ClipboardCheck, Building2,
  CheckCircle2, XCircle, Hash, Settings, ArrowRight,
} from "lucide-react";
import Link from "next/link";

/* ─── helpers ────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return "E";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const avatarGradients = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
];

/* ─── Info Row ───────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, accent = "text-slate-400" }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className={accent} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{value || "—"}</p>
    </div>
  </div>
);

/* ─── Section Card ───────────────────────────────────────── */
const Section = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-slate-100">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ─── Page ───────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { slug } = useParams();
  const { user } = useSelector((s) => s.User);

  const isActive = user?.status?.trim().toLowerCase() === "active";
  const gradientClass = avatarGradients[
    (user?.employeeName?.charCodeAt(0) || 0) % avatarGradients.length
  ];

  const joiningDate = user?.dateOfJoining
    ? new Date(user.dateOfJoining).toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <Employeelayout>
      <div className="space-y-5 max-w-screen-xl mx-auto">

        {/* ── Profile Card (no banner) ──────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            {/* Avatar */}
            <div className={`
              w-16 h-16 rounded-2xl shrink-0
              bg-gradient-to-br ${gradientClass}
              flex items-center justify-center shadow-sm
            `}>
              <span className="text-xl font-extrabold text-white tracking-tight">
                {getInitials(user?.employeeName)}
              </span>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {user?.employeeName || "—"}
                </h1>
                <span className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                  ${isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"}
                `}>
                  {isActive
                    ? <CheckCircle2 size={11} className="text-emerald-500" />
                    : <XCircle size={11} className="text-slate-400" />}
                  {isActive ? "Active" : (user?.status || "Inactive")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {user?.department?.departmentName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    {user.department.departmentName}
                  </span>
                )}
                {user?.employeeId && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} className="text-slate-400" />
                    {user.employeeId}
                  </span>
                )}
                {user?.employeeemail && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    {user.employeeemail}
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/employee/${slug}/mark-attendance`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200 shrink-0"
            >
              <ClipboardCheck size={15} />
              Mark Attendance
            </Link>
          </div>

          {/* ── Stat chips ───────────────────────────────── */}
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Joined",       value: joiningDate,                              icon: CalendarDays, color: "text-blue-600 bg-blue-50"    },
              { label: "Check In",     value: user?.department?.checkInTime  || "—",    icon: Clock,        color: "text-indigo-600 bg-indigo-50" },
              { label: "Check Out",    value: user?.department?.checkOutTime || "—",    icon: Timer,        color: "text-violet-600 bg-violet-50" },
              { label: "Grace Period", value: user?.department?.graceTime ? `${user.department.graceTime} min` : "—", icon: Clock, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-lg ${color.split(" ")[1]} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={color.split(" ")[0]} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-sm font-bold text-slate-800 tabular-nums truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column grid ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Personal Information */}
          <Section title="Personal Information">
            <div className="space-y-5">
              <InfoRow icon={User}       label="Full Name"   value={user?.employeeName}    accent="text-blue-500"    />
              <InfoRow icon={Hash}       label="Employee ID" value={user?.employeeId}       accent="text-indigo-500"  />
              <InfoRow icon={Mail}       label="Email"       value={user?.employeeemail}    accent="text-violet-500"  />
              <InfoRow icon={Phone}      label="Phone"       value={user?.employeePhone}    accent="text-cyan-500"    />
              <InfoRow icon={CreditCard} label="CNIC"        value={user?.employeeCNIC}     accent="text-emerald-500" />
              <InfoRow icon={MapPin}     label="Address"     value={user?.employeeAddress}  accent="text-amber-500"   />
            </div>
          </Section>

          {/* Job Details */}
          <Section title="Job Details">
            <div className="space-y-5">
              <InfoRow icon={Building2}    label="Department"      value={user?.department?.departmentName} accent="text-blue-500"   />
              <InfoRow icon={CalendarDays} label="Date of Joining" value={
                user?.dateOfJoining
                  ? new Date(user.dateOfJoining).toLocaleDateString("en-US", {
                      day: "2-digit", month: "long", year: "numeric",
                    })
                  : null
              } accent="text-indigo-500" />

              {/* Status row */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {isActive
                    ? <CheckCircle2 size={15} className="text-emerald-500" />
                    : <XCircle     size={15} className="text-red-400"     />}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Status</p>
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mt-1
                    ${isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-500 border-slate-200"}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {user?.status
                      ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Quick Actions ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Mark Attendance",
                desc:  "Check in or check out for today",
                href:  `/employee/${slug}/mark-attendance`,
                icon:  ClipboardCheck,
                style: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
                textStyle: "text-blue-100",
              },
              {
                label: "View Attendance",
                desc:  "See your attendance history",
                href:  `/employee/${slug}/attendance`,
                icon:  CalendarDays,
                style: "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200",
                textStyle: "text-slate-400",
              },
              {
                label: "Settings",
                desc:  "Manage your account preferences",
                href:  `/employee/${slug}/settings`,
                icon:  Settings,
                style: "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200",
                textStyle: "text-slate-400",
              },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={`group flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${action.style}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-none">{action.label}</p>
                    <p className={`text-xs mt-0.5 truncate ${action.textStyle}`}>{action.desc}</p>
                  </div>
                  <ArrowRight size={15} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </Employeelayout>
  );
}
