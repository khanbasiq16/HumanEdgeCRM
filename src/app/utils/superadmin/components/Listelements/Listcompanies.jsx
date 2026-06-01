"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import {
  Building2, MapPin, Phone, Eye, Loader2,
  Globe, CheckCircle2, XCircle, Search, SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createcompany } from "@/features/Slice/CompanySlice";
import Companydailog from "../dialog/Companydailog";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

/* ── avatar colour cycle ────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

/* ── Skeleton card ──────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
    <div className="flex gap-2 pt-1">
      <div className="h-8 bg-slate-100 rounded-lg flex-1" />
      <div className="h-8 bg-slate-100 rounded-lg flex-1" />
    </div>
  </div>
);

/* ── Stat chip ──────────────────────────────────────────── */
const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const Listcompanies = () => {
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [statusLoading, setStatusLoading] = useState({});

  const router   = useRouter();
  const dispatch = useDispatch();
  const { companies } = useSelector((s) => s.Company);

  /* fetch */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/get-all-companies");
        dispatch(createcompany(res.data?.companies || []));
      } catch {
        toast.error("Failed to load companies");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  /* toggle status */
  const handleToggleStatus = async (companyId, currentStatus) => {
    setStatusLoading((p) => ({ ...p, [companyId]: true }));
    try {
      const newStatus = currentStatus?.toLowerCase() === "active" ? "deactive" : "active";
      const res = await axios.put(`/api/update-company-status/${companyId}`, { status: newStatus });
      dispatch(createcompany(res.data?.companies || []));
      toast.success(`Company ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading((p) => ({ ...p, [companyId]: false }));
    }
  };

  /* filtered list */
  const filtered = useMemo(() =>
    companies.filter((c) => {
      const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status?.toLowerCase() === filterStatus;
      return matchSearch && matchStatus;
    }),
  [companies, search, filterStatus]);

  /* stats */
  const total    = companies.length;
  const active   = companies.filter((c) => c.status?.toLowerCase() === "active").length;
  const inactive = total - active;

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Stats row ─────────────────────────────────────── */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatChip label="Total"    value={total}    colorClass="bg-slate-50 border-slate-200 text-slate-700" />
          <StatChip label="Active"   value={active}   colorClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
          <StatChip label="Inactive" value={inactive} colorClass="bg-red-50 border-red-200 text-red-600" />
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
        {/* search */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
          />
        </div>

        {/* filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-full sm:w-40 text-sm bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* count badge */}
        {!loading && (
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>

      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">
              {search || filterStatus !== "all" ? "No companies match your filters" : "No companies yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search || filterStatus !== "all" ? "Try adjusting your search or filter" : "Create your first company to get started"}
            </p>
          </div>
          {!search && filterStatus === "all" && <Companydailog />}
        </div>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((company, idx) => {
            const isActive  = company.status?.toLowerCase() === "active";
            const initials  = company.name?.slice(0, 2).toUpperCase() || "CO";
            const avatarCls = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const isToggling = statusLoading[company.id];

            return (
              <div
                key={company.id || idx}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:shadow-[0_4px_20px_0_rgba(59,130,246,0.08)] transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Card top */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    {/* Logo / initials */}
                    {(company.companylogo || company.companyLogo) ? (
                      <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 shrink-0 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={company.companylogo || company.companyLogo}
                          alt={company.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${avatarCls}`}>
                        {initials}
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`
                      inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border shrink-0
                      ${isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"}
                    `}>
                      {isActive
                        ? <CheckCircle2 size={10} className="text-emerald-500" />
                        : <XCircle size={10} className="text-slate-400" />}
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Company name */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">
                      {company.name}
                    </h3>
                    {company.companyWebsite && (
                      <p className="text-[11px] text-blue-500 mt-0.5 truncate flex items-center gap-1">
                        <Globe size={10} />
                        {company.companyWebsite.replace(/^https?:\/\//, "")}
                      </p>
                    )}
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {company.companyAddress?.replace(/\n/g, ", ") || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{company.companyPhoneNumber || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Card footer — action buttons */}
                <div className="border-t border-slate-100 p-3 flex gap-2">
                  {/* View Details */}
                  <button
                    onClick={() => router.push(`/admin/company/${company.companyslug}`)}
                    disabled={!isActive}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
                      ${isActive
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600"
                        : "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"}
                    `}
                  >
                    <Eye size={13} />
                    View
                  </button>

                  {/* Toggle status */}
                  <button
                    onClick={() => handleToggleStatus(company.id, company.status)}
                    disabled={isToggling}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold
                      border transition-all
                      ${isActive
                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"}
                      ${isToggling ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                  >
                    {isToggling ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isActive ? (
                      <XCircle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    {isToggling ? "…" : isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Listcompanies;
