"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Loader2, Calendar, User, MessageSquare, Send,
  CheckCircle2, Users, FolderKanban, Clock, AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ── Constants ── */
const TASK_STATUS = {
  pending:       { label: "Pending",     bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  "in-progress": { label: "In Progress", bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  working:       { label: "Working",     bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  completed:     { label: "Completed",   bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
};
const PRIORITY_STYLE = {
  low:    "bg-slate-100 text-slate-500",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-red-100   text-red-600",
};
const STATUS_STYLE = {
  active:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Active"    },
  "on-hold": { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "On Hold"   },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;
const stripHtml = (html) => html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";

export default function EmployeeProjectWorkspace() {
  const { slug, id } = useParams();
  const router       = useRouter();
  const { user }     = useSelector((s) => s.User);
  const eid          = user?.employeeId || user?.id;

  const [project,        setProject]        = useState(null);
  const [tasks,          setTasks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("all");

  /* task detail */
  const [selTask,        setSelTask]        = useState(null);
  const [taskOpen,       setTaskOpen]       = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [addingComment,  setAddingComment]  = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /* ── Fetch project + my tasks ── */
  useEffect(() => {
    if (!eid || !id) return;
    Promise.all([
      axios.get(`/api/projects/${id}`),
      axios.get(`/api/tasks/employee/${eid}/project/${id}`),
    ])
      .then(([projRes, tasksRes]) => {
        setProject(projRes.data.project || null);
        setTasks(tasksRes.data.tasks || []);
      })
      .catch(() => toast.error("Failed to load workspace"))
      .finally(() => setLoading(false));
  }, [eid, id]);

  /* ── Status update ── */
  const handleStatusChange = useCallback(async (taskId, status) => {
    setUpdatingStatus(true);
    try {
      await axios.post("/api/tasks/update-status", { taskId, status });
      const upd = (t) => t.id === taskId ? { ...t, status } : t;
      setTasks((p) => p.map(upd));
      setSelTask((t) => t ? upd(t) : t);
      toast.success("Status updated");
    } catch { toast.error("Failed to update"); }
    finally { setUpdatingStatus(false); }
  }, []);

  /* ── Add comment ── */
  const handleAddComment = async () => {
    if (!newComment.trim() || !selTask) return;
    setAddingComment(true);
    try {
      const res = await axios.post("/api/tasks/add-comment", {
        taskId:     selTask.id,
        text:       newComment,
        authorId:   eid,
        authorName: user?.employeeName || "Employee",
        authorRole: "employee",
      });
      if (res.data.success) {
        const updated = { ...selTask, comments: [...(selTask.comments || []), res.data.comment] };
        setSelTask(updated);
        setTasks((p) => p.map((t) => t.id === selTask.id ? updated : t));
        setNewComment("");
      }
    } catch { toast.error("Failed to add comment"); }
    finally { setAddingComment(false); }
  };

  /* ── Filtered tasks ── */
  const visibleTasks = useMemo(() =>
    statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter),
  [tasks, statusFilter]);

  const taskCounts = useMemo(() => ({
    total:     tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending:   tasks.filter((t) => t.status === "pending").length,
    progress:  tasks.filter((t) => t.status === "in-progress" || t.status === "working").length,
  }), [tasks]);

  /* ── Members ── */
  const acceptedMembers = useMemo(() =>
    (project?.members || []).filter((m) => m.status === "accepted"),
  [project]);

  if (loading) return (
    <Employeelayout>
      <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
    </Employeelayout>
  );

  if (!project) return (
    <Employeelayout>
      <div className="flex flex-col items-center py-24 gap-3">
        <FolderKanban size={40} className="text-slate-200" />
        <p className="text-sm text-slate-400">Project not found</p>
        <button onClick={() => router.back()} className="text-xs text-blue-600 font-semibold hover:underline">Go back</button>
      </div>
    </Employeelayout>
  );

  const sc = STATUS_STYLE[project.status] || STATUS_STYLE.active;

  return (
    <Employeelayout>
      <div className="w-full max-w-4xl space-y-5">

        {/* ── Back + Project header ── */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push(`/employee/${slug}/projects`)}
            className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-xl font-extrabold text-slate-900">{project.title}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[project.priority] || PRIORITY_STYLE.medium}`}>
                    {project.priority?.toUpperCase()}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-slate-400 leading-relaxed">{stripHtml(project.description)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />{sc.label}
                </span>
                {project.deadline && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Calendar size={11} />{fmtDate(project.deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "My Tasks",   val: taskCounts.total,     cls: "" },
            { label: "Completed",  val: taskCounts.completed, cls: "bg-emerald-50 border-emerald-200" },
            { label: "In Progress",val: taskCounts.progress,  cls: "bg-blue-50 border-blue-200" },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 p-4 text-center ${cls}`}>
              <p className="text-2xl font-extrabold text-slate-900">{val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Team Members ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-slate-500" />
            <h2 className="text-sm font-extrabold text-slate-800">Team Members</h2>
            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">{acceptedMembers.length}</span>
          </div>
          {acceptedMembers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No accepted members yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {acceptedMembers.map((m) => {
                const isMe = m.id === eid;
                return (
                  <div key={m.id} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${isMe ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${isMe ? "bg-blue-600" : "bg-slate-400"}`}>
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 leading-none">{m.name} {isMe && <span className="text-blue-500">(You)</span>}</p>
                      {m.department && <p className="text-[10px] text-slate-400 mt-0.5">{m.department}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── My Tasks in this project ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-800">My Tasks</h2>
            <div className="flex gap-1.5 flex-wrap">
              {[["all","All"],["pending","Pending"],["in-progress","In Progress"],["working","Working"],["completed","Done"]].map(([v, l]) => (
                <button key={v} onClick={() => setStatusFilter(v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    statusFilter === v ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 size={36} className="text-slate-200" />
              <p className="text-sm font-semibold text-slate-400">No tasks assigned to you in this project</p>
              <p className="text-xs text-slate-400">Tasks assigned by the admin will appear here</p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 bg-white rounded-2xl border border-dashed border-slate-200">
              <AlertCircle size={28} className="text-slate-200" />
              <p className="text-sm font-semibold text-slate-400">No {statusFilter} tasks</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleTasks.map((task) => {
                const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;
                return (
                  <div key={task.id} onClick={() => { setSelTask(task); setNewComment(""); setTaskOpen(true); }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                    <div className="px-4 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium}`}>
                          {task.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{stripHtml(task.description)}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-50 flex-wrap">
                        {task.dueDate && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={10}/>{fmtDate(task.dueDate)}</span>}
                        {task.comments?.length > 0 && <span className="text-[11px] text-slate-400 flex items-center gap-1"><MessageSquare size={10}/>{task.comments.length}</span>}
                        {task.adminRemark && <span className="text-[11px] text-blue-500 font-semibold ml-auto">Remark</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Task Detail Dialog ── */}
      {selTask && (
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className={`p-5 border-b border-slate-100 shrink-0 ${TASK_STATUS[selTask.status]?.bg || ""}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900">{selTask.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[selTask.priority] || PRIORITY_STYLE.medium}`}>
                      {selTask.priority?.toUpperCase()}
                    </span>
                    {selTask.dueDate && (
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10}/>{fmtDate(selTask.dueDate)}</span>
                    )}
                  </div>
                </div>
                {/* Status selector — employee can update */}
                <Select value={selTask.status} onValueChange={(v) => handleStatusChange(selTask.id, v)} disabled={updatingStatus}>
                  <SelectTrigger className={`rounded-xl text-xs font-bold border w-36 bg-white shrink-0 ${TASK_STATUS[selTask.status]?.text}`}>
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

            {/* Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">

              {/* Description */}
              {selTask.description && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <div className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: selTask.description }} />
                </div>
              )}

              {/* Admin Remark */}
              {selTask.adminRemark && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1.5">Admin Remark</p>
                  <p className="text-sm text-blue-900">{selTask.adminRemark}</p>
                </div>
              )}

              {/* Comments */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                  Comments ({selTask.comments?.length || 0})
                </p>
                {(selTask.comments?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">No comments yet</p>
                ) : (
                  <div className="space-y-3 max-h-44 overflow-y-auto">
                    {selTask.comments.map((c) => {
                      const isAdmin = c.authorRole === "superadmin";
                      return (
                        <div key={c.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${isAdmin ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {c.authorName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className={`flex-1 flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${isAdmin ? "bg-blue-50 text-blue-900 rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none"}`}>
                              {c.text}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {isAdmin ? "Admin" : c.authorName} · {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Input className="rounded-xl border-slate-200 text-sm flex-1" placeholder="Write a comment…"
                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()} />
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 shrink-0"
                    onClick={handleAddComment} disabled={addingComment || !newComment.trim()}>
                    {addingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Employeelayout>
  );
}
