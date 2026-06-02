"use client";

import React, { useState } from "react";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import toast   from "react-hot-toast";
import axios   from "axios";
import { useDispatch, useSelector } from "react-redux";
import { UpdateUser } from "@/features/Slice/UserSlice";
import {
  User, Shield, Bell, Lock, Eye, EyeOff, RefreshCcw,
  Save, Mail, Phone, Loader2, Check, ChevronRight, Building2, Hash, Briefcase,
  Landmark, CreditCard, ChevronsUpDown,
} from "lucide-react";

/* ── bank list ────────────────────────────────────────────── */
const BANKS = [
  { name: "National Bank of Pakistan",         code: "NBP"   },
  { name: "NayaPay",                            code: "NAYAP" },
  { name: "SadaPay",                            code: "SADAP" },
  { name: "SINDH BANK",                         code: "SDB"   },
  { name: "Summit Bank Limited",                code: "SUM"   },
  { name: "CITI BANK N A",                      code: "CITI"  },
  { name: "ALLIED BANK LTD",                    code: "ABL"   },
  { name: "BANK AL FALAH LIMITED",              code: "BAL"   },
  { name: "ASKARI BANK LTD",                    code: "ACB"   },
  { name: "BANK AL HABIB LTD",                  code: "BAH"   },
  { name: "BANK ISLAMI PAKISTAN LTD",           code: "BIL"   },
  { name: "THE BANK OF PUNJAB",                 code: "TBP"   },
  { name: "DUBAI ISLAMIC BANK PAK LTD",         code: "DBI"   },
  { name: "AL BARAKA BANK (PAKISTAN) LTD",      code: "ABS"   },
  { name: "HABIB BANK LIMITED",                 code: "HBL"   },
  { name: "J.S.BANK LIMITED",                   code: "JSB"   },
  { name: "KHUSHALI BANK LIMITED",              code: "KBL"   },
  { name: "THE BANK OF KHYBER LTD",             code: "TBK"   },
  { name: "SAMBA BANK LIMITED",                 code: "SMB"   },
  { name: "MCB ISLAMIC BANK",                   code: "MCBIS" },
  { name: "MEEZAN BANK LIMITED",                code: "MBL"   },
  { name: "HABIB METROPOLITAN BANK LTD",        code: "MPB"   },
  { name: "MCB Bank Ltd.",                      code: "MCB"   },
  { name: "NRSP Microfinance Bank",             code: "NRSP"  },
  { name: "SILKBANK LIMITED",                   code: "SLK"   },
  { name: "ST. CHARTERED BANK PAKISTAN",        code: "SCB"   },
  { name: "SONERI BANK LTD.",                   code: "SBL"   },
  { name: "TELENOR MICRO FINANCE BANK LIMITED", code: "TBL"   },
  { name: "U Microfinance Bank Ltd",            code: "UBANK" },
  { name: "UNITED BANK LIMITED",                code: "UBL"   },
  { name: "Mobilink Micro Finance Bank Ltd",    code: "MOBIM" },
];

/* ── helpers ──────────────────────────────────────────────── */
const getInitials = (name) =>
  (name || "E").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const generatePassword = (len = 16) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let p = "", U = false, L = false, N = false, S = false;
  while (!U || !L || !N || !S || p.length < len) {
    p = ""; U = L = N = S = false;
    for (let i = 0; i < len; i++) {
      const c = chars[Math.floor(Math.random() * chars.length)];
      p += c;
      if (/[A-Z]/.test(c)) U = true;
      if (/[a-z]/.test(c)) L = true;
      if (/[0-9]/.test(c)) N = true;
      if (/[^A-Za-z0-9]/.test(c)) S = true;
    }
  }
  return p;
};

const pwStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "bg-slate-100" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak",   color: "bg-red-400"    };
  if (s <= 2) return { score: s, label: "Fair",   color: "bg-amber-400"  };
  if (s <= 3) return { score: s, label: "Good",   color: "bg-blue-400"   };
  return             { score: s, label: "Strong", color: "bg-emerald-500" };
};

/* ── reusable section header ──────────────────────────────── */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-slate-400" />
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
    {action}
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
    {children}
  </p>
);

const PwField = ({ label, value, show, onToggle, onChange, placeholder }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-9 pr-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500 focus-visible:ring-1"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

/* ── nav items ────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "profile",       icon: User,    label: "Profile"      },
  { id: "bank",          icon: Landmark,label: "Bank Details" },
  { id: "security",      icon: Shield,  label: "Security"     },
  { id: "notifications", icon: Bell,    label: "Notifications"},
];

/* ══════════════════════════════════════════════════════════ */
const EmployeeSettings = () => {
  const { user }   = useSelector((s) => s.User);
  const dispatch   = useDispatch();
  const [tab, setTab] = useState("profile");

  /* profile */
  const [profile, setProfile] = useState({
    employeeName:    user?.employeeName    || "",
    employeeemail:   user?.employeeemail   || "",
    employeePhone:   user?.employeePhone   || "",
    employeeAddress: user?.employeeAddress || "",
    employeeCNIC:    user?.employeeCNIC    || "",
    dateOfJoining:   user?.dateOfJoining   || "",
    designation:     user?.designation     || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  /* bank */
  const [bank, setBank] = useState({
    bankName:          user?.bankName          || "",
    bankCode:          user?.bankCode          || "",
    bankAccountNumber: user?.bankAccountNumber || "",
  });
  const [bankOpen,    setBankOpen]    = useState(false);
  const [bankLoading, setBankLoading] = useState(false);

  /* password */
  const [pw, setPw]           = useState({ old: "", new: "", confirm: "" });
  const [pwShow, setPwShow]   = useState({ old: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const strength = pwStrength(pw.new);

  /* notifications */
  const [notifs, setNotifs] = useState({ email: true, sms: false });

  /* ── handlers ─────────────────────────────────────────── */
  const onProfileChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await axios.post(`/api/employee/update-employee/${user.employeeId}`, profile);
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(UpdateUser(res.data.employee));
      }
    } catch { toast.error("Failed to update profile"); }
    finally   { setProfileLoading(false); }
  };

  const handleBankSelect = (bankName) => {
    const found = BANKS.find((b) => b.name === bankName);
    setBank((b) => ({ ...b, bankName, bankCode: found?.code || "" }));
    setBankOpen(false);
  };

  const saveBank = async (e) => {
    e.preventDefault();
    if (!bank.bankName) return toast.error("Please select a bank");
    if (!bank.bankAccountNumber) return toast.error("Please enter account number");
    setBankLoading(true);
    try {
      const res = await axios.post(`/api/employee/update-employee/${user.employeeId}`, bank);
      if (res.data.success) {
        toast.success("Bank details updated successfully");
        dispatch(UpdateUser(res.data.employee));
      }
    } catch { toast.error("Failed to update bank details"); }
    finally   { setBankLoading(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) return toast.error("Passwords do not match");
    if (pw.new.length < 8)    return toast.error("Password must be at least 8 characters");
    setPwLoading(true);
    try {
      const res = await axios.post(`/api/employee/update-password/${user.employeeId}`, {
        oldPassword: pw.old, newPassword: pw.new, confirmPassword: pw.confirm,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setPw({ old: "", new: "", confirm: "" });
      }
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to update password"); }
    finally      { setPwLoading(false); }
  };

  const inputCls = "h-9 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500 focus-visible:ring-1";

  /* ── render ───────────────────────────────────────────── */
  return (
    <Employeelayout>
      <div className="space-y-5">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your profile, bank details, security, and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── Sidebar ─────────────────────────────────── */}
          <div className="w-full lg:w-56 shrink-0 space-y-3">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-sm">
                {getInitials(user?.employeeName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                  {user?.employeeName || "Employee"}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.department?.departmentName || "—"}
                </p>
                <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-700 uppercase tracking-wide">
                  Employee
                </span>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 space-y-0.5">
              {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                    ${tab === id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                      ${tab === id ? "bg-blue-100" : "bg-slate-100"}`}>
                      <Icon size={13} className={tab === id ? "text-blue-600" : "text-slate-500"} />
                    </div>
                    {label}
                  </div>
                  <ChevronRight size={13} className={tab === id ? "text-blue-400" : "text-slate-300"} />
                </button>
              ))}
            </div>

          </div>

          {/* ── Content area ────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ══ PROFILE ══════════════════════════════════ */}
            {tab === "profile" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <SectionHeader icon={User} title="Profile Information" />

                {/* Identity strip */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base font-extrabold shrink-0 shadow-sm">
                      {getInitials(user?.employeeName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold text-slate-900 leading-tight">
                        {user?.employeeName || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail size={11} className="text-slate-300" />
                          {user?.employeeemail || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Building2 size={11} className="text-slate-300" />
                          {user?.department?.departmentName || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Hash size={11} className="text-slate-300" />
                          {user?.employeeId || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={saveProfile} className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input name="employeeName" value={profile.employeeName} onChange={onProfileChange}
                        placeholder="Your full name" className={inputCls} />
                    </div>

                    <div>
                      <FieldLabel>Email Address</FieldLabel>
                      <Input type="email" name="employeeemail" value={profile.employeeemail} onChange={onProfileChange}
                        placeholder="you@company.com" className={inputCls} />
                    </div>

                    <div>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input name="employeePhone" value={profile.employeePhone} onChange={onProfileChange}
                        placeholder="+92 300 0000000" className={inputCls} />
                    </div>

                    <div>
                      <FieldLabel>CNIC</FieldLabel>
                      <Input name="employeeCNIC" value={profile.employeeCNIC} onChange={onProfileChange}
                        placeholder="00000-0000000-0" className={inputCls} />
                    </div>

                    <div>
                      <FieldLabel>Date of Joining</FieldLabel>
                      <Input type="date" name="dateOfJoining" value={profile.dateOfJoining} onChange={onProfileChange}
                        className={inputCls} />
                    </div>

                    <div>
                      <FieldLabel>
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} className="text-slate-400" /> Designation / Job Title
                        </span>
                      </FieldLabel>
                      <Input name="designation" value={profile.designation} onChange={onProfileChange}
                        placeholder="e.g. Software Engineer" className={inputCls} />
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Home Address</FieldLabel>
                      <Input name="employeeAddress" value={profile.employeeAddress} onChange={onProfileChange}
                        placeholder="Street, City" className={inputCls} />
                    </div>

                  </div>

                  <div className="flex justify-end mt-5 pt-5 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {profileLoading
                        ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                        : <><Save size={13} />Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══ BANK DETAILS ═════════════════════════════ */}
            {tab === "bank" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <SectionHeader icon={Landmark} title="Bank Details" />

                {/* Current bank info strip */}
                {user?.bankName && (
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Landmark size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.bankName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {user.bankCode || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                          <CreditCard size={11} className="text-slate-300" />
                          {user.bankAccountNumber || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={saveBank} className="p-5 space-y-4">

                  {/* Bank name searchable dropdown */}
                  <div>
                    <FieldLabel>Bank Name</FieldLabel>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`${inputCls} w-full flex items-center justify-between px-3 border border-slate-200`}
                        >
                          <span className={bank.bankName ? "text-slate-800 flex-1 truncate text-sm" : "text-slate-400 flex-1 text-sm"}>
                            {bank.bankName || "Search & select your bank…"}
                          </span>
                          <ChevronsUpDown size={13} className="text-slate-400 shrink-0 ml-2" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 rounded-xl shadow-lg"
                        align="start"
                        style={{ width: "var(--radix-popover-trigger-width)" }}
                      >
                        <Command>
                          <CommandInput placeholder="Search bank…" className="h-9 text-sm" />
                          <CommandList className="max-h-52">
                            <CommandEmpty className="py-4 text-center text-sm text-slate-400">No bank found.</CommandEmpty>
                            <CommandGroup>
                              {BANKS.map((b) => (
                                <CommandItem
                                  key={b.code}
                                  value={b.name}
                                  onSelect={() => handleBankSelect(b.name)}
                                  className="flex items-center justify-between text-sm px-3 py-2 cursor-pointer"
                                >
                                  <span>{b.name}</span>
                                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{b.code}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Bank code – readonly, auto-filled */}
                  <div>
                    <FieldLabel>Bank Code</FieldLabel>
                    <div className="relative">
                      <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        value={bank.bankCode}
                        readOnly
                        placeholder="Auto-filled from bank selection"
                        className={`${inputCls} pl-8 bg-slate-100 text-slate-500 cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  {/* Account number */}
                  <div>
                    <FieldLabel>Account Number / IBAN</FieldLabel>
                    <div className="relative">
                      <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        value={bank.bankAccountNumber}
                        onChange={(e) => setBank((b) => ({ ...b, bankAccountNumber: e.target.value }))}
                        placeholder="e.g. 1234567890 or PK00XXXX…"
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={bankLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {bankLoading
                        ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                        : <><Save size={13} />Save Bank Details</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══ SECURITY ═════════════════════════════════ */}
            {tab === "security" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <SectionHeader
                  icon={Shield}
                  title="Change Password"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        const p = generatePassword();
                        setPw((d) => ({ ...d, new: p, confirm: p }));
                        toast.success("Strong password generated!");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
                    >
                      <RefreshCcw size={11} /> Generate
                    </button>
                  }
                />

                <form onSubmit={savePassword} className="p-5 space-y-4">

                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Lock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Use a strong password with uppercase, numbers, and symbols — at least 8 characters.
                    </p>
                  </div>

                  <PwField label="Current Password"
                    value={pw.old} show={pwShow.old}
                    onToggle={() => setPwShow((s) => ({ ...s, old: !s.old }))}
                    onChange={(e) => setPw((d) => ({ ...d, old: e.target.value }))}
                    placeholder="Enter current password" />

                  <PwField label="New Password"
                    value={pw.new} show={pwShow.new}
                    onToggle={() => setPwShow((s) => ({ ...s, new: !s.new }))}
                    onChange={(e) => setPw((d) => ({ ...d, new: e.target.value }))}
                    placeholder="Enter new password" />

                  {pw.new && (
                    <div className="space-y-1.5 -mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300
                              ${i <= strength.score ? strength.color : "bg-slate-100"}`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-semibold
                        ${strength.score <= 1 ? "text-red-500"
                          : strength.score <= 2 ? "text-amber-500"
                          : strength.score <= 3 ? "text-blue-500"
                          : "text-emerald-600"}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}

                  <PwField label="Confirm New Password"
                    value={pw.confirm} show={pwShow.confirm}
                    onToggle={() => setPwShow((s) => ({ ...s, confirm: !s.confirm }))}
                    onChange={(e) => setPw((d) => ({ ...d, confirm: e.target.value }))}
                    placeholder="Confirm new password" />

                  {pw.confirm && (
                    <p className={`text-[11px] font-semibold flex items-center gap-1 -mt-2
                      ${pw.new === pw.confirm ? "text-emerald-600" : "text-red-500"}`}>
                      {pw.new === pw.confirm
                        ? <><Check size={11} />Passwords match</>
                        : "Passwords do not match"}
                    </p>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {pwLoading
                        ? <><Loader2 size={13} className="animate-spin" />Updating…</>
                        : <><Lock size={13} />Update Password</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══ NOTIFICATIONS ════════════════════════════ */}
            {tab === "notifications" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <SectionHeader icon={Bell} title="Notification Preferences" />

                <div className="p-5 space-y-3">
                  {[
                    { id: "email", icon: Mail,  label: "Email Notifications", sub: "Receive alerts and updates via email",     accent: "bg-blue-50 text-blue-500"    },
                    { id: "sms",   icon: Phone, label: "SMS Alerts",           sub: "Get text messages for critical events",    accent: "bg-emerald-50 text-emerald-500" },
                  ].map(({ id, icon: Icon, label, sub, accent }) => (
                    <div key={id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifs((n) => ({ ...n, [id]: !n[id] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                          ${notifs[id] ? "bg-blue-600" : "bg-slate-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
                          ${notifs[id] ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toast.success("Preferences saved!")}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      <Save size={13} />Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Employeelayout>
  );
};

export default EmployeeSettings;
