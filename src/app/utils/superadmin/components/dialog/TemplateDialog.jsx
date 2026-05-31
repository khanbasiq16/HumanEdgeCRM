"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import {
  NotepadText, Plus, Loader2, FileCheck, FileSignature, Building2,
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

/* ── Type option card ───────────────────────────────────── */
const TypeCard = ({ value, selected, onSelect, icon: Icon, label, description, accent }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`
      w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
      ${selected
        ? `${accent} shadow-sm`
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}
    `}
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-white/60" : "bg-slate-100"}`}>
      <Icon size={18} className={selected ? "" : "text-slate-400"} />
    </div>
    <div>
      <p className="text-sm font-bold leading-none">{label}</p>
      <p className="text-xs opacity-70 mt-1">{description}</p>
    </div>
  </button>
);

/* ── Main component ─────────────────────────────────────── */
const TemplateDialog = () => {
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [role, setRole]               = useState("Employee");
  const [company, setCompany]         = useState("");
  const [allCompanies, setAllCompanies] = useState([]);

  const dispatch = useDispatch();
  const router   = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("/api/get-all-companies");
        if (res.data.success) {
          setAllCompanies(res.data.companies);
          if (res.data.companies.length > 0) {
            const first = res.data.companies[0];
            setCompany(first.companyId || first.name);
          }
        }
      } catch {
        /* silent */
      }
    };
    fetchCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/templates/create", { role, company });
      if (res.data.success) {
        dispatch(createtemplate(res.data.templates));
        setOpen(false);
        setRole("Employee");
        setCompany("");
        const editorPath = (role === "Contract" || role === "Admin")
          ? `/contract-editor/${res.data.templateId}`
          : `/template-editor/${res.data.templateId}`;
        router.push(editorPath);
      } else {
        toast.error("Failed to create template");
      }
    } catch {
      toast.error("Error creating template");
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
          Create Template
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <NotepadText size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Create Template
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Choose a type and start designing</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Template type cards */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FileCheck size={12} className="text-slate-400" />
                Template Type <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <TypeCard
                  value="Employee"
                  selected={role === "Employee"}
                  onSelect={setRole}
                  icon={FileCheck}
                  label="Employee Letter"
                  description="Offer letters, experience letters, warning letters"
                  accent="border-blue-400 bg-blue-50 text-blue-700"
                />
                <TypeCard
                  value="Contract"
                  selected={role === "Contract" || role === "Admin"}
                  onSelect={setRole}
                  icon={FileSignature}
                  label="Contract"
                  description="Client contracts, service agreements, NDAs"
                  accent="border-violet-400 bg-violet-50 text-violet-700"
                />
              </div>
            </div>

            {/* Company — always shown for both types */}
            <Field label="Company" required={role === "Contract" || role === "Admin"} icon={Building2}>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue placeholder="Select company…" />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.length > 0 ? (
                    allCompanies.map((c, i) => (
                      <SelectItem key={i} value={c.companyId || c.name}>
                        {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No companies found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {role === "Employee" && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Company logo and header will appear on the letter
                </p>
              )}
            </Field>

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
                <><Plus size={14} /> Create Template</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
