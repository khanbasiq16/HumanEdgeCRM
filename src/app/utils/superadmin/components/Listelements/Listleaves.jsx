"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

const Listleaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [notes, setNotes] = useState({});

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/leaves");
      setLeaves(res.data?.leaves || []);
    } catch {
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === "Pending").length,
    approved: leaves.filter((leave) => leave.status === "Approved").length,
    rejected: leaves.filter((leave) => leave.status === "Rejected").length,
  }), [leaves]);

  const filteredLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((leave) => {
      const matchesStatus = statusFilter === "All" || leave.status === statusFilter;
      const matchesSearch = !q ||
        (leave.employeeName || "").toLowerCase().includes(q) ||
        (leave.employeeId || "").toLowerCase().includes(q) ||
        (leave.reason || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [leaves, search, statusFilter]);

  const updateLeaveStatus = async (leave, status) => {
    if (status === "Rejected" && !notes[leave.id]?.trim()) {
      toast.error("Please enter reject reason");
      return;
    }

    setUpdatingId(leave.id);
    try {
      const res = await axios.patch(`/api/leaves/${leave.id}`, {
        status,
        adminNote: notes[leave.id]?.trim() || "",
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Leave updated");
        fetchLeaves();
      } else {
        toast.error(res.data?.message || "Failed to update leave");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update leave");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.total} icon={CalendarCheck} color="border-blue-200 bg-blue-50 text-blue-700" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="border-amber-200 bg-amber-50 text-amber-700" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="border-red-200 bg-red-50 text-red-700" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Leave Applications</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review employee leave requests</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or reason"
                className="pl-8 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={26} className="animate-spin text-blue-500" />
            <p className="text-sm font-semibold">Loading leave applications...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <CalendarCheck size={36} className="text-slate-200" />
            <p className="text-sm font-semibold">No leave applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Admin Note</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const isUpdating = updatingId === leave.id;
                  const isFinal = leave.status === "Approved" || leave.status === "Rejected";

                  return (
                    <tr key={leave.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{leave.employeeName || "-"}</p>
                        <p className="text-xs text-slate-400">{leave.employeeId}</p>
                        {leave.department && <p className="text-xs text-slate-400">{leave.department}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-semibold whitespace-nowrap">
                        {formatLeaveDates(leave)}
                      </td>
                      <td className="px-4 py-3 min-w-64">
                        <p className="text-sm text-slate-600">{leave.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[leave.status] || STATUS_STYLE.Pending}`}>
                          {leave.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-56">
                        {isFinal ? (
                          <p className="text-xs text-slate-500">{leave.adminNote || "-"}</p>
                        ) : (
                          <input
                            value={notes[leave.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                            placeholder={leave.status === "Pending" ? "Reject reason / admin note" : "Admin note"}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isUpdating || isFinal}
                            onClick={() => updateLeaveStatus(leave, "Approved")}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Approve
                          </button>
                          <button
                            disabled={isUpdating || isFinal}
                            onClick={() => updateLeaveStatus(leave, "Rejected")}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Listleaves;
