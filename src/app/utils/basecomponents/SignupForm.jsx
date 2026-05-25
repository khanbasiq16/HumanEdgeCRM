"use client";
import Image from "next/image";
import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Eye, EyeOff, KeyRound, Mail, User, Lock,
  Users, BarChart3, ShieldCheck, Building2, CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const FEATURES = [
  { icon: Users,       text: "Multi-company employee management"    },
  { icon: BarChart3,   text: "Real-time attendance analytics"       },
  { icon: ShieldCheck, text: "Role-based access control"            },
  { icon: Building2,   text: "Centralized HR operations hub"        },
];

export default function SignupForm() {
  const [formData, setFormData]         = useState({ name: "", email: "", password: "" });
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState("");
  const [errors, setErrors]             = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: "" });
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    const pass  = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setFormData({ ...formData, password: pass });
    navigator.clipboard.writeText(pass);
    toast.success("Password generated & copied!");
    setShowPassword(true);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address"; valid = false;
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"; valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/signup", formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-[#EEF4FF] via-white to-blue-100 flex-col justify-between p-10 relative overflow-hidden">

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #bfdbfe 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-300 rounded-full opacity-20 blur-3xl" />

        {/* Brand */}
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

          <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">
            Get started with<br />your admin<br />
            <span className="text-blue-600">account today.</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Create your Super Admin account to unlock full control over employees, attendance, payroll, and companies.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
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

      {/* ── Right panel — form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center p-0.5">
              <Image src="/logo.webp" alt="HumanEdge" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <p className="font-bold text-slate-900">HumanEdge</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Create account</h2>
            <p className="text-slate-400 text-sm mt-1">Set up your Super Admin access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 pr-20 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={generatePassword}
                    title="Generate password"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Sparkles size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.password}
                </p>
              )}
              {message && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              Secured with enterprise-grade encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
