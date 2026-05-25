"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Home, Calendar, ClipboardCheck, Building,
  Settings, Mail, ClipboardList, X, CornerDownLeft,
} from "lucide-react";

const Highlight = ({ text = "", query = "" }) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-100 text-blue-700 rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

const GroupLabel = ({ children }) => (
  <p className="px-2 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
    {children}
  </p>
);

export default function EmployeeCommandPalette({ open, onClose, employeeSlug, isSales }) {
  const router   = useRouter();
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const PAGES = [
    { label: "Dashboard",        sub: "Overview & summary",            href: `/employee/${employeeSlug}`,                    icon: Home           },
    { label: "Attendance",       sub: "View attendance records",       href: `/employee/${employeeSlug}/attendance`,         icon: Calendar       },
    { label: "Mark Attendance",  sub: "Check in / check out",         href: `/employee/${employeeSlug}/mark-attendance`,    icon: ClipboardCheck },
    { label: "My Tasks",         sub: "View and manage your tasks",    href: `/employee/${employeeSlug}/tasks`,              icon: ClipboardList  },
    { label: "My Letters",       sub: "Letters & documents",           href: `/employee/${employeeSlug}/letters`,            icon: Mail           },
    ...(isSales ? [{ label: "Companies", sub: "Assigned companies", href: `/employee/${employeeSlug}/companies`, icon: Building }] : []),
    { label: "Settings",         sub: "Account preferences",          href: `/employee/${employeeSlug}/settings`,           icon: Settings       },
  ];

  const filteredPages = PAGES.filter(p =>
    !query.trim() ||
    p.label.toLowerCase().includes(query.toLowerCase()) ||
    p.sub.toLowerCase().includes(query.toLowerCase())
  );

  /* reset on open */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Ctrl+K global */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); if (open) onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* keyboard nav */
  const handleKeyDown = (e) => {
    if (e.key === "Escape")    { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filteredPages.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filteredPages[activeIdx]) navigate(filteredPages[activeIdx].href);
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const navigate = (href) => { router.push(href); onClose(); };
  const clearQ   = () => { setQuery(""); inputRef.current?.focus(); };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Palette container */}
      <div className="fixed z-[101] top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-[600px] px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages…"
              className="flex-1 bg-transparent outline-none text-slate-800 text-sm placeholder:text-slate-400 caret-blue-600"
            />
            {query && (
              <button onClick={clearQ} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-mono shrink-0">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[400px] overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filteredPages.length > 0 ? (
              <>
                <GroupLabel>Pages</GroupLabel>
                {filteredPages.map((item, gi) => {
                  const Icon     = item.icon;
                  const isActive = gi === activeIdx;
                  return (
                    <button
                      key={item.href}
                      data-idx={gi}
                      onMouseEnter={() => setActiveIdx(gi)}
                      onClick={() => navigate(item.href)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          <Highlight text={item.label} query={query} />
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          <Highlight text={item.sub} query={query} />
                        </p>
                      </div>
                      {isActive && (
                        <div className="shrink-0 w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                          <CornerDownLeft size={11} className="text-blue-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search size={18} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">No results for <span className="font-semibold text-slate-700">"{query}"</span></p>
                <p className="text-xs text-slate-400 mt-1">Try a different keyword</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">Esc</kbd>
                close
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">HumanEdge</span>
          </div>
        </div>
      </div>
    </>
  );
}
