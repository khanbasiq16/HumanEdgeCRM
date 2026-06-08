"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CalendarCheck, CalendarDays, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import LeaveApplicationPanel from "../attendance/LeaveApplicationPanel";

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLeaveDates = (leave) => {
  if (leave.leaveType === "one-day" || leave.fromDate === leave.toDate) {
    return formatDate(leave.fromDate);
  }
  return `${formatDate(leave.fromDate)} - ${formatDate(leave.toDate)}`;
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-xs font-semibold opacity-70 mt-1">{label}</p>
    </div>
  </div>
);

const Listleaves = ({ employee }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const employeeId = employee?.employeeId || employee?.id;

  const fetchLeaves = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/leaves?employeeId=${employeeId}`);
      setLeaves(res.data?.leaves || []);
    } catch {
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === "Pending").length,
    approved: leaves.filter((leave) => leave.status === "Approved").length,
    rejected: leaves.filter((leave) => leave.status === "Rejected").length,
  }), [leaves]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">My Leaves</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your leave applications and admin responses</p>
        </div>
        <LeaveApplicationPanel employee={employee} onSubmitted={fetchLeaves} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={CalendarCheck} color="border-blue-200 bg-blue-50 text-blue-700" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="border-amber-200 bg-amber-50 text-amber-700" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="border-red-200 bg-red-50 text-red-700" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-extrabold text-slate-900">Leave Applications</p>
          <p className="text-xs text-slate-400 mt-0.5">Pending, approved, and rejected requests</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={26} className="animate-spin text-blue-500" />
            <p className="text-sm font-semibold">Loading leave applications...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <CalendarDays size={36} className="text-slate-200" />
            <p className="text-sm font-semibold">No leave applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Admin Response</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatLeaveDates(leave)}
                    </td>
                    <td className="px-4 py-3 min-w-72 text-slate-600">{leave.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[leave.status] || STATUS_STYLE.Pending}`}>
                        {leave.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-72">
                      {leave.status === "Rejected" ? (
                        <p className="text-sm text-red-600 font-medium">{leave.adminNote || "Rejected by admin"}</p>
                      ) : leave.status === "Approved" ? (
                        <p className="text-sm text-emerald-600 font-medium">{leave.adminNote || "Approved by admin"}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Waiting for admin review</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Listleaves;
