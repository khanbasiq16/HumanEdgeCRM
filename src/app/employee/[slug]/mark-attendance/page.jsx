"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useEffect, useState } from "react";
import Checkin  from "@/app/utils/employees/components/attendance/Checkin";
import CheckOut from "@/app/utils/employees/components/attendance/CheckOut";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Clock, Timer, Clock3, CheckCheck, CalendarDays,
  Building2, User,
} from "lucide-react";

/* ── live karachi clock ──────────────────────────────────── */
const useKarachiClock = () => {
  const [now, setNow] = useState(() =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const fmtClock = (d) => {
  let h = d.getHours();
  const m  = d.getMinutes().toString().padStart(2, "0");
  const s  = d.getSeconds().toString().padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { time: `${h}:${m}:${s}`, ampm: ap };
};

const fmtDate = (d) =>
  d.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

/* ── status step indicator ───────────────────────────────── */
const STEPS = ["Check In", "Working", "Check Out"];

const StepBar = ({ step }) => (
  <div className="flex items-center justify-center gap-0 mt-6">
    {STEPS.map((lbl, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-xs font-extrabold border-2 transition-all duration-300
            ${step > i
              ? "bg-emerald-500 border-emerald-500 text-white"
              : step === i
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-slate-200 text-slate-400"}
          `}>
            {step > i ? "✓" : i + 1}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider
            ${step >= i ? "text-slate-700" : "text-slate-400"}`}>
            {lbl}
          </span>
        </div>
        {i < 2 && (
          <div className={`w-14 h-0.5 mb-5 mx-1 rounded transition-all duration-500
            ${step > i ? "bg-emerald-400" : "bg-slate-200"}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ── page ────────────────────────────────────────────────── */
const Page = () => {
  const [isCheckedIn,   setIsCheckedin]  = useState(false);
  const [isCheckedout,  setIsCheckedout] = useState(false);
  const [loading,       setLoading]      = useState(true);

  const { slug } = useParams();
  const { user } = useSelector((s) => s.User);
  const now      = useKarachiClock();

  /* ── fetch today's status ─────────────────────────────── */
  useEffect(() => {
    if (!user?.employeeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/attendance/get-attendance-status/${user.employeeId}`
        );
        setIsCheckedin(res.data.employee.isCheckedin);
        setIsCheckedout(res.data.employee.isCheckedout);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to fetch status");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.employeeId]);

  const step    = isCheckedout ? 3 : isCheckedIn ? 1 : 0;
  const allDone = isCheckedout;
  const { time, ampm } = fmtClock(now);

  return (
    <Employeelayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Page header ──────────────────────────────── */}
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Mark Attendance</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">
            {slug?.replace(/-/g, " ")} · {fmtDate(now)}
          </p>
        </div>

        {/* ── Clock + status ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-6 pt-6 pb-7">

          {/* Clock */}
          <div className="text-center">
            <div className="flex items-end justify-center gap-1.5">
              <span className="text-5xl font-extrabold text-slate-900 tabular-nums tracking-tight leading-none">
                {time}
              </span>
              <span className="text-xl font-bold text-slate-400 mb-1">{ampm}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1.5">{fmtDate(now)}</p>
          </div>

          {/* Step bar */}
          <StepBar step={step} />
        </div>

        {/* ── Employee info strip ───────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <User size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {user?.employeeName || "Employee"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Building2 size={11} className="text-slate-400 shrink-0" />
              <p className="text-xs text-slate-400 truncate">
                {user?.department?.departmentName || "—"}
              </p>
            </div>
          </div>
          <div className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shrink-0
            ${isCheckedIn && !isCheckedout
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : allDone
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-500 border-slate-200"}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full
              ${isCheckedIn && !isCheckedout ? "bg-blue-500 animate-pulse" : allDone ? "bg-emerald-500" : "bg-slate-400"}
            `} />
            {allDone ? "Done" : isCheckedIn ? "Working" : "Not Started"}
          </div>
        </div>

        {/* ── Action card ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">

          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading attendance status…</p>
            </div>

          ) : allDone ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCheck size={30} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">All Done for Today!</p>
                <p className="text-sm text-slate-400 mt-1">
                  You've completed your attendance. See you tomorrow!
                </p>
              </div>
            </div>

          ) : !isCheckedIn ? (
            <Checkin
              isCheckedIn={isCheckedIn}
              setIsCheckedin={setIsCheckedin}
              setIsCheckedout={setIsCheckedout}
            />
          ) : (
            <CheckOut
              isCheckedIn={isCheckedIn}
              isCheckedout={isCheckedout}
              setIsCheckedout={setIsCheckedout}
              setIsCheckedin={setIsCheckedin}
            />
          )}
        </div>

        {/* ── Schedule chips ────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Check In",
              value: user?.department?.checkInTime  || "—",
              icon:  Clock,
              cls:   "bg-blue-50 border-blue-100 text-blue-600",
            },
            {
              label: "Work Hrs",
              value: user?.totalWorkingHours ? `${user.totalWorkingHours} hrs` : "—",
              icon:  Timer,
              cls:   "bg-indigo-50 border-indigo-100 text-indigo-600",
            },
            {
              label: "Grace",
              value: user?.department?.graceTime
                ? `${user.department.graceTime} min`
                : "—",
              icon:  Clock3,
              cls:   "bg-emerald-50 border-emerald-100 text-emerald-600",
            },
          ].map(({ label, value, icon: Icon, cls }, i) => (
            <div key={i} className={`rounded-xl p-3.5 border ${cls.split(" ").slice(0, 2).join(" ")}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className={cls.split(" ")[2]} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              </div>
              <p className={`text-base font-extrabold tabular-nums ${cls.split(" ")[2]}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

      </div>
    </Employeelayout>
  );
};

export default Page;
