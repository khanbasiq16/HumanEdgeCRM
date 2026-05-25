"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import axios from "axios";
import { Layers, Loader2, Clock, Timer, FileText, Pencil, Save } from "lucide-react";

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
  const parts = value ? value.split(/[: ]/) : ["", "", "AM"];
  const [h, m, mer] = parts;

  const update = (part, val) => {
    const nh   = part === "h"   ? val : (h   || "12");
    const nm   = part === "m"   ? val : (m   || "00");
    const nmer = part === "mer" ? val : (mer || "AM");
    onChange(`${nh}:${nm} ${nmer}`);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
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

/* ── Parse "9:00 AM" → "09:00 AM" for TimePicker ─────────── */
const normalizeTime = (timeStr) => {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  const h   = String(parseInt(match[1])).padStart(2, "0");
  const m   = String(parseInt(match[2])).padStart(2, "0");
  const mer = match[3].toUpperCase();
  return `${h}:${m} ${mer}`;
};

/* ── Main dialog ─────────────────────────────────────────── */
const EditDepartment = ({ open, setOpen, department }) => {
  const [loading, setLoading]   = useState(false);
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [graceTime, setGrace]   = useState("");
  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    if (department) {
      setName(department.departmentName || "");
      setDesc(department.description    || "");
      setGrace(department.graceTime     || "");
      setCheckIn(normalizeTime(department.checkInTime));
      setCheckOut(normalizeTime(department.checkOutTime));
    }
  }, [department]);

  const formHandler = async (e) => {
    e.preventDefault();
    if (!name || !checkIn || !checkOut) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`/api/department/${department.departmentId}`, {
        departmentName: name,
        description:    desc,
        checkInTime:    checkIn,
        checkOutTime:   checkOut,
        graceTime,
      });
      toast.success("Department updated successfully");
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Pencil size={14} className="text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-none">
                Edit Department
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {department?.departmentName || "Update department details"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formHandler} className="flex flex-col flex-1 min-h-0">

          {/* ── Scrollable content ── */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <Section title="Department Info" />

            <Field label="Department Name" required icon={Layers}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Description" icon={FileText}>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
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

            <Field label="Grace Time (minutes)" icon={Timer}>
              <Input
                type="number"
                value={graceTime}
                onChange={(e) => setGrace(e.target.value)}
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
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartment;
