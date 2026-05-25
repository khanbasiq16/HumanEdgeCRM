"use client";

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDispatch } from "react-redux";
import { createdepartment } from "@/features/Slice/DepartmentSlice";
import { Layers, Plus, Loader2, Clock, Timer, FileText } from "lucide-react";

/* ── Field wrapper ──────────────────────────────────────── */
const Field = ({ label, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

const Section = ({ title }) => (
  <div className="pb-2 border-b border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
  </div>
);

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

/* ── Custom Time Picker ──────────────────────────────────── */
const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const MERIDS  = ["AM", "PM"];

const TimePicker = ({ value, onChange }) => {
  const [h, m, mer] = value ? value.split(/[: ]/) : ["", "", "AM"];

  const update = (part, val) => {
    const nh  = part === "h"   ? val  : (h   || "12");
    const nm  = part === "m"   ? val  : (m   || "00");
    const nmer = part === "mer" ? val : (mer || "AM");
    onChange(`${nh}:${nm} ${nmer}`);
  };

  const selectCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 w-full";

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
      {/* Hour */}
      <Select value={h || ""} onValueChange={(v) => update("h", v)}>
        <SelectTrigger className="h-8 flex-1 text-sm bg-white border-0 shadow-none focus:ring-0 px-2 font-semibold text-slate-700">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS.map((hr) => (
            <SelectItem key={hr} value={hr} className="text-sm">{hr}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-slate-400 font-bold text-sm shrink-0">:</span>

      {/* Minute */}
      <Select value={m || ""} onValueChange={(v) => update("m", v)}>
        <SelectTrigger className="h-8 flex-1 text-sm bg-white border-0 shadow-none focus:ring-0 px-2 font-semibold text-slate-700">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((mn) => (
            <SelectItem key={mn} value={mn} className="text-sm">{mn}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM / PM */}
      <Select value={mer || "AM"} onValueChange={(v) => update("mer", v)}>
        <SelectTrigger className="h-8 w-16 shrink-0 text-sm bg-blue-600 text-white border-0 shadow-none focus:ring-0 px-2 font-bold rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MERIDS.map((md) => (
            <SelectItem key={md} value={md} className="text-sm font-semibold">{md}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/* ── Main dialog ─────────────────────────────────────────── */
const DepartmentDialog = ({ open, setOpen }) => {
  const [loading, setLoading]       = useState(false);
  const [checkIn, setCheckIn]       = useState("");
  const [checkOut, setCheckOut]     = useState("");
  const dispatch = useDispatch();

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target);

      if (!formData.get("departmentName") || !checkIn || !checkOut) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      const departmentName = formData.get("departmentName")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      const payload = {
        departmentName,
        description:  formData.get("description"),
        checkInTime:  checkIn,
        checkOutTime: checkOut,
        graceTime:    formData.get("graceTime"),
      };

      const res = await axios.post("/api/create-department", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Department created successfully");
        dispatch(createdepartment(res.data.departments));
        e.target.reset();
        setCheckIn("");
        setCheckOut("");
        setOpen(false);
      } else {
        toast.error(res.data.error || "Failed to create department");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Create Department
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Layers size={15} className="text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-none">
                Create Department
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Define shift timings and department details</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formHandler} className="flex flex-col flex-1 min-h-0">

          {/* ── Scrollable content ── */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <Section title="Department Info" />

            <Field label="Department Name" required icon={Layers}>
              <Input
                id="departmentName"
                name="departmentName"
                placeholder="e.g. Engineering, Sales"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Description" icon={FileText}>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional description about this department…"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </Field>

            <Section title="Shift Timings" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Check In Time" required icon={Clock}>
                <TimePicker value={checkIn} onChange={setCheckIn} />
              </Field>

              <Field label="Check Out Time" required icon={Clock}>
                <TimePicker value={checkOut} onChange={setCheckOut} />
              </Field>
            </div>

            <Field label="Grace Time (minutes)" required icon={Timer}>
              <Input
                type="number"
                id="graceTime"
                name="graceTime"
                placeholder="e.g. 15"
                min={0}
                className={inputCls}
              />
            </Field>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Creating…</>
              ) : (
                <><Plus size={14} /> Create</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentDialog;
