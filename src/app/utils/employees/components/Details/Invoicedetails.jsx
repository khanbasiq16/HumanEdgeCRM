"use client";
import React, { useState } from "react";
import axios from "axios";
import {
  Check, Copy, Mail, Phone, MapPin, Globe, Receipt,
  Building2, Hash, CalendarDays, DollarSign, FileText,
  FolderOpen, Package, UserCheck, ExternalLink, Send,
  Loader2, X, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── helpers ── */
const statusStyle = (s) => {
  if (s === "Paid")  return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "Sent")  return "bg-blue-50    text-blue-700    border-blue-200";
  return                    "bg-amber-50   text-amber-700   border-amber-200";
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, icon: Icon, color = "blue" }) => {
  const cls = {
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo:  "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cls[color]}`}>
        <Icon size={14} />
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
    </div>
  );
};

const InfoLine = ({ label, value, link = false, mono = false }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
    <p className="text-xs text-slate-400 font-medium shrink-0 w-28">{label}</p>
    <div className="flex-1 min-w-0 text-right">
      {link && value ? (
        <a href={value} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold">
          {value.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
          <ExternalLink size={10} />
        </a>
      ) : (
        <p className={`text-xs font-semibold text-slate-800 break-all ${mono ? "font-mono text-[11px]" : ""}`}>
          {value || <span className="text-slate-300 font-normal">—</span>}
        </p>
      )}
    </div>
  </div>
);

/* ── Send Confirmation Modal ── */
const SendConfirmModal = ({ open, onClose, onConfirm, invoice, client, sending }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Send size={14} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-900">Send Invoice</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              This will send a professional invoice email to the client using <strong>{invoice?.companyName}</strong>'s email settings.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Preview</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Invoice No.</span>
                <span className="text-xs font-bold text-slate-800">{invoice?.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Amount</span>
                <span className="text-xs font-bold text-emerald-600">${Number(invoice?.totalAmount || 0).toLocaleString()}</span>
              </div>
              {invoice?.Description && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Description</span>
                  <span className="text-xs font-semibold text-slate-700 max-w-45 truncate text-right">{invoice.Description}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Mail size={14} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sending to</p>
              <p className="text-sm font-bold text-slate-800 truncate">{client?.clientEmail}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            {sending
              ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
              : <><Send size={13} /> Confirm & Send</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ── */
const Invoicedetails = ({ invoice, client, setInvoice }) => {
  const [copied,      setCopied]      = useState(false);
  const [sending,     setSending]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!invoice || !client) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading invoice…
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoice.invoiceLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    try {
      const res = await axios.post("/api/send-invoice-email", {
        to:            client.clientEmail,
        invoiceLink:   invoice.invoiceLink,
        invoiceid:     invoice.invoiceId,
        slug:          invoice.companySlug,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount:   invoice.totalAmount,
        description:   invoice.Description,
        clientName:    client.clientName,
      });

      if (res.data?.success) {
        toast.success("Invoice sent successfully!");
        setInvoice(res.data.invoice);
        setConfirmOpen(false);
      } else {
        toast.error(res.data?.message || "Failed to send invoice");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Hero header ── */}
      <Card>
        <div className="flex items-center justify-between gap-6 px-7 py-6">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
              <Receipt size={22} className="text-white" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                Invoice #{invoice.invoiceNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  <CalendarDays size={11} className="text-slate-400" /> {invoice.invoiceDate}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-semibold">
                  <Building2 size={11} /> {invoice.companyName}
                </span>
                {invoice.assignedEmployeeName && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full font-semibold">
                    <UserCheck size={11} /> {invoice.assignedEmployeeName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right space-y-2">
            <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${statusStyle(invoice.status)}`}>
              {invoice.status}
            </span>
            <p className="text-2xl font-extrabold text-slate-900">
              ${Number(invoice.totalAmount || invoice.invoiceAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Hash,         label: "Invoice No.",  value: invoice.invoiceNumber,  color: "indigo"  },
          { icon: DollarSign,   label: "Total Amount", value: `$${Number(invoice.totalAmount || 0).toLocaleString()}`, color: "emerald" },
          { icon: CalendarDays, label: "Date",         value: invoice.invoiceDate,    color: "blue"    },
        ].map(({ icon: Icon, label, value, color }) => {
          const bg   = { blue: "bg-blue-50",    indigo: "bg-indigo-50",    emerald: "bg-emerald-50"    };
          const text = { blue: "text-blue-600", indigo: "text-indigo-600", emerald: "text-emerald-600" };
          const ring = { blue: "border-blue-100", indigo: "border-indigo-100", emerald: "border-emerald-100" };
          return (
            <Card key={label} className={`border ${ring[color]}`}>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg[color]}`}>
                  <Icon size={16} className={text[color]} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Bill To + Invoice Details ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Bill To" icon={Mail} color="blue" />
          <div className="px-5 py-1">
            <InfoLine label="Name"    value={client.clientName} />
            <InfoLine label="Email"   value={client.clientEmail} />
            <InfoLine label="Phone"   value={client.clientPhone} />
            <InfoLine label="Address" value={client.clientAddress} />
            <InfoLine label="Website" value={client.clientWebsite} link />
          </div>
        </Card>

        <Card>
          <CardHeader title="Invoice Details" icon={FileText} color="indigo" />
          <div className="px-5 py-1">
            <InfoLine label="Invoice No." value={invoice.invoiceNumber} mono />
            <InfoLine label="Company"     value={invoice.companyName} />
            <InfoLine label="Description" value={invoice.Description} />
            <InfoLine label="Amount"      value={`$${Number(invoice.totalAmount || 0).toLocaleString()}`} />
            <InfoLine label="Status"      value={invoice.status} />
            {invoice.assignedEmployeeName && (
              <InfoLine label="Assigned To" value={invoice.assignedEmployeeName} />
            )}
          </div>
        </Card>
      </div>

      {/* ── Package & Project details ── */}
      {(client.packageDetails || client.projectsDetails) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.projectsDetails && (
            <Card>
              <CardHeader title="Project Details" icon={FolderOpen} color="blue" />
              <div className="px-7 py-5">
                <div className="rich-content text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: client.projectsDetails }} />
              </div>
            </Card>
          )}
          {client.packageDetails && (
            <Card>
              <CardHeader title="Package Details" icon={Package} color="emerald" />
              <div className="px-7 py-5">
                <div className="rich-content text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: client.packageDetails }} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      {invoice.status === "Draft" && (
        <Card>
          <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center flex-1 min-w-0 h-9 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <span className="px-3 text-xs text-slate-400 font-mono truncate flex-1 min-w-0">
                {invoice.invoiceLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="h-full px-3 flex items-center gap-1.5 text-xs font-semibold border-l border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors shrink-0"
              >
                {copied
                  ? <><Check size={13} className="text-emerald-500" /> Copied</>
                  : <><Copy size={13} /> Copy Link</>}
              </button>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200 shrink-0"
            >
              <Send size={14} /> Send Invoice
            </button>
          </div>
        </Card>
      )}

      {/* ID strip */}
      <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
        <Hash size={11} />
        <span className="font-mono">{invoice.invoiceId}</span>
      </div>

      <SendConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSend}
        invoice={invoice}
        client={client}
        sending={sending}
      />
    </div>
  );
};

export default Invoicedetails;
