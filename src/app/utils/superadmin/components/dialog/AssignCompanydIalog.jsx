"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Building2, Check, Loader2, X, Search, CheckCircle2,
} from "lucide-react";

const AssignCompanyDialog = ({ open, setOpen, assigncompanies, employeeId, employeeName }) => {
  const { companies }  = useSelector((s) => s.Company);
  const [selected,     setSelected]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");

  /* pre-fill already-assigned companies —
     supports both plain ID strings ["id1","id2"]
     and company objects [{id:"id1",...}]          */
  useEffect(() => {
    if (open && Array.isArray(assigncompanies)) {
      const ids = assigncompanies.map(c =>
        typeof c === "string" ? c : (c.id || c._id)
      );
      setSelected(ids);
      setSearch("");
    }
  }, [assigncompanies, open]);

  if (!open) return null;

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = companies.filter(c =>
    !search.trim() || (c.name || c.companyName || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const names = selected
        .map(id => companies.find(c => (c.id || c._id) === id))
        .filter(Boolean)
        .map(c => c.name || c.companyName);

      const res = await axios.post("/api/assign-companies", {
        employeeId,
        companyIds: selected,
        companyNames: names,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Companies assigned!");
        setOpen(false);
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(res.data.message || "Failed to assign");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-blue-600"/>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-none">Assign Companies</h2>
              {employeeName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Employee: <span className="font-semibold text-slate-600">{employeeName}</span>
                </p>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies…"
              className="w-full pl-8 pr-3 h-9 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Selected count chip */}
          {selected.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg w-fit">
              <CheckCircle2 size={12}/> {selected.length} company selected
            </div>
          )}

          {/* Company list */}
          <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 italic">No companies found</p>
            ) : filtered.map(comp => {
              const id       = comp.id || comp._id;
              const name     = comp.name || comp.companyName;
              const logo     = comp.companylogo || comp.companyLogo;
              const isActive = comp.status?.toLowerCase() !== "deactive";
              const checked  = selected.includes(id);
              return (
                <button key={id} type="button" onClick={() => isActive && toggle(id)}
                  disabled={!isActive}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                    checked
                      ? "bg-blue-50 border-blue-300"
                      : isActive
                        ? "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                        : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                  }`}>

                  {/* Logo / initials */}
                  {logo ? (
                    <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 p-0.5 shrink-0"/>
                  ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      checked ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {name?.slice(0, 2).toUpperCase() || "CO"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${checked ? "text-blue-800" : "text-slate-800"}`}>{name}</p>
                    {!isActive && <p className="text-[10px] text-slate-400">Inactive</p>}
                  </div>

                  {/* Checkbox indicator */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked ? "bg-blue-600 border-blue-600" : "border-slate-300"
                  }`}>
                    {checked && <Check size={11} className="text-white" strokeWidth={3}/>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
            {loading ? <><Loader2 size={14} className="animate-spin"/> Assigning…</> : <><Building2 size={14}/> Assign Companies</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCompanyDialog;
