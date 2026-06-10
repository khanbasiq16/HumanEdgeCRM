"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Clock, CalendarDays, User, Building2, Lock, Timer, AlertCircle } from "lucide-react";
import { resetTimer } from "@/features/Slice/StopwatchSlice";
import { resetCheckIn } from "@/features/Slice/CheckInSlice";
import toast from "react-hot-toast";
import axios from "axios";
import { updateCheckOut } from "@/features/Slice/UserSlice";
import SwipeSlider from "./SwipeSlider";

const CheckOut = ({ isCheckedIn, isCheckedout, setIsCheckedout, setIsCheckedin, onCheckoutDone }) => {
  const { user }                             = useSelector((state) => state.User);
  const { startTime: stopwatchStartTime }    = useSelector((state) => state.Stopwatch);
  const dispatch        = useDispatch();

  const [dialogOpen,    setDialogOpen]   = useState(false);
  const [checkoutType,  setCheckoutType] = useState(""); // "early" | "late"
  const [checkoutInfo,  setCheckoutInfo] = useState({ time: "", date: "", checkinTime: "", worked: "", remaining: "" });
  const [note,          setNote]         = useState("");
  const [loading,       setLoading]      = useState(false);
  const [sliderKey,     setSliderKey]    = useState(0);
  const [elapsedSecs,   setElapsedSecs]  = useState(0);

  /* ── live elapsed timer (updates every second) ──────────── */
  useEffect(() => {
    const checkInStart = user?.startTime || stopwatchStartTime;
    if (!checkInStart) return;

    const tick = () => {
      const secs = Math.max(0, Math.floor((Date.now() - new Date(checkInStart).getTime()) / 1000));
      setElapsedSecs(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user?.startTime, stopwatchStartTime]);

  /* ── working hours & grace ───────────────────────────────── */
  const workingHours   = parseFloat(user?.totalWorkingHours) || 9;
  const graceMins      = parseInt(user?.department?.graceTime || 0);
  const requiredSecs   = workingHours * 3600;
  const graceSecs      = graceMins * 60;
  const unlockAtSecs   = requiredSecs - graceSecs;   // earliest allowed checkout
  const canCheckout    = elapsedSecs >= unlockAtSecs;
  const remainingSecs  = Math.max(0, unlockAtSecs - elapsedSecs);

  const fmtRemaining = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  };

  const progressPct = Math.min(100, Math.round((elapsedSecs / requiredSecs) * 100));

  /* ── helpers ──────────────────────────────────────────── */
  const getKarachiTime = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));

  const getIP = async () => {
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      return (await r.json()).ip;
    } catch { return "0.0.0.0"; }
  };

  const fmt12 = (d) => {
    let h = d.getHours();
    const m  = d.getMinutes().toString().padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  };

  const fmtDate = (d) =>
    d.toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    });

  const fmtWorked = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const fmtHM = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h} hr${h > 1 ? "s" : ""} ${m} min`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${m} min`;
  };

  const resetSlider = () => setSliderKey((k) => k + 1);

  /* ── core API call ────────────────────────────────────── */
  const doCheckout = async (noteText = null) => {
    setLoading(true);
    try {
      const ip           = await getIP();
      const checkInStart = user?.startTime || stopwatchStartTime;
      const diffSeconds  = checkInStart
        ? Math.max(0, Math.floor((Date.now() - new Date(checkInStart).getTime()) / 1000))
        : 0;
      const totalWorked  = fmtWorked(diffSeconds);

      const res = await axios.post("/api/check-out", {
        ip,
        employeeId:    user?.employeeId,
        note:          noteText,
        stopwatchTime: totalWorked,
      });

      if (res.data.success) {
        toast.success("Checked out successfully!");
        dispatch(resetCheckIn());
        dispatch(updateCheckOut(new Date().toISOString()));
        dispatch(resetTimer());
        setIsCheckedin(false);
        setIsCheckedout(false);
        setElapsedSecs(0);
        setDialogOpen(false);
        setNote("");
        onCheckoutDone?.();
        return true;
      } else {
        toast.error(res.data.error || res.data.message || "Check-out failed");
        setDialogOpen(false);
        resetSlider();
        return false;
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Check-out failed. Please try again.";
      setDialogOpen(false);
      toast.error(message);
      resetSlider();
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ── swipe handler ────────────────────────────────────── */
  const handleSwipe = async () => {
    if (!isCheckedIn || isCheckedout) return;

    const now         = getKarachiTime();
    const lateAtSecs  = requiredSecs + graceSecs;
    const checkInStart = user?.startTime || stopwatchStartTime;
    const checkinFmt  = checkInStart ? fmt12(new Date(new Date(checkInStart).toLocaleString("en-US", { timeZone: "Asia/Karachi" }))) : "—";

    if (elapsedSecs < unlockAtSecs) {
      setCheckoutType("early");
      setCheckoutInfo({
        time:       fmt12(now),
        date:       fmtDate(now),
        checkinTime: checkinFmt,
        worked:     fmtHM(elapsedSecs),
        remaining:  fmtHM(remainingSecs),
      });
      resetSlider();
      setDialogOpen(true);
      return;
    }

    if (elapsedSecs > lateAtSecs) {
      setCheckoutType("late");
      setCheckoutInfo({
        time:        fmt12(now),
        date:        fmtDate(now),
        checkinTime: checkinFmt,
        worked:      fmtHM(elapsedSecs),
        remaining:   "—",
      });
      resetSlider();
      setDialogOpen(true);
      return;
    }

    await doCheckout(null);
  };

  /* ── render ───────────────────────────────────────────── */
  if (isCheckedout) {
    return (
      <div className="flex items-center gap-3 py-5 px-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} color="white" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">Checked out for today!</p>
          <p className="text-xs text-emerald-600 mt-0.5">Your attendance is complete. See you tomorrow!</p>
        </div>
      </div>
    );
  }

  if (!isCheckedIn) {
    return (
      <div className="flex items-center gap-3 py-5 px-5 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-600">Not checked in yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Please check in first before checking out.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">

        {/* Progress bar + remaining time */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Progress</span>
            </div>
            <span className="text-xs font-bold text-slate-600">{progressPct}%</span>
          </div>

          {/* Bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                canCheckout ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {Math.floor(elapsedSecs / 3600)}h {Math.floor((elapsedSecs % 3600) / 60)}m worked
            </span>
            <span className="text-slate-500 font-medium">{workingHours}h required</span>
          </div>
        </div>

        {/* Info banner — locked or ready */}
        {!canCheckout ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700">Shift in progress</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Full shift ends in <span className="font-extrabold">{fmtRemaining(remainingSecs)}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700">Shift complete</p>
              <p className="text-xs text-emerald-600 mt-0.5">You can now check out</p>
            </div>
          </div>
        )}

        {/* Slider — always visible, early checkout opens dialog */}
        <div className="text-center pb-1">
          <p className={`text-xs font-bold uppercase tracking-widest ${canCheckout ? "text-emerald-600" : "text-slate-400"}`}>
            {canCheckout ? "Ready to check out" : "Early checkout — reason required"}
          </p>
          <p className="text-sm text-slate-500 mt-1">Drag the slider all the way to the right</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 h-[68px] bg-slate-100 rounded-2xl border border-slate-200">
            <Loader2 size={20} className="animate-spin text-orange-500" />
            <span className="text-sm font-semibold text-slate-500">Processing…</span>
          </div>
        ) : (
          <SwipeSlider
            key={sliderKey}
            onConfirm={handleSwipe}
            disabled={loading}
            label="Slide to Check Out →"
            accent="orange"
          />
        )}
      </div>

      {/* Early / late reason dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) { setDialogOpen(false); resetSlider(); }
      }}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl p-4 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-sm font-bold">
              {checkoutType === "late" ? "Late Check-Out" : "Early Check-Out"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">

            {/* Check-in + Checkout time row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock size={13} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Check In</p>
                  <p className="text-xs font-extrabold text-slate-900 truncate">{checkoutInfo.checkinTime}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 p-2.5 rounded-xl border min-w-0 ${checkoutType === "late" ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${checkoutType === "late" ? "bg-amber-100" : "bg-red-100"}`}>
                  <Clock size={13} className={checkoutType === "late" ? "text-amber-600" : "text-red-500"} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Check Out</p>
                  <p className="text-xs font-extrabold text-slate-900 truncate">{checkoutInfo.time}</p>
                </div>
              </div>
            </div>

            {/* Worked + Remaining row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Timer size={13} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Worked</p>
                  <p className="text-xs font-extrabold text-slate-700 truncate">{checkoutInfo.worked}</p>
                </div>
              </div>
              {checkoutType === "early" ? (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={13} className="text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Remaining</p>
                    <p className="text-xs font-extrabold text-red-600 truncate">{checkoutInfo.remaining}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <CalendarDays size={13} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Date</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{checkoutInfo.date}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Date (early only) + Employee */}
            <div className="grid grid-cols-2 gap-2">
              {checkoutType === "early" && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <CalendarDays size={13} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Date</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{checkoutInfo.date}</p>
                  </div>
                </div>
              )}
              <div className={`flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-0 ${checkoutType !== "early" ? "col-span-2" : ""}`}>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <User size={13} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Employee</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{user?.employeeName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.department?.departmentName || "—"}</p>
                </div>
              </div>
            </div>

          </div>

          <p className={`text-xs font-medium mt-3 mb-1.5 ${checkoutType === "late" ? "text-amber-600" : "text-red-500"}`}>
            {checkoutType === "late"
              ? "Checking out later than scheduled. Please provide a reason."
              : `Only ${checkoutInfo.worked} of ${workingHours}h worked. Please provide a reason.`}
          </p>
          <Textarea
            placeholder="Write your reason here…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl border-slate-200 focus-visible:ring-orange-500 text-sm"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetSlider(); }}
              className="rounded-xl flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => doCheckout(note)}
              disabled={loading || !note.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex-1"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-1" />Wait…</>
                : "Check Out"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckOut;
