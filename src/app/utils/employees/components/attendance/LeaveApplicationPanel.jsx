"use client";
import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CalendarCheck, Loader2, Send, X } from "lucide-react";

const LeaveApplicationPanel = ({ employee, onSubmitted }) => {
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("one-day");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const employeeId = employee?.employeeId || employee?.id;

  const departmentName = useMemo(() => {
    if (!employee?.department) return "";
    if (typeof employee.department === "string") return employee.department;
    return employee.department.departmentName || "";
  }, [employee]);

  const resetForm = () => {
    setLeaveType("one-day");
    setFromDate("");
    setToDate("");
    setReason("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalToDate = leaveType === "one-day" ? fromDate : toDate;

    if (!fromDate || !finalToDate || !reason.trim()) {
      toast.error("Please select leave date and enter a reason");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/leaves", {
        employeeId,
        employeeName: employee?.employeeName || "",
        department: departmentName,
        leaveType,
        fromDate,
        toDate: finalToDate,
        reason,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Leave application submitted");
        resetForm();
        setOpen(false);
        onSubmitted?.();
      } else {
        toast.error(res.data?.message || "Failed to submit leave");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        <CalendarCheck size={15} />
        Apply Leave
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CalendarCheck size={17} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Apply Leave</h2>
                <p className="text-xs text-slate-400">Submit your leave request for admin approval</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4 bg-slate-50/40">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Leave Type</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white border border-slate-200 p-1">
                    {[
                      { id: "one-day", label: "One Day" },
                      { id: "multiple-days", label: "Multiple Days" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setLeaveType(type.id);
                          if (type.id === "one-day") setToDate("");
                          if (type.id === "multiple-days" && fromDate && !toDate) setToDate(fromDate);
                        }}
                        className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                          leaveType === type.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`grid gap-3 ${leaveType === "multiple-days" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      {leaveType === "one-day" ? "Leave Date" : "From Date"}
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        if (!toDate) setToDate(e.target.value);
                      }}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {leaveType === "multiple-days" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">To Date</label>
                      <input
                        type="date"
                        value={toDate}
                        min={fromDate || undefined}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Write your leave reason"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !employeeId}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveApplicationPanel;
