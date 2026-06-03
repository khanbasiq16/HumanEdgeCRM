"use client";
import React, { useEffect, useState } from "react";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Megaphone, Plus, Trash2, Loader2, Users, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";

/* ── time formatter ── */
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/* ── single announcement card ── */
const AnnouncementCard = ({ ann, onDelete, deleting }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Megaphone size={16} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">{ann.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar size={10} /> {fmtDate(ann.createdAt)}
            </span>
            <span className="text-[11px] text-slate-400">by {ann.createdBy}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {ann.body && (
            <button
              onClick={() => setExpanded((o) => !o)}
              className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Less" : "More"}
            </button>
          )}
          <button
            onClick={() => onDelete(ann.id)}
            disabled={deleting === ann.id}
            className="h-8 w-8 inline-flex items-center justify-center text-red-400 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
          >
            {deleting === ann.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
      {expanded && ann.body && (
        <p className="text-sm text-slate-600 leading-relaxed pl-12">{ann.body}</p>
      )}
    </div>
  );
};

/* ── main page ── */
const AnnouncementsPage = () => {
  const { user } = useSelector((s) => s.User);

  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [title,         setTitle]         = useState("");
  const [body,          setBody]          = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/announcements");
      setAnnouncements(res.data.announcements || []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    setSubmitting(true);
    try {
      const res = await axios.post("/api/announcements", {
        title,
        body,
        createdBy: user?.name || user?.employeeName || "Admin",
      });
      if (res.data.success) {
        toast.success(`Announcement sent to ${res.data.notified} employee(s)`);
        setTitle("");
        setBody("");
        fetchAnnouncements();
      }
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await axios.delete(`/api/announcements/${id}`);
      if (res.data.success) {
        toast.success("Announcement deleted");
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Announcements" />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Create form ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Megaphone size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">New Announcement</p>
              <p className="text-xs text-slate-400 mt-0.5">Sent instantly to all employees as a notification</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Title <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office closed on Friday"
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Message <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Additional details for the announcement…"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users size={12} />
                Notification sent to all employees
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 h-9 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {submitting ? "Sending…" : "Send Announcement"}
              </button>
            </div>
          </form>
        </div>

        {/* ── List ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Past Announcements</p>
            <span className="text-xs text-slate-400">{announcements.length} total</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Megaphone size={20} className="text-amber-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No announcements yet</p>
              <p className="text-xs text-slate-400">Create one above to notify all employees</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminlayout>
  );
};

export default AnnouncementsPage;
