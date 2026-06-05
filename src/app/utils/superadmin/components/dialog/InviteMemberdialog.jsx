"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus, Loader2, Users, Building2, CalendarDays,
  DollarSign, FileText, Settings, Mail, Send, ShieldCheck,
  CheckSquare, Square, Copy, CheckCircle2, Link2, ArrowLeft,
  UserCheck, Zap,
} from "lucide-react";

const MODULES = [
  { id: "employees",  label: "Employees & Departments", desc: "Employees, departments, projects & tasks", icon: Users        },
  { id: "companies",  label: "Companies",               desc: "Create and manage company profiles",       icon: Building2    },
  { id: "attendance", label: "Attendance",              desc: "View and manage attendance records",       icon: CalendarDays },
  { id: "accounts",   label: "Accounts & Finance",      desc: "Accounts, banks, taxes and expenses",      icon: DollarSign   },
  { id: "templates",  label: "Templates",               desc: "Create and assign letter templates",       icon: FileText     },
  { id: "settings",   label: "Settings Page Only",      desc: "IP whitelist, toggles, configuration",    icon: Settings     },
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

const InviteMemberdialog = ({ open, setOpen, invitedBy, inviterPermissions = null }) => {
  const availableModules = inviterPermissions === null
    ? MODULES
    : MODULES.filter((m) => inviterPermissions.includes(m.id));

  const [email, setEmail]           = useState("");
  const [note, setNote]             = useState("");
  const [selected, setSelected]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [emailError, setEmailError] = useState("");
  const [acceptLink, setAcceptLink] = useState("");
  const [copied, setCopied]         = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [phase, setPhase]           = useState("form"); // form | success

  // Existing-user detection
  const [existingUser, setExistingUser] = useState(null); // { uid, name, email, role, permissions }
  const [lookingUp, setLookingUp]       = useState(false);
  const [grantMode, setGrantMode]       = useState(false); // true = grant to existing user
  const [wasGrant, setWasGrant]         = useState(false); // stored for success screen
  const emailTimer = useRef(null);

  const reset = () => {
    setEmail(""); setNote(""); setSelected([]);
    setEmailError(""); setAcceptLink("");
    setCopied(false); setEmailSent(false); setPhase("form");
    setExistingUser(null); setLookingUp(false);
    setGrantMode(false); setWasGrant(false);
  };

  const handleClose = (val) => {
    setOpen(val);
    if (!val) setTimeout(reset, 300);
  };

  const toggleModule = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(selected.length === availableModules.length ? [] : availableModules.map((m) => m.id));

  /* ── Email change: debounced user lookup ── */
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError("");
    setExistingUser(null);
    setGrantMode(false);
    clearTimeout(emailTimer.current);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;

    setLookingUp(true);
    emailTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/admin/check-user?email=${encodeURIComponent(val)}`);
        if (res.data.exists) {
          setExistingUser(res.data.user);
          setGrantMode(true);
        }
      } catch {}
      finally { setLookingUp(false); }
    }, 500);
  };

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return false;
    }
    if (selected.length === 0) {
      toast.error("Select at least one permission module");
      return false;
    }
    return true;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(acceptLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (grantMode && existingUser) {
        /* ── Grant access to existing user directly ── */
        const res = await axios.patch("/api/admin/members", {
          id:          existingUser.uid,
          permissions: selected,
        });
        if (res.data.success) {
          setWasGrant(true);
          setEmailSent(true);
          setPhase("success");
          toast.success(`Access granted to ${email} and notified`);
        } else {
          toast.error(res.data.error || "Failed to grant access");
        }
      } else {
        /* ── Regular invite ── */
        const res = await axios.post("/api/admin/invite", {
          email,
          permissions: selected,
          invitedBy:   invitedBy || "Admin",
          note,
        });
        setAcceptLink(res.data.acceptLink || "");
        setEmailSent(res.data.emailSent === true);
        setWasGrant(false);
        setPhase("success");
        if (res.data.emailSent) {
          toast.success(`Invitation email sent to ${email}`);
        } else {
          toast.error("Email delivery failed — share the link manually");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

  /* ── Avatar color from email ── */
  const avatarColor = (str) => AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials    = (str) => (str || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <UserPlus size={13} />
          Invite Member
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden">

        {/* ── Success screen ── */}
        {phase === "success" && (
          <>
            <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${wasGrant ? "bg-blue-600" : emailSent ? "bg-emerald-500" : "bg-amber-500"}`}>
                  {wasGrant
                    ? <UserCheck size={17} className="text-white" />
                    : emailSent
                    ? <CheckCircle2 size={17} className="text-white" />
                    : <Link2 size={17} className="text-white" />
                  }
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                    {wasGrant ? "Access Granted" : emailSent ? "Invitation Sent" : "Invitation Created"}
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wasGrant
                      ? <><span className="font-semibold text-blue-600">{email}</span> can now access the panel</>
                      : emailSent
                      ? <>Email sent to <span className="font-semibold text-slate-600">{email}</span></>
                      : <span className="text-amber-600 font-medium">Email failed — share the link manually</span>
                    }
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-6 space-y-4">

              {/* Grant mode: success card */}
              {wasGrant && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(existingUser?.name || email)}`}>
                    {initials(existingUser?.name || email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{existingUser?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Zap size={13} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600">Access updated</span>
                  </div>
                </div>
              )}

              {/* Invite mode: link section */}
              {!wasGrant && (
                <>
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${emailSent ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}>
                    <Link2 size={16} className={`mt-0.5 shrink-0 ${emailSent ? "text-amber-600" : "text-red-500"}`} />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${emailSent ? "text-amber-800" : "text-red-700"}`}>
                        {emailSent ? "Share the invite link directly (recommended)" : "Email delivery failed — use this link"}
                      </p>
                      <p className={`text-xs ${emailSent ? "text-amber-600" : "text-red-500"}`}>
                        {emailSent
                          ? "Copy and share this link in case the email lands in spam."
                          : "The invitation was saved. Copy and send this link via WhatsApp, Slack, or any other channel."
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Invite Link</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="flex-1 text-xs font-mono text-slate-600 break-all leading-relaxed">{acceptLink}</p>
                      <button
                        onClick={copyLink}
                        title="Copy link"
                        className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          copied
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-white border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Copied to clipboard
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Permissions summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permissions Granted</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={13} className="text-slate-400" />
                  <span className="text-slate-600">{email}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selected.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                      {MODULES.find((m) => m.id === s)?.label || s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} /> Invite another
              </button>
              <button
                onClick={() => handleClose(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* ── Invite form ── */}
        {phase === "form" && (
          <>
            <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={17} className="text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                    Invite Admin Member
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send an invite or grant access to an existing user
                  </p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="member@company.com"
                      value={email}
                      onChange={handleEmailChange}
                      className={`${inputCls} pl-10 pr-10`}
                    />
                    {lookingUp && (
                      <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                    )}
                  </div>
                  {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}

                  {/* Existing user card */}
                  {existingUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(existingUser.name || existingUser.email)}`}>
                        {initials(existingUser.name || existingUser.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-800 truncate">{existingUser.name || "—"}</p>
                        <p className="text-xs text-blue-500 truncate">{existingUser.email}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200">
                        <UserCheck size={11} className="text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-600">User Found</span>
                      </div>
                    </div>
                  )}

                  {/* Mode indicator */}
                  {grantMode && existingUser && (
                    <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1">
                      <Zap size={11} /> This user already exists — submitting will grant access directly and send them a notification.
                    </p>
                  )}
                </div>

                {/* Note (only for invite mode) */}
                {!grantMode && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Personal Note <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <Input
                      placeholder="e.g. Welcome to the team!"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Access Permissions
                    </label>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {selected.length === availableModules.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {availableModules.map((mod) => {
                      const Icon      = mod.icon;
                      const isChecked = selected.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            isChecked ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isChecked ? "bg-blue-600" : "bg-white border border-slate-200"
                          }`}>
                            <Icon size={14} className={isChecked ? "text-white" : "text-slate-400"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isChecked ? "text-blue-800" : "text-slate-700"}`}>
                              {mod.label}
                            </p>
                            <p className={`text-xs mt-0.5 ${isChecked ? "text-blue-500" : "text-slate-400"}`}>
                              {mod.desc}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {isChecked
                              ? <CheckSquare size={16} className="text-blue-600" />
                              : <Square size={16} className="text-slate-300" />
                            }
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-medium">
                  {selected.length > 0
                    ? `${selected.length} permission${selected.length > 1 ? "s" : ""} selected`
                    : "No permissions selected"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
                  >
                    {loading ? (
                      <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    ) : grantMode ? (
                      <><Zap size={14} /> Grant Access</>
                    ) : (
                      <><Send size={14} /> Send Invitation</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberdialog;
