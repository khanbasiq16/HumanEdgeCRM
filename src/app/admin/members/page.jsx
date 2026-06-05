"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

import SuperAdminlayout    from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb     from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import InviteMemberdialog  from "@/app/utils/superadmin/components/dialog/InviteMemberdialog";
import EditInvitationdialog from "@/app/utils/superadmin/components/dialog/EditInvitationdialog";

import {
  ShieldCheck, UserPlus, Mail, CheckCircle2, Trash2, Pencil,
} from "lucide-react";

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

/* ── Skeleton ── */
const Sk = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

const MembersSkeleton = () => (
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
            <Sk className="h-5 w-20 rounded-full" />
            <Sk className="h-5 w-20 rounded-full" />
            <Sk className="w-7 h-7 rounded-lg" />
            <Sk className="w-7 h-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Page = () => {
  const [loading,        setLoading]        = useState(true);
  const [members,        setMembers]        = useState([]);
  const [invitations,    setInvitations]    = useState([]);
  const [invitedialog,   setInvitedialog]   = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editingMember,  setEditingMember]  = useState(null);

  const { user } = useSelector((s) => s.User);
  const isSuperAdmin       = user?.role === "superAdmin";
  const inviterPermissions = isSuperAdmin ? null : (user?.permissions || []);

  useEffect(() => {
    axios.get("/api/admin/members")
      .then((r) => {
        setMembers(r.data.members || []);
        setInvitations(r.data.invitations || []);
      })
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteMember = async (uid) => {
    try {
      await axios.delete("/api/admin/members", { data: { uid } });
      setMembers((prev) => prev.filter((m) => m.uid !== uid));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleCancelInvite = async (id) => {
    try {
      await axios.delete("/api/admin/invite/delete", { data: { id } });
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invitation cancelled");
    } catch {
      toast.error("Failed to cancel invitation");
    }
  };

  const totalCount = members.length + invitations.length;

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Members" />

      <div className="space-y-6">

        {loading ? <MembersSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-400" />
                <h2 className="text-sm font-bold text-slate-800">
                  Admin Members{totalCount > 0 ? ` · ${totalCount}` : ""}
                </h2>
              </div>
              {isSuperAdmin && (
                <InviteMemberdialog
                  open={invitedialog}
                  setOpen={setInvitedialog}
                  invitedBy={user?.name || user?.email || "Admin"}
                  inviterPermissions={inviterPermissions}
                />
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {members.length === 0 && invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <UserPlus size={22} className="text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">No admin members yet</p>
                    <p className="text-xs text-slate-300 mt-0.5">Invite team members to collaborate</p>
                  </div>
                  {isSuperAdmin && (
                    <InviteMemberdialog
                      open={invitedialog}
                      setOpen={setInvitedialog}
                      invitedBy={user?.name || user?.email || "Admin"}
                      inviterPermissions={inviterPermissions}
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Active members */}
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
                          <div className="flex flex-wrap gap-1 max-w-[180px] justify-end">
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
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => { setEditingMember({ id: m.uid, email: m.email, permissions: m.permissions || [] }); setEditMemberOpen(true); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                                title="Edit permissions"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m.uid)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                title="Remove member"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
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
                          <div className="flex flex-wrap gap-1 max-w-[180px] justify-end">
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
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleCancelInvite(inv.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              title="Cancel invitation"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {editingMember && (
        <EditInvitationdialog
          open={editMemberOpen}
          setOpen={setEditMemberOpen}
          invitation={editingMember}
          endpoint="/api/admin/members"
          idField="id"
          inviterPermissions={inviterPermissions}
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
