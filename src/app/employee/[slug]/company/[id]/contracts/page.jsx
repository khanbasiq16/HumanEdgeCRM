"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import Contractdialog from "@/app/utils/employees/components/dialog/Contractdialog";
import axios from "axios";
import {
  ScrollText, Loader2, Eye, Edit, Copy, Check,
  CopyCheck, CheckCircle2, Clock, Building2, Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createcontracts } from "@/features/Slice/ContractsSlice";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import toast from "react-hot-toast";

/* ── Status config ───────────────────────────────────────── */
const STATUS = {
  active:  { label: "Active",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  sent:    { label: "Sent",    cls: "bg-blue-50   text-blue-700   border-blue-200",    icon: Clock         },
  signed:  { label: "Signed",  cls: "bg-violet-50 text-violet-700 border-violet-200",  icon: CheckCircle2  },
  draft:   { label: "Draft",   cls: "bg-slate-100 text-slate-600  border-slate-200",   icon: ScrollText    },
};

/* ── Contract card ───────────────────────────────────────── */
const ContractCard = ({ contract, onGenerateUrl, generatingId }) => {
  const router     = useRouter();
  const [copied, setCopied] = useState(false);
  const status     = STATUS[contract.status?.toLowerCase()] || STATUS.draft;
  const StatusIcon = status.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(contract.contractURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatName = (name) =>
    name ? name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
          <ScrollText size={15} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{contract.contractName || "Untitled Contract"}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
              <StatusIcon size={9} /> {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Company row */}
      <div className="px-5 py-3 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-100">
        <Building2 size={12} className="text-slate-300 shrink-0" />
        <span className="truncate font-medium">{formatName(contract.companyid)}</span>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 space-y-2 mt-auto">
        {/* Preview / View */}
        <button
          onClick={() => router.push(
            contract.status !== "signed"
              ? `/view-contract-details/${contract.id}`
              : contract.contractURL
          )}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
        >
          <Eye size={13} />
          {contract.status !== "signed" ? "Preview" : "View Contract"}
        </button>

        {/* Edit */}
        {contract.status !== "signed" && (
          <button
            onClick={() => router.push(`/edit-contract/${contract.id}`)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-colors"
          >
            <Edit size={13} /> Edit
          </button>
        )}

        {/* Generate URL */}
        {!contract.contractURL && (
          <button
            onClick={() => onGenerateUrl(contract.id)}
            disabled={generatingId === contract.id}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors disabled:opacity-60"
          >
            {generatingId === contract.id
              ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
              : <><CopyCheck size={13} /> Generate Contract URL</>}
          </button>
        )}

        {/* Copy link */}
        {contract.contractURL && contract.status !== "signed" && (
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-colors"
          >
            {copied ? <><Check size={13} className="text-emerald-400" /> Copied!</> : <><Copy size={13} /> Copy Link</>}
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Skeleton ────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
    <div className="space-y-2">
      <div className="h-8 bg-slate-100 rounded-xl" />
      <div className="h-8 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────── */
const ContractsPage = () => {
  const { id, slug } = useParams();
  const dispatch     = useDispatch();
  const { contracts }  = useSelector((s) => s.Contracts);
  const [loading, setLoading]         = useState(true);
  const [generatingId, setGeneratingId] = useState(null);

  /* fetch templates so Contractdialog can work */
  useEffect(() => {
    axios.get("/api/templates/get")
      .then(res => { if (res.data.success) dispatch(createtemplate(res.data.templates || [])); })
      .catch(() => {});
  }, []);

  /* fetch contracts */
  useEffect(() => {
    dispatch(createcontracts([]));
    axios.get(`/api/get-contracts/${id}`)
      .then(res => dispatch(createcontracts(res.data?.contracts || [])))
      .catch(() => dispatch(createcontracts([])))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateUrl = async (contractId) => {
    setGeneratingId(contractId);
    try {
      const res = await axios.post(`/api/generate-contracts/${contractId}`, { companyslug: id });
      if (res.data.success) {
        toast.success("Contract URL generated!");
        const refreshed = await axios.get(`/api/get-contracts/${id}`);
        dispatch(createcontracts(refreshed.data?.contracts || []));
      } else toast.error("Failed to generate URL");
    } catch { toast.error("Error generating contract URL"); }
    finally  { setGeneratingId(null); }
  };

  return (
    <Employeelayout>
      <section className="w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Contracts</h1>
            {!loading && (
              <p className="text-sm text-slate-400 mt-0.5">
                {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Contractdialog />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ScrollText size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No contracts yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Create Contract" to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contracts.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                onGenerateUrl={handleGenerateUrl}
                generatingId={generatingId}
              />
            ))}
          </div>
        )}

      </section>
    </Employeelayout>
  );
};

export default ContractsPage;
