"use client";
import React from "react";
import EditClient from "../dialog/EditClient";
import {
  Mail, Phone, MapPin, Package, Building2, Hash,
  FolderOpen, Globe, CalendarDays,
} from "lucide-react";

const ClientDetails = ({ client, setClient }) => {
  if (!client) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-slate-100">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {client.clientName}
          </h2>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-mono">
            <Hash size={11} />
            {client.id}
          </span>
        </div>
        <EditClient client={client} setClient={setClient} />
      </div>

      {/* ── Info Grid ── */}
      <div className="px-8 py-7 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
        <InfoRow icon={<Mail size={15} />}      label="Email"        value={client.clientEmail} />
        <InfoRow icon={<Building2 size={15} />} label="Company Name" value={client.companyName} />
        <InfoRow icon={<Phone size={15} />}     label="Phone"        value={client.clientPhone} />
        <InfoRow icon={<Hash size={15} />}      label="Company ID"   value={client.companyId} mono />
        <InfoRow icon={<MapPin size={15} />}    label="Address"      value={client.clientAddress} />
        <InfoRow icon={<FolderOpen size={15} />}label="Projects"     value={client.projectsDetails} html />
        <InfoRow icon={<Package size={15} />}   label="Package"      value={client.packageDetails}  html />

        {/* Website — renders as link */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Globe size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Website
            </p>
            {client.clientWebsite ? (
              <a
                href={client.clientWebsite}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium break-all"
              >
                {client.clientWebsite.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
              </a>
            ) : (
              <span className="text-sm text-slate-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-8 py-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
        <CalendarDays size={13} />
        Created{" "}
        {new Date(client.createdAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, mono = false, html = false }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
      <span className="text-blue-600">{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      {html ? (
        <div
          className="text-sm text-slate-700 prose-sm prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4"
          dangerouslySetInnerHTML={{ __html: value || "<span class='text-slate-400'>N/A</span>" }}
        />
      ) : (
        <p className={`text-sm text-slate-700 font-semibold break-all ${mono ? "font-mono" : ""}`}>
          {value || "N/A"}
        </p>
      )}
    </div>
  </div>
);

export default ClientDetails;
