"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Clock, CalendarDays, User, Building2 } from "lucide-react";
import toast        from "react-hot-toast";
import { startTimer }      from "@/features/Slice/StopwatchSlice";
import { setattendanceid } from "@/features/Slice/CheckInSlice";
import axios               from "axios";
import { resetCheckOut }   from "@/features/Slice/CheckOutSlice";
import SwipeSlider         from "./SwipeSlider";

const Checkin = ({ isCheckedIn, setIsCheckedin, setIsCheckedout }) => {
  const { user } = useSelector((state) => state.User);
  const dispatch = useDispatch();

  const [noteModal,    setNoteModal]    = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmTime,  setConfirmTime]  = useState({ time: "", date: "" });
  const [lateTime,     setLateTime]     = useState({ time: "", date: "" });
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

  const fmt = (d) => {
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

  const resetSlider = () => setSliderKey((k) => k + 1);

  /* ── core API call ────────────────────────────────────── */
  const doCheckin = async (noteText = "") => {
    setLoading(true);
    // const tid = toast.loading("Verifying identity…");
    try {
      const ip  = await getIP();
      const res = await axios.post("/api/check-in", {
        ip,
        employeeId: user?.employeeId,
        note:       noteText,
      });
      if (res.data.success) {
        toast.success("Check-in successful!");
        dispatch(setattendanceid(res.data.attendanceid));
        dispatch(resetCheckOut());
        dispatch(startTimer(res.data.startTime));
        setIsCheckedin(true);
        setIsCheckedout(false);
        setNoteModal(false);
        setConfirmModal(false);
        setNote("");
        return true;
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || "Check-in failed");
      resetSlider();
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ── swipe handler ────────────────────────────────────── */
  const handleSwipe = () => {
    if (isCheckedIn) return;

    const now        = getKarachiTime();
    const checkInStr = user?.department?.checkInTime;
    if (!checkInStr) {
      resetSlider();
      return toast.error("Department check-in time not found!");
    }

    let [tp, mer] = checkInStr.split(" ");
    let [hh, mm]  = tp.split(":").map(Number);
    if (mer?.toLowerCase() === "pm" && hh < 12) hh += 12;
    if (mer?.toLowerCase() === "am" && hh === 12) hh = 0;

    const graceMinutes   = parseInt(user?.department?.graceTime) || 0;
    const office         = new Date(now);
    office.setHours(hh, mm, 0, 0);
    const lateCutoff     = new Date(office.getTime() + graceMinutes * 60_000);

    const isNightShift   = hh >= 12;           // checkInTime is PM (≥ noon 24h)
    const isPastMidnight = now.getHours() < 12; // current time is AM

    // Night shift past midnight (e.g. shift was 9PM, now it's 3AM) → late
    if (isNightShift && isPastMidnight) {
      setLateTime({ time: fmt(now), date: fmtDate(now) });
      resetSlider();
      setNoteModal(true);
      return;
    }

    // Too early — shift hasn't started yet
    if (now < office) {
      resetSlider();
      return toast.error(`Shift starts at ${checkInStr}. Please check in at the right time.`);
    }

    // Late — past grace period
    if (now > lateCutoff) {
      setLateTime({ time: fmt(now), date: fmtDate(now) });
      resetSlider();
      setNoteModal(true);
      return;
    }

    // On time → show confirmation dialog
    resetSlider();
    setConfirmTime({ time: fmt(now), date: fmtDate(now) });
    setConfirmModal(true);
  };

  /* ── render ───────────────────────────────────────────── */
  if (isCheckedIn) {
    return (
      <div className="flex items-center gap-3 py-5 px-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} color="white" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">You're checked in!</p>
          <p className="text-xs text-emerald-600 mt-0.5">Your attendance has been recorded for today.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-center pb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ready to start?</p>
          <p className="text-sm text-slate-500 mt-1">
            Drag the slider all the way to the right to check in
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 h-[68px] bg-slate-100 rounded-2xl border border-slate-200">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold text-slate-500">Processing…</span>
          </div>
        ) : (
          <SwipeSlider
            key={sliderKey}
            onConfirm={handleSwipe}
            disabled={loading}
            label="Slide to Check In →"
            accent="blue"
          />
        )}
      </div>

      {/* ── On-time confirmation dialog ── */}
      <Dialog open={confirmModal} onOpenChange={(open) => {
        if (!open) { setConfirmModal(false); resetSlider(); }
      }}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Confirm Check-In</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 my-1">
            {/* Time */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Clock size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Check-In Time</p>
                <p className="text-sm font-extrabold text-slate-900">{confirmTime.time}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <CalendarDays size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-slate-700">{confirmTime.date}</p>
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

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => { setConfirmModal(false); resetSlider(); }}
              className="rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => doCheckin("")}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-1.5" />Checking in…</>
                : "Confirm Check In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Late check-in dialog ── */}
      <Dialog open={noteModal} onOpenChange={(open) => {
        if (!open) { setNoteModal(false); resetSlider(); }
      }}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Late Check-In Reason</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 my-1">
            {/* Time */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Clock size={15} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Check-In Time</p>
                <p className="text-sm font-extrabold text-slate-900">{lateTime.time}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <CalendarDays size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-slate-700">{lateTime.date}</p>
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

          <p className="text-xs text-amber-600 font-medium mt-1 mb-1">
            You're checking in late. Please provide a reason to proceed.
          </p>
          <Textarea
            placeholder="Write your reason here…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl border-slate-200 focus-visible:ring-blue-500"
            rows={3}
          />
          <DialogFooter className="gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => { setNoteModal(false); resetSlider(); }}
              className="rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => doCheckin(note)}
              disabled={loading || !note.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-1.5" />Submitting…</>
                : "Submit & Check In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Checkin;
