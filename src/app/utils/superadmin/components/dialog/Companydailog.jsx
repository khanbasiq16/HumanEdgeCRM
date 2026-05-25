"use client";

import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent,
  SelectItem, SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { createcompany } from "@/features/Slice/CompanySlice";
import {
  Building2, Plus, Loader2, Upload, Globe, Phone,
  MapPin, Facebook, Linkedin, Instagram, Mail,
  KeyRound, Server, Wifi, Clock,
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
const Section = ({ title, subtitle }) => (
  <div className="col-span-2 pt-2 pb-1 border-b border-slate-100">
    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</p>
    {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const CompanyDialog = () => {
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [selectedZone, setSelectedZone] = useState("");

  const dispatch  = useDispatch();
  const { timeZone } = useSelector((s) => s.TimeZone);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      if (file)         formData.append("file", file);
      if (selectedZone) formData.append("timezone", selectedZone);

      const res = await axios.post("/api/create-company", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Company created successfully");
        e.target.reset();
        setFile(null);
        setPreview(null);
        setSelectedZone("");
        setOpen(false);
        dispatch(createcompany(res.data.companies));
      } else {
        toast.error(res.data.message || "Failed to create company");
      }
    } catch {
      toast.error("Something went wrong");
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
          Create Company
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Dialog header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Create New Company
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Fill in the details to register a new company</p>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={formHandler}>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Section: Basic Info ───────────────────── */}
              <Section title="Basic Information" subtitle="Core company details" />

              <Field label="Company Name" required icon={Building2}>
                <Input className={inputCls} name="name" placeholder="Acme Corporation" required />
              </Field>

              <Field label="Phone Number" required icon={Phone}>
                <Input className={inputCls} name="companyPhoneNumber" placeholder="+92 300 1234567" required />
              </Field>

              <Field label="Address" required icon={MapPin}>
                <Input className={inputCls} name="companyAddress" placeholder="123 Main Street, City" required />
              </Field>

              <Field label="Time Zone" icon={Clock}>
                <Select onValueChange={setSelectedZone} value={selectedZone}>
                  <SelectTrigger className={`${inputCls} w-full`}>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-52 overflow-y-auto">
                    {timeZone?.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Logo upload */}
              <div className="md:col-span-2">
                <Field label="Company Logo" required icon={Upload}>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="file-upload"
                      className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors group"
                    >
                      <Upload size={18} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600">
                          {file ? file.name : "Click to upload logo"}
                        </p>
                        <p className="text-xs text-slate-400">PNG, JPG, SVG — max 2MB</p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                    {preview && (
                      <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-sm">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              {/* ── Section: Web & Social ─────────────────── */}
              <Section title="Web & Social" subtitle="Online presence" />

              <Field label="Website" required icon={Globe}>
                <Input className={inputCls} name="companywebsite" placeholder="https://example.com" required />
              </Field>

              <Field label="Facebook" icon={Facebook}>
                <Input className={inputCls} name="companyFacebook" placeholder="https://facebook.com/page" />
              </Field>

              <Field label="LinkedIn" icon={Linkedin}>
                <Input className={inputCls} name="companyLinkedin" placeholder="https://linkedin.com/company" />
              </Field>

              <Field label="Instagram" icon={Instagram}>
                <Input className={inputCls} name="companyInstagram" placeholder="https://instagram.com/handle" />
              </Field>

              {/* ── Section: Email Config ─────────────────── */}
              <Section title="Email Configuration" subtitle="SMTP settings for sending emails" />

              <Field label="Company Email" icon={Mail}>
                <Input className={inputCls} name="companyemail" type="email" placeholder="info@company.com" />
              </Field>

              <Field label="Email Password" icon={KeyRound}>
                <Input className={inputCls} name="companyemailpassword" type="password" placeholder="••••••••" />
              </Field>

              <Field label="SMTP Host" icon={Server}>
                <Input className={inputCls} name="companyemailhost" placeholder="smtp.gmail.com" />
              </Field>

              <Field label="SMTP Port" icon={Wifi}>
                <Input className={inputCls} name="companysmtphost" placeholder="587" />
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={14} /> Create Company</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDialog;
