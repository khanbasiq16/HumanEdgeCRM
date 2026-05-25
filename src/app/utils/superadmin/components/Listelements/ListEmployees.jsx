"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createemployees } from "@/features/Slice/EmployeeSlice";
import { EmployeeTable } from "../Tables/EmployeeTable";
import Employeedailog from "../dialog/Employeedailog";
import axios from "axios";
import { Users } from "lucide-react";
import toast from "react-hot-toast";

/* ── Stat chip ─────────────────────────────────────────── */
const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

/* ── Skeleton row ──────────────────────────────────────── */
const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0 animate-pulse">
    <div className="w-4 h-4 bg-slate-100 rounded shrink-0" />
    <div className="w-9 h-9 bg-slate-100 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <div className="h-3.5 bg-slate-100 rounded w-32" />
      <div className="h-3 bg-slate-100 rounded w-48" />
    </div>
    <div className="h-3 bg-slate-100 rounded w-24 hidden sm:block" />
    <div className="h-6 bg-slate-100 rounded-full w-16 hidden md:block" />
    <div className="h-7 bg-slate-100 rounded-lg w-20 hidden lg:block" />
    <div className="h-7 bg-slate-100 rounded-lg w-20 hidden lg:block" />
    <div className="w-8 h-8 bg-slate-100 rounded-lg ml-auto shrink-0" />
  </div>
);

/* ── Main component ────────────────────────────────────── */
const ListEmployees = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { employees } = useSelector((state) => state.Employee);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/get-all-employees");
        dispatch(createemployees(res.data?.employees || []));
      } catch {
        toast.error("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [dispatch]);

  const total    = employees.length;
  const active   = employees.filter((e) => e.status?.toLowerCase() === "active").length;
  const inactive = total - active;

  return (
    <div className="space-y-5">

      {/* Stats */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatChip label="Total"    value={total}    colorClass="bg-slate-50 border-slate-200 text-slate-700" />
          <StatChip label="Active"   value={active}   colorClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
          <StatChip label="Inactive" value={inactive} colorClass="bg-red-50 border-red-200 text-red-600" />
        </div>
      )}

      {/* Content area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div>{[...Array(7)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No employees yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first employee to get started</p>
            </div>
            <Employeedailog />
          </div>
        ) : (
          <EmployeeTable employees={employees} />
        )}
      </div>
    </div>
  );
};

export default ListEmployees;
