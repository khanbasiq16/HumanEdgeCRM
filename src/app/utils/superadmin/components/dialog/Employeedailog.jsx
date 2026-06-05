"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import toast from "react-hot-toast";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useDispatch, useSelector } from "react-redux";
import { createemployees } from "@/features/Slice/EmployeeSlice";
import {
  Users, Plus, Loader2, Eye, EyeOff, KeyRound, Mail, Phone,
  MapPin, CreditCard, DollarSign, Clock, Calendar, Building2,
  Briefcase, Target, Landmark, Hash, ChevronsUpDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BANKS } from "@/app/utils/constants/banks";

/* ── Field wrapper ──────────────────────────────────────── */
const Field = ({ label, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

/* ── Section header ─────────────────────────────────────── */
const Section = ({ title, subtitle }) => (
  <div className="col-span-2 pt-2 pb-1 border-b border-slate-100">
    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</p>
    {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const today = new Date().toISOString().split("T")[0];

const Employeedailog = () => {
  const [loading, setLoading]               = useState(false);
  const [open, setOpen]                     = useState(false);
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [passwordError, setPasswordError]   = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCompanies, setSelectedCompanies]   = useState([]);
  const [dateOfJoining, setDateOfJoining]           = useState(today);
  const [selectedBankName, setSelectedBankName]     = useState("");
  const [bankCode, setBankCode]                     = useState("");
  const [bankOpen, setBankOpen]                     = useState(false);
  const [phoneValue, setPhoneValue]                 = useState("");
  const [phoneError, setPhoneError]                 = useState("");
  const [accountError, setAccountError]             = useState("");

  const dispatch = useDispatch();
  const { department } = useSelector((s) => s.Department);
  const { companies }  = useSelector((s) => s.Company);

  const validatePassword = (val) => {
    if (val.length < 6)       setPasswordError("Must be at least 6 characters");
    else if (!/\d/.test(val)) setPasswordError("Must contain at least one number");
    else                      setPasswordError("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    const pass  = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setPassword(pass);
    validatePassword(pass);
    navigator.clipboard.writeText(pass);
    toast.success("Password generated & copied!");
    setShowPassword(true);
  };

  const handleCompanySelect = (value) => {
    const c = companies.find((c) => c.name === value);
    setSelectedCompanies(c ? [c.id] : []);
  };

  const handleBankSelect = (bankName) => {
    const bank = BANKS.find((b) => b.name === bankName);
    setSelectedBankName(bankName);
    setBankCode(bank?.code || "");
  };

  const handleAccountNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    e.target.value = v;
    if (!v)          return setAccountError("");
    if (v.length < 10)  return setAccountError("Account number must be at least 10 digits");
    if (v.length > 24)  return setAccountError("Account number too long");
    setAccountError("");
  };

  const formHandler = async (e) => {
    e.preventDefault();
    if (!password || passwordError) return;
    if (phoneValue && !isValidPhoneNumber(phoneValue)) return toast.error("Enter a valid phone number");
    if (accountError) return toast.error(accountError);
    if (!selectedDepartment) { toast.error("Please select a department"); return; }
    if (selectedCompanies.length === 0) { toast.error("Please select a company"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      selectedCompanies.forEach((id) => formData.append("companyIds[]", id));
      formData.append("employeeName",      e.target.employeeName.value);
      formData.append("employeeAddress",   e.target.employeeAddress.value);
      formData.append("employeeemail",     e.target.employeeemail.value);
      formData.append("employeepassword",  password);
      formData.append("employeePhone",     phoneValue);
      formData.append("employeeCNIC",      e.target.employeeCNIC.value);
      formData.append("employeeSalary",    e.target.employeeSalary.value);
      formData.append("department",        selectedDepartment);
      formData.append("designation",       e.target.designation.value);
      formData.append("totalWorkingHours", e.target.totalWorkingHours?.value || "");
      formData.append("dateOfJoining",     e.target.dateOfJoining.value);
      formData.append("bankName",          selectedBankName);
      formData.append("bankCode",          bankCode);
      formData.append("bankAccountNumber", e.target.bankAccountNumber?.value || "");
      if (e.target.salesTarget) formData.append("salesTarget", e.target.salesTarget.value);

      const payload = {};
      formData.forEach((v, k) => {
        if (k === "companyIds[]") {
          payload.companyIds = payload.companyIds ? [...payload.companyIds, v] : [v];
        } else {
          payload[k] = v;
        }
      });

      const res = await axios.post("/api/create-employee", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Employee created successfully");
        e.target.reset();
        dispatch(createemployees(res.data.employees));

        setSelectedDepartment("");
        setSelectedCompanies([]);
        setPassword("");
        setPhoneValue("");
        setPhoneError("");
        setDateOfJoining(today);
        setSelectedBankName("");
        setBankCode("");
        setBankOpen(false);
        setAccountError("");
        setOpen(false);
      }
    } catch {
      toast.error("Error creating employee");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Create Employee
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Create New Employee
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Fill in the details to register a new employee</p>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={formHandler}>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Personal Information ───────────────────── */}
              <Section title="Personal Information" subtitle="Employee identity and contact details" />

              <Field label="Full Name" required icon={Users}>
                <Input className={inputCls} name="employeeName" placeholder="John Doe" required />
              </Field>

              <Field label="Email Address" required icon={Mail}>
                <Input className={inputCls} name="employeeemail" type="email" placeholder="john@company.com" required />
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <PhoneInput
                  international
                  defaultCountry="PK"
                  value={phoneValue}
                  onChange={(val) => {
                    setPhoneValue(val || "");
                    if (!val)                          setPhoneError("");
                    else if (!isValidPhoneNumber(val)) setPhoneError("Enter a valid phone number");
                    else                               setPhoneError("");
                  }}
                  placeholder="+92 300 1234567"
                  className={`phone-input-wrapper${phoneError ? " phone-input-error" : ""}`}
                />
                {phoneError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {phoneError}
                  </p>
                )}
              </Field>

              <Field label="CNIC Number" required icon={CreditCard}>
                <Input className={inputCls} name="employeeCNIC" placeholder="42201-1234567-8" required />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address" icon={MapPin}>
                  <Input className={inputCls} name="employeeAddress" placeholder="123 Main Street, City" />
                </Field>
              </div>

              {/* Bank Details */}
              <div className="md:col-span-2">
                <Field label="Bank Name" icon={Landmark}>
                  <Popover open={bankOpen} onOpenChange={setBankOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`${inputCls} w-full flex items-center justify-between px-3 text-left`}
                      >
                        <span className={selectedBankName ? "text-slate-800 flex-1 truncate text-sm" : "text-slate-400 flex-1 text-sm"}>
                          {selectedBankName || "Search & select bank…"}
                        </span>
                        <ChevronsUpDown size={13} className="text-slate-400 shrink-0 ml-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 rounded-xl shadow-lg" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                      <Command>
                        <CommandInput placeholder="Search bank…" className="h-9 text-sm" />
                        <CommandList className="max-h-48">
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
                </Field>
              </div>

              <Field label="Bank Code" icon={Hash}>
                <Input
                  className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`}
                  value={bankCode}
                  readOnly
                  placeholder="Auto-filled"
                />
              </Field>

              <Field label="Account Number" icon={CreditCard}>
                <Input
                  className={`${inputCls} ${accountError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  name="bankAccountNumber"
                  placeholder="e.g. 1234567890"
                  inputMode="numeric"
                  onChange={handleAccountNumberChange}
                />
                {accountError ? (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" /> {accountError}
                  </p>
                ) : null}
              </Field>

              {/* Password — full width */}
              <div className="md:col-span-2">
                <Field label="Password" required icon={KeyRound}>
                  <div className="relative">
                    <Input
                      className={`${inputCls} pr-20`}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={generatePassword}
                        title="Generate password"
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <KeyRound size={15} />
                      </button>
                    </div>
                  </div>
                  {passwordError && <p className="text-red-500 text-[11px] mt-1">{passwordError}</p>}
                </Field>
              </div>

              {/* ── Work Details ───────────────────────────── */}
              <Section title="Work Details" subtitle="Employment and role information" />

              <Field label="Department" required icon={Briefcase}>
                <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                  <SelectTrigger className={`${inputCls} w-full`}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {department?.length > 0 ? (
                      department.map((dep) => (
                        <SelectItem key={dep._id || dep.id} value={dep.departmentName}>
                          {dep.departmentName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No departments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Company" required icon={Building2}>
                <Select
                  onValueChange={handleCompanySelect}
                  value={companies.find((c) => selectedCompanies[0] === c.id)?.name || ""}
                >
                  <SelectTrigger className={`${inputCls} w-full`}>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.length > 0 ? (
                      companies.map((comp) => (
                        <SelectItem key={comp.id} value={comp.name}>{comp.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No companies available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Designation / Job Title" required icon={Briefcase}>
                  <Input className={inputCls} name="designation" placeholder="e.g. Software Engineer" required />
                </Field>
              </div>

              {selectedDepartment === "Sales" && (
                <Field label="Sales Target" required icon={Target}>
                  <Input className={inputCls} name="salesTarget" type="number" placeholder="Monthly target" required />
                </Field>
              )}

              <Field label="Salary (PKR)" required icon={DollarSign}>
                <Input className={inputCls} name="employeeSalary" placeholder="50,000" required />
              </Field>

              <Field label="Working Hours / Day" icon={Clock}>
                <Input className={inputCls} name="totalWorkingHours" placeholder="8" />
              </Field>

              <Field label="Date of Joining" icon={Calendar}>
                <div className="relative">
                  <input
                    name="dateOfJoining"
                    type="date"
                    value={dateOfJoining}
                    max={today}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full h-9 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 pr-9 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!passwordError}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={14} /> Create Employee</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Employeedailog;
