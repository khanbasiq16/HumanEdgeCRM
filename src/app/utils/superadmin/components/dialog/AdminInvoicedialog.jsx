"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { getallinvoice } from "@/features/Slice/InvoiceSlice";
import {
  Receipt, Plus, Loader2, Search, User, Mail, MapPin,
  Hash, Calendar, Building2, DollarSign, FileText, ChevronDown, Users,
} from "lucide-react";

const inputCls =
  "h-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

const AdminInvoicedialog = ({ setInvoices }) => {
  const [loading, setLoading]                     = useState(false);
  const [open, setOpen]                           = useState(false);

  const [companies, setCompanies]                 = useState([]);
  const [selectedCompany, setSelectedCompany]     = useState(null);
  const [companySearch, setCompanySearch]         = useState("");
  const [companyDropOpen, setCompanyDropOpen]     = useState(false);

  const [employees, setEmployees]                 = useState([]);
  const [selectedEmployee, setSelectedEmployee]   = useState(null);
  const [employeeDropOpen, setEmployeeDropOpen]   = useState(false);

  const [clients, setClients]                     = useState([]);
  const [clientSearch, setClientSearch]           = useState("");
  const [selectedClient, setSelectedClient]       = useState(null);
  const [clientDropOpen, setClientDropOpen]       = useState(false);
  const clientDropRef                             = useRef(null);

  const [invoiceNumber, setInvoiceNumber]         = useState("");
  const [currentDate, setCurrentDate]             = useState("");

  const dispatch        = useDispatch();
  const { user }        = useSelector((s) => s.User);

  useEffect(() => {
    if (!open) return;
    setInvoiceNumber(`INV-${Math.floor(100 + Math.random() * 900)}`);
    setCurrentDate(new Date().toLocaleDateString("en-GB"));
    setSelectedCompany(null);
    setCompanySearch("");
    setSelectedEmployee(null);
    setClients([]);
    setClientSearch("");
    setSelectedClient(null);
    setClientDropOpen(false);
  }, [open]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [compRes, empRes] = await Promise.all([
          axios.get("/api/get-all-companies"),
          axios.get("/api/get-all-employees"),
        ]);
        if (compRes.data.success) setCompanies(compRes.data.companies || []);
        if (empRes.data.success) {
          const salesOnly = (empRes.data.employees || []).filter(
            (e) => e.department?.trim().toLowerCase() === "sales"
          );
          setEmployees(salesOnly);
        }
      } catch {
        toast.error("Failed to load companies / employees");
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!selectedCompany) { setClients([]); setSelectedClient(null); setClientSearch(""); return; }
    const fetchClients = async () => {
      try {
        const res = await axios.get(`/api/get-all-clients/${selectedCompany.companyslug}`);
        setClients(res.data.clients || []);
      } catch {
        toast.error("Failed to load clients");
      }
    };
    fetchClients();
  }, [selectedCompany]);

  const filteredClients = clientSearch.trim()
    ? clients.filter((c) => c.clientName?.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  // close client dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (clientDropRef.current && !clientDropRef.current.contains(e.target))
        setClientDropOpen(false);
    };
    if (clientDropOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [clientDropOpen]);

  const filteredCompanies = companies.filter((c) =>
    (c.name || c.companyslug || "").toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredEmployees = employees.filter((e) =>
    (e.name || e.email || "").toLowerCase()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) { toast.error("Please select a company"); return; }
    if (!selectedClient)  { toast.error("Please select a client");  return; }
    setLoading(true);
    try {
      const data = Object.fromEntries(new FormData(e.target));
      data.companySlug          = selectedCompany.companyslug;
      data.clientId             = selectedClient.id;
      data.invoiceNumber        = invoiceNumber;
      data.invoiceDate          = currentDate;
      data.Description          = data.invoiceDescription || "";
      data.totalAmount          = Number(data.invoiceAmount);
      data.createdBy            = user?.name;
      data.status               = "Draft";
      data.user_id              = user?.uid;
      data.type                 = "admin";
      data.assignedEmployeeId   = selectedEmployee?.employeeId   || selectedEmployee?.id || null;
      data.assignedEmployeeName = selectedEmployee?.employeeName || null;

      const res = await axios.post("/api/create-invoice", data, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Invoice created successfully!");
        if (setInvoices) {
          const allRes = await axios.get("/api/all-invoices");
          if (allRes.data.success) setInvoices(allRes.data.invoices || []);
        }
        setOpen(false);
      } else {
        toast.error(res.data.error || "Failed to create invoice");
      }
    } catch {
      toast.error("Error creating invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <Plus size={13} />
          New Invoice
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Receipt size={15} className="text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-none">
                Generate Invoice
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Assign to company, client & employee</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/40">

            {/* Invoice meta band */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash size={9} /> Invoice No.
                </p>
                <p className="text-sm font-extrabold text-blue-600">{invoiceNumber}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={9} /> Date
                </p>
                <p className="text-sm font-semibold text-slate-700">{currentDate}</p>
              </div>
            </div>

            {/* Company selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-400" />
                Select Company <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCompanyDropOpen((o) => !o)}
                  className="w-full h-9 flex items-center justify-between px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-400 transition-colors"
                >
                  <span className={selectedCompany ? "text-slate-800" : "text-slate-400"}>
                    {selectedCompany ? (selectedCompany.name || selectedCompany.companyslug) : "Choose a company…"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </button>
                {companyDropOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          placeholder="Search company…"
                          className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredCompanies.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">No companies found</p>
                      ) : filteredCompanies.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedCompany(c);
                            setCompanyDropOpen(false);
                            setCompanySearch("");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {c.name || c.companyslug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <User size={12} className="text-slate-400" />
                Select Client <span className="text-red-500">*</span>
              </Label>
              <div className="relative" ref={clientDropRef}>
                <button
                  type="button"
                  disabled={!selectedCompany}
                  onClick={() => { if (selectedCompany) setClientDropOpen((o) => !o); }}
                  className="w-full h-9 flex items-center justify-between px-3 bg-white border border-slate-200 rounded-lg text-sm hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={selectedClient ? "text-slate-800" : "text-slate-400"}>
                    {selectedClient
                      ? selectedClient.clientName
                      : selectedCompany ? "Choose a client…" : "Select a company first"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {selectedClient && (
                      <span
                        onMouseDown={(e) => { e.stopPropagation(); setSelectedClient(null); setClientSearch(""); }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 text-[10px] transition-colors"
                      >✕</span>
                    )}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </button>

                {clientDropOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search client…"
                          className="w-full h-7 pl-7 pr-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">
                          {clients.length === 0 ? "No clients in this company" : "No matches found"}
                        </p>
                      ) : filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedClient(c);
                            setClientDropOpen(false);
                            setClientSearch("");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-sm font-semibold text-slate-700">{c.clientName}</p>
                          {c.clientEmail && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{c.clientEmail}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedClient && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <User size={12} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">{selectedClient.clientName}</span>
                  {selectedClient.clientEmail && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-1">
                      <Mail size={10} /> {selectedClient.clientEmail}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Employee selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Users size={12} className="text-slate-400" />
                Assign Employee <span className="text-slate-400 font-normal">(Sales only)</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmployeeDropOpen((o) => !o)}
                  className="w-full h-9 flex items-center justify-between px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-400 transition-colors"
                >
                  <span className={selectedEmployee ? "text-slate-800" : "text-slate-400"}>
                    {selectedEmployee ? selectedEmployee.employeeName : "Choose an employee…"}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedEmployee && (
                      <span
                        onMouseDown={(e) => { e.stopPropagation(); setSelectedEmployee(null); setEmployeeDropOpen(false); }}
                        className="text-slate-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </span>
                    )}
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </div>
                </button>
                {employeeDropOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-44 overflow-y-auto">
                      {employees.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">No Sales employees found</p>
                      ) : employees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedEmployee(emp);
                            setEmployeeDropOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span className="font-medium">{emp.employeeName}</span>
                          {emp.employeeemail && <span className="text-xs text-slate-400 ml-2">({emp.employeeemail})</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FileText size={12} className="text-slate-400" />
                Description
              </Label>
              <textarea
                name="invoiceDescription"
                rows={3}
                placeholder="Describe the services rendered…"
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <DollarSign size={12} className="text-slate-400" />
                Total Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                <Input
                  name="invoiceAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  className={`${inputCls} pl-7 font-semibold`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
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
                <><Loader2 size={14} className="animate-spin" /> Creating…</>
              ) : (
                <><Receipt size={14} /> Save as Draft</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminInvoicedialog;
