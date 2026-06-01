"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import axios from "axios";
import {
  Building2, Globe, MapPin, Phone, Mail, Clock,
  Calendar, Facebook, Instagram, Linkedin, CheckCircle2,
  XCircle, FileText, Users, LayoutTemplate, UserCheck,
  ScrollText, Loader2, ArrowRight, User, Briefcase,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

/* ── Info row ── */
const InfoRow = ({ icon: Icon, label, value, isLink }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline mt-0.5 block truncate">
            {value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value}</p>
        )}
      </div>
    </div>
  );
};

/* ── Nav card ── */
const NavCard = ({ href, icon: Icon, label, count, color }) => {
  const C = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-200",    iconBg: "bg-blue-100 text-blue-600",    text: "text-blue-700"    },
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  iconBg: "bg-violet-100 text-violet-600",  text: "text-violet-700"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-emerald-700" },
  }[color] || {};

  return (
    <Link href={href}
      className={`flex items-center justify-between p-5 rounded-2xl border transition-all hover:shadow-md group ${C.bg} ${C.border}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${C.iconBg}`}>
          <Icon size={18}/>
        </div>
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${C.text}`}>{label}</p>
          <p className="text-2xl font-black text-slate-800 leading-tight">
            {count ?? "—"}
          </p>
        </div>
      </div>
      <ArrowRight size={16} className={`${C.text} group-hover:translate-x-0.5 transition-transform`}/>
    </Link>
  );
};

/* ── Tag list card ── */
const TagCard = ({ icon: Icon, title, items, color }) => {
  const C = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  iconBg: "bg-violet-100 text-violet-600",  text: "text-violet-700",  tag: "bg-violet-100 text-violet-800 border-violet-200"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-emerald-700", tag: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   iconBg: "bg-amber-100 text-amber-600",   text: "text-amber-700",   tag: "bg-amber-100 text-amber-800 border-amber-200"   },
  }[color] || {};

  return (
    <div className={`rounded-2xl border p-5 ${C.bg} ${C.border}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${C.iconBg}`}>
          <Icon size={14}/>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wider flex-1 ${C.text}`}>{title}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border bg-white ${C.text} ${C.border}`}>
          {items?.length ?? 0}
        </span>
      </div>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${C.tag}`}>
              {title.includes("Employee") ? <User size={10}/> : <Briefcase size={10}/>}
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-3">No data yet</p>
      )}
    </div>
  );
};

/* ── Skeleton ── */
const Skeleton = () => (
  <Employeelayout>
    <div className="space-y-5 w-full animate-pulse">
      <div className="bg-white rounded-2xl border border-slate-200 h-28"/>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_,i) => <div key={i} className="h-24 rounded-2xl bg-slate-100"/>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(2)].map((_,i) => <div key={i} className="h-48 rounded-2xl bg-white border border-slate-200"/>)}
      </div>
    </div>
  </Employeelayout>
);

/* ── Page ── */
const Page = () => {
  const { id, slug } = useParams();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    axios.get(`/api/get-company/${id}`)
      .then(res => setCompany(res.data.company))
      .catch(() => {});
  }, [id]);

  if (!company) return <Skeleton/>;

  const isActive  = company.status?.toLowerCase() === "active";
  const initials  = (company.name || "CO").slice(0, 2).toUpperCase();
  const logoSrc   = company.companyLogo || company.companylogo;
  const createdAt = company.createdAt
    ? new Date(company.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const employees  = company.resolvedEmployees  || [];
  const templates  = company.resolvedTemplates  || [];
  const clientCount = company.liveClientCount   ?? 0;

  return (
    <Employeelayout>
      <div className="space-y-5 w-full max-w-5xl">

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex items-center gap-5">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
            {logoSrc
              ? <img src={logoSrc} alt={company.name} className="w-full h-full object-contain p-1"/>
              : <span className="text-2xl font-black text-blue-600">{initials}</span>}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">{company.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                {isActive ? <CheckCircle2 size={11}/> : <XCircle size={11}/>}
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {company.companyemail || company.companyEmail
                ? <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11}/>{company.companyemail || company.companyEmail}</span>
                : null}
              {company.companyPhoneNumber
                ? <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11}/>{company.companyPhoneNumber}</span>
                : null}
              {company.companyAddress
                ? <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11}/>{company.companyAddress}</span>
                : null}
            </div>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard href={`/employee/${slug}/company/${id}/invoices`}  icon={FileText}   label="Invoices"   count={company.assignedInvoices?.length ?? 0} color="blue"/>
          <NavCard href={`/employee/${slug}/company/${id}/clients`}   icon={Users}      label="Clients"    count={clientCount}                           color="violet"/>
          <NavCard href={`/employee/${slug}/company/${id}/contracts`} icon={ScrollText} label="Contracts"  count={company.Createcontracts?.length ?? 0}  color="emerald"/>
        </div>

        {/* ── Details grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Contact Details
            </p>
            <InfoRow icon={Globe}    label="Website"   value={company.companyWebsite}             isLink/>
            <InfoRow icon={Mail}     label="Email"     value={company.companyemail || company.companyEmail}/>
            <InfoRow icon={Phone}    label="Phone"     value={company.companyPhoneNumber}/>
            <InfoRow icon={MapPin}   label="Address"   value={company.companyAddress}/>
            <InfoRow icon={Clock}    label="Timezone"  value={company.timezone}/>
            <InfoRow icon={Calendar} label="Created"   value={createdAt}/>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Social Links
            </p>
            <InfoRow icon={Facebook}  label="Facebook"  value={company.companyFacebook}  isLink/>
            <InfoRow icon={Instagram} label="Instagram" value={company.companyInstagram} isLink/>
            <InfoRow icon={Linkedin}  label="LinkedIn"  value={company.companyLinkedin}  isLink/>
            {!company.companyFacebook && !company.companyInstagram && !company.companyLinkedin && (
              <p className="text-xs text-slate-400 italic text-center py-4">No social links added</p>
            )}
          </div>
        </div>

        {/* ── People & Templates ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TagCard icon={Users}          title="Assigned Employees" items={employees} color="violet"/>
          <TagCard icon={LayoutTemplate} title="Assigned Templates" items={templates} color="emerald"/>
        </div>

      </div>
    </Employeelayout>
  );
};

export default Page;
