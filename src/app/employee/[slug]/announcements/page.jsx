"use client";
import React, { useEffect, useState } from "react";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Megaphone, Loader2, Calendar, User, X, ChevronRight,
} from "lucide-react";

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate
    ? ts.toDate()
    : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDateShort = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate
    ? ts.toDate()
    : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ── Detail Dialog ── */
const AnnouncementDialog = ({ ann, onClose }) => {
  if (!ann) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "88vh" }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
              <Megaphone size={20} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-base font-extrabold text-slate-900 leading-snug">{ann.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={12} className="text-amber-400" />
                  {fmtDate(ann.createdAt)}
                </span>
                {ann.createdBy && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <User size={12} className="text-amber-400" />
                    {ann.createdBy}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {ann.body ? (
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm text-slate-400 italic">No additional details for this announcement.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ── */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);

  useEffect(() => {
    axios.get("/api/announcements")
      .then(res => setAnnouncements(res.data.announcements || []))
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Employeelayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Megaphone size={18} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-none">Announcements</h1>
            <p className="text-xs text-slate-400 mt-0.5">Latest updates from management</p>
          </div>
          <span className="ml-auto text-xs text-slate-400 font-medium">
            {!loading && `${announcements.length} total`}
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={26} className="animate-spin text-amber-400" />
            <p className="text-xs text-slate-400">Loading announcements…</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Megaphone size={24} className="text-amber-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No announcements yet</p>
            <p className="text-xs text-slate-400">Check back later for updates from management</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <button
                key={ann.id}
                onClick={() => setSelected(ann)}
                className="w-full text-left bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-100 transition-colors">
                    <Megaphone size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-amber-700 transition-colors">
                      {ann.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar size={10} className="text-amber-400" />
                        {fmtDateShort(ann.createdAt)}
                      </span>
                      {ann.createdBy && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <User size={10} className="text-amber-400" />
                          {ann.createdBy}
                        </span>
                      )}
                    </div>
                    {ann.body && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {ann.body}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-slate-300 group-hover:text-amber-400 transition-colors mt-1"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <AnnouncementDialog ann={selected} onClose={() => setSelected(null)} />
    </Employeelayout>
  );
}
