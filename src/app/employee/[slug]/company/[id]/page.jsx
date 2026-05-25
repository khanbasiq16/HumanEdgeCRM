"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import axios from "axios";
import {
  Building2, Globe, MapPin, Phone, Mail, Clock, Hash,
  Calendar, Facebook, Instagram, Linkedin, CheckCircle2,
  XCircle, FileText, Users, LayoutTemplate, UserCheck,
  ScrollText, Loader2, ArrowRight,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

/* ── Info row ────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, isLink }) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={13} className="text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      {isLink && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-0.5 block truncate"
        >
          {value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      ) : (
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || "—"}</p>
      )}
    </div>
  </div>
);

/* ── Section wrapper ─────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
      {title}
    </p>
    {children}
  </div>
);

/* ── Quick nav card ──────────────────────────────────────── */
const NavCard = ({ href, icon: Icon, label, count, color }) => {
  const colors = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: "bg-blue-100 text-blue-600",    title: "text-blue-700",    btn: "bg-blue-600 hover:bg-blue-700" },
    violet:  { bg: "bg-violet-50",  border: "border-violet-100",  icon: "bg-violet-100 text-violet-600",  title: "text-violet-700",  btn: "bg-violet-600 hover:bg-violet-700" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "bg-emerald-100 text-emerald-600", title: "text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700" },
  };
  const c = colors[color] || colors.blue;

  return (
    <Link href={href}
      className={`rounded-2xl border p-5 flex items-center justify-between group transition-all hover:shadow-md ${c.bg} ${c.border}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
          <Icon size={15} />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${c.title}`}>{label}</p>
          {count !== undefined && (
            <p className="text-lg font-extrabold text-slate-800 leading-tight">{count}</p>
          )}
        </div>
      </div>
      <ArrowRight size={15} className={`${c.title} group-hover:translate-x-0.5 transition-transform`} />
    </Link>
  );
};

/* ── Array data card ─────────────────────────────────────── */
const ArrayCard = ({ icon: Icon, title, data, color }) => {
  const colors = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: "bg-blue-100 text-blue-600",    title: "text-blue-700"    },
    violet:  { bg: "bg-violet-50",  border: "border-violet-100",  icon: "bg-violet-100 text-violet-600",  title: "text-violet-700"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "bg-emerald-100 text-emerald-600", title: "text-emerald-700" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-100",   icon: "bg-amber-100 text-amber-600",   title: "text-amber-700"   },
    rose:    { bg: "bg-rose-50",    border: "border-rose-100",    icon: "bg-rose-100 text-rose-600",    title: "text-rose-700"    },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.icon}`}>
          <Icon size={13} />
        </div>
        <p className={`text-xs font-bold uppercase tracking-wider ${c.title}`}>{title}</p>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${c.border} ${c.title}`}>
          {data?.length || 0}
        </span>
      </div>
      {data && data.length > 0 ? (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {data.map((item, idx) => (
            <li key={idx} className="bg-white rounded-xl px-3 py-2 text-xs text-slate-700 border border-white/80 font-medium truncate">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400 italic">No data available</p>
      )}
    </div>
  );
};

/* ── Skeleton ────────────────────────────────────────────── */
const Skeleton = () => (
  <Employeelayout>
    <div className="space-y-5 animate-pulse w-full max-w-5xl">
      <div className="bg-white rounded-2xl border border-slate-200/80 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-100 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
            {[...Array(4)].map((__, j) => (
              <div key={j} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-slate-100 rounded w-20" />
                  <div className="h-4 bg-slate-100 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </Employeelayout>
);

/* ── Main page ───────────────────────────────────────────── */
const Page = () => {
  const { id, slug } = useParams();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    axios.get(`/api/get-company/${id}`, { withCredentials: true })
      .then(res => setCompany(res.data.company))
      .catch(err => console.error(err));
  }, [id]);

  if (!company) return <Skeleton />;

  const isActive = company.status?.toLowerCase() === "active";
  const initials = (company.name || "CO").slice(0, 2).toUpperCase();
  const createdAt = company.createdAt
    ? new Date(company.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const logoSrc = company.companyLogo || company.companylogo;

  return (
    <Employeelayout>
      <div className="space-y-5 w-full max-w-5xl">

        {/* ── Hero card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0 flex items-center justify-center p-2">
              {logoSrc ? (
                <img src={logoSrc} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-black text-blue-600">{initials}</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {company.companyId && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Hash size={11} /> {company.companyId}
                  </span>
                )}
                {company.companyslug && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-blue-600 font-semibold">{company.companyslug}</span>
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                ${isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"}`}
              >
                {isActive
                  ? <CheckCircle2 size={11} className="text-emerald-500" />
                  : <XCircle size={11} className="text-slate-400" />}
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Info grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Company Details">
            <div className="space-y-4">
              <InfoRow icon={Globe}    label="Website"     value={company.companyWebsite}     isLink />
              <InfoRow icon={Phone}    label="Phone"       value={company.companyPhoneNumber} />
              <InfoRow icon={Mail}     label="Email"       value={company.companyemail || company.companyEmail} />
              <InfoRow icon={MapPin}   label="Address"     value={company.companyAddress}     />
              <InfoRow icon={Clock}    label="Timezone"    value={company.timezone}           />
              <InfoRow icon={Calendar} label="Created At"  value={createdAt}                  />
            </div>
          </Section>

          <Section title="Social Links">
            <div className="space-y-4">
              <InfoRow icon={Facebook}  label="Facebook"  value={company.companyFacebook}  isLink />
              <InfoRow icon={Instagram} label="Instagram" value={company.companyInstagram} isLink />
              <InfoRow icon={Linkedin}  label="LinkedIn"  value={company.companyLinkedin}  isLink />
            </div>
          </Section>
        </div>

        {/* ── Quick navigation ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard
            href={`/employee/${slug}/company/${id}/invoices`}
            icon={FileText}
            label="Invoices"
            count={company.assignedInvoices?.length ?? "—"}
            color="blue"
          />
          <NavCard
            href={`/employee/${slug}/company/${id}/clients`}
            icon={Users}
            label="Clients"
            count={company.CreateClients?.length ?? "—"}
            color="violet"
          />
          <NavCard
            href={`/employee/${slug}/company/${id}/contracts`}
            icon={ScrollText}
            label="Contracts"
            count={company.Createcontracts?.length ?? "—"}
            color="emerald"
          />
        </div>

        {/* ── Assigned arrays ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ArrayCard icon={Users}         title="Assigned Employees" data={company.AssignEmployee}   color="violet"  />
          <ArrayCard icon={LayoutTemplate} title="Assign Templates"  data={company.ContactTemplates} color="emerald" />
          <ArrayCard icon={UserCheck}     title="Assign Clients"     data={company.CreateClients}    color="amber"   />
        </div>

      </div>
    </Employeelayout>
  );
};

export default Page;
