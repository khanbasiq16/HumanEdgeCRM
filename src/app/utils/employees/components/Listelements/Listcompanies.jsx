"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2, MapPin, Phone, Mail, Globe,
  Eye, CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createcompany } from "@/features/Slice/CompanySlice";

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
    <div className="h-9 bg-slate-100 rounded-xl" />
  </div>
);

/* ─── Company Card ──────────────────────────────────────── */
const CompanyCard = ({ company, slug, router }) => {
  const logoSrc    = company.companylogo || company.companyLogo;
  const isActive   = company.status?.toLowerCase() !== "deactive";
  const email      = company.companyEmail || company.companyemail;
  const initial    = (company.name || "C")[0].toUpperCase();

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
          {/* Logo / avatar */}
          <div className="shrink-0">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={company.name}
                className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 p-0.5"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center`}>
                <span className="text-white text-lg font-extrabold">{initial}</span>
              </div>
            )}
          </div>

          {/* Name + status */}
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

      {/* Action */}
      <div className="px-5 pb-5 pt-1">
        <button
          onClick={() => isActive && router.push(`/employee/${slug}/company/${company.companyslug}`)}
          disabled={!isActive}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
            ${isActive
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          <Eye size={13} />
          View Details
          {isActive && <ArrowRight size={12} className="ml-auto" />}
        </button>
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

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`/api/get-employee-companies/${user.employeeId}`);
        dispatch(createcompany(res.data?.companies || []));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

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
            <CompanyCard key={i} company={company} slug={slug} router={router} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Listcompanies;
