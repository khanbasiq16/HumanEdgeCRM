"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Clock, CalendarDays, User, Building2 } from "lucide-react";
import { resetTimer } from "@/features/Slice/StopwatchSlice";
import { resetCheckIn } from "@/features/Slice/CheckInSlice";
import toast from "react-hot-toast";
import axios from "axios";
import { updateCheckOut } from "@/features/Slice/UserSlice";
import SwipeSlider from "./SwipeSlider";

const CheckOut = ({ isCheckedIn, isCheckedout, setIsCheckedout, setIsCheckedin }) => {
  const { user }                             = useSelector((state) => state.User);
  const { startTime: stopwatchStartTime }    = useSelector((state) => state.Stopwatch);
  const dispatch        = useDispatch();

  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [checkoutType, setCheckoutType] = useState(""); // "early" | "late"
  const [checkoutInfo, setCheckoutInfo] = useState({ time: "", date: "" });
  const [note,         setNote]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [sliderKey,    setSliderKey]    = useState(0);

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
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const fmtWorked = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const resetSlider = () => setSliderKey((k) => k + 1);

  /* ── core API call ────────────────────────────────────── */
  const doCheckout = async (noteText = null) => {
    setLoading(true);
    const tid = toast.loading("Processing check-out…");
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
        toast.dismiss(tid);
        toast.success("Checked out successfully!");
        dispatch(resetCheckIn());
        dispatch(updateCheckOut());
        dispatch(resetTimer());
        setIsCheckedin(false);
        setIsCheckedout(true);
        setDialogOpen(false);
        setNote("");
        return true;
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || "Check-out failed");
      resetSlider();
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ── swipe handler ────────────────────────────────────── */
  const handleSwipe = async () => {
    if (!isCheckedIn || isCheckedout) return;

    const now          = getKarachiTime();
    const checkInStart = user?.startTime || stopwatchStartTime;
    const workingHours = parseFloat(user?.totalWorkingHours) || 9;
    const graceMs      = parseInt(user?.department?.graceTime || 0) * 60_000;
    const workingMs    = workingHours * 3600 * 1000;

    if (!checkInStart) {
      // No startTime — let server handle validation
      await doCheckout(null);
      return;
    }

    const elapsedMs = Date.now() - new Date(checkInStart).getTime();

    if (elapsedMs < workingMs - graceMs) {
      setCheckoutType("early");
      setCheckoutInfo({ time: fmt12(now), date: fmtDate(now) });
      resetSlider();
      setDialogOpen(true);
      return;
    }
    if (elapsedMs > workingMs + graceMs) {
      setCheckoutType("late");
      setCheckoutInfo({ time: fmt12(now), date: fmtDate(now) });
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
        <div className="text-center pb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">End your shift?</p>
          <p className="text-sm text-slate-500 mt-1">
            Drag the slider all the way to the right to check out
          </p>
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
        <DialogContent className="sm:max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {checkoutType === "late" ? "Late Check-Out Reason" : "Early Check-Out Reason"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 my-1">
            {/* Time */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${checkoutType === "late" ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${checkoutType === "late" ? "bg-amber-100" : "bg-red-100"}`}>
                <Clock size={15} className={checkoutType === "late" ? "text-amber-600" : "text-red-500"} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Check-Out Time</p>
                <p className="text-sm font-extrabold text-slate-900">{checkoutInfo.time}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <CalendarDays size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-slate-700">{checkoutInfo.date}</p>
              </div>
            </div>

            {/* Employee */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User size={15} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Employee</p>
                <p className="text-sm font-bold text-slate-700 truncate">{user?.employeeName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 size={10} />
                  {user?.department?.departmentName || "—"}
                </p>
              </div>
            </div>
          </div>

          <p className={`text-xs font-medium mt-1 mb-1 ${checkoutType === "late" ? "text-amber-600" : "text-red-500"}`}>
            {checkoutType === "late"
              ? "You're checking out later than scheduled. Please provide a reason to proceed."
              : "You're checking out earlier than scheduled. Please provide a reason to proceed."}
          </p>
          <Textarea
            placeholder="Write your reason here…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl border-slate-200 focus-visible:ring-orange-500"
            rows={3}
          />
          <DialogFooter className="gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetSlider(); }}
              className="rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => doCheckout(note)}
              disabled={loading || !note.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-1.5" />Submitting…</>
                : "Submit & Check Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckOut;
