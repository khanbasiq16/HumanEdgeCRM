"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ClipboardList, Loader2, Calendar, MessageSquare, Send,
  FolderKanban, Plus, Pencil, X, Save, Trash2,
  CheckCircle2, Clock, AlertCircle,
  Bold, Italic, List, ListOrdered, Zap, Signal, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/* ── Constants ─────────────────────────────────────────────── */
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

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : null;

/* ── Priority pill data ── */
const PRIORITY_PILLS = [
  { value: "low",    label: "Low",    Icon: Signal,     active: "bg-slate-700 text-white border-slate-700",   idle: "border-slate-200 text-slate-500 hover:border-slate-400" },
  { value: "medium", label: "Medium", Icon: TrendingUp, active: "bg-amber-500 text-white border-amber-500",   idle: "border-slate-200 text-slate-500 hover:border-amber-400" },
  { value: "high",   label: "High",   Icon: Zap,        active: "bg-red-500   text-white border-red-500",     idle: "border-slate-200 text-slate-500 hover:border-red-400"   },
];

/* ── Toolbar button helper ── */
const TB = ({ active, onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
      active ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    }`}
  >
    {children}
  </button>
);

/* ── Self-task rich text editor ── */
function SelfTaskEditor({ content, onChange, editorKey }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: content || "",
    editorProps: {
      attributes: {
        class: "min-h-[90px] text-sm text-slate-700 focus:outline-none px-3 py-2.5 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && !content) editor.commands.clearContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKey]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-violet-400 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <TB active={editor.isActive("bold")}        onClick={() => editor.chain().focus().toggleBold().run()}        title="Bold"><Bold size={12}/></TB>
        <TB active={editor.isActive("italic")}      onClick={() => editor.chain().focus().toggleItalic().run()}      title="Italic"><Italic size={12}/></TB>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <TB active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet List"><List size={12}/></TB>
        <TB active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered size={12}/></TB>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TASK CARD — shared for both self and project tasks
───────────────────────────────────────────────────────────── */
function TaskCard({ task, onClick }) {
  const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;
  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      <div className={`h-1 w-full ${task.source === "employee" ? "bg-gradient-to-r from-violet-400 to-purple-500" : "bg-gradient-to-r from-blue-400 to-indigo-500"}`} />
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium}`}>
            {task.priority?.toUpperCase()}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
        {task.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description?.replace(/<[^>]*>/g, " ").trim()}</p>
        )}
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-50 flex-wrap">
          {task.taskDate && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={10} />Start: {fmtDate(task.taskDate)}</span>
          )}
          {task.dueDate && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={10} />Due: {fmtDate(task.dueDate)}</span>
          )}
          {task.comments?.length > 0 && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><MessageSquare size={10} />{task.comments.length}</span>
          )}
          {task.adminRemark && (
            <span className="text-[11px] text-blue-500 font-semibold ml-auto">Remark</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS FILTER CHIPS
───────────────────────────────────────────────────────────── */
function StatusChips({ tasks, filter, onFilter }) {
  const counts = useMemo(() => ({
    all:           tasks.length,
    pending:       tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    working:       tasks.filter((t) => t.status === "working").length,
    completed:     tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  return (
    <div className="flex gap-1.5 flex-wrap">
      {[["all","All"],["pending","Pending"],["in-progress","In Progress"],["working","Working"],["completed","Done"]].map(([v, l]) => (
        <button key={v} onClick={() => onFilter(v)}
          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            filter === v ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"
          }`}>
          {l} <span className="opacity-60">{counts[v]}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TASK DETAIL DIALOG
───────────────────────────────────────────────────────────── */
function TaskDetailDialog({ task, open, onClose, user, isSelf, onStatusChange, onUpdate, onDelete, onAddComment }) {
  const [editMode,       setEditMode]       = useState(false);
  const [editForm,       setEditForm]       = useState({});
  const [editEditorKey,  setEditEditorKey]  = useState(0);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [addingComment,  setAddingComment]  = useState(false);

  useEffect(() => {
    if (task) {
      setEditForm({ title: task.title, description: task.description || "", taskDate: task.taskDate || "", dueDate: task.dueDate || "" });
      setEditMode(false);
      setNewComment("");
      setEditEditorKey((k) => k + 1);
    }
  }, [task]);

  if (!task) return null;
  const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;

  const handleStatus = async (status) => {
    setUpdatingStatus(true);
    await onStatusChange(task.id, status);
    setUpdatingStatus(false);
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) return toast.error("Title is required");
    setSaving(true);
    await onUpdate(task.id, editForm);
    setSaving(false);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    await onAddComment(task.id, newComment);
    setAddingComment(false);
    setNewComment("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setEditMode(false); } }}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className={`p-5 border-b border-slate-100 shrink-0 ${sc.bg}`}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {editMode ? (
                <Input className="rounded-xl border-slate-200 bg-white text-sm font-bold"
                  value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              ) : (
                <p className="text-sm font-extrabold text-slate-900">{task.title}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isSelf
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">Self Task</span>
                  : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Project Task</span>
                }
                {task.taskDate && !editMode && (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} />Start: {fmtDate(task.taskDate)}</span>
                )}
                {task.dueDate && !editMode && (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} />Due: {fmtDate(task.dueDate)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isSelf && !editMode && (
                <button onClick={handleDelete} disabled={deleting}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              )}
              {isSelf && (
                <button onClick={() => setEditMode((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors">
                  {editMode ? <X size={15} /> : <Pencil size={15} />}
                </button>
              )}
              <Select value={task.status} onValueChange={handleStatus} disabled={updatingStatus}>
                <SelectTrigger className={`rounded-xl text-xs font-bold border w-32 bg-white ${sc.text}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Description (view) */}
          {!editMode && task.description && (
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <div
                className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_li]:my-0.5 [&_p]:my-0.5 [&_strong]:font-bold [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          )}

          {/* Edit form (self only) */}
          {editMode && isSelf && (
            <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Edit Task</p>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <SelfTaskEditor
                  editorKey={editEditorKey}
                  content={editForm.description}
                  onChange={(html) => setEditForm((f) => ({ ...f, description: html }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Task Date</label>
                  <Input type="date" className="rounded-xl border-slate-200 text-xs bg-white"
                    value={editForm.taskDate} onChange={(e) => setEditForm((f) => ({ ...f, taskDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date</label>
                  <Input type="date" className="rounded-xl border-slate-200 text-xs bg-white"
                    value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs" onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 size={12} className="animate-spin mr-1" />Saving…</> : <><Save size={12} className="mr-1" />Save</>}
                </Button>
              </div>
            </div>
          )}

          {/* Admin Remark */}
          {task.adminRemark && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1.5">Admin Remark</p>
              <p className="text-sm text-blue-900">{task.adminRemark}</p>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              Comments ({task.comments?.length || 0})
            </p>
            {(task.comments?.length || 0) === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">No comments yet</p>
            ) : (
              <div className="space-y-3 max-h-44 overflow-y-auto">
                {task.comments.map((c) => {
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
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()} />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 shrink-0"
                onClick={handleComment} disabled={addingComment || !newComment.trim()}>
                {addingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function EmployeeTasksPage() {
  const { user } = useSelector((s) => s.User);
  const eid = user?.employeeId || user?.id;

  /* ── Navigation state ── */
  const [activeView,    setActiveView]    = useState("self"); // "self" | projectId
  const [activeProject, setActiveProject] = useState(null);

  /* ── Projects sidebar ── */
  const [projects,        setProjects]        = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  /* ── Self tasks ── */
  const [selfTasks,    setSelfTasks]    = useState([]);
  const [selfLoading,  setSelfLoading]  = useState(true);
  const [selfFilter,   setSelfFilter]   = useState("all");

  /* ── Project workspace tasks ── */
  const [projTasks,    setProjTasks]    = useState([]);
  const [projLoading,  setProjLoading]  = useState(false);
  const [projFilter,   setProjFilter]   = useState("all");

  /* ── Create self task dialog ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", taskDate: "", priority: "medium" });
  const [editorKey,  setEditorKey]  = useState(0);

  /* ── Task detail dialog ── */
  const [selTask,  setSelTask]  = useState(null);
  const [taskOpen, setTaskOpen] = useState(false);

  /* ── Load projects + self tasks on mount ── */
  useEffect(() => {
    if (!eid) return;
    axios.get(`/api/projects/employee/${eid}`)
      .then((r) => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));

    axios.get(`/api/tasks/employee/${eid}/self`)
      .then((r) => setSelfTasks(r.data.tasks || []))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setSelfLoading(false));
  }, [eid]);

  /* ── Load project tasks when switching to a project ── */
  const switchToProject = useCallback(async (proj) => {
    setActiveView(proj.id);
    setActiveProject(proj);
    setProjFilter("all");
    setProjLoading(true);
    try {
      const r = await axios.get(`/api/tasks/employee/${eid}/project/${proj.id}`);
      setProjTasks(r.data.tasks || []);
    } catch { toast.error("Failed to load project tasks"); }
    finally   { setProjLoading(false); }
  }, [eid]);

  /* ── Create self task ── */
  const handleCreate = async () => {
    if (!createForm.title.trim()) return toast.error("Title is required");
    setCreating(true);
    try {
      const res = await axios.post("/api/tasks/create", {
        title:          createForm.title,
        description:    createForm.description,
        taskDate:       createForm.taskDate || null,
        dueDate:        null,
        assignedTo:     eid,
        assignedToName: user?.employeeName || "",
        projectId:      null,
        projectTitle:   "",
        createdBy:      user?.employeeName || "Employee",
        source:         "employee",
        type:           "self",
        priority:       createForm.priority || "medium",
      });
      if (res.data.success) {
        toast.success("Task created!");
        setSelfTasks((p) => [res.data.task, ...p]);
        setCreateOpen(false);
        setCreateForm({ title: "", description: "", taskDate: "", priority: "medium" });
        setEditorKey((k) => k + 1);
      }
    } catch { toast.error("Failed to create task"); }
    finally   { setCreating(false); }
  };

  /* ── Task actions ── */
  const handleStatusChange = useCallback(async (taskId, status) => {
    try {
      await axios.post("/api/tasks/update-status", { taskId, status });
      const upd = (t) => t.id === taskId ? { ...t, status } : t;
      setSelfTasks((p) => p.map(upd));
      setProjTasks((p) => p.map(upd));
      setSelTask((t) => t ? upd(t) : t);
      toast.success("Status updated!");
    } catch { toast.error("Failed to update status"); }
  }, []);

  const handleUpdate = useCallback(async (taskId, form) => {
    try {
      await axios.post("/api/tasks/update", { taskId, ...form });
      const upd = (t) => t.id === taskId ? { ...t, ...form } : t;
      setSelfTasks((p) => p.map(upd));
      setSelTask((t) => t ? { ...t, ...form } : t);
      toast.success("Task updated!");
    } catch { toast.error("Failed to update task"); }
  }, []);

  const handleDelete = useCallback(async (taskId) => {
    try {
      await axios.delete("/api/tasks/delete", { data: { taskId, employeeId: eid } });
      setSelfTasks((p) => p.filter((t) => t.id !== taskId));
      toast.success("Task deleted.");
    } catch { toast.error("Failed to delete task"); }
  }, [eid]);

  const handleAddComment = useCallback(async (taskId, text) => {
    try {
      const res = await axios.post("/api/tasks/add-comment", {
        taskId, text,
        authorId:   eid,
        authorName: user?.employeeName || "Employee",
        authorRole: "employee",
      });
      if (res.data.success) {
        const upd = (t) => t.id === taskId ? { ...t, comments: [...(t.comments || []), res.data.comment] } : t;
        setSelfTasks((p) => p.map(upd));
        setProjTasks((p) => p.map(upd));
        setSelTask((t) => t ? upd(t) : t);
      }
    } catch { toast.error("Failed to add comment"); }
  }, [eid, user]);

  const openTask = (task) => { setSelTask(task); setTaskOpen(true); };

  /* ── Filtered lists ── */
  const visibleSelf = useMemo(() =>
    selfFilter === "all" ? selfTasks : selfTasks.filter((t) => t.status === selfFilter),
  [selfTasks, selfFilter]);

  const visibleProj = useMemo(() =>
    projFilter === "all" ? projTasks : projTasks.filter((t) => t.status === projFilter),
  [projTasks, projFilter]);

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <Employeelayout>
      <div className="flex gap-0 lg:gap-6 min-h-[calc(100vh-120px)]">

        {/* ══════════════════════════════════════════
            LEFT SIDEBAR  — Self Tasks + Projects
        ══════════════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0">
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-1 mb-2">Workspace</p>

          {/* Self Tasks button */}
          <button
            onClick={() => { setActiveView("self"); setActiveProject(null); }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all ${
              activeView === "self"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={16} className="shrink-0" />
            <span className="flex-1 text-left">Self Tasks</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              activeView === "self" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
            }`}>{selfTasks.length}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 my-3 px-1">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Projects</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Projects list */}
          {projectsLoading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-slate-400 text-center px-2 py-4">No projects yet</p>
          ) : (
            <div className="space-y-0.5">
              {projects.map((proj) => {
                const sc = STATUS_STYLE[proj.status] || STATUS_STYLE.active;
                const isActive = activeView === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => switchToProject(proj)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <FolderKanban size={15} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="flex-1 text-xs font-semibold truncate">{proj.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white/60" : sc.dot}`} />
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ══════════════════════════════════════════
            RIGHT CONTENT — Self Tasks or Project Workspace
        ══════════════════════════════════════════ */}
        <main className="flex-1 min-w-0">

          {/* ─── SELF TASKS VIEW ─── */}
          {activeView === "self" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">Self Tasks</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {selfTasks.filter((t) => t.status === "completed").length} of {selfTasks.length} completed
                  </p>
                </div>
                <button
                  onClick={() => { setCreateForm({ title: "", description: "", taskDate: "", priority: "medium" }); setEditorKey((k) => k + 1); setCreateOpen(true); }}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus size={15} /> New Task
                </button>
              </div>

              {/* Status filter */}
              <StatusChips tasks={selfTasks} filter={selfFilter} onFilter={setSelfFilter} />

              {/* Task list */}
              {selfLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
              ) : visibleSelf.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <ClipboardList size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">
                    {selfFilter === "all" ? "No self tasks yet" : `No ${selfFilter} tasks`}
                  </p>
                  {selfFilter === "all" && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Create your first task
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 max-w-2xl">
                  {visibleSelf.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={openTask} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── PROJECT WORKSPACE VIEW ─── */}
          {activeView !== "self" && activeProject && (
            <div className="space-y-4">
              {/* Project header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FolderKanban size={18} className="text-blue-500" />
                      <h1 className="text-xl font-extrabold text-slate-900">{activeProject.title}</h1>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        PRIORITY_STYLE[activeProject.priority] || PRIORITY_STYLE.medium
                      }`}>
                        {activeProject.priority?.toUpperCase()}
                      </span>
                    </div>
                    {activeProject.description && (
                      <p className="text-sm text-slate-400">{activeProject.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeProject.deadline && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar size={11} /> {fmtDate(activeProject.deadline)}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                      STATUS_STYLE[activeProject.status]?.bg || "bg-slate-50"
                    } ${STATUS_STYLE[activeProject.status]?.text || "text-slate-600"}`}>
                      {STATUS_STYLE[activeProject.status]?.label || activeProject.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 font-medium">
                  Showing tasks assigned to you in this project
                </p>
              </div>

              {/* Status filter */}
              <StatusChips tasks={projTasks} filter={projFilter} onFilter={setProjFilter} />

              {/* Task list */}
              {projLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
              ) : projTasks.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 size={36} className="text-slate-200" />
                  <p className="text-sm font-semibold text-slate-400">No tasks assigned to you in this project</p>
                  <p className="text-xs text-slate-400">Tasks assigned by the admin will appear here</p>
                </div>
              ) : visibleProj.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 bg-white rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle size={28} className="text-slate-200" />
                  <p className="text-sm font-semibold text-slate-400">No {projFilter} tasks</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-w-2xl">
                  {visibleProj.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={openTask} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ══ Create Self Task Dialog ══════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v && !creating) setCreateOpen(false); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <ClipboardList size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-slate-900 leading-none">New Self Task</p>
              <p className="text-xs text-slate-400 mt-0.5">Personal task, not linked to any project</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* Title */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Task Title <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <input
                className="w-full text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 bg-transparent border-0 border-b-2 border-slate-100 focus:border-violet-500 outline-none pb-2 transition-colors"
                placeholder="What do you need to do…"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && !creating && createForm.title.trim() && handleCreate()}
              />
            </div>

            {/* Description — rich text */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
              <SelfTaskEditor
                editorKey={editorKey}
                content={createForm.description}
                onChange={(html) => setCreateForm((f) => ({ ...f, description: html }))}
              />
            </div>

            {/* Priority + Task Date side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                <div className="flex gap-1.5">
                  {PRIORITY_PILLS.map(({ value, label, Icon, active, idle }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCreateForm((f) => ({ ...f, priority: value }))}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        createForm.priority === value ? active : idle
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Task Date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input type="date" className="pl-8 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    value={createForm.taskDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, taskDate: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
            <button onClick={() => !creating && setCreateOpen(false)} disabled={creating}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating || !createForm.title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {creating
                ? <><Loader2 size={13} className="animate-spin" />Creating…</>
                : "Create Task"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Task Detail Dialog ═══════════════════════════════════ */}
      <TaskDetailDialog
        task={selTask}
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        user={user}
        isSelf={selTask?.source === "employee"}
        onStatusChange={handleStatusChange}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAddComment={handleAddComment}
      />
    </Employeelayout>
  );
}
