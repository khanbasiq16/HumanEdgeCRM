"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useSelector } from "react-redux";

const Timer = () => {
  const { user }                                 = useSelector((s) => s.User);
  const { isRunning, startTime: reduxStartTime } = useSelector((s) => s.Stopwatch);

  const [fsCheckedin, setFsCheckedin] = useState(false);
  const [fsStartTime, setFsStartTime] = useState(null);
  const [elapsed,     setElapsed]     = useState(0);

  /* ── Firestore listener — only updates local state, never touches Redux ── */
  useEffect(() => {
    if (!user?.employeeId) return;
    const unsub = onSnapshot(doc(db, "employees", user.employeeId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFsCheckedin(d.isCheckedin  || false);
        setFsStartTime(d.startTime    || null);
      }
    });
    return () => unsub();
  }, [user?.employeeId]);

  /* ── Use whichever source is available first ─────────────────────────── */
  // Redux is updated instantly on check-in (no network delay).
  // Firestore arrives 1-3 s later and takes over.
  const active    = fsCheckedin || isRunning;
  const startTime = fsStartTime || reduxStartTime;

  /* ── Tick every second ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!active || !startTime) { setElapsed(0); return; }

    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, startTime]);

  const fmt = (s) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => String(v).padStart(2, "0"))
      .join(":");

  return <span className="tabular-nums font-semibold">{fmt(elapsed)}</span>;
};

export default Timer;
