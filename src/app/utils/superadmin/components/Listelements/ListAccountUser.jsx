"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAccountants } from "@/features/Slice/AccountantSlice";
import { AccountsTable } from "../Tables/AccountsTable";
import AccountDialog from "../dialog/Accountsdialog";
import { Users } from "lucide-react";
import toast from "react-hot-toast";

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0 animate-pulse">
    <div className="w-4 h-4 bg-slate-100 rounded shrink-0" />
    <div className="w-9 h-9 bg-slate-100 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <div className="h-3.5 bg-slate-100 rounded w-36" />
      <div className="h-3 bg-slate-100 rounded w-52" />
    </div>
    <div className="h-3 bg-slate-100 rounded w-24 hidden sm:block" />
    <div className="h-6 bg-slate-100 rounded-full w-16 hidden md:block" />
    <div className="w-8 h-8 bg-slate-100 rounded-lg ml-auto shrink-0" />
  </div>
);

const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

const ListAccountUser = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { accountants } = useSelector((s) => s.Acounts);

  useEffect(() => {
    const fetchaccounts = async () => {
      try {
        const res = await axios.get("/api/acounts/get-all-accounts");
        dispatch(createAccountants(res.data?.accounts || []));
      } catch {
        toast.error("Failed to load accountants");
      } finally {
        setLoading(false);
      }
    };
    fetchaccounts();
  }, [dispatch]);

  const total    = accountants?.length || 0;
  const active   = accountants?.filter((a) => a.status?.toLowerCase() === "active").length || 0;
  const inactive = total - active;

  return (
    <div className="space-y-5">
      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatChip label="Total"    value={total}    colorClass="bg-slate-50 border-slate-200 text-slate-700" />
          <StatChip label="Active"   value={active}   colorClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
          <StatChip label="Inactive" value={inactive} colorClass="bg-red-50 border-red-200 text-red-600" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !accountants?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No accountants yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first accountant to get started</p>
            </div>
            <AccountDialog />
          </div>
        ) : (
          <AccountsTable accountants={accountants} />
        )}
      </div>
    </div>
  );
};

export default ListAccountUser;
