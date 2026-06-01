"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2, MapPin, Phone, Mail, Globe,
  Eye, CheckCircle2, XCircle, ArrowRight,
  Plus, Users, FileText, X, Search,
  Loader2, User, Receipt, Hash, DollarSign, Calendar,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createcompany } from "@/features/Slice/CompanySlice";
import Clientdialog from "@/app/utils/employees/components/dialog/Clientdialog";

/* ─── Skeleton ──────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2.5 mb-5">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
    <div className="h-9 bg-slate-100 rounded-xl mb-2" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-slate-100 rounded-xl" />
      <div className="h-8 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ─── Company Card ──────────────────────────────────────── */
const CompanyCard = ({ company, slug, router, onNewClient, onNewInvoice }) => {
  const logoSrc  = company.companylogo || company.companyLogo;
  const isActive = company.status?.toLowerCase() !== "deactive";
  const email    = company.companyEmail || company.companyemail;
  const initial  = (company.name || "C")[0].toUpperCase();

  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-cyan-500 to-blue-600",
    "from-amber-500 to-orange-600",
  ];
  const grad = gradients[(company.name?.charCodeAt(0) || 0) % gradients.length];

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden
      ${isActive
        ? "border-slate-200 hover:border-blue-300 hover:shadow-[0_4px_24px_rgba(59,130,246,0.10)]"
        : "border-slate-200 opacity-70"}`}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {logoSrc ? (
              <img src={logoSrc} alt={company.name}
                className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 p-0.5"/>
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center`}>
                <span className="text-white text-lg font-extrabold">{initial}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">{company.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {isActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={9} /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <XCircle size={9} /> Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-4 flex-1 space-y-2.5">
        {company.companyAddress && (
          <div className="flex items-start gap-2.5 text-xs text-slate-500">
            <MapPin size={13} className="text-slate-300 shrink-0 mt-0.5" />
            <span className="leading-snug line-clamp-2">{company.companyAddress.replace(/\n/g, ", ")}</span>
          </div>
        )}
        {company.companyPhoneNumber && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Phone size={13} className="text-slate-300 shrink-0" />
            <span className="truncate">{company.companyPhoneNumber}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Mail size={13} className="text-slate-300 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {company.companyWebsite && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Globe size={13} className="text-slate-300 shrink-0" />
            <span className="truncate">{company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-1 space-y-2">
        {/* View Details */}
        <button
          onClick={() => isActive && router.push(`/employee/${slug}/company/${company.companyslug}`)}
          disabled={!isActive}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
            ${isActive
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          <Eye size={13} /> View Details
          {isActive && <ArrowRight size={12} className="ml-auto" />}
        </button>

        {/* Quick actions */}
        {isActive && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNewClient(company)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors"
            >
              <Users size={11}/> New Client
            </button>
            <button
              onClick={() => onNewInvoice(company)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            >
              <FileText size={11}/> New Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────── */
const Listcompanies = () => {
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { companies } = useSelector((s) => s.Company);
  const { user }      = useSelector((s) => s.User);

  /* ── Dialog state ── */
  const [actionCompany, setActionCompany] = useState(null);

  const [clientOpen,       setClientOpen]       = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  const [invoiceOpen,     setInvoiceOpen]     = useState(false);
  const [invoiceCreating, setInvoiceCreating] = useState(false);
  const [invClients,      setInvClients]      = useState([]);
  const [invSearch,       setInvSearch]       = useState("");
  const [invFiltered,     setInvFiltered]     = useState([]);
  const [invSelClient,    setInvSelClient]    = useState(null);
  const [invHighlighted,  setInvHighlighted]  = useState(-1);
  const [invNumber,       setInvNumber]       = useState("");
  const [invDate,         setInvDate]         = useState("");
  const invSearchRef = useRef(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`/api/get-employee-companies/${user.employeeId}`);
        dispatch(createcompany(res.data?.companies || []));
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Load clients when invoice dialog opens */
  useEffect(() => {
    if (!invoiceOpen || !actionCompany) return;
    setInvNumber(`INV-${Math.floor(100 + Math.random() * 900)}`);
    setInvDate(new Date().toLocaleDateString("en-GB"));
    setInvSearch(""); setInvSelClient(null); setInvClients([]); setInvFiltered([]);
    axios.get(`/api/get-all-clients/${actionCompany.companyslug}`)
      .then(r => setInvClients(r.data.clients || []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceOpen, actionCompany]);

  /* Filter clients as user types */
  useEffect(() => {
    setInvHighlighted(-1);
    if (!invSearch.trim()) { setInvFiltered([]); return; }
    setInvFiltered(invClients.filter(c => c.clientName?.toLowerCase().includes(invSearch.toLowerCase())));
  }, [invSearch, invClients]);

  /* Keyboard nav */
  const handleInvKeyDown = (e) => {
    if (invFiltered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setInvHighlighted(p => (p < invFiltered.length - 1 ? p + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setInvHighlighted(p => (p > 0 ? p - 1 : invFiltered.length - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (invHighlighted >= 0) { const c = invFiltered[invHighlighted]; setInvSearch(c.clientName); setInvSelClient(c); setInvFiltered([]); setInvHighlighted(-1); invSearchRef.current?.blur(); }
    } else if (e.key === "Escape") { setInvFiltered([]); setInvHighlighted(-1); }
  };

  const selectInvClient = useCallback((c) => {
    setInvSearch(c.clientName); setInvSelClient(c); setInvFiltered([]); setInvHighlighted(-1);
  }, []);

  /* Open Create Client dialog */
  const openClientDialog = (company) => {
    setActionCompany(company);
    setClientOpen(true);
  };

  /* Open Create Invoice dialog */
  const openInvoiceDialog = (company) => {
    setActionCompany(company);
    setInvoiceOpen(true);
  };


  /* ── Create Invoice handler ── */
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invSelClient)  return toast.error("Please select a client");
    if (!actionCompany) return;
    setInvoiceCreating(true);
    try {
      const fd   = new FormData(e.target);
      const data = {
        companySlug:   actionCompany.companyslug,
        clientId:      invSelClient.id,
        invoiceNumber: invNumber,
        invoiceDate:   invDate,
        Description:   fd.get("invoiceDescription") || "",
        totalAmount:   Number(fd.get("invoiceAmount")),
        createdBy:     user?.employeeName,
        status:        "Draft",
        user_id:       user?.employeeId || user?.id,
        type:          "employee",
      };
      const res = await axios.post("/api/create-invoice", data);
      if (res.data.success) {
        toast.success("Invoice created!");
        setInvoiceOpen(false);
      } else toast.error(res.data.error || "Failed to create invoice");
    } catch { toast.error("Error creating invoice"); }
    finally { setInvoiceCreating(false); }
  };

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Companies</h1>
          {!loading && (
            <p className="text-sm text-slate-400 mt-0.5">
              {companies.length} compan{companies.length !== 1 ? "ies" : "y"} assigned to you
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={24} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">No companies assigned</p>
            <p className="text-xs text-slate-400 mt-1">Companies assigned to you will appear here</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, i) => (
            <CompanyCard
              key={i}
              company={company}
              slug={slug}
              router={router}
              onNewClient={openClientDialog}
              onNewInvoice={openInvoiceDialog}
            />
          ))}
        </div>
      )}

      {/* ══ CREATE CLIENT — shared Clientdialog ══ */}
      <Clientdialog
        open={clientOpen}
        onClose={() => setClientOpen(false)}
        companySlug={actionCompany?.companyslug}
        companyName={actionCompany?.name}
        hideTrigger
      />

      {/* ══ CREATE INVOICE DIALOG (admin-style) ══ */}
      {invoiceOpen && (
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
                <button onClick={() => setInvoiceOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={15}/>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/40">

                {/* Invoice meta band */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash size={9}/> Invoice No.
                    </p>
                    <p className="text-sm font-extrabold text-blue-600">{invNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={9}/> Date
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{invDate}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 size={9}/> Company
                    </p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{actionCompany?.name || "—"}</p>
                  </div>
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
                      ref={invSearchRef}
                      value={invSearch}
                      onChange={e => {
                        setInvSearch(e.target.value);
                        if (invSelClient && invSelClient.clientName !== e.target.value) setInvSelClient(null);
                      }}
                      onKeyDown={handleInvKeyDown}
                      onBlur={() => setTimeout(() => setInvFiltered([]), 120)}
                      placeholder="Search client name…"
                      className="w-full h-9 text-sm bg-white border border-slate-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                    {invFiltered.length > 0 && (
                      <div className="absolute z-50 bg-white border border-slate-200 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {invFiltered.map((c, idx) => (
                          <div key={c.id}
                            onMouseDown={e => { e.preventDefault(); selectInvClient(c); }}
                            className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${idx === invHighlighted ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                            <span className="font-medium">{c.clientName}</span>
                            <span className="text-xs text-slate-400 ml-2">({c.clientEmail})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected client preview */}
                {invSelClient && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-emerald-600"/>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{invSelClient.clientName}</span>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Selected</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                      <Mail size={11} className="text-emerald-500 shrink-0"/>{invSelClient.clientEmail}
                    </div>
                    {invSelClient.clientAddress && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                        <MapPin size={11} className="text-emerald-500 shrink-0"/>{invSelClient.clientAddress}
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
                <button type="button" onClick={() => setInvoiceOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={invoiceCreating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
                  {invoiceCreating
                    ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
                    : <><Receipt size={14}/> Save as Draft</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client — opened from inside invoice dialog */}
      <Clientdialog
        open={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        companySlug={actionCompany?.companyslug}
        companyName={actionCompany?.name}
        hideTrigger
        onSuccess={() => {
          if (!actionCompany) return;
          axios.get(`/api/get-all-clients/${actionCompany.companyslug}`)
            .then(r => setInvClients(r.data.clients || []))
            .catch(() => {});
        }}
      />
    </div>
  );
};

export default Listcompanies;
