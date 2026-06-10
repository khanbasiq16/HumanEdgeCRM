"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useSelector } from "react-redux";

const Timer = () => {
  const { user }                                 = useSelector((s) => s.User);
  const { isRunning, startTime: reduxStartTime } = useSelector((s) => s.Stopwatch);

  const [fsCheckedin,    setFsCheckedin]    = useState(false);
  const [fsCheckedout,   setFsCheckedout]   = useState(false);
  const [fsStartTime,    setFsStartTime]    = useState(null);
  const [fsCheckoutTime, setFsCheckoutTime] = useState(null);
  const [elapsed,        setElapsed]        = useState(0);

  /* ── Firestore listener ── */
  useEffect(() => {
    if (!user?.employeeId) return;
    const unsub = onSnapshot(doc(db, "employees", user.employeeId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFsCheckedin(d.isCheckedin     || false);
        setFsCheckedout(d.isCheckedout   || false);
        setFsStartTime(d.startTime       || null);
        setFsCheckoutTime(d.checkoutTime || null);
      }
    });
    return () => unsub();
  }, [user?.employeeId]);

  const isCheckedout = fsCheckedout || user?.isCheckedout || false;
  const active       = fsCheckedin || isRunning || isCheckedout;
  const startTime    = isCheckedout
    ? (fsCheckoutTime || user?.checkoutTime)
    : (fsStartTime || reduxStartTime);

  /* ── Tick every second ── */
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

  const fmt = (s) => {
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(sc).padStart(2, "0")}s`;
  };

  return <span className="tabular-nums font-semibold">{fmt(elapsed)}</span>;
};

export default Timer;
