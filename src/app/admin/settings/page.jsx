"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import Ipwhitelistdialog from "@/app/utils/superadmin/components/dialog/Ipwhitelistdialog";
import InviteMemberdialog from "@/app/utils/superadmin/components/dialog/InviteMemberdialog";
import EditInvitationdialog from "@/app/utils/superadmin/components/dialog/EditInvitationdialog";
import { Switch } from "@/components/ui/switch";

import { createcompany }    from "@/features/Slice/CompanySlice";
import { createdepartment } from "@/features/Slice/DepartmentSlice";
import { createemployees }  from "@/features/Slice/EmployeeSlice";
import { getallipwhitelist } from "@/features/Slice/IpwhiteSlice";

import {
  Users, Layers, Building2, Wifi, Calendar, CheckCircle2,
  XCircle, Shield, ToggleLeft, ArrowRight, UserPlus, Mail,
  ShieldCheck, Trash2, Pencil,
} from "lucide-react";
import Link from "next/link";

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
  employees:  "Employees",
  companies:  "Companies",
  attendance: "Attendance",
  accounts:   "Accounts",
  templates:  "Templates",
  settings:   "Settings",
};

const Page = () => {
  const [ipdialog, setIpdialog]             = useState(false);
  const [invitedialog, setInvitedialog]     = useState(false);
  const [signupAccess, setSignupAccess]     = useState(false);
  const [toggling, setToggling]             = useState(false);
  const [empRegAccess, setEmpRegAccess]     = useState(false);
  const [empRegToggling, setEmpRegToggling] = useState(false);
  const [members, setMembers]         = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [editMemberOpen, setEditMemberOpen]   = useState(false);
  const [editingMember, setEditingMember]     = useState(null);
  const router  = useRouter();
  const dispatch = useDispatch();

  const { department } = useSelector((s) => s.Department);
  const { ipwhitelist } = useSelector((s) => s.Ipwhitelist);
  const { employees }   = useSelector((s) => s.Employee);
  const { companies }   = useSelector((s) => s.Company);

  useEffect(() => {
    axios.get("/api/get-all-department").then((r) => dispatch(createdepartment(r.data.departments))).catch(console.error);
    axios.get("/api/get-all-employees").then((r)  => dispatch(createemployees(r.data.employees))).catch(console.error);
    axios.get("/api/get-all-companies").then((r)  => dispatch(createcompany(r.data.companies))).catch(console.error);
    axios.get("/api/get-ipwhitelist").then((r)    => dispatch(getallipwhitelist(r.data.whitelist))).catch(console.error);
    axios.get("/api/get-signup-access").then((r)      => setSignupAccess(r.data.signupAccess)).catch(console.error);
    axios.get("/api/get-employee-reg-access").then((r) => setEmpRegAccess(r.data.employeeRegAccess)).catch(console.error);
    axios.get("/api/admin/members").then((r) => {
      setMembers(r.data.members || []);
      setInvitations(r.data.invitations || []);
    }).catch(console.error);
  }, []);

  const handleToggleSignup = async () => {
    setToggling(true);
    try {
      await axios.post("/api/update-signup-access", { signupAccess: !signupAccess });
      setSignupAccess(!signupAccess);
      toast.success(`Signup page ${!signupAccess ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update signup setting");
    } finally {
      setToggling(false);
    }
  };

  const handleToggleEmpReg = async () => {
    setEmpRegToggling(true);
    try {
      await axios.post("/api/update-employee-reg-access", { employeeRegAccess: !empRegAccess });
      setEmpRegAccess(!empRegAccess);
      toast.success(`Employee registration ${!empRegAccess ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update employee registration setting");
    } finally {
      setEmpRegToggling(false);
    }
  };

  const activeEmployees   = employees?.filter((e) => e.status?.toLowerCase() === "active").length || 0;
  const inactiveEmployees = (employees?.length || 0) - activeEmployees;

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Settings" />

      <div className="space-y-6">

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
                ipwhitelist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Wifi size={14} className="text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">{item.networkName}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{item.ip}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Wifi size={24} className="text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">No IPs whitelisted</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Admin Members ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <SectionHeader
            icon={ShieldCheck}
            title={`Admin Members${members.length + invitations.length > 0 ? ` · ${members.length + invitations.length}` : ""}`}
            action={
              <InviteMemberdialog
                open={invitedialog}
                setOpen={setInvitedialog}
                invitedBy="Super Admin"
              />
            }
          />
          <div className="divide-y divide-slate-100">
            {members.length === 0 && invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <UserPlus size={20} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-400">No admin members yet</p>
                  <p className="text-xs text-slate-300 mt-0.5">Invite team members to collaborate</p>
                </div>
              </div>
            ) : (
              <>
                {/* Accepted members */}
                {members.map((m) => {
                  const initials = (m.name || m.email || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={m.uid} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-700 truncate">{m.name || "—"}</p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0 flex items-center gap-1">
                            <CheckCircle2 size={9} /> Active
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail size={10} className="text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-400 truncate">{m.email}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 max-w-36 justify-end">
                          {(m.permissions || []).slice(0, 3).map((p) => (
                            <span key={p} className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                              {MODULE_LABELS[p] || p}
                            </span>
                          ))}
                          {(m.permissions || []).length > 3 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                              +{(m.permissions || []).length - 3}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => { setEditingMember({ id: m.uid, email: m.email, permissions: m.permissions || [] }); setEditMemberOpen(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                          title="Edit permissions"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete("/api/admin/members", { data: { uid: m.uid } });
                              setMembers((prev) => prev.filter((x) => x.uid !== m.uid));
                              toast.success("Member removed");
                            } catch {
                              toast.error("Failed to remove member");
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pending invitations */}
                {invitations.map((inv) => {
                  const initials = (inv.email || "?")[0].toUpperCase();
                  return (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/40">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0 border border-amber-200 border-dashed">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-500 truncate">{inv.email}</p>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                            Pending
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Invited by {inv.invitedBy} · expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 max-w-36 justify-end">
                          {(inv.permissions || []).slice(0, 2).map((p) => (
                            <span key={p} className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                              {MODULE_LABELS[p] || p}
                            </span>
                          ))}
                          {(inv.permissions || []).length > 2 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                              +{(inv.permissions || []).length - 2}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete("/api/admin/invite/delete", { data: { id: inv.id } });
                              setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                              toast.success("Invitation cancelled");
                            } catch {
                              toast.error("Failed to delete invitation");
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          title="Cancel invitation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
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

      </div>
      {/* Edit member permissions dialog */}
      {editingMember && (
        <EditInvitationdialog
          open={editMemberOpen}
          setOpen={setEditMemberOpen}
          invitation={editingMember}
          endpoint="/api/admin/members"
          idField="id"
          onUpdated={(uid, perms) => {
            setMembers((prev) => prev.map((m) => m.uid === uid ? { ...m, permissions: perms } : m));
            setEditingMember(null);
          }}
        />
      )}
    </SuperAdminlayout>
  );
};

export default Page;
