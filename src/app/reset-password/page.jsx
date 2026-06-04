"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, ArrowRight, Eye, EyeOff,
  KeyRound, ShieldCheck, Lock, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

/* ── OTP input — 6 individual digit boxes ── */
const OtpInput = ({ value, onChange }) => {
  const inputs = useRef([]);

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      if (!value[idx] && idx > 0) inputs.current[idx - 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next  = value.split("");
    next[idx]   = char;
    onChange(next.join(""));
    if (char && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, "").slice(0, 6));
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl bg-slate-50
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all
                     caret-transparent"
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
};

/* ── Main page — uses useSearchParams so wrapped in Suspense ── */
function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const emailParam   = searchParams.get("email") || "";

  // Step: "otp" | "password" | "done"
  const [step, setStep]           = useState("otp");
  const [otp, setOtp]             = useState("");
  const [newPassword, setNew]     = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowCon] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter the complete 6-digit OTP");

    setLoading(true);
    try {
      const res  = await fetch("/api/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: emailParam, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("OTP verified!");
        setStep("password");
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirm)  return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res  = await fetch("/api/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: emailParam, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep("done");
        toast.success("Password reset successfully!");
      } else {
        toast.error(data.error || "Reset failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: emailParam }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("New OTP sent to your email!");
        setOtp("");
        setCountdown(60);
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-linear-to-br from-[#EEF4FF] via-white to-blue-100 flex-col justify-between p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #bfdbfe 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-300 rounded-full opacity-20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-12">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center">
              <Image src="/logo.webp" alt="HumanEdge" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-lg leading-none">HumanEdge</p>
              <p className="text-slate-500 text-xs font-medium">HR Management Platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-3">
            {step === "otp"      && <><span>Verify your</span><br /><span>identity</span><br /><span className="text-blue-600">securely.</span></>}
            {step === "password" && <><span>Create a</span><br /><span>new strong</span><br /><span className="text-blue-600">password.</span></>}
            {step === "done"     && <><span>You're all</span><br /><span>set and</span><br /><span className="text-blue-600">secured.</span></>}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            {step === "otp"      && "Enter the 6-digit code sent to your registered email address to continue."}
            {step === "password" && "Choose a strong password that's at least 6 characters and unique to this account."}
            {step === "done"     && "Your password has been updated. You can now sign in with your new credentials."}
          </p>
        </div>

        {/* Progress steps */}
        <div className="relative z-10 space-y-3">
          {[
            { label: "Send OTP",       done: true },
            { label: "Verify OTP",     done: step === "password" || step === "done" },
            { label: "Reset Password", done: step === "done" },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : "bg-blue-100 border-2 border-blue-300"}`}>
                {done
                  ? <CheckCircle2 size={14} className="text-white" />
                  : <div className="w-2 h-2 rounded-full bg-blue-400" />}
              </div>
              <p className={`text-sm font-medium ${done ? "text-emerald-700" : "text-slate-500"}`}>{label}</p>
            </div>
          ))}
          <p className="text-slate-400 text-xs pt-4 border-t border-blue-200">
            © {new Date().getFullYear()} HumanEdge. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center p-0.5">
              <Image src="/logo.webp" alt="HumanEdge" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <p className="font-bold text-slate-900">HumanEdge</p>
          </div>

          {/* ══ STEP 1: OTP ══ */}
          {step === "otp" && (
            <>
              <div className="mb-6 w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <ShieldCheck size={22} className="text-blue-600" />
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900">Check your email</h2>
                <p className="text-slate-400 text-sm mt-1">
                  We sent a 6-digit OTP to{" "}
                  <span className="font-semibold text-slate-700">{emailParam}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <OtpInput value={otp} onChange={setOtp} />

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                    : <>Verify OTP <ArrowRight size={15} /></>}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400 mb-2">Didn't receive the code?</p>
                {countdown > 0 ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Resend in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {resending ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ══ STEP 2: New Password ══ */}
          {step === "password" && (
            <>
              <div className="mb-6 w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Lock size={22} className="text-blue-600" />
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900">New password</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Set a strong new password for your account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNew(e.target.value)}
                      required
                      className="pl-9 pr-10 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                      At least 6 characters required
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="pl-9 pr-10 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1"
                    />
                    <button type="button" onClick={() => setShowCon(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== newPassword && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                      Passwords do not match
                    </p>
                  )}
                  {confirm && confirm === newPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirm}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2 mt-2"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Resetting…</>
                    : <>Reset Password <ArrowRight size={15} /></>}
                </button>
              </form>
            </>
          )}

          {/* ══ STEP 3: Done ══ */}
          {step === "done" && (
            <div className="text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Password Reset!</h2>
              <p className="text-slate-400 text-sm mb-8">
                Your password has been updated successfully.
                You can now sign in with your new credentials.
              </p>
              <Link
                href="/"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
              >
                Go to Sign In <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {/* Back link */}
          {step !== "done" && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/forgot-password"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={13} /> Back
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
