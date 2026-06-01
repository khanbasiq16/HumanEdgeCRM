"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getallinvoice } from "@/features/Slice/InvoiceSlice";
import {
  Receipt, Plus, Loader2, Search, User, Mail, MapPin,
  Hash, Building2, DollarSign, FileText, X, Calendar,
} from "lucide-react";
import Clientdialog from "./Clientdialog";

const Invoicedialog = () => {
  const [open,             setOpen]             = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [clients,          setClients]          = useState([]);
  const [search,           setSearch]           = useState("");
  const [filteredClients,  setFilteredClients]  = useState([]);
  const [selectedClient,   setSelectedClient]   = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [invoiceNumber,    setInvoiceNumber]    = useState("");
  const [currentDate,      setCurrentDate]      = useState("");
  const searchInputRef = useRef(null);

  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.User);
  const { id }   = useParams();

  const companyLabel = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setInvoiceNumber(`INV-${Math.floor(100 + Math.random() * 900)}`);
      setCurrentDate(new Date().toLocaleDateString("en-GB"));
      setSearch(""); setSelectedClient(null); setFilteredClients([]); setHighlightedIndex(-1);
    }
  }, [open]);

  /* Fetch clients for this company */
  const fetchClients = useCallback(() => {
    if (!id || !user?.employeeId) return;
    axios.get(`/api/get-clients/${id}/${user.employeeId}`)
      .then(r => setClients(r.data.clients || []))
      .catch(() => toast.error("Failed to fetch clients"));
  }, [id, user?.employeeId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* Filter as user types */
  useEffect(() => {
    setHighlightedIndex(-1);
    if (!search.trim()) { setFilteredClients([]); return; }
    setFilteredClients(clients.filter(c => c.clientName.toLowerCase().includes(search.toLowerCase())));
  }, [search, clients]);

  const selectClient = useCallback((client) => {
    setSearch(client.clientName);
    setSelectedClient(client);
    setFilteredClients([]);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = (e) => {
    if (filteredClients.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(p => (p < filteredClients.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(p => (p > 0 ? p - 1 : filteredClients.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectClient(filteredClients[highlightedIndex]);
        searchInputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setFilteredClients([]);
      searchInputRef.current?.blur();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return toast.error("Please select a client first");
    setLoading(true);
    try {
      const fd   = new FormData(e.target);
      const data = {
        companySlug:   id,
        clientId:      selectedClient.id,
        invoiceNumber,
        invoiceDate:   currentDate,
        Description:   fd.get("invoiceDescription") || "",
        totalAmount:   Number(fd.get("invoiceAmount")),
        createdBy:     user?.employeeName,
        status:        "Draft",
        user_id:       user?.employeeId,
        type:          "employee",
      };
      const res = await axios.post("/api/create-invoice", data, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.data.success) {
        toast.success("Invoice Created Successfully!");
        e.target.reset();
        setSelectedClient(null); setSearch("");
        dispatch(getallinvoice(res.data.assignedInvoices));
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
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200"
      >
        <Plus size={13}/> New Invoice
      </button>

      {/* Shared Create Client dialog — opened from inside invoice dialog */}
      <Clientdialog
        open={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        hideTrigger
        onSuccess={fetchClients}
      />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl overflow-hidden" style={{ maxHeight: "92vh" }}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Receipt size={15} className="text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">Generate Invoice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Creates a new draft invoice</p>
                </div>
                <button onClick={() => setOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={15}/>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/40">

                {/* Invoice meta band */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash size={9}/> Invoice No.
                    </p>
                    <p className="text-sm font-extrabold text-blue-600">{invoiceNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={9}/> Date
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{currentDate}</p>
                  </div>
                  {companyLabel && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 size={9}/> Company
                      </p>
                      <p className="text-sm font-semibold text-slate-700 truncate">{companyLabel}</p>
                    </div>
                  )}
                </div>

                {/* Client search */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400"/> Select Client <span className="text-red-500">*</span>
                    </label>
                    <button type="button" onClick={() => setCreateClientOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors">
                      <Plus size={10}/> Create Client
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={e => {
                        setSearch(e.target.value);
                        if (selectedClient && selectedClient.clientName !== e.target.value) setSelectedClient(null);
                        setHighlightedIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => setTimeout(() => setFilteredClients([]), 120)}
                      onFocus={() => {
                        if (search.trim() && !selectedClient) {
                          setFilteredClients(clients.filter(c => c.clientName.toLowerCase().includes(search.toLowerCase())));
                        }
                      }}
                      placeholder="Search client name…"
                      className="w-full h-9 text-sm bg-white border border-slate-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                    {filteredClients.length > 0 && (
                      <div className="absolute z-50 bg-white border border-slate-200 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {filteredClients.map((c, idx) => (
                          <div key={c.id}
                            onMouseDown={e => { e.preventDefault(); selectClient(c); searchInputRef.current?.blur(); }}
                            className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                              idx === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                            }`}>
                            <span className="font-medium">{c.clientName}</span>
                            <span className="text-xs text-slate-400 ml-2">({c.clientEmail})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected client preview */}
                {selectedClient && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-emerald-600"/>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{selectedClient.clientName}</span>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                      <Mail size={11} className="text-emerald-500 shrink-0"/>{selectedClient.clientEmail}
                    </div>
                    {selectedClient.clientAddress && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                        <MapPin size={11} className="text-emerald-500 shrink-0"/>{selectedClient.clientAddress}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400"/> Description
                  </label>
                  <textarea name="invoiceDescription" rows={3}
                    placeholder="Describe the services rendered…"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"/>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-slate-400"/> Total Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                    <input name="invoiceAmount" type="number" step="0.01" placeholder="0.00" required
                      className="w-full h-9 text-sm bg-white border border-slate-200 rounded-lg pl-7 pr-3 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"/>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
                    : <><Receipt size={14}/> Save as Draft</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Invoicedialog;
