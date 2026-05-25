"use client";
import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Banknote, ArrowRight, CreditCard, Building2, Hash } from "lucide-react";
import BankDialog from "../dialog/BankDialog";

/* ── Skeleton card ─────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-6 bg-slate-100 rounded-full w-24" />
      <div className="h-8 bg-slate-100 rounded-lg w-28" />
    </div>
  </div>
);

/* ── Info row ───────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon size={13} className="text-slate-400 shrink-0" />
    <span className="text-slate-400 text-[11px] font-medium w-20 shrink-0">{label}</span>
    <span className="text-slate-600 font-medium truncate">{value || "—"}</span>
  </div>
);

/* ── Bank card ──────────────────────────────────────────── */
const BankCard = ({ bank, onClick }) => {
  const balance  = parseFloat(bank.balance || 0).toLocaleString();
  const symbol   = bank.currency?.symbol || "";

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:shadow-[0_4px_20px_0_rgba(59,130,246,0.08)] transition-all duration-200 flex flex-col cursor-pointer overflow-hidden"
    >
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Banknote size={20} className="text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
              {bank.banktitle || "Untitled Bank"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {bank.accountHolderName || "—"}
            </p>
          </div>
        </div>

        {/* Balance highlight */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">Balance</p>
          <p className="text-lg font-extrabold text-emerald-700 tabular-nums">
            {symbol} {balance}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <InfoRow icon={CreditCard} label="IBAN"        value={bank.iban} />
          <InfoRow icon={Hash}       label="Branch Code" value={bank.branchCode} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
            <Building2 size={10} />
            {bank.accountType || "Bank"} Account
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
            Details <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ────────────────────────────────────── */
const Listbanks = () => {
  const { banks, loading } = useSelector((state) => state.Banks);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-5">
      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !banks?.length ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Banknote size={28} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">No bank accounts yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first bank account to get started</p>
          </div>
          <BankDialog open={open} setOpen={setOpen} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {banks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              onClick={() => router.push(`/admin/bank/${bank.bankslug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Listbanks;
