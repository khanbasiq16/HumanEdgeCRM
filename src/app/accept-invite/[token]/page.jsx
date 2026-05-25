"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2,
  XCircle, Users, Building2, CalendarDays, DollarSign,
  FileText, Settings, Lock, User, Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const MODULE_META = {
  employees:  { label: "Manage Employees",    icon: Users        },
  companies:  { label: "Manage Companies",    icon: Building2    },
  attendance: { label: "Attendance Tracking", icon: CalendarDays },
  accounts:   { label: "Accounts & Finance",  icon: DollarSign   },
  templates:  { label: "Letter Templates",    icon: FileText     },
  settings:   { label: "System Settings",     icon: Settings     },
};

const PermBadge = ({ perm }) => {
  const meta = MODULE_META[perm] || { label: perm, icon: ShieldCheck };
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium">
      <Icon size={13} className="shrink-0" />
      {meta.label}
    </div>
  );
};

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router    = useRouter();

  const [phase, setPhase]           = useState("loading"); // loading | register | existing | success | error
  const [invitation, setInvitation] = useState(null);
  const [userExists, setUserExists] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  const [name, setName]             = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!token) return;
    axios
      .get(`/api/admin/invite/verify?token=${token}`)
      .then((r) => {
        setInvitation(r.data.invitation);
        setUserExists(r.data.userExists);
        setPhase(r.data.userExists ? "existing" : "register");
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || "Invalid or expired invitation.");
        setPhase("error");
      });
  }, [token]);

  const validate = () => {
    const errs = {};
    if (!userExists && !name.trim()) errs.name = "Full name is required";
    if (!userExists && password.length < 8) errs.password = "Password must be at least 8 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAccept = async () => {
    if (!userExists && !validate()) return;
    setSubmitting(true);
    try {
      await axios.post("/api/admin/invite/accept", {
        token,
        name:     userExists ? undefined : name,
        password: userExists ? undefined : password,
      });
      setPhase("success");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Something went wrong. Please try again.");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "h-11 text-sm bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo bar */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">HR Platform</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">

          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-slate-500 text-sm font-medium">Verifying invitation…</p>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle size={32} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Invitation Invalid</h2>
                <p className="text-sm text-slate-500">{errorMsg}</p>
              </div>
              <button
                onClick={() => router.push("/superadmin/sign-in")}
                className="mt-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* Success */}
          {phase === "success" && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome aboard!</h2>
                <p className="text-sm text-slate-500">
                  {userExists
                    ? "Your permissions have been updated. Sign in to access your dashboard."
                    : "Your account has been created. Sign in with your email and password."}
                </p>
              </div>
              <div className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Email</p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{invitation?.email}</p>
              </div>
              <button
                onClick={() => router.push("/superadmin/sign-in")}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Register or Existing user form */}
          {(phase === "register" || phase === "existing") && invitation && (
            <>
              {/* Header */}
              <div className="px-7 pt-7 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {phase === "existing" ? "Accept Invitation" : "Create Your Account"}
                </h2>
                <p className="text-sm text-slate-500">
                  {invitation.invitedBy} invited you to join as an Admin Member.
                  {invitation.note && (
                    <span className="block mt-1 italic text-slate-400">"{invitation.note}"</span>
                  )}
                </p>
              </div>

              <div className="p-7 space-y-5">
                {/* Email (read-only) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Invited Email
                  </label>
                  <div className="flex items-center gap-2.5 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{invitation.email}</span>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Your Access Permissions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {invitation.permissions.map((p) => (
                      <PermBadge key={p} perm={p} />
                    ))}
                  </div>
                </div>

                {/* Name + Password — only for new users */}
                {phase === "register" && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                          className={`${inputCls} pl-10`}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Set Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                          className={`${inputCls} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                      )}
                      {password.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                password.length >= (i + 1) * 3
                                  ? password.length >= 12
                                    ? "bg-emerald-400"
                                    : password.length >= 8
                                    ? "bg-blue-400"
                                    : "bg-amber-400"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Existing user note */}
                {phase === "existing" && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <ShieldCheck size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700">
                      An account with this email already exists. Accepting will apply the above permissions to your existing account.
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  ) : (
                    phase === "existing" ? "Accept & Apply Permissions" : "Create Account & Accept"
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          HR Management Platform · Secure Invitation
        </p>
      </div>
    </div>
  );
}
