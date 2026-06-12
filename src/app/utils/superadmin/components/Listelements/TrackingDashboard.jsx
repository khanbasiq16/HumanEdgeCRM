"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Monitor, Users, Clock, RefreshCw, Search, Calendar,
  X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Activity, Wifi, WifiOff, Eye, ImageOff, RotateCcw,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
const relativeTime = (iso) => {
  if (!iso) return "Never";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const pageLabel = (path) => {
  if (!path) return "Dashboard";
  const p = path.split("/").filter(Boolean);
  return p.length <= 1 ? "Dashboard" : p.slice(1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" › ");
};

const initials = (name) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];
const avatarColor = (name) =>
  AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ screenshots, index, onClose }) => {
  const [current, setCurrent]     = useState(index);
  const [zoom, setZoom]           = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [isDragging, setDragging] = useState(false);
  const dragStart                 = useRef(null);
  const imgRef                    = useRef(null);
  const ss = screenshots[current];

  const navigate = (idx) => {
    setCurrent(idx);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const zoomIn  = () => setZoom((z) => Math.min(+(z + 0.25).toFixed(2), 4));
  const zoomOut = () => { setZoom((z) => { const nz = Math.max(+(z - 0.25).toFixed(2), 0.5); if (nz <= 1) setPan({ x: 0, y: 0 }); return nz; }); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape")               onClose();
      if (e.key === "ArrowRight")           navigate(Math.min(current + 1, screenshots.length - 1));
      if (e.key === "ArrowLeft")            navigate(Math.max(current - 1, 0));
      if (e.key === "+" || e.key === "=")   zoomIn();
      if (e.key === "-")                    zoomOut();
      if (e.key === "0")                    resetZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, screenshots.length]);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => {
      const nz = Math.min(Math.max(+(z + delta).toFixed(2), 0.5), 4);
      if (nz <= 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  };

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  const download = () => {
    const a = document.createElement("a");
    a.href = ss.screenshotUrl;
    a.download = `${ss.employeeName}-${ss.date}-${ss.time}.jpg`.replace(/[: ]/g, "-");
    a.target = "_blank";
    a.click();
  };

  if (!ss) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 bg-black/60 border-b border-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(ss.employeeName)} flex items-center justify-center text-white text-xs font-bold`}>
            {initials(ss.employeeName)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{ss.employeeName}</p>
            <p className="text-white/50 text-xs">{ss.date} · {ss.time}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs mr-1">{current + 1} / {screenshots.length}</span>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-1 py-1">
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="w-7 h-7 rounded-md hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
              title="Zoom out (−)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetZoom}
              className="text-white/70 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-white/10 transition-colors min-w-[44px] text-center"
              title="Reset zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= 4}
              className="w-7 h-7 rounded-md hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={download}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={13} />
            Download
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        {/* Prev */}
        <button
          onClick={() => navigate(Math.max(current - 1, 0))}
          disabled={current === 0}
          className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 flex items-center justify-center text-white transition-colors"
          style={{ pointerEvents: zoom > 1 ? "none" : "auto" }}
        >
          <ChevronLeft size={20} />
        </button>

        <img
          ref={imgRef}
          src={ss.screenshotUrl}
          alt="screenshot"
          draggable={false}
          className="rounded-xl object-contain shadow-2xl select-none transition-transform duration-100"
          style={{
            maxHeight: zoom === 1 ? "calc(100vh - 130px)" : "none",
            maxWidth:  zoom === 1 ? "100%" : "none",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
        />

        {/* Zoom hint */}
        {zoom === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-[11px] pointer-events-none select-none">
            Scroll to zoom · Drag when zoomed
          </div>
        )}

        {/* Next */}
        <button
          onClick={() => navigate(Math.min(current + 1, screenshots.length - 1))}
          disabled={current === screenshots.length - 1}
          className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 flex items-center justify-center text-white transition-colors"
          style={{ pointerEvents: zoom > 1 ? "none" : "auto" }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Thumbnails strip */}
      <div className="shrink-0 bg-black/60 border-t border-white/10 px-4 py-2 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
        {screenshots.map((s, i) => (
          <button
            key={s.id}
            onClick={() => navigate(i)}
            className={`shrink-0 w-16 h-10 rounded-md overflow-hidden border-2 transition-all ${i === current ? "border-blue-400 opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}
          >
            <img src={s.screenshotUrl} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  </div>
);

// ── Live Status Tab ───────────────────────────────────────────────────────────
const LiveStatusTab = ({ employees, loading, onRefresh, lastRefresh }) => {
  const online  = employees.filter((e) => e.isOnline);
  const offline = employees.filter((e) => !e.isOnline);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-500">
            Auto-refreshes every 30s
            {lastRefresh && <span className="ml-2 text-slate-400">· Last: {lastRefresh}</span>}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <Wifi size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">No activity recorded yet</p>
          <p className="text-slate-300 text-sm mt-1">Employees will appear here once they log in</p>
        </div>
      ) : (
        <>
          {online.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Online — {online.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {online.map((emp) => (
                  <EmployeeCard key={emp.employeeId} emp={emp} />
                ))}
              </div>
            </div>
          )}
          {offline.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Offline — {offline.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {offline.map((emp) => (
                  <EmployeeCard key={emp.employeeId} emp={emp} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EmployeeCard = ({ emp }) => (
  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-slate-200 transition-all">
    <div className="relative shrink-0">
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(emp.employeeName)} flex items-center justify-center text-white font-bold text-sm`}>
        {initials(emp.employeeName)}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${emp.isOnline ? "bg-green-500" : "bg-slate-300"}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-slate-800 text-sm truncate">{emp.employeeName}</p>
      {emp.isOnline && emp.currentPage && (
        <p className="text-xs text-blue-500 truncate">{pageLabel(emp.currentPage)}</p>
      )}
      <p className="text-[11px] text-slate-400 mt-0.5">{relativeTime(emp.lastSeen)}</p>
    </div>
    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${emp.isOnline ? "bg-green-50 text-green-600 border border-green-200" : "bg-slate-100 text-slate-400"}`}>
      {emp.isOnline ? "Online" : "Offline"}
    </span>
  </div>
);

// ── Screenshots Gallery Tab ───────────────────────────────────────────────────
const GalleryTab = ({ screenshots, loading, filters, setFilters, onRefresh, onOpen }) => {
  const employees = [...new Map(screenshots.map((s) => [s.employeeId, s.employeeName])).entries()];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm min-w-[160px]">
          <Users size={14} className="text-slate-400 shrink-0" />
          <select
            className="outline-none bg-transparent text-slate-700 text-sm flex-1"
            value={filters.employeeId}
            onChange={(e) => setFilters((f) => ({ ...f, employeeId: e.target.value }))}
          >
            <option value="">All Employees</option>
            {employees.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <input
            type="date"
            className="outline-none bg-transparent text-slate-700 text-sm"
            value={filters.rawDate || ""}
            onChange={(e) => {
              const raw = e.target.value;
              const date = raw ? new Date(raw).toLocaleDateString("en-GB") : "";
              setFilters((f) => ({ ...f, date, rawDate: raw }));
            }}
          />
          {filters.date && (
            <button onClick={() => setFilters((f) => ({ ...f, date: "", rawDate: "" }))}>
              <X size={13} className="text-slate-400 hover:text-red-500 transition-colors" />
            </button>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>

        {screenshots.length > 0 && (
          <span className="ml-auto flex items-center text-xs text-slate-400 font-medium self-center">
            {screenshots.length} screenshot{screenshots.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-video bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : screenshots.length === 0 ? (
        <div className="text-center py-20">
          <ImageOff size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">No screenshots found</p>
          <p className="text-slate-300 text-sm mt-1">
            {filters.date || filters.employeeId ? "Try changing your filters" : "Screenshots appear here once employees are monitored"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {screenshots.map((ss, idx) => (
            <div
              key={ss.id}
              className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
              onClick={() => onOpen(idx)}
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={ss.screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <ZoomIn size={14} className="text-slate-700" />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = document.createElement("a");
                        a.href = ss.screenshotUrl;
                        a.download = `${ss.employeeName}-${ss.date}-${ss.time}.jpg`.replace(/[: ]/g, "-");
                        a.target = "_blank";
                        a.click();
                      }}
                    >
                      <Download size={14} className="text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${avatarColor(ss.employeeName)} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>
                    {initials(ss.employeeName)[0]}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{ss.employeeName}</p>
                </div>
                <p className="text-[10px] text-slate-400">{ss.date} · {ss.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Timeline Tab ──────────────────────────────────────────────────────────────
const TimelineTab = ({ screenshots, loading, onOpen }) => {
  // Build a lookup: screenshot id → global index (for lightbox)
  const idToGlobalIdx = Object.fromEntries(screenshots.map((s, i) => [s.id, i]));

  const grouped = screenshots.reduce((acc, ss) => {
    const date = ss.date || "Unknown";
    if (!acc[date]) acc[date] = {};
    const name = ss.employeeName || "Unknown";
    if (!acc[date][name]) acc[date][name] = [];
    acc[date][name].push(ss);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => {
    const parse = (s) => { const [d, m, y] = s.split("/"); return new Date(y, m - 1, d); };
    return parse(b) - parse(a);
  });

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (dates.length === 0) return (
    <div className="text-center py-20">
      <Clock size={40} className="mx-auto text-slate-300 mb-3" />
      <p className="text-slate-400 font-medium">No timeline data yet</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
              {date}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            {Object.entries(grouped[date]).map(([name, shots]) => (
              <div key={name} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initials(name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{shots.length} screenshot{shots.length !== 1 ? "s" : ""} captured</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={11} />
                    {shots[shots.length - 1]?.time} – {shots[0]?.time}
                  </div>
                </div>

                {/* Horizontal scroll thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {[...shots].reverse().map((ss) => (
                    <div
                      key={ss.id}
                      className="shrink-0 group/thumb relative cursor-pointer"
                      onClick={() => onOpen(idToGlobalIdx[ss.id])}
                    >
                      <div className="w-28 h-16 rounded-lg overflow-hidden border border-slate-100 shadow-sm relative">
                        <img src={ss.screenshotUrl} alt="" className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-all flex items-center justify-center">
                          <ZoomIn size={14} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center mt-1">{ss.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const TABS = [
  { id: "online",   label: "Live Status",   icon: Activity },
  { id: "gallery",  label: "Screenshots",   icon: Monitor  },
  { id: "timeline", label: "Timeline",      icon: Clock    },
];

export default function TrackingDashboard() {
  const [activeTab, setActiveTab]       = useState("online");
  const [employees,  setEmployees]      = useState([]);
  const [screenshots, setScreenshots]   = useState([]);
  const [loadingOnline, setLO]          = useState(false);
  const [loadingSS,     setLS]          = useState(false);
  const [lightboxIdx,   setLightboxIdx] = useState(null);
  const [lastRefresh,   setLastRefresh] = useState("");
  const [filters, setFilters]           = useState({ employeeId: "", date: "", rawDate: "" });

  const fetchEmployees = useCallback(async () => {
    setLO(true);
    try {
      const r = await axios.get("/api/tracking/get-online-employees");
      if (r.data.success) {
        setEmployees(r.data.employees);
        setLastRefresh(new Date().toLocaleTimeString());
      }
    } catch {}
    setLO(false);
  }, []);

  const fetchScreenshots = useCallback(async () => {
    setLS(true);
    try {
      const p = new URLSearchParams();
      if (filters.employeeId) p.set("employeeId", filters.employeeId);
      if (filters.date)       p.set("date",       filters.date);
      p.set("pageSize", "150");
      const r = await axios.get(`/api/tracking/get-screenshots?${p}`);
      if (r.data.success) setScreenshots(r.data.screenshots);
    } catch {}
    setLS(false);
  }, [filters.employeeId, filters.date]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchScreenshots(); }, [fetchScreenshots]);

  // Auto-refresh online status every 30s
  useEffect(() => {
    const t = setInterval(fetchEmployees, 30000);
    return () => clearInterval(t);
  }, [fetchEmployees]);

  const online  = employees.filter((e) => e.isOnline).length;
  const today   = new Date().toLocaleDateString("en-GB");
  const todaySS = screenshots.filter((s) => s.date === today).length;

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          screenshots={screenshots}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}    label="Total Employees"    value={employees.length}  color="bg-blue-600" />
        <StatCard icon={Wifi}     label="Online Now"         value={online}            color="bg-green-500" />
        <StatCard icon={Monitor}  label="Screenshots Today"  value={todaySS}           color="bg-violet-500" />
        <StatCard icon={Activity} label="Total Screenshots"  value={screenshots.length} color="bg-amber-500" />
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  active
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === "online" && online > 0 && (
                  <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {online}
                  </span>
                )}
                {tab.id === "gallery" && screenshots.length > 0 && (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {screenshots.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === "online" && (
            <LiveStatusTab
              employees={employees}
              loading={loadingOnline}
              onRefresh={fetchEmployees}
              lastRefresh={lastRefresh}
            />
          )}
          {activeTab === "gallery" && (
            <GalleryTab
              screenshots={screenshots}
              loading={loadingSS}
              filters={filters}
              setFilters={setFilters}
              onRefresh={fetchScreenshots}
              onOpen={setLightboxIdx}
            />
          )}
          {activeTab === "timeline" && (
            <TimelineTab screenshots={screenshots} loading={loadingSS} onOpen={setLightboxIdx} />
          )}
        </div>
      </div>
    </>
  );
}
