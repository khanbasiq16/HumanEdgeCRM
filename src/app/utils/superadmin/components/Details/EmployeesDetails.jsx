"use client";
import React, { useState } from "react";
import AssignCompanydIalog from "../dialog/AssignCompanydIalog";
import Listattendance from "../Listelements/LIstattendance";
import EditEmployeeDialog from "../dialog/EditEmployeeDialog";
import {
  Mail, Phone, CreditCard, MapPin, Briefcase, DollarSign,
  Clock, Calendar, Building2, Target, CheckCircle2, XCircle,
  Globe, Plus, Copy, Check,
} from "lucide-react";

/* ── Info row ───────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={14} className="text-slate-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{value || "—"}</p>
    </div>
  </div>
);

/* ── Stat pill ──────────────────────────────────────────── */
const StatPill = ({ label, value, color }) => {
  const colors = {
    blue:    "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    violet:  "bg-violet-50 border-violet-100 text-violet-700",
    amber:   "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-3 rounded-xl border ${colors[color] || colors.blue}`}>
      <span className="text-lg font-extrabold tabular-nums">{value || "—"}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{label}</span>
    </div>
  );
};

/* ── Copy ID button ─────────────────────────────────────── */
const CopyId = ({ id }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-mono font-medium transition-colors"
    >
      {id?.slice(0, 12)}…
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </button>
  );
};

/* ── Section card ───────────────────────────────────────── */
const Card = ({ title, action, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
      <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">{title}</p>
      {action}
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const EmployeesDetails = ({ employee, assigncompanies, setemployee }) => {
  const [open, setOpen] = useState(false);

  if (!employee) return null;

  const isActive = employee.status?.toLowerCase() === "active";
  const assignedCompanies = assigncompanies?.filter((c) => employee.companyIds?.includes(c.id)) || [];
  const initials = (employee.employeeName || "EM").slice(0, 2).toUpperCase();

  const joinDate = employee.dateOfJoining
    ? new Date(employee.dateOfJoining).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-4">

      {/* ── Profile header card ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-6 py-5">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-sm">
            {initials}
          </div>

          {/* Name + dept + ID */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{employee.employeeName}</h2>
              {employee.department && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  {employee.department}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">ID:</span>
              <CopyId id={employee.employeeId} />
              {employee.employeeemail && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-500 truncate">{employee.employeeemail}</span>
                </>
              )}
            </div>
          </div>

          {/* Status + Edit */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
              ${isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200"}
            `}>
              {isActive
                ? <CheckCircle2 size={11} className="text-emerald-500" />
                : <XCircle size={11} className="text-slate-400" />}
              {isActive ? "Active" : "Inactive"}
            </span>
            <EditEmployeeDialog employee={employee} setemployee={setemployee} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <StatPill label="Department"  value={employee.department}         color="blue"    />
          <StatPill label="Salary (PKR)" value={employee.employeeSalary ? `PKR ${Number(employee.employeeSalary).toLocaleString()}` : null} color="emerald" />
          <StatPill label="Working Hrs" value={employee.totalWorkingHours ? `${employee.totalWorkingHours} hrs` : null} color="violet" />
          <StatPill label="Joined"      value={joinDate ? new Date(employee.dateOfJoining).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null} color="amber" />
        </div>
      </div>

      {/* ── Info grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Card title="Personal Information">
          <InfoRow icon={Mail}       label="Email Address" value={employee.employeeemail} />
          <InfoRow icon={Phone}      label="Phone Number"  value={employee.employeePhone} />
          <InfoRow icon={CreditCard} label="CNIC"          value={employee.employeeCNIC} />
          <InfoRow icon={MapPin}     label="Address"       value={employee.employeeAddress} />
        </Card>

        <Card title="Work Details">
          <InfoRow icon={Briefcase}   label="Department"      value={employee.department} />
          <InfoRow icon={DollarSign}  label="Salary (PKR)"    value={employee.employeeSalary} />
          <InfoRow icon={Clock}       label="Working Hours"   value={employee.totalWorkingHours ? `${employee.totalWorkingHours} hrs / day` : null} />
          <InfoRow icon={Calendar}    label="Date of Joining" value={joinDate} />
          {employee.salesTarget && (
            <InfoRow icon={Target} label="Sales Target" value={employee.salesTarget} />
          )}
        </Card>
      </div>

      {/* ── Assigned Companies ────────────────────────────── */}
      <Card
        title="Assigned Companies"
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus size={12} />
            Assign
          </button>
        }
      >
        <div className="py-2">
          {assignedCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignedCompanies.map((comp, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{comp.name}</p>
                    {comp.companyWebsite && (
                      <a
                        href={comp.companyWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 mt-0.5"
                      >
                        <Globe size={9} />
                        {comp.companyWebsite.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building2 size={18} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No company assigned yet</p>
            </div>
          )}
        </div>

        <AssignCompanydIalog
          open={open}
          setOpen={setOpen}
          assigncompanies={assigncompanies}
          employeeId={employee.employeeId}
        />
      </Card>

      {/* ── Attendance ────────────────────────────────────── */}
      <Card title="Attendance History">
        <div className="py-2">
          <Listattendance attendance={employee.Attendance} setemployee={setemployee} />
        </div>
      </Card>

    </div>
  );
};

export default EmployeesDetails;
