"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, Check } from "lucide-react";

const THUMB = 52;
const PAD   = 6;

export default function SwipeSlider({
  onConfirm,
  disabled  = false,
  label     = "Slide to confirm",
  accent    = "blue",   // "blue" | "orange"
}) {
  const trackRef            = useRef(null);
  const [pos, setPos]       = useState(0);
  const [dragging, setDrag] = useState(false);
  const [done, setDone]     = useState(false);

  const getMax = useCallback(
    () => (trackRef.current?.offsetWidth ?? 320) - THUMB - PAD * 2,
    []
  );

  const start = useCallback(() => {
    if (disabled || done) return;
    setDrag(true);
  }, [disabled, done]);

  const move = useCallback((clientX) => {
    if (!dragging || done) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const raw    = clientX - rect.left - PAD - THUMB / 2;
    const max    = getMax();
    const clamped = Math.min(Math.max(raw, 0), max);
    setPos(clamped);
    if (clamped >= max * 0.88) {
      setDrag(false);
      setPos(max);
      setDone(true);
      onConfirm();
    }
  }, [dragging, done, getMax, onConfirm]);

  const end = useCallback(() => {
    if (dragging) { setDrag(false); setPos(0); }
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => move(e.clientX);
    const mu = () => end();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup",   mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup",   mu);
    };
  }, [dragging, move, end]);

  const max = getMax();
  const pct = max > 0 ? Math.min((pos / max) * 100, 100) : 0;

  const isBlue    = accent === "blue";
  const fillGrad  = done
    ? "linear-gradient(to right,#10b981,#059669)"
    : isBlue
    ? "linear-gradient(to right,#2563eb,#4f46e5)"
    : "linear-gradient(to right,#f97316,#ef4444)";
  const thumbBg   = done ? "#10b981" : isBlue ? "#2563eb" : "#f97316";
  const thumbGlow = done
    ? "0 4px 18px rgba(16,185,129,.5)"
    : isBlue
    ? "0 4px 18px rgba(37,99,235,.45)"
    : "0 4px 18px rgba(249,115,22,.45)";

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-[68px] rounded-2xl bg-slate-100 border border-slate-200
        overflow-hidden select-none
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
    >
      {/* fill bar */}
      <div
        className="absolute inset-y-0 left-0 rounded-2xl"
        style={{
          width:      `${PAD + THUMB + pos}px`,
          background: fillGrad,
          opacity:    0.14 + (pct / 100) * 0.22,
          transition: dragging ? "none" : "all .4s ease",
        }}
      />

      {/* hint text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: done ? 0 : Math.max(0, 1 - pct / 50) }}
      >
        <span className="text-sm font-semibold text-slate-400 tracking-wide">{label}</span>
      </div>

      {/* confirmed text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0 }}
      >
        <span className="text-sm font-bold text-emerald-600">Confirmed!</span>
      </div>

      {/* thumb */}
      <div
        className="absolute top-[8px] w-[52px] h-[52px] rounded-xl flex items-center justify-center z-10"
        style={{
          left:       `${PAD}px`,
          transform:  `translateX(${pos}px)`,
          background: thumbBg,
          boxShadow:  thumbGlow,
          transition: dragging
            ? "none"
            : "transform .45s cubic-bezier(.25,.46,.45,.94), background .3s ease, box-shadow .3s ease",
        }}
        onMouseDown={start}
        onTouchStart={(e) => { e.preventDefault(); start(); }}
        onTouchMove={(e)  => { e.preventDefault(); move(e.touches[0].clientX); }}
        onTouchEnd={end}
      >
        {done
          ? <Check        size={22} color="white" strokeWidth={2.5} />
          : <ChevronRight size={22} color="white" strokeWidth={2.5} />
        }
      </div>
    </div>
  );
}
