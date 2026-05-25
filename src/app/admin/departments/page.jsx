"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { createdepartment } from "@/features/Slice/DepartmentSlice";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import DepartmentDialog from "@/app/utils/superadmin/components/dialog/DepartmentDialog";
import EditDepartment from "@/app/utils/superadmin/components/dialog/EditDepartment";
import {
  Layers, Clock, Timer, Pencil, ArrowRight,
} from "lucide-react";

/* ── Stat chip ─────────────────────────────────────────── */
const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

/* ── Skeleton card ─────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-6 bg-slate-100 rounded-full w-24" />
      <div className="h-8 bg-slate-100 rounded-lg w-20" />
    </div>
  </div>
);

/* ── Accent colors cycling ──────────────────────────────── */
const ACCENTS = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-indigo-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-sky-500 to-blue-400",
];

/* ── Department card ────────────────────────────────────── */
const DeptCard = ({ dept, index, onEdit }) => {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:shadow-[0_4px_20px_0_rgba(59,130,246,0.08)] transition-all duration-200 flex flex-col overflow-hidden">
      {/* Top accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Layers size={18} className="text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
              {dept.departmentName}
            </h3>
            {dept.description ? (
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{dept.description}</p>
            ) : (
              <p className="text-[11px] text-slate-300 mt-0.5 italic">No description</p>
            )}
          </div>
        </div>

        {/* Timings */}
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={12} className="text-emerald-500" />
              <span>Check In</span>
            </div>
            <span className="font-semibold text-slate-700">{dept.checkInTime || "—"}</span>
          </div>
          <div className="border-t border-slate-200" />
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={12} className="text-rose-400" />
              <span>Check Out</span>
            </div>
            <span className="font-semibold text-slate-700">{dept.checkOutTime || "—"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
            <Timer size={10} />
            {dept.graceTime || 0} min grace
          </span>
          <button
            onClick={() => onEdit(dept)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-600 group-hover:text-blue-500 transition-colors"
          >
            <Pencil size={11} />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────── */
const DepartmentsPage = () => {
  const dispatch = useDispatch();
  const { department: departments } = useSelector((s) => s.Department);

  const [loading, setLoading]           = useState(true);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    axios.get("/api/get-all-department")
      .then((res) => dispatch(createdepartment(res.data.departments || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (dept) => {
    setSelectedDept(dept);
    setEditOpen(true);
  };

  const total = departments?.length || 0;

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Departments" />

      <div className="space-y-5">
        {/* Stats */}
        {!loading && total > 0 && (
          <div className="flex flex-wrap gap-3">
            <StatChip
              label="Total"
              value={total}
              colorClass="bg-slate-50 border-slate-200 text-slate-700"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">
              {loading ? "Loading…" : `${total} department${total !== 1 ? "s" : ""}`}
            </span>
          </div>
          <DepartmentDialog open={createOpen} setOpen={setCreateOpen} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !departments?.length ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Layers size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No departments yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first department to get started</p>
            </div>
            <DepartmentDialog open={createOpen} setOpen={setCreateOpen} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {departments.map((dept, i) => (
              <DeptCard key={dept.departmentId} dept={dept} index={i} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog (controlled externally) */}
      <EditDepartment open={editOpen} setOpen={setEditOpen} department={selectedDept} />
    </SuperAdminlayout>
  );
};

export default DepartmentsPage;
