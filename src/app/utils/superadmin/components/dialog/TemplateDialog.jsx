"use client";
import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import {
  NotepadText, Plus, Loader2, FileCheck, FileSignature, Building2,
  Check, ChevronDown, Search, Users, Shield, Sparkles,
} from "lucide-react";

/* ── Searchable Dropdown ──────────────────────────────────── */
const SearchableDropdown = ({
  label, required, icon: Icon, items, value, onChange,
  placeholder = "Select…", searchPlaceholder = "Search…",
  renderItem, renderSelected, emptyText = "No items found",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = items.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const searchStr = (item.name || item.clientName || item.label || "").toLowerCase();
    return searchStr.includes(q);
  });

  const selected = items.find(item => (item.companyId || item.id || item.name) === value);

  return (
    <div className="space-y-1.5" ref={ref}>
      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200
          ${open
            ? "border-blue-300 ring-2 ring-blue-100 bg-white shadow-sm"
            : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white"}
        `}
      >
        {selected ? (
          renderSelected ? renderSelected(selected) : (
            <span className="text-sm font-semibold text-slate-800 flex-1 truncate">
              {selected.name || selected.clientName || "—"}
            </span>
          )
        ) : (
          <span className="text-sm text-slate-400 flex-1">{placeholder}</span>
        )}
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              
            </div>

            {/* Items */}
            <div className="max-h-[200px] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-1.5">
                  <Search size={20} className="text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">{emptyText}</p>
                </div>
              ) : (
                filtered.map((item, i) => {
                  const itemId = item.companyId || item.id || item.name;
                  const isSelected = value === itemId;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onChange(itemId);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                        ${isSelected
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-slate-50 border border-transparent"}
                      `}
                    >
                      {renderItem ? renderItem(item, isSelected) : (
                        <>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-100" : "bg-slate-100"}`}>
                            <span className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-slate-500"}`}>
                              {(item.name || item.clientName || "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <span className={`text-sm font-medium flex-1 truncate ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                            {item.name || item.clientName || "—"}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                              <Check size={11} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Type option card ───────────────────────────────────── */
const TypeCard = ({ value, selected, onSelect, icon: Icon, label, description, accent, badge }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`
      relative w-full flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-all duration-200
      ${selected
        ? `${accent} shadow-sm shadow-current/5`
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}
    `}
  >
    <div className={`
      w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
      ${selected ? "bg-white/70 shadow-sm" : "bg-slate-100"}
    `}>
      <Icon size={18} className={selected ? "" : "text-slate-400"} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold leading-none">{label}</p>
      <p className="text-[11px] opacity-60 mt-1 leading-snug">{description}</p>
    </div>
    {/* Radio indicator */}
    <div className={`
      w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
      ${selected ? "border-current bg-current" : "border-slate-300"}
    `}>
      {selected && <Check size={11} className="text-white" strokeWidth={3} />}
    </div>
    {badge && selected && (
      <span className="absolute -top-1.5 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-current shadow-sm">
        {badge}
      </span>
    )}
  </button>
);

/* ── Main component ─────────────────────────────────────── */
const TemplateDialog = () => {
  const [loading, setLoading]             = useState(false);
  const [open, setOpen]                   = useState(false);
  const [role, setRole]                   = useState("Employee");
  const [company, setCompany]             = useState("");
  const [client, setClient]               = useState("");
  const [allCompanies, setAllCompanies]   = useState([]);
  const [allClients, setAllClients]       = useState([]);

  const dispatch = useDispatch();
  const router   = useRouter();

  /* Find "Brintor" company */
  const brintorCompany = allCompanies.find(
    c => (c.name || "").toLowerCase().includes("brintor")
  );
  const brintorId = brintorCompany
    ? (brintorCompany.companyId || brintorCompany.name)
    : "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, clientRes] = await Promise.all([
          axios.get("/api/get-all-companies"),
          axios.get("/api/all-clients"),
        ]);
        if (compRes.data.success) {
          setAllCompanies(compRes.data.companies);
        }
        if (clientRes.data.success) {
          setAllClients(clientRes.data.clients || []);
        }
      } catch {
        /* silent */
      }
    };
    fetchData();
  }, []);

  /* Auto-select Brintor for Employee Letter */
  useEffect(() => {
    if (role === "Employee" && brintorId) {
      setCompany(brintorId);
    }
  }, [role, brintorId]);

  /* When dialog opens, reset state */
  const handleOpenChange = (v) => {
    setOpen(v);
    if (v) {
      setRole("Employee");
      setClient("");
      // company will be auto-set by the effect above
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "Employee") {
      // Auto-select Brintor
      setCompany(brintorId);
      setClient("");
    } else {
      // Contract — reset company to pick
      setCompany(allCompanies.length > 0 ? (allCompanies[0].companyId || allCompanies[0].name) : "");
      setClient("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) {
      return toast.error("Please select a company");
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/templates/create", { role, company, client });
      if (res.data.success) {
        dispatch(createtemplate(res.data.templates));
        setOpen(false);
        setRole("Employee");
        setCompany("");
        setClient("");
        const editorPath = (role === "Contract" || role === "Admin")
          ? `/contract-editor/${res.data.templateId}`
          : `/employee-letter-canvas/${res.data.templateId}`;
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

  const isContractType = role === "Contract" || role === "Admin";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Create Template
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
              <NotepadText size={20} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-slate-900 leading-none tracking-tight">
                Create Template
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-1 font-medium">Choose a type and start designing</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-6">

            {/* ─── Template Type ─────────────────────────── */}
            <div className="space-y-2.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                Template Type <span className="text-red-400 ml-0.5">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <TypeCard
                  value="Employee"
                  selected={role === "Employee"}
                  onSelect={handleRoleChange}
                  icon={FileCheck}
                  label="Employee Letter"
                  description="Offer letters, experience letters, warning letters"
                  accent="border-blue-400 bg-blue-50/80 text-blue-700"
                />
                <TypeCard
                  value="Contract"
                  selected={isContractType}
                  onSelect={handleRoleChange}
                  icon={FileSignature}
                  label="Contract"
                  description="Client contracts, service agreements, NDAs"
                  accent="border-violet-400 bg-violet-50/80 text-violet-700"
                />
              </div>
            </div>

            {/* ─── Company Section ───────────────────────── */}
            {role === "Employee" ? (
              /* Auto-selected Brintor for Employee Letter */
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} className="text-slate-400" />
                  Company
                </Label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/60">
                  {/* Company logo or initial */}
                  <div className="w-9 h-9 rounded-lg bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    {brintorCompany ? (
                      (brintorCompany.companylogo || brintorCompany.companyLogo) ? (
                        <img
                          src={brintorCompany.companylogo || brintorCompany.companyLogo}
                          alt=""
                          className="w-full h-full object-contain rounded-lg p-0.5"
                        />
                      ) : (
                        <span className="text-xs font-bold text-blue-600">
                          {(brintorCompany.name || "B")[0].toUpperCase()}
                        </span>
                      )
                    ) : (
                      <Building2 size={14} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {brintorCompany?.name || "Brintor"}
                    </p>
                    <p className="text-[10px] text-blue-600/70 font-medium">Auto-selected for employee letters</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 rounded-lg">
                    <Shield size={11} className="text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-700">Default</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Contract — Searchable Company Dropdown */
              <SearchableDropdown
                label="Company"
                required
                icon={Building2}
                items={allCompanies}
                value={company}
                onChange={setCompany}
                placeholder="Select a company…"
                searchPlaceholder="Search companies…"
                emptyText="No companies found"
                renderItem={(item, isSelected) => (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${isSelected ? "bg-blue-100 border border-blue-200" : "bg-slate-100"}`}>
                      {(item.companylogo || item.companyLogo) ? (
                        <img src={item.companylogo || item.companyLogo} alt="" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-slate-500"}`}>
                          {(item.name || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                        {item.name}
                      </p>
                      {item.companyEmail && (
                        <p className="text-[10px] text-slate-400 truncate">{item.companyEmail}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </>
                )}
                renderSelected={(item) => (
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                      {(item.companylogo || item.companyLogo) ? (
                        <img src={item.companylogo || item.companyLogo} alt="" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500">
                          {(item.name || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">{item.name}</span>
                  </div>
                )}
              />
            )}

            {/* ─── Client Dropdown (Contract only) ──────── */}
            {isContractType && (
              <SearchableDropdown
                label="Client"
                required={false}
                icon={Users}
                items={allClients}
                value={client}
                onChange={setClient}
                placeholder="Select a client (optional)…"
                searchPlaceholder="Search clients…"
                emptyText="No clients found"
                renderItem={(item, isSelected) => (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-violet-100" : "bg-slate-100"}`}>
                      <span className={`text-xs font-bold ${isSelected ? "text-violet-700" : "text-slate-500"}`}>
                        {(item.clientName || item.name || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-violet-800" : "text-slate-700"}`}>
                        {item.clientName || item.name || "—"}
                      </p>
                      {item.clientEmail && (
                        <p className="text-[10px] text-slate-400 truncate">{item.clientEmail}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </>
                )}
                renderSelected={(item) => (
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-violet-700">
                        {(item.clientName || item.name || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {item.clientName || item.name || "—"}
                    </span>
                  </div>
                )}
              />
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !company}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50"
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
