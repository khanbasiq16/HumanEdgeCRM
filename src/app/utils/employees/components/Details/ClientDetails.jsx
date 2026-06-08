"use client";
import React from "react";
import EditClient from "../dialog/EditClient";
import { useSelector } from "react-redux";
import {
  Mail, Phone, MapPin, Package, Building2, Hash,
  FolderOpen, Globe, CalendarDays, UserCheck, ExternalLink,
  Copy, CheckCircle2, Star,
} from "lucide-react";

/* ── Copy chip ── */
const CopyChip = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
    >
      {copied ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

/* ── Section card ── */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, icon: Icon, color = "blue" }) => {
  const colors = {
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={14} />
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
    </div>
  );
};

/* ── Single info row ── */
const InfoLine = ({ label, value, mono = false, link = false, copyable = false }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
    <p className="text-xs text-slate-400 font-medium shrink-0 w-28">{label}</p>
    <div className="flex-1 min-w-0 text-right">
      {link && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
        >
          {value.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
          <ExternalLink size={10} />
        </a>
      ) : (
        <div className="flex items-center justify-end gap-1.5">
          <p className={`text-xs text-slate-800 font-semibold break-all ${mono ? "font-mono text-[11px]" : ""}`}>
            {value || <span className="text-slate-300 font-normal">—</span>}
          </p>
          {copyable && value && <CopyChip text={value} />}
        </div>
      )}
    </div>
  </div>
);

/* ── Main component ── */
const ClientDetails = ({ client, setClient }) => {
  const { user } = useSelector((s) => s.User);

  if (!client) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading client…</div>
  );

  const initials = (client.clientName || "?")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const createdDate = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const isMyClient =
    client.assignedEmployeeId &&
    (client.assignedEmployeeId === user?.employeeId || client.assignedEmployeeId === user?.id);

  return (
    <div className="space-y-5">

      {/* ── Hero header ── */}
      <Card>
        <div className="flex items-center justify-between gap-6 px-7 py-6">
          {/* Left — avatar + info */}
          <div className="flex items-center gap-5 min-w-0">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-extrabold select-none shrink-0 shadow-md shadow-blue-200">
              {initials}
            </div>

            {/* Name + badges */}
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {client.clientName}
                </h1>
                {isMyClient && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> Your Client
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {client.clientEmail && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                    <Mail size={11} className="text-slate-400" /> {client.clientEmail}
                  </span>
                )}
                {client.companyName && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-semibold">
                    <Building2 size={11} /> {client.companyName}
                  </span>
                )}
                {client.assignedEmployeeName && (
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border ${
                    isMyClient
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-violet-700 bg-violet-50 border-violet-100"
                  }`}>
                    <UserCheck size={11} />
                    {client.assignedEmployeeName}
                    {isMyClient && <span className="text-[10px] font-bold">(You)</span>}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — edit button */}
          <div className="shrink-0">
            <EditClient client={client} setClient={setClient} />
          </div>
        </div>
      </Card>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Building2,    label: "Company",     value: client.companyName || "—",                       color: "blue"    },
          { icon: UserCheck,    label: "Assigned To",  value: client.assignedEmployeeName || "Unassigned",     color: isMyClient ? "amber" : "violet" },
          { icon: CalendarDays, label: "Client Since", value: createdDate,                                     color: "emerald" },
        ].map(({ icon: Icon, label, value, color }) => {
          const bg   = { blue: "bg-blue-50",    violet: "bg-violet-50",    emerald: "bg-emerald-50",    amber: "bg-amber-50"    };
          const text = { blue: "text-blue-600", violet: "text-violet-600", emerald: "text-emerald-600", amber: "text-amber-600" };
          const ring = { blue: "border-blue-100", violet: "border-violet-100", emerald: "border-emerald-100", amber: "border-amber-200" };
          return (
            <Card key={label} className={`border ${ring[color]}`}>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg[color]}`}>
                  <Icon size={16} className={text[color]} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
                    {label === "Assigned To" && isMyClient && (
                      <span className="text-[10px] font-bold text-amber-500 shrink-0">(You)</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Contact + Company details ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Contact Information" icon={Phone} color="blue" />
          <div className="px-5 py-1">
            <InfoLine label="Email"   value={client.clientEmail}   copyable />
            <InfoLine label="Phone"   value={client.clientPhone}   copyable />
            <InfoLine label="Address" value={client.clientAddress} />
            <InfoLine label="Website" value={client.clientWebsite} link />
          </div>
        </Card>

        <Card>
          <CardHeader title="Company Information" icon={Building2} color="violet" />
          <div className="px-5 py-1">
            <InfoLine label="Company"    value={client.companyName} />
            <InfoLine label="Company ID" value={client.companyId}   mono copyable />
            <InfoLine label="Client ID"  value={client.id}          mono copyable />
            <InfoLine label="Created"    value={createdDate} />
          </div>
        </Card>
      </div>

      {/* ── Projects & Package ── */}
      {(client.projectsDetails || client.packageDetails) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.projectsDetails && (
            <Card>
              <CardHeader title="Project Details" icon={FolderOpen} color="blue" />
              <div className="px-7 py-5">
                <div
                  className="rich-content text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: client.projectsDetails }}
                />
              </div>
            </Card>
          )}
          {client.packageDetails && (
            <Card>
              <CardHeader title="Package Details" icon={Package} color="emerald" />
              <div className="px-7 py-5">
                <div
                  className="rich-content text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: client.packageDetails }}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Footer ID strip ── */}
      <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
        <Hash size={11} />
        <span className="font-mono">{client.id}</span>
        <CopyChip text={client.id} />
      </div>

    </div>
  );
};

export default ClientDetails;
