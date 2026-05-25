"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ClipboardList, Search, Loader2, User, Calendar, MessageSquare,
  ChevronRight, Send, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TASK_STATUS = {
  pending:       { label: "Pending",     bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  "in-progress": { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  working:       { label: "Working",     bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  completed:     { label: "Completed",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};
const PRIORITY_STYLE = {
  low:    "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-red-100   text-red-600",
};

const Page = () => {
  const { user } = useSelector((s) => s.User);

  const [tasks,          setTasks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [sf,             setSf]             = useState("all");
  const [sourceFilter,   setSourceFilter]   = useState("all");

  // Task detail
  const [selTask,        setSelTask]        = useState(null);
  const [taskOpen,       setTaskOpen]       = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [addingComment,  setAddingComment]  = useState(false);
  const [remark,         setRemark]         = useState("");
  const [savingRemark,   setSavingRemark]   = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/tasks/get-all");
      setTasks(res.data.tasks || []);
    } catch { toast.error("Failed to load tasks"); }
    finally   { setLoading(false); }
  };

  const openTask = (task) => {
    setSelTask(task);
    setRemark(task.adminRemark || "");
    setNewComment("");
    setTaskOpen(true);
  };

  const handleStatusChange = async (taskId, status) => {
    setUpdatingStatus(true);
    try {
      await axios.post("/api/tasks/update-status", { taskId, status });
      const update = (t) => t.id === taskId ? { ...t, status } : t;
      setTasks((prev) => prev.map(update));
      setSelTask((t) => t ? update(t) : t);
      toast.success("Status updated");
    } catch { toast.error("Failed to update status"); }
    finally   { setUpdatingStatus(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selTask) return;
    setAddingComment(true);
    try {
      const res = await axios.post("/api/tasks/add-comment", {
        taskId:     selTask.id,
        text:       newComment,
        authorId:   user?.employeeId || "",
        authorName: user?.employeeName || user?.name || "Admin",
        authorRole: "superadmin",
      });
      if (res.data.success) {
        const updated = { ...selTask, comments: [...(selTask.comments || []), res.data.comment] };
        setSelTask(updated);
        setTasks((prev) => prev.map((t) => t.id === selTask.id ? updated : t));
        setNewComment("");
      }
    } catch { toast.error("Failed to add comment"); }
    finally   { setAddingComment(false); }
  };

  const handleSaveRemark = async () => {
    if (!selTask) return;
    setSavingRemark(true);
    try {
      await axios.post("/api/tasks/add-remark", { taskId: selTask.id, remark });
      const updated = { ...selTask, adminRemark: remark };
      setSelTask(updated);
      setTasks((prev) => prev.map((t) => t.id === selTask.id ? updated : t));
      toast.success("Remark saved");
    } catch { toast.error("Failed to save remark"); }
    finally   { setSavingRemark(false); }
  };

  const counts = useMemo(() => ({
    total:         tasks.length,
    pending:       tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    working:       tasks.filter((t) => t.status === "working").length,
    completed:     tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (sf !== "all")           list = list.filter((t) => t.status === sf);
    if (sourceFilter !== "all") list = list.filter((t) => t.source === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title?.toLowerCase().includes(q) ||
        t.assignedToName?.toLowerCase().includes(q) ||
        t.projectTitle?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, sf, sourceFilter, search]);

  return (
    <SuperAdminlayout>
      <section className="w-full max-w-6xl">
        <Superbreadcrumb path="All Tasks" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">All Tasks</h1>
            <p className="text-sm text-slate-400 mt-0.5">{counts.total} total tasks across all employees</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pending",     val: counts.pending,          cls: "" },
            { label: "In Progress", val: counts["in-progress"],   cls: "bg-blue-50 border-blue-200" },
            { label: "Working",     val: counts.working,          cls: "bg-amber-50 border-amber-200" },
            { label: "Completed",   val: counts.completed,        cls: "bg-emerald-50 border-emerald-200" },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 p-4 text-center ${cls}`}>
              <p className="text-2xl font-extrabold text-slate-900">{val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["in-progress", "In Progress"],
              ["working", "Working"],
              ["completed", "Completed"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSf(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  sf === v
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex gap-2 sm:ml-auto items-center flex-wrap">
            {/* Source filter */}
            <div className="flex gap-1.5">
              {[["all", "All Sources"], ["admin", "Admin"], ["employee", "Self"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setSourceFilter(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    sourceFilter === v
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-8 rounded-xl border-slate-200 text-sm w-full sm:w-52"
                placeholder="Search tasks or employee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-slate-200">
            <ClipboardList size={40} className="text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;
              const isSelf = task.source === "employee";
              return (
                <div
                  key={task.id}
                  onClick={() => openTask(task)}
                  className="bg-white rounded-xl border border-slate-200 px-5 py-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1 h-1 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium}`}>
                        {task.priority?.toUpperCase()}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          Self
                        </span>
                      )}
                      {task.projectTitle && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {task.projectTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User size={10} />{task.assignedToName || "Unassigned"}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {(task.comments?.length > 0) && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MessageSquare size={10} />{task.comments.length}
                        </span>
                      )}
                      {task.adminRemark && (
                        <span className="text-xs text-blue-500 font-semibold">Remark added</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </div>
              );
            })}
          </div>
        )}

        {/* Task Detail Dialog */}
        {selTask && (
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-extrabold text-slate-900">{selTask.title}</p>
                      {selTask.source === "employee" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Self</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[selTask.priority] || PRIORITY_STYLE.medium}`}>
                        {selTask.priority?.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User size={10} />{selTask.assignedToName}
                      </span>
                      {selTask.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(selTask.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                      {selTask.projectTitle && (
                        <span className="text-xs text-slate-400 truncate">· {selTask.projectTitle}</span>
                      )}
                    </div>
                    {selTask.description && (
                      <p className="text-xs text-slate-500 mt-2">{selTask.description}</p>
                    )}
                  </div>

                  {/* Status select */}
                  <Select value={selTask.status} onValueChange={(v) => handleStatusChange(selTask.id, v)} disabled={updatingStatus}>
                    <SelectTrigger className={`rounded-xl text-xs font-bold border w-36 shrink-0 ${TASK_STATUS[selTask.status]?.bg} ${TASK_STATUS[selTask.status]?.text}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">

                {/* Admin Remark */}
                <div>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Admin Remark</p>
                  <Textarea
                    className="rounded-xl border-slate-200 resize-none text-sm"
                    placeholder="Add your feedback or remark…"
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                  <div className="flex justify-end mt-1.5">
                    <Button
                      size="sm"
                      className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs h-7 px-3"
                      onClick={handleSaveRemark}
                      disabled={savingRemark}
                    >
                      {savingRemark
                        ? <Loader2 size={12} className="animate-spin" />
                        : <><Save size={11} className="mr-1" />Save Remark</>}
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                    Comments ({selTask.comments?.length || 0})
                  </p>

                  {(selTask.comments?.length || 0) === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">No comments yet</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selTask.comments.map((c) => {
                        const isAdmin = c.authorRole === "superadmin";
                        return (
                          <div key={c.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${isAdmin ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                              {c.authorName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className={`flex-1 flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                              <div className={`px-3 py-2 rounded-xl text-xs max-w-[80%] ${isAdmin ? "bg-blue-50 text-blue-900 rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none"}`}>
                                {c.text}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {c.authorName} · {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="flex gap-2 mt-3">
                    <Input
                      className="rounded-xl border-slate-200 text-sm flex-1"
                      placeholder="Write a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                    />
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 shrink-0"
                      onClick={handleAddComment}
                      disabled={addingComment || !newComment.trim()}
                    >
                      {addingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </section>
    </SuperAdminlayout>
  );
};

export default Page;
