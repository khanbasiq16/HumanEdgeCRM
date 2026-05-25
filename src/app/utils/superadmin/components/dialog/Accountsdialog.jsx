"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createAccountants } from "@/features/Slice/AccountantSlice";
import axios from "axios";
import {
  Users, Plus, Loader2, Eye, EyeOff, KeyRound,
  User, Mail, Phone, MapPin,
} from "lucide-react";

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
const Section = ({ title }) => (
  <div className="pb-2 border-b border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
  </div>
);

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

const AccountDialog = () => {
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const dispatch = useDispatch();

  const validatePassword = (value) => {
    if (value.length < 6)       setPasswordError("Password must be at least 6 characters");
    else if (!/\d/.test(value)) setPasswordError("Password must contain at least one number");
    else                        setPasswordError("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    const pw = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setPassword(pw);
    validatePassword(pw);
    toast.success("Password generated!");
  };

  const formHandler = async (e) => {
    e.preventDefault();
    if (passwordError) { toast.error(passwordError); return; }
    setLoading(true);
    try {
      const formData = {
        accountuserName:     e.target.accountuserName.value,
        accountuseremail:    e.target.accountEmail.value,
        accountuserphone:    e.target.accountPhone.value,
        accountuseraddress:  e.target.accountAddress.value,
        accountuserpassword: password,
      };
      const res = await axios.post("/api/acounts/create-acountant", formData);
      if (res.data.success) {
        toast.success("Accountant created successfully!");
        dispatch(createAccountants(res.data.accounts));
        e.target.reset();
        setPassword("");
        setOpen(false);
      }
    } catch (error) {
      const code = error.code;
      const msg =
        code === "auth/email-already-in-use" ? "Email is already in use" :
        code === "auth/invalid-email"        ? "Invalid email" :
        code === "auth/weak-password"        ? "Password is too weak" :
        "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Create Accountant
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Create Accountant
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Add a new accountant user to the system</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formHandler}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Section title="Account Information" />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Full Name" required icon={User}>
                  <Input
                    id="accountuserName"
                    name="accountuserName"
                    placeholder="Enter full name"
                    required
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Email Address" required icon={Mail}>
                <Input
                  id="accountEmail"
                  name="accountEmail"
                  type="email"
                  placeholder="email@example.com"
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <Input
                  id="accountPhone"
                  name="accountPhone"
                  type="tel"
                  placeholder="+92 300 0000000"
                  className={inputCls}
                />
              </Field>

              <div className="col-span-2">
                <Field label="Address" icon={MapPin}>
                  <Input
                    id="accountAddress"
                    name="accountAddress"
                    placeholder="Enter address"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Password" required icon={KeyRound}>
                  <div className="relative">
                    <Input
                      id="employeepassword"
                      name="employeepassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                      required
                      className={`${inputCls} pr-20`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={generatePassword}
                        title="Generate password"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <KeyRound size={13} />
                      </button>
                    </div>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                  )}
                </Field>
              </div>
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Creating…</>
              ) : (
                <><Plus size={14} /> Create Accountant</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog;
