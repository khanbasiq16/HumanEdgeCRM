"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  Users, Loader2, Plus, Globe, Mail, Phone, MapPin, Briefcase,
  Package, Building2, ChevronDown, Search, Check, UserCheck,
  Bold, Italic, Underline, List, ListOrdered,
} from "lucide-react";

const EMP_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

/* ── Minimal rich text editor ── */
const RichEditor = ({ value = "", onChange, placeholder = "" }) => {
  const editorRef   = useRef(null);
  const initialized = useRef(false);
  const [formats, setFormats] = useState({});

  useEffect(() => {
    if (!initialized.current && editorRef.current) {
      editorRef.current.innerHTML = value || "";
      initialized.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd) => { document.execCommand(cmd, false, null); editorRef.current?.focus(); sync(); };
  const sync  = () => setFormats({
    bold:      document.queryCommandState("bold"),
    italic:    document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    ul:        document.queryCommandState("insertUnorderedList"),
    ol:        document.queryCommandState("insertOrderedList"),
  });
  const Btn = ({ cmd, icon: Icon, active }) => (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
      className={`p-1.5 rounded transition-all ${active ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-500"}`}>
      <Icon size={13} />
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <Btn cmd="bold" icon={Bold} active={formats.bold} />
        <Btn cmd="italic" icon={Italic} active={formats.italic} />
        <Btn cmd="underline" icon={Underline} active={formats.underline} />
        <div className="w-px h-3.5 bg-slate-200 mx-1" />
        <Btn cmd="insertUnorderedList" icon={List} active={formats.ul} />
        <Btn cmd="insertOrderedList" icon={ListOrdered} active={formats.ol} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { sync(); onChange?.(editorRef.current?.innerHTML ?? ""); }}
        onKeyUp={sync}
        onMouseUp={sync}
        data-placeholder={placeholder}
        className="min-h-[80px] max-h-[140px] overflow-y-auto px-3 py-2.5 outline-none text-sm text-slate-700 bg-white [&::-webkit-scrollbar]:hidden"
        style={{ lineHeight: 1.6 }}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before { content:attr(data-placeholder); color:#cbd5e1; pointer-events:none; font-size:13px; }
        [contenteditable] ul { padding-left:1.2em; list-style:disc; }
        [contenteditable] ol { padding-left:1.2em; list-style:decimal; }
        [contenteditable] li { margin:2px 0; }
      `}</style>
    </div>
  );
};

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

const Section = ({ title }) => (
  <div className="pb-1 border-b border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
  </div>
);

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

const AdminClientdialog = ({ setClients }) => {
  const [loading, setLoading]                   = useState(false);
  const [open, setOpen]                         = useState(false);

  const [companies, setCompanies]               = useState([]);
  const [selectedCompany, setSelectedCompany]   = useState(null);
  const [companySearch, setCompanySearch]       = useState("");
  const [companyDropOpen, setCompanyDropOpen]   = useState(false);

  const [employees, setEmployees]               = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDropOpen, setEmployeeDropOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch]     = useState("");
  const empContainerRef = useRef(null);

  const [projectsDetails, setProjectsDetails]   = useState("");
  const [packageDetails, setPackageDetails]     = useState("");

  const { user } = useSelector((s) => s.User);

  useEffect(() => {
    if (!open) return;
    setSelectedCompany(null);
    setCompanySearch("");
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setEmployeeDropOpen(false);
    setProjectsDetails("");
    setPackageDetails("");
  }, [open]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, eRes] = await Promise.all([
          axios.get("/api/get-all-companies"),
          axios.get("/api/get-all-employees"),
        ]);
        if (cRes.data.success) setCompanies(cRes.data.companies || []);
        if (eRes.data.success) {
          const salesOnly = (eRes.data.employees || []).filter((e) => {
            const dept = typeof e.department === "string"
              ? e.department
              : (e.department?.departmentName || "");
            return dept.trim().toLowerCase().includes("sales");
          });
          setEmployees(salesOnly);
        }
      } catch {
        toast.error("Failed to load companies / employees");
      }
    };
    load();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    (c.name || c.companyslug || "").toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredEmployees = employees.filter((e) =>
    (e.employeeName || "").toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (e.employeeemail || "").toLowerCase().includes(employeeSearch.toLowerCase())
  );

  useEffect(() => {
    if (!employeeDropOpen) return;
    const handler = (e) => {
      if (empContainerRef.current && !empContainerRef.current.contains(e.target)) {
        setEmployeeDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [employeeDropOpen]);

  const handleClose = () => {
    setOpen(false);
    setProjectsDetails("");
    setPackageDetails("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) { toast.error("Please select a company"); return; }
    setLoading(true);
    try {
      const fd = new FormData(e.target);
      const body = {
        companyName:          selectedCompany.companyslug,
        clientName:           fd.get("clientName"),
        clientEmail:          fd.get("clientEmail"),
        clientPhone:          fd.get("clientPhone"),
        clientWebsite:        fd.get("clientWebsite"),
        clientAddress:        fd.get("clientAddress"),
        projectsDetails,
        packageDetails,
        assignedEmployeeId:   selectedEmployee?.employeeId || selectedEmployee?.id || null,
        assignedEmployeeName: selectedEmployee?.employeeName || null,
      };

      const res = await axios.post("/api/create-client", body, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Client created successfully!");
        if (setClients) {
          const allRes = await axios.get("/api/all-clients");
          if (allRes.data.success) setClients(allRes.data.clients || []);
        }
        e.target.reset();
        handleClose();
      } else {
        toast.error(res.data.error || "Failed to create client");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error creating client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <Plus size={13} />
          Create Client
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Users size={17} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">Create New Client</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Assign to company & employee</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white">

            {/* ── Company & Employee Assignment ── */}
            <Section title="Assignment" />

            <div className="grid grid-cols-2 gap-4">
              {/* Company dropdown */}
              <Field label="Company" required icon={Building2}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCompanyDropOpen((o) => !o)}
                    className="w-full h-9 flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:border-blue-400 transition-colors"
                  >
                    <span className={selectedCompany ? "text-slate-800 truncate" : "text-slate-400"}>
                      {selectedCompany ? (selectedCompany.name || selectedCompany.companyslug) : "Select company…"}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                  </button>
                  {companyDropOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            autoFocus
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full h-7 pl-7 pr-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {filteredCompanies.length === 0 ? (
                          <p className="px-4 py-2.5 text-xs text-slate-400">No companies</p>
                        ) : filteredCompanies.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => { setSelectedCompany(c); setCompanyDropOpen(false); setCompanySearch(""); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            {c.name || c.companyslug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              {/* Employee dropdown */}
              <Field label="Assign Employee" icon={UserCheck}>
                <div className="relative" ref={empContainerRef}>
                  <button
                    type="button"
                    onClick={() => { setEmployeeDropOpen((o) => !o); setEmployeeSearch(""); }}
                    className={`w-full h-9 flex items-center justify-between px-3 bg-slate-50 border rounded-lg text-sm transition-colors ${employeeDropOpen ? "border-blue-400 ring-1 ring-blue-100" : "border-slate-200 hover:border-blue-400"}`}
                  >
                    {selectedEmployee ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${EMP_COLORS[employees.indexOf(selectedEmployee) % EMP_COLORS.length]}`}>
                          {(selectedEmployee.employeeName || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-800 truncate text-sm font-medium">{selectedEmployee.employeeName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Optional…</span>
                    )}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {selectedEmployee && (
                        <span
                          onMouseDown={(e) => { e.stopPropagation(); setSelectedEmployee(null); }}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 text-[10px] transition-colors"
                        >✕</span>
                      )}
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${employeeDropOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {employeeDropOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      {/* Search */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            autoFocus
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            placeholder="Search employee…"
                            className="w-full h-7 pl-7 pr-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-44 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {filteredEmployees.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-slate-400 text-center">No employees found</p>
                        ) : filteredEmployees.map((emp, idx) => {
                          const initials = (emp.employeeName || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                          const isSelected = selectedEmployee?.id === emp.id;
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onMouseDown={() => { setSelectedEmployee(emp); setEmployeeDropOpen(false); setEmployeeSearch(""); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${EMP_COLORS[idx % EMP_COLORS.length]}`}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate">{emp.employeeName}</p>
                                {emp.employeeemail && (
                                  <p className="text-[11px] text-slate-400 truncate">{emp.employeeemail}</p>
                                )}
                              </div>
                              {isSelected && <Check size={13} className="text-blue-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* ── Contact Info ── */}
            <Section title="Contact Info" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client Name" required icon={Users}>
                <Input name="clientName" placeholder="Full name" required className={inputCls} />
              </Field>
              <Field label="Email" required icon={Mail}>
                <Input name="clientEmail" type="email" placeholder="client@email.com" required className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" required icon={Phone}>
                <Input name="clientPhone" placeholder="+1 234 567 8900" required className={inputCls} />
              </Field>
              <Field label="Website" icon={Globe}>
                <Input name="clientWebsite" placeholder="https://example.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Address" required icon={MapPin}>
              <Input name="clientAddress" placeholder="Street, City, Country" required className={inputCls} />
            </Field>

            {/* ── Project Details ── */}
            <Section title="Project Details" />

            <Field label="Projects Details" icon={Briefcase}>
              <RichEditor value={projectsDetails} onChange={setProjectsDetails} placeholder="Describe project details, scope, timelines…" />
            </Field>

            <Field label="Package Details" icon={Package}>
              <RichEditor value={packageDetails} onChange={setPackageDetails} placeholder="Describe package, pricing, deliverables…" />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
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
                <><Users size={14} /> Save Client</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminClientdialog;
