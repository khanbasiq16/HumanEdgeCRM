"use client";

import axios from "axios";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import {
  Building2, MapPin, Phone, Globe, Clock, Image,
  Facebook, Instagram, Linkedin, Mail, KeyRound,
  Server, Hash, Eye, EyeOff, Loader2, Save,
} from "lucide-react";

const inputCls =
  "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

/* ── Field wrapper ────────────────────────────────────── */
const Field = ({ label, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

const EditCompanyDialog = ({ company, open, setOpen }) => {
  const [formData, setFormData] = useState({
    name: "",
    companyAddress: "",
    companyPhoneNumber: "",
    companyFacebook: "",
    companyLinkedin: "",
    companyInstagram: "",
    companyWebsite: "",
    companyEmail: "",
    companyEmailPassword: "",
    companyEmailHost: "",
    companySmtpHost: "",
    timezone: "",
  });

  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { timeZone } = useSelector((state) => state.TimeZone);

  useEffect(() => {
    if (company) {
      setFormData({
        name:                company.name || "",
        companyAddress:      company.companyAddress || "",
        companyPhoneNumber:  company.companyPhoneNumber || "",
        companyFacebook:     company.companyFacebook || "",
        companyLinkedin:     company.companyLinkedin || "",
        companyInstagram:    company.companyInstagram || "",
        companyWebsite:      company.companyWebsite || "",
        companyEmail:        company.companyemail || "",
        companyEmailPassword: company.companyemailpassword || "",
        companyEmailHost:    company.companyemailhost || "",
        companySmtpHost:     company.companysmtphost || "",
        timezone:            company.timezone || "",
      });
      setPreview(company.companyLogo || null);
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value ?? ""));
      if (file) data.append("file", file);

      const res = await axios.post(`/api/companies/${company.companyId}`, data);
      if (res.data.success) {
        toast.success("Company updated successfully");
        setOpen(false);
        setFile(null);
      } else {
        toast.error(res.data.message || "Failed to update company");
      }
    } catch {
      toast.error("Failed to update company");
    } finally {
      setLoading(false);
    }
  };

  const initials = (formData.name || "CO").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[620px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl">

        {/* ── Minimal header ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Edit Company</p>
            <p className="text-xs text-slate-400 mt-0.5">Update company information</p>
          </div>
        </div>

        <form onSubmit={formHandler}>
          <Tabs defaultValue="basic" className="w-full">

            {/* ── Tab bar ── */}
            <div className="border-b border-slate-100 bg-white px-6 pt-3">
              <TabsList className="h-auto bg-transparent p-0 gap-0">
                {[
                  { value: "basic",  label: "Basic Info"   },
                  { value: "social", label: "Social Links" },
                  { value: "email",  label: "Email Config" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-4 py-2 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-slate-500 hover:text-slate-700 bg-transparent shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── Basic Info ── */}
            <TabsContent value="basic" className="m-0">
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {/* Logo upload + preview */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-2">
                    {preview ? (
                      <img src={preview} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl font-black text-blue-600">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Image size={12} className="text-slate-400" />
                      Company Logo
                    </Label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors w-fit">
                      <Image size={13} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {file ? file.name : "Choose file…"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Name" required icon={Building2}>
                    <Input
                      name="name"
                      placeholder="Brintor Inc."
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Phone Number" required icon={Phone}>
                    <Input
                      name="companyPhoneNumber"
                      placeholder="+92 300 0000000"
                      value={formData.companyPhoneNumber}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Website" required icon={Globe}>
                    <Input
                      name="companyWebsite"
                      placeholder="https://example.com"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Timezone" icon={Clock}>
                    <Select
                      value={formData.timezone}
                      onValueChange={(v) => setFormData((p) => ({ ...p, timezone: v }))}
                    >
                      <SelectTrigger className={`${inputCls} w-full`}>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {timeZone.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Company Address" required icon={MapPin}>
                  <Input
                    name="companyAddress"
                    placeholder="123 Business Ave, City, Country"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </Field>
              </div>
            </TabsContent>

            {/* ── Social Links ── */}
            <TabsContent value="social" className="m-0">
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium">Enter full URLs including https://</p>
                </div>

                <Field label="Facebook" icon={Facebook}>
                  <Input
                    name="companyFacebook"
                    placeholder="https://facebook.com/yourpage"
                    value={formData.companyFacebook}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>

                <Field label="LinkedIn" icon={Linkedin}>
                  <Input
                    name="companyLinkedin"
                    placeholder="https://linkedin.com/company/yourcompany"
                    value={formData.companyLinkedin}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>

                <Field label="Instagram" icon={Instagram}>
                  <Input
                    name="companyInstagram"
                    placeholder="https://instagram.com/yourhandle"
                    value={formData.companyInstagram}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>
              </div>
            </TabsContent>

            {/* ── Email Config ── */}
            <TabsContent value="email" className="m-0">
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-600 font-medium">These settings are used for sending emails from this company account.</p>
                </div>

                <Field label="Company Email" icon={Mail}>
                  <Input
                    name="companyEmail"
                    type="email"
                    placeholder="info@company.com"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>

                <Field label="Email Password" icon={KeyRound}>
                  <div className="relative">
                    <input
                      name="companyEmailPassword"
                      placeholder="App password or SMTP password"
                      value={formData.companyEmailPassword}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      className={`${inputCls} w-full pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email Host" icon={Server}>
                    <Input
                      name="companyEmailHost"
                      placeholder="smtp.gmail.com"
                      value={formData.companyEmailHost}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="SMTP Port" icon={Hash}>
                    <Input
                      name="companySmtpHost"
                      placeholder="587"
                      value={formData.companySmtpHost}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
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
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
