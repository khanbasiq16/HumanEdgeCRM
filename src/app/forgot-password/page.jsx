"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Mail, ArrowRight, ArrowLeft,
  ShieldCheck, KeyRound, Lock, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const TIPS = [
  { icon: ShieldCheck, text: "Reset link expires in 15 minutes"       },
  { icon: Mail,        text: "Check your spam folder if not received" },
  { icon: KeyRound,    text: "Choose a strong, unique new password"   },
  { icon: Lock,        text: "Never share your password with anyone"  },
];

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const router                = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address");

    setLoading(true);
    try {
      const res  = await fetch("/api/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent! Check your inbox.");
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-[#EEF4FF] via-white to-blue-100 flex-col justify-between p-10 relative overflow-hidden">
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
            Regain access to<br />your account<br />
            <span className="text-blue-600">securely.</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Enter your registered email and we'll send you a 6-digit OTP to reset your password.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {TIPS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-blue-600" />
              </div>
              <p className="text-slate-700 text-sm font-medium">{text}</p>
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

          {/* Icon */}
          <div className="mb-6 w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <KeyRound size={22} className="text-blue-600" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Forgot password?</h2>
            <p className="text-slate-400 text-sm mt-1">
              We'll send a 6-digit OTP to your registered email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Sending OTP…</>
              ) : (
                <>Send OTP <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">
              <ArrowLeft size={13} /> Back to sign in
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              OTP valid for 15 min
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
