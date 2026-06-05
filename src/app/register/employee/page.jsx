"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye, EyeOff, KeyRound, User, Mail, CreditCard, MapPin,
  Building2, Layers, Clock, Calendar, Lock, Loader2,
  ArrowRight, ArrowLeft, CheckCircle2, ClipboardCheck, BarChart3,
  FileText, UserPlus, Briefcase, Landmark, Hash,
} from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { createcompany } from "@/features/Slice/CompanySlice";
import { createdepartment } from "@/features/Slice/DepartmentSlice";
import { useRouter } from "next/navigation";
import { BANKS } from "@/app/utils/constants/banks";

/* ── Design tokens matching the app theme ── */
const inputCls =
  "pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400 w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const labelCls = "text-xs font-bold text-slate-600 uppercase tracking-wider";
const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none";

const FEATURES = [
  { icon: ClipboardCheck, text: "One-tap check-in & check-out"       },
  { icon: BarChart3,      text: "View your attendance history"        },
  { icon: FileText,       text: "Receive official HR letters"         },
  { icon: Clock,          text: "Access payslips & salary details"    },
];

const STEPS = ["Personal Info", "Employment", "Bank & ID", "Security"];

/* ── Step Indicator ── */
const StepBar = ({ current }) => (
  <div className="flex items-center mb-8 pt-1">
    {STEPS.map((label, i) => {
      const done   = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1 shrink-0 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
              done   ? "bg-blue-600 text-white" :
              active ? "bg-blue-600 text-white ring-[3px] ring-blue-100 ring-offset-1" :
                       "bg-slate-100 text-slate-400"
            }`}>
              {done ? <CheckCircle2 size={12} /> : i + 1}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wide leading-none text-center ${
              active ? "text-blue-600" : done ? "text-slate-500" : "text-slate-300"
            }`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-1.5 mb-3.5 transition-all ${i < current ? "bg-blue-600" : "bg-slate-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ── Main Page ── */
export default function EmployeeRegisterPage() {
  const [step,               setStep]               = useState(0);
  const [loading,            setLoading]            = useState(false);
  const [dataLoading,        setDataLoading]        = useState(true);
  const [accessBlocked,      setAccessBlocked]      = useState(false);
  const [password,           setPassword]           = useState("");
  const [showPassword,       setShowPassword]       = useState(false);
  const [passwordError,      setPasswordError]      = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCompanyId,  setSelectedCompanyId]  = useState("");
  const [selectedBankName,   setSelectedBankName]   = useState("");
  const [bankCode,           setBankCode]           = useState("");
  const [bankOpen,           setBankOpen]           = useState(false);
  const [phoneValue,         setPhoneValue]         = useState("");
  const [success,            setSuccess]            = useState(null);
  const [fieldErrors,        setFieldErrors]        = useState({ email: "", cnic: "", accountNumber: "", phone: "" });
  const [form,               setForm]               = useState({
    employeeName: "", employeeemail: "", employeePhone: "",
    employeeCNIC: "", employeeAddress: "", employeeSalary: "",
    totalWorkingHours: "", dateOfJoining: "", salesTarget: "",
    designation: "", bankAccountNumber: "",
  });

  const router   = useRouter();
  const dispatch = useDispatch();
  const { department } = useSelector((s) => s.Department);
  const { companies }  = useSelector((s) => s.Company);

  useEffect(() => {
    (async () => {
      try {
        const [accessRes, cRes, dRes] = await Promise.all([
          axios.get("/api/get-employee-reg-access"),
          axios.get("/api/get-maincompanies"),
          axios.get("/api/get-all-department"),
        ]);
        if (!accessRes.data?.employeeRegAccess) { setAccessBlocked(true); setDataLoading(false); return; }
        if (cRes.data?.companies)   dispatch(createcompany(cRes.data.companies));
        if (dRes.data?.departments) dispatch(createdepartment(dRes.data.departments));
      } catch {
        toast.error("Failed to load form data");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [dispatch]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleBankSelect = (bankName) => {
    const bank = BANKS.find((b) => b.name === bankName);
    setSelectedBankName(bankName);
    setBankCode(bank?.code || "");
  };

  const setFieldError = (key, msg) =>
    setFieldErrors((p) => ({ ...p, [key]: msg }));

  const handleEmailChange = (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, employeeemail: v }));
    if (!v) { setFieldError("email", ""); return; }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setFieldError("email", valid ? "" : "Enter a valid email address");
  };

  const handleCNICChange = (e) => {
    // Auto-format: XXXXX-XXXXXXX-X
    let raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    let formatted = raw;
    if (raw.length > 5)  formatted = raw.slice(0, 5) + "-" + raw.slice(5);
    if (raw.length > 12) formatted = raw.slice(0, 5) + "-" + raw.slice(5, 12) + "-" + raw.slice(12);
    setForm((p) => ({ ...p, employeeCNIC: formatted }));
    const valid = /^\d{5}-\d{7}-\d$/.test(formatted);
    setFieldError("cnic", raw.length === 0 ? "" : valid ? "" : "Format must be XXXXX-XXXXXXX-X");
  };

  const handleAccountNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, ""); // only digits
    setForm((p) => ({ ...p, bankAccountNumber: v }));
    if (!v) { setFieldError("accountNumber", ""); return; }
    if (v.length < 10) setFieldError("accountNumber", "Account number must be at least 10 digits");
    else if (v.length > 24) setFieldError("accountNumber", "Account number too long");
    else setFieldError("accountNumber", "");
  };

  const validatePassword = (v) => {
    if (v.length < 6)  return setPasswordError("Minimum 6 characters required.");
    if (!/\d/.test(v)) return setPasswordError("Must contain at least one number.");
    setPasswordError("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const pass  = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setPassword(pass); validatePassword(pass);
    navigator.clipboard.writeText(pass);
    setShowPassword(true);
    toast.success("Password generated & copied!");
  };

  /* Step validation before advancing */
  const validateStep = () => {
    if (step === 0) {
      if (!form.employeeName.trim())  return toast.error("Name is required");
      if (!form.employeeemail.trim()) return toast.error("Email is required");
      if (fieldErrors.email)          return toast.error(fieldErrors.email);
      if (!phoneValue)                return toast.error("Phone number is required");
      if (fieldErrors.phone)          return toast.error(fieldErrors.phone);
    }
    if (step === 1) {
      if (!selectedCompanyId)         return toast.error("Select a company");
      if (!selectedDepartment)        return toast.error("Select a department");
      if (!form.designation.trim())   return toast.error("Designation is required");
      if (!form.employeeSalary)       return toast.error("Salary is required");
      if (!form.dateOfJoining)        return toast.error("Joining date is required");
    }
    if (step === 2) {
      if (!form.employeeCNIC.trim())       return toast.error("CNIC is required");
      if (fieldErrors.cnic)                return toast.error(fieldErrors.cnic);
      if (!form.employeeAddress.trim())    return toast.error("Address is required");
      if (!selectedBankName)               return toast.error("Select a bank");
      if (!form.bankAccountNumber.trim())  return toast.error("Account number is required");
      if (fieldErrors.accountNumber)       return toast.error(fieldErrors.accountNumber);
    }
    return true;
  };

  const next = () => { if (validateStep() === true) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (passwordError || !password) return toast.error("Fix password errors first.");
    setLoading(true);
    try {
      const res = await axios.post("/api/create-employee", {
        companyIds:         [selectedCompanyId],
        employeeName:       form.employeeName,
        employeeAddress:    form.employeeAddress,
        employeeemail:      form.employeeemail,
        employeepassword:   password,
        employeePhone:      phoneValue,
        employeeCNIC:       form.employeeCNIC,
        employeeSalary:     form.employeeSalary,
        department:         selectedDepartment,
        designation:        form.designation,
        totalWorkingHours:  form.totalWorkingHours,
        dateOfJoining:      form.dateOfJoining,
        bankName:           selectedBankName,
        bankCode:           bankCode,
        bankAccountNumber:  form.bankAccountNumber,
        ...(selectedDepartment === "Sales" && { salesTarget: form.salesTarget }),
      });
      if (res.data.success) setSuccess({ name: form.employeeName, email: form.employeeemail });
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Registration disabled screen */
  if (accessBlocked) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5">
          <Lock size={26} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Registration Unavailable</h2>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          Employee self-registration is currently disabled. Please contact your HR administrator to create your account.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors mx-auto"
        >
          Go to Login <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  /* Loading skeleton */
  if (dataLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={26} className="animate-spin text-blue-600" />
        <p className="text-sm text-slate-400 font-medium">Loading registration form…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left Panel (same as login) ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-[#EEF4FF] via-white to-blue-100 flex-col justify-between p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #bfdbfe 1px, transparent 0)", backgroundSize: "32px 32px" }} />
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
              <p className="text-slate-500 text-xs font-medium">Employee Portal</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-3">
            Create your<br />employee<br />
            <span className="text-blue-600">account.</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Register in 3 simple steps and get instant access to your HR workspace, attendance tools, and official documents.
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

      {/* ── Right Panel ── */}
      <div className="flex-1 bg-white overflow-y-auto px-6 sm:px-10">
        <div className="w-full max-w-md mx-auto py-10">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center p-0.5">
              <Image src="/logo.webp" alt="HumanEdge" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <p className="font-bold text-slate-900">HumanEdge</p>
          </div>

          {/* ── Success Screen ── */}
          {success ? (
            <div className="flex flex-col items-center text-center space-y-5 py-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CheckCircle2 size={30} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">You're registered!</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">
                  Welcome, <span className="font-bold text-slate-700">{success.name}</span>. A confirmation email has been sent to{" "}
                  <span className="text-blue-600 font-semibold">{success.email}</span>.
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200"
              >
                Go to Login <ArrowRight size={15} />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                <CheckCircle2 size={12} className="text-blue-500" />
                Secured with enterprise-grade encryption
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <UserPlus size={22} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Register Account</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Step {step + 1} of {STEPS.length} — {STEPS[step]}
                </p>
              </div>

              {/* Step bar */}
              <StepBar current={step} />

              {/* ── Step 1: Personal Info ── */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Full Name</Label>
                    <div className="relative">
                      <User size={14} className={iconCls} />
                      <Input value={form.employeeName} onChange={set("employeeName")} placeholder="e.g. Basiq Khan" className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Email Address</Label>
                    <div className="relative">
                      <Mail size={14} className={iconCls} />
                      <Input
                        type="email"
                        value={form.employeeemail}
                        onChange={handleEmailChange}
                        placeholder="you@company.com"
                        className={`${inputCls} ${fieldErrors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Phone Number</Label>
                    <PhoneInput
                      international
                      defaultCountry="PK"
                      value={phoneValue}
                      onChange={(val) => {
                        setPhoneValue(val || "");
                        if (!val)                          setFieldError("phone", "");
                        else if (!isValidPhoneNumber(val)) setFieldError("phone", "Enter a valid phone number");
                        else                               setFieldError("phone", "");
                      }}
                      placeholder="+92 3XX XXXXXXX"
                      className={`phone-input-wrapper${fieldErrors.phone ? " phone-input-error" : ""}`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Employment ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Company</Label>
                    <div className="relative">
                      <Building2 size={14} className={iconCls} />
                      <Select onValueChange={(v) => setSelectedCompanyId(companies.find(c => c.name === v)?.id || "")} value={companies.find(c => c.id === selectedCompanyId)?.name || ""}>
                        <SelectTrigger className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 focus:ring-1">
                          <SelectValue placeholder="Select company…" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.length > 0
                            ? companies.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                            : <SelectItem value="none" disabled>No companies</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Department</Label>
                    <div className="relative">
                      <Layers size={14} className={iconCls} />
                      <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                        <SelectTrigger className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 focus:ring-1">
                          <SelectValue placeholder="Select department…" />
                        </SelectTrigger>
                        <SelectContent>
                          {department?.length > 0
                            ? department.map(d => <SelectItem key={d._id || d.id} value={d.departmentName}>{d.departmentName}</SelectItem>)
                            : <SelectItem value="none" disabled>No departments</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Designation / Job Title</Label>
                    <div className="relative">
                      <Briefcase size={14} className={iconCls} />
                      <Input value={form.designation} onChange={set("designation")} placeholder="e.g. Software Engineer" className={inputCls} />
                    </div>
                  </div>

                  {selectedDepartment === "Sales" && (
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Monthly Sales Target (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">$</span>
                        <Input type="number" value={form.salesTarget} onChange={set("salesTarget")} placeholder="e.g. 50000" className={inputCls} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Salary (PKR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">Rs</span>
                        <Input type="number" value={form.employeeSalary} onChange={set("employeeSalary")} placeholder="50000" className={inputCls} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Work Hours/Day</Label>
                      <div className="relative">
                        <Clock size={14} className={iconCls} />
                        <Input type="number" value={form.totalWorkingHours} onChange={set("totalWorkingHours")} placeholder="8" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Date of Joining</Label>
                    <div className="relative">
                      <Calendar size={14} className={iconCls} />
                      <Input type="date" value={form.dateOfJoining} onChange={set("dateOfJoining")} className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Bank & ID ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>CNIC Number</Label>
                    <div className="relative">
                      <CreditCard size={14} className={iconCls} />
                      <Input
                        value={form.employeeCNIC}
                        onChange={handleCNICChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        maxLength={15}
                        className={`${inputCls} ${fieldErrors.cnic ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {fieldErrors.cnic ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {fieldErrors.cnic}
                      </p>
                    ) : form.employeeCNIC.length === 15 && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Valid CNIC
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Address</Label>
                    <div className="relative">
                      <MapPin size={14} className={iconCls} />
                      <Input value={form.employeeAddress} onChange={set("employeeAddress")} placeholder="Street, City" className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Bank Name</Label>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 pl-9 pr-3 h-11 text-sm bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 relative"
                        >
                          <Landmark size={14} className={iconCls} />
                          <span className={selectedBankName ? "text-slate-800 flex-1 truncate" : "text-slate-400 flex-1"}>
                            {selectedBankName || "Search & select bank…"}
                          </span>
                          <ChevronsUpDown size={14} className="text-slate-400 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 rounded-xl shadow-lg" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                        <Command>
                          <CommandInput placeholder="Search bank…" className="h-10 text-sm" />
                          <CommandList className="max-h-52">
                            <CommandEmpty className="py-4 text-center text-sm text-slate-400">No bank found.</CommandEmpty>
                            <CommandGroup>
                              {BANKS.map((b) => (
                                <CommandItem
                                  key={b.code}
                                  value={b.name}
                                  onSelect={() => { handleBankSelect(b.name); setBankOpen(false); }}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Bank Code</Label>
                      <div className="relative">
                        <Hash size={14} className={iconCls} />
                        <Input
                          value={bankCode}
                          readOnly
                          placeholder="Auto-filled"
                          className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Account Number</Label>
                      <div className="relative">
                        <CreditCard size={14} className={iconCls} />
                        <Input
                          value={form.bankAccountNumber}
                          onChange={handleAccountNumberChange}
                          placeholder="e.g. 1234567890"
                          inputMode="numeric"
                          className={`${inputCls} ${fieldErrors.accountNumber ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                        />
                      </div>
                      {fieldErrors.accountNumber ? (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {fieldErrors.accountNumber}
                        </p>
                      ) : form.bankAccountNumber.length >= 10 && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Valid account number
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Security ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Password</Label>
                    <div className="relative">
                      <Lock size={14} className={iconCls} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="Min 6 chars with a number"
                        onChange={e => { setPassword(e.target.value); validatePassword(e.target.value); }}
                        className="pl-9 pr-20 h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400 w-full"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button type="button" onClick={generatePassword} title="Generate password" className="text-slate-400 hover:text-blue-600 transition-colors">
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {passwordError}
                      </p>
                    )}
                    {password && !passwordError && (
                      <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Strong password
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
                    <p className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Password must have</p>
                    <div className={`flex items-center gap-2 ${password.length >= 6 ? "text-blue-600" : "text-slate-400"}`}>
                      <CheckCircle2 size={11} /> At least 6 characters
                    </div>
                    <div className={`flex items-center gap-2 ${/\d/.test(password) ? "text-blue-600" : "text-slate-400"}`}>
                      <CheckCircle2 size={11} /> At least one number
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <KeyRound size={11} /> Click the key icon to auto-generate & copy a secure password
                  </p>
                </div>
              )}

              {/* ── Navigation Buttons ── */}
              <div className="flex items-center gap-3 mt-8">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-2 h-11 px-5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200"
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !!passwordError || !password}
                    className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200"
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Creating Account…</>
                      : <>Create Account <ArrowRight size={15} /></>
                    }
                  </button>
                )}
              </div>

              {/* Sign in link */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                  Secured with enterprise-grade encryption
                </div>
                <button type="button" onClick={() => router.push("/")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
