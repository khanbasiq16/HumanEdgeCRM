"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getallinvoice } from "@/features/Slice/InvoiceSlice";
import {
  Receipt, Plus, Loader2, Search, User, Mail, MapPin,
  Hash, Calendar, Building2, DollarSign, FileText,
} from "lucide-react";

const inputCls =
  "h-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

const Invoicedialog = () => {
  const [loading, setLoading]                       = useState(false);
  const [open, setOpen]                             = useState(false);
  const [clients, setClients]                       = useState([]);
  const [search, setSearch]                         = useState("");
  const [filteredClients, setFilteredClients]       = useState([]);
  const [selectedClient, setSelectedClient]         = useState(null);
  const [invoiceNumber, setInvoiceNumber]           = useState("");
  const [currentDate, setCurrentDate]               = useState("");
  const [highlightedIndex, setHighlightedIndex]     = useState(-1);
  const searchInputRef = useRef(null);

  const dispatch      = useDispatch();
  const { user }      = useSelector((s) => s.User);
  const { id }        = useParams();
  const companySlug   = id;

  const capitalizedCompanyName = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  useEffect(() => {
    if (open) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      setInvoiceNumber(`INV-${randomNum}`);
      setCurrentDate(new Date().toLocaleDateString("en-GB"));
      setSearch("");
      setSelectedClient(null);
      setFilteredClients([]);
      setHighlightedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`/api/get-all-clients/${id}`);
        setClients(res.data.clients || []);
      } catch {
        toast.error("Failed to fetch clients");
      }
    };
    fetchClients();
  }, [id]);

  useEffect(() => {
    setHighlightedIndex(-1);
    if (search.trim() === "") {
      setFilteredClients([]);
    } else {
      setFilteredClients(
        clients.filter((c) =>
          c.clientName.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
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
      setHighlightedIndex((p) => (p < filteredClients.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((p) => (p > 0 ? p - 1 : filteredClients.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectClient(filteredClients[highlightedIndex]);
        searchInputRef.current.blur();
      }
    } else if (e.key === "Escape") {
      setFilteredClients([]);
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }
    setLoading(true);
    try {
      const data          = Object.fromEntries(new FormData(e.target));
      data.companySlug    = companySlug;
      data.clientId       = selectedClient.id;
      data.invoiceNumber  = invoiceNumber;
      data.invoiceDate    = currentDate;
      data.Description    = data.invoiceDescription || "";
      data.totalAmount    = Number(data.invoiceAmount);
      data.createdBy      = user?.name;
      data.status         = "Draft";
      data.user_id        = user?.uid;
      data.type           = "admin";

      const res = await axios.post("/api/create-invoice", data, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Invoice Created Successfully!");
        e.target.reset();
        setSelectedClient(null);
        setSearch("");
        dispatch(getallinvoice(res.data.assignedInvoices));
      } else {
        toast.error(res.data.error || "Failed to create invoice");
      }
    } catch {
      toast.error("Error creating invoice");
    } finally {
      setLoading(false);
      setOpen(false);
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

      <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl">

        {/* ── Minimal header ── */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Receipt size={15} className="text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-none">
                Generate Invoice
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Creates a new draft invoice</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleInvoiceSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/40">

            {/* ── Invoice meta band ── */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
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
              {capitalizedCompanyName && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={9} /> Company
                  </p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{capitalizedCompanyName}</p>
                </div>
              )}
            </div>

            {/* ── Client search ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <User size={12} className="text-slate-400" />
                Select Client <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (selectedClient && selectedClient.clientName !== e.target.value) {
                      setSelectedClient(null);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setFilteredClients([]), 100)}
                  placeholder="Search client name…"
                  className={`${inputCls} pl-9`}
                />
                {filteredClients.length > 0 && (
                  <div className="absolute z-50 bg-white border border-slate-200 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredClients.map((c, index) => (
                      <div
                        key={c.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectClient(c);
                          setFilteredClients([]);
                          searchInputRef.current.blur();
                        }}
                        className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                          index === highlightedIndex
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-medium">{c.clientName}</span>
                        <span className="text-xs text-slate-400 ml-2">({c.clientEmail})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Selected client preview ── */}
            {selectedClient && (
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <User size={13} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{selectedClient.clientName}</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                  <Mail size={11} className="text-emerald-500 shrink-0" />
                  {selectedClient.clientEmail}
                </div>
                {selectedClient.clientAddress && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                    <MapPin size={11} className="text-emerald-500 shrink-0" />
                    {selectedClient.clientAddress}
                  </div>
                )}
              </div>
            )}

            {/* ── Description ── */}
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

            {/* ── Amount ── */}
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
                  placeholder="0.00"
                  required
                  className={`${inputCls} pl-7 font-semibold`}
                />
              </div>
            </div>
          </div>

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
                <><Loader2 size={14} className="animate-spin" /> Generating…</>
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

export default Invoicedialog;
