"use client";
import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays, Plus, Pencil, Trash2, Loader2, PartyPopper, Clock,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
};

const isUpcoming = (dateStr) => new Date(dateStr) >= new Date(new Date().toDateString());

/* ── Holiday list item ───────────────────────────────────── */
const HolidayItem = ({ title, date, onEdit }) => (
  <button
    onClick={onEdit}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-all group text-left"
  >
    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
      <PartyPopper size={14} className="text-rose-500" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(date)}</p>
    </div>
    <Pencil size={12} className="text-slate-300 group-hover:text-rose-400 shrink-0 transition-colors" />
  </button>
);

/* ── Main page ───────────────────────────────────────────── */
const HolidayCalendarPage = () => {
  const [events, setEvents]                     = useState([]);
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate]         = useState("");
  const [holidayName, setHolidayName]           = useState("");
  const [selectedHolidayId, setSelectedHolidayId] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [fetching, setFetching]                 = useState(true);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/get-holidays");
      const formatted = res.data.holidays.map((h) => ({
        id:              h.id,
        title:           h.name,
        start:           h.date,
        allDay:          true,
        backgroundColor: "transparent",
        borderColor:     "transparent",
      }));
      setEvents(formatted);
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleDateClick = (info) => {
    setSelectedHolidayId(null);
    setHolidayName("");
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedHolidayId(clickInfo.event.id);
    setHolidayName(clickInfo.event.title);
    setSelectedDate(clickInfo.event.startStr);
    setIsModalOpen(true);
  };

  const handleSaveOrUpdate = async () => {
    if (!holidayName.trim()) return toast.error("Please enter a holiday name");
    setLoading(true);
    try {
      if (selectedHolidayId) {
        await axios.post(`/api/admin/update-holiday/${selectedHolidayId}`, { name: holidayName });
        toast.success("Holiday updated");
      } else {
        await axios.post("/api/admin/add-holiday", { name: holidayName, date: selectedDate });
        toast.success("Holiday added");
      }
      setIsModalOpen(false);
      fetchHolidays();
    } catch {
      toast.error(selectedHolidayId ? "Error updating holiday" : "Error saving holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/admin/delete-holiday/${selectedHolidayId}`);
      toast.success("Holiday removed");
      setDeleteDialogOpen(false);
      setIsModalOpen(false);
      fetchHolidays();
    } catch {
      toast.error("Error deleting holiday");
    } finally {
      setLoading(false);
    }
  };

  const renderEventContent = (eventInfo) => (
    <div className="flex items-center px-2 py-0.5 bg-rose-50 border-l-2 border-rose-400 rounded-r-md cursor-pointer hover:bg-rose-100 transition-colors overflow-hidden">
      <span className="text-[10px] font-bold text-rose-600 truncate leading-tight">
        {eventInfo.event.title}
      </span>
    </div>
  );

  /* sorted by date */
  const upcomingHolidays = [...events]
    .filter((e) => isUpcoming(e.start))
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const pastHolidays = [...events]
    .filter((e) => !isUpcoming(e.start))
    .sort((a, b) => new Date(b.start) - new Date(a.start));

  const isEditing = !!selectedHolidayId;

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Holiday Portal" />

      <div className="space-y-5">

        {/* ── Stat chip ───────────────────────────────── */}
        {!fetching && events.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold bg-slate-50 border-slate-200 text-slate-700">
              <span className="text-xl font-extrabold tabular-nums">{events.length}</span>
              <span className="font-medium opacity-80">Total Holidays</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold bg-rose-50 border-rose-200 text-rose-700">
              <span className="text-xl font-extrabold tabular-nums">{upcomingHolidays.length}</span>
              <span className="font-medium opacity-80">Upcoming</span>
            </div>
          </div>
        )}

        {/* ── Main layout ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <CalendarDays size={16} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">
                {new Date().getFullYear()} Holiday Calendar
              </p>
              <span className="ml-auto text-xs text-slate-400 font-medium">
                Click a date to add · Click an event to edit
              </span>
            </div>
            <div className="p-5">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                height="auto"
                headerToolbar={{
                  left:   "prev,next today",
                  center: "title",
                  right:  "dayGridMonth",
                }}
              />
            </div>
          </div>

          {/* Sidebar panel */}
          <div className="space-y-4">

            {/* Upcoming */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
                <Clock size={14} className="text-rose-400" />
                <p className="text-sm font-bold text-slate-800">Upcoming</p>
                <span className="ml-auto text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                  {upcomingHolidays.length}
                </span>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {upcomingHolidays.length > 0 ? (
                  upcomingHolidays.map((e) => (
                    <HolidayItem
                      key={e.id}
                      title={e.title}
                      date={e.start}
                      onEdit={() => {
                        setSelectedHolidayId(e.id);
                        setHolidayName(e.title);
                        setSelectedDate(e.start);
                        setIsModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No upcoming holidays
                  </div>
                )}
              </div>
            </div>

            {/* Past */}
            {pastHolidays.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
                  <CalendarDays size={14} className="text-slate-400" />
                  <p className="text-sm font-bold text-slate-800">Past</p>
                  <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    {pastHolidays.length}
                  </span>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {pastHolidays.map((e) => (
                    <HolidayItem
                      key={e.id}
                      title={e.title}
                      date={e.start}
                      onEdit={() => {
                        setSelectedHolidayId(e.id);
                        setHolidayName(e.title);
                        setSelectedDate(e.start);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Dialog ─────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 rounded-2xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isEditing ? "bg-amber-500" : "bg-rose-500"}`}>
                {isEditing ? <Pencil size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                  {isEditing ? "Edit Holiday" : "Add Holiday"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  {formatDate(selectedDate)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <PartyPopper size={12} className="text-slate-400" />
                Holiday Name <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                placeholder="e.g. Independence Day, Eid ul Fitr"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveOrUpdate()}
                className="h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-rose-500 focus-visible:ring-1 placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ml-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOrUpdate}
              disabled={loading}
              className={`
                inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl
                transition-colors shadow-sm disabled:opacity-60
                ${isEditing
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"}
              `}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : isEditing ? (
                <><Pencil size={14} /> Update</>
              ) : (
                <><Plus size={14} /> Add Holiday</>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-700">{holidayName}</span> on{" "}
              {formatDate(selectedDate)} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              disabled={loading}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Calendar CSS ──────────────────────────────── */}
      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .fc .fc-button-primary {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          color: #64748b !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          box-shadow: none !important;
          padding: 6px 14px !important;
        }
        .fc .fc-button-primary:hover {
          background: #f1f5f9 !important;
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background: #e0e7ff !important;
          color: #4f46e5 !important;
          border-color: #c7d2fe !important;
        }
        .fc .fc-col-header-cell {
          background: #f8fafc;
          padding: 10px 0;
        }
        .fc .fc-col-header-cell-cushion {
          text-decoration: none !important;
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .fc .fc-daygrid-day-number {
          font-weight: 700;
          font-size: 0.8rem;
          color: #64748b;
          padding: 8px 10px;
          text-decoration: none !important;
        }
        .fc .fc-day-today {
          background: #fff1f2 !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: #f43f5e;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #f1f5f9;
        }
        .fc .fc-daygrid-day:hover {
          background: #f8fafc;
          cursor: pointer;
        }
        .fc .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
          border-color: #f1f5f9 !important;
        }
        .fc .fc-toolbar.fc-header-toolbar {
          margin-bottom: 16px;
        }
      `}</style>
    </SuperAdminlayout>
  );
};

export default HolidayCalendarPage;
