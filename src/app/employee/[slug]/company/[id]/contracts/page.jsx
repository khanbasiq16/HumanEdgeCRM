"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import axios from "axios";
import {
  ScrollText, CheckCircle2, Building2, PenLine,
  FileSignature, Calendar,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/* ── Sales Panel contract card ───────────────────────────── */
const SalesContractCard = ({ contract, slug }) => {
  const router = useRouter();

  const savedAt = contract.updatedAt
    ? new Date(contract.updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : contract.assignedAt
      ? new Date(contract.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  const hasSaved = !!contract.canvasData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-teal-500" />

      <div className="px-5 pt-4 pb-4 border-b border-slate-100 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <FileSignature size={16} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate leading-tight">
            {contract.templateName || "Untitled Contract"}
          </p>
          <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            hasSaved
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          }`}>
            <CheckCircle2 size={9} />
            {hasSaved ? "Saved" : "Not Saved Yet"}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Building2 size={11} className="text-slate-300 shrink-0" />
          <span className="truncate font-medium">{contract.company?.name || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Calendar size={11} className="text-slate-300 shrink-0" />
          <span>{hasSaved ? `Saved: ${savedAt}` : `Assigned: ${savedAt}`}</span>
        </div>
      </div>

      <div className="px-5 pb-5 mt-auto pt-2">
        <button
          onClick={() => router.push(`/employee/${slug}/sales-panel`)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
        >
          <PenLine size={13} /> Open in Sales Panel
        </button>
      </div>
    </div>
  );
};

/* ── Skeleton ────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-1 bg-slate-100" />
    <div className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-2/5" />
      </div>
      <div className="h-9 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────── */
const ContractsPage = () => {
  const { id, slug } = useParams();

  /* Use state.User.user — the correct Redux key (capital U) */
  const { user } = useSelector((state) => state.User);

  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) { setLoading(false); return; }

    setLoading(true);

    /* Step 1: get employee's companies to resolve company name from slug */
    axios.get(`/api/get-employee-companies/${eid}`)
      .then(compRes => {
        const companies = compRes.data?.companies || [];
        /* id from URL = companyslug */
        const matched = companies.find(
          c => c.companyslug === id || c.id === id
        );
        const companyName = (matched?.name || "").toLowerCase();

        /* Step 2: get all employee contracts, filter by company name */
        return axios.get(`/api/letters/employee-contracts?employeeId=${eid}`)
          .then(letRes => {
            const all = letRes.data?.contracts || [];
            if (!companyName) {
              /* fallback: show all if company name not resolved */
              setContracts(all);
            } else {
              setContracts(
                all.filter(c =>
                  (c.company?.name || "").toLowerCase() === companyName
                )
              );
            }
          });
      })
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [user, id]);

  return (
    <Employeelayout>
      <section className="w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Contracts</h1>
            {!loading && (
              <p className="text-sm text-slate-400 mt-0.5">
                {contracts.length} contract{contracts.length !== 1 ? "s" : ""} for this company
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ScrollText size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No contracts yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Contracts assigned to you for this company will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contracts.map(c => (
              <SalesContractCard key={c.id} contract={c} slug={slug} />
            ))}
          </div>
        )}

      </section>
    </Employeelayout>
  );
};

export default ContractsPage;
