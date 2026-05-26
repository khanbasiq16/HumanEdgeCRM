"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ClipboardList, Loader2, Calendar, MessageSquare, Send,
  FolderOpen, Plus, Pencil, X, Save, Trash2,
  Bold, Italic, List, ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/* ── Tiptap rich editor ─────────────────────────────────── */
const TaskRichEditor = ({ content, onChange, placeholder = "Task details…", minHeight = "80px" }) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: content || "",
    editorProps: {
      attributes: {
        class: `text-sm text-slate-700 focus:outline-none px-3 py-2`,
        style: `min-height: ${minHeight}`,
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const btn = (active, onClick, children, title) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
        active ? "bg-blue-100 text-blue-600" : "text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-100 bg-slate-50">
        {btn(editor.isActive("bold"),        () => editor.chain().focus().toggleBold().run(),         <Bold size={12} />,        "Bold")}
        {btn(editor.isActive("italic"),      () => editor.chain().focus().toggleItalic().run(),       <Italic size={12} />,      "Italic")}
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        {btn(editor.isActive("bulletList"),  () => editor.chain().focus().toggleBulletList().run(),   <List size={12} />,        "Bullet List")}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(),  <ListOrdered size={12} />, "Numbered List")}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

/* ── Night-shift aware date helper ──────────────────────── */
const getShiftDate = (checkInTime) => {
  // Pakistan Standard Time = UTC+5, no DST — pure math, no Intl quirks
  const k = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const nowH = k.getUTCHours();
  const nowM = k.getUTCMinutes();

  let useYesterday = false;
  if (checkInTime) {
    const match = checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ap = match[3].toUpperCase();
      if (ap === "PM" && h !== 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      // Night-shift: only subtract a day when the shift starts at 6 PM or
      // later AND current Karachi time is in the early-morning window (< noon),
      // meaning the employee is still within that overnight shift.
      if (h >= 18 && nowH < 12 && (nowH < h || (nowH === h && nowM < m))) {
        useYesterday = true;
      }
    }
  }

  if (useYesterday) k.setUTCDate(k.getUTCDate() - 1);

  return [
    k.getUTCFullYear(),
    String(k.getUTCMonth() + 1).padStart(2, "0"),
    String(k.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

/* ── Strip HTML for plain text preview ─────────────────── */
const stripHtml = (html) => html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";

/* ── Constants ──────────────────────────────────────────── */
const TASK_STATUS = {
  pending:       { label: "Pending",     bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200",  dot: "bg-slate-400"   },
  "in-progress": { label: "In Progress", bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500"    },
  working:       { label: "Working",     bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500"   },
  completed:     { label: "Completed",   bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500" },
};
const PRIORITY_STYLE = {
  low:    "bg-slate-100 text-slate-500",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-red-100   text-red-600",
};

/* ── Page ───────────────────────────────────────────────── */
export default function EmployeeTasksPage() {
  const { user } = useSelector((s) => s.User);

  const [tasks,          setTasks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("all");
  const [sourceFilter,   setSourceFilter]   = useState("all");

  const [createOpen,     setCreateOpen]     = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [createForm,     setCreateForm]     = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [createEditorKey, setCreateEditorKey] = useState(0);

  const [selTask,        setSelTask]        = useState(null);
  const [taskOpen,       setTaskOpen]       = useState(false);
  const [editMode,       setEditMode]       = useState(false);
  const [editForm,       setEditForm]       = useState({});
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [addingComment,  setAddingComment]  = useState(false);

  useEffect(() => {
    if (!user?.employeeId) return;
    fetchTasks();
  }, [user?.employeeId]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/api/tasks/employee/${user.employeeId}`);
      setTasks(res.data.tasks || []);
    } catch { toast.error("Failed to load tasks"); }
    finally   { setLoading(false); }
  };

  /* ── Open create dialog with correct default date ─── */
  const openCreate = () => {
    const defaultDate = getShiftDate(user?.department?.checkInTime);
    setCreateForm({ title: "", description: "", priority: "medium", dueDate: defaultDate });
    setCreateEditorKey((k) => k + 1);
    setCreateOpen(true);
  };

  /* ── Create ──────────────────────────────────────── */
  const handleCreate = async () => {
    if (!createForm.title.trim()) return toast.error("Title is required");
    setCreating(true);
    try {
      const res = await axios.post("/api/tasks/create", {
        title:          createForm.title,
        description:    createForm.description,
        priority:       createForm.priority,
        dueDate:        createForm.dueDate,
        assignedTo:     user.employeeId,
        assignedToName: user.employeeName || "",
        projectId:      null,
        projectTitle:   "",
        createdBy:      user.employeeName || "Employee",
        source:         "employee",
      });
      if (res.data.success) {
        toast.success("Task created!");
        setTasks((p) => [res.data.task, ...p]);
        setCreateOpen(false);
      }
    } catch { toast.error("Failed to create task"); }
    finally   { setCreating(false); }
  };

  /* ── Open task detail ────────────────────────────── */
  const openTask = (task) => {
    setSelTask(task);
    setEditForm({
      title:       task.title,
      description: task.description || "",
      priority:    task.priority    || "medium",
      dueDate:     task.dueDate     || "",
    });
    setEditMode(false);
    setNewComment("");
    setTaskOpen(true);
  };

  /* ── Status update ───────────────────────────────── */
  const handleStatusChange = async (taskId, status) => {
    setUpdatingStatus(true);
    try {
      await axios.post("/api/tasks/update-status", { taskId, status });
      const upd = (t) => t.id === taskId ? { ...t, status } : t;
      setTasks((p) => p.map(upd));
      setSelTask((t) => t ? upd(t) : t);
      toast.success("Status updated!");
    } catch { toast.error("Failed to update"); }
    finally   { setUpdatingStatus(false); }
  };

  /* ── Save edit ───────────────────────────────────── */
  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      await axios.post("/api/tasks/update", { taskId: selTask.id, ...editForm });
      const updated = { ...selTask, ...editForm, dueDate: editForm.dueDate || null };
      setSelTask(updated);
      setTasks((p) => p.map((t) => t.id === selTask.id ? updated : t));
      setEditMode(false);
      toast.success("Task updated!");
    } catch { toast.error("Failed to update task"); }
    finally   { setSaving(false); }
  };

  /* ── Delete (self-created only) ─────────────────── */
  const handleDelete = async () => {
    if (!selTask || !window.confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await axios.delete("/api/tasks/delete", { data: { taskId: selTask.id, employeeId: user.employeeId } });
      setTasks((p) => p.filter((t) => t.id !== selTask.id));
      setTaskOpen(false);
      toast.success("Task deleted.");
    } catch { toast.error("Failed to delete task"); }
    finally   { setDeleting(false); }
  };

  /* ── Add comment ─────────────────────────────────── */
  const handleAddComment = async () => {
    if (!newComment.trim() || !selTask) return;
    setAddingComment(true);
    try {
      const res = await axios.post("/api/tasks/add-comment", {
        taskId:     selTask.id,
        text:       newComment,
        authorId:   user?.employeeId || "",
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
    finally   { setAddingComment(false); }
  };

  /* ── Derived ─────────────────────────────────────── */
  const sourceTasks = useMemo(() => {
    if (sourceFilter === "self")     return tasks.filter((t) => t.source === "employee");
    if (sourceFilter === "assigned") return tasks.filter((t) => t.source !== "employee");
    return tasks;
  }, [tasks, sourceFilter]);

  const filtered = useMemo(() => {
    if (filter === "all") return sourceTasks;
    return sourceTasks.filter((t) => t.status === filter);
  }, [sourceTasks, filter]);

  const counts = useMemo(() => ({
    all:           sourceTasks.length,
    pending:       sourceTasks.filter((t) => t.status === "pending").length,
    "in-progress": sourceTasks.filter((t) => t.status === "in-progress").length,
    working:       sourceTasks.filter((t) => t.status === "working").length,
    completed:     sourceTasks.filter((t) => t.status === "completed").length,
    self:          tasks.filter((t) => t.source === "employee").length,
    assigned:      tasks.filter((t) => t.source !== "employee").length,
  }), [tasks, sourceTasks]);

  /* ─────────────────────────────────────────────────── */
  return (
    <Employeelayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Tasks</h1>
            <p className="text-sm text-slate-400 mt-0.5">{counts.all} total tasks</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            <Plus size={15} /> New Task
          </Button>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pending",     val: counts.pending,        cls: "" },
            { label: "In Progress", val: counts["in-progress"], cls: "bg-blue-50   border-blue-200"    },
            { label: "Working",     val: counts.working,        cls: "bg-amber-50  border-amber-200"   },
            { label: "Completed",   val: counts.completed,      cls: "bg-emerald-50 border-emerald-200" },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 p-4 text-center ${cls}`}>
              <p className="text-2xl font-extrabold text-slate-900">{val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex gap-2">
          {[
            ["all",      "All Tasks",  counts.self + counts.assigned],
            ["assigned", "Assigned",   counts.assigned],
            ["self",     "Self Tasks", counts.self],
          ].map(([v, l, c]) => (
            <button
              key={v}
              onClick={() => { setSourceFilter(v); setFilter("all"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                sourceFilter === v
                  ? v === "self"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {l} <span className="opacity-60 ml-0.5">{c}</span>
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[["all","All"],["pending","Pending"],["in-progress","In Progress"],["working","Working"],["completed","Completed"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filter === v
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {l} <span className="opacity-60 ml-0.5">{counts[v] ?? ""}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-3 bg-white rounded-2xl border border-slate-200">
            <ClipboardList size={36} className="text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">No tasks here</p>
            <Button onClick={openCreate} variant="outline" className="rounded-xl text-xs">
              <Plus size={13} className="mr-1" /> Create your first task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const sc      = TASK_STATUS[task.status] || TASK_STATUS.pending;
              const isSelf  = task.source === "employee";
              const preview = stripHtml(task.description);
              return (
                <div
                  key={task.id}
                  onClick={() => openTask(task)}
                  className={`bg-white rounded-2xl border px-5 py-4 cursor-pointer hover:shadow-sm transition-all border-l-4 ${
                    isSelf ? "border-l-violet-400" : "border-l-blue-400"
                  } ${sc.border}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {task.source === "employee" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">Self</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium}`}>
                        {task.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">{task.title}</p>
                  {preview && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{preview}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {task.projectTitle ? (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><FolderOpen size={10} />{task.projectTitle}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Personal Task</span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />{new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {(task.comments?.length > 0) && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><MessageSquare size={10} />{task.comments.length}</span>
                    )}
                    {task.adminRemark && (
                      <span className="text-xs text-blue-600 font-bold">• Admin remark</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Task Dialog ──────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title *</label>
              <Input className="rounded-xl border-slate-200" placeholder="What needs to be done…"
                value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
              <TaskRichEditor
                key={createEditorKey}
                content={createForm.description}
                onChange={(html) => setCreateForm((f) => ({ ...f, description: html }))}
                placeholder="Task details…"
                minHeight="90px"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                <Select value={createForm.priority} onValueChange={(v) => setCreateForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Due Date</label>
                <Input type="date" className="rounded-xl border-slate-200"
                  value={createForm.dueDate} onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 size={13} className="animate-spin mr-1.5" />Creating…</> : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Task Detail / Edit Dialog ────────────────────── */}
      {selTask && (
        <Dialog open={taskOpen} onOpenChange={(v) => { setTaskOpen(v); if (!v) setEditMode(false); }}>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className={`p-5 border-b border-slate-100 shrink-0 ${TASK_STATUS[selTask.status]?.bg || ""}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {editMode ? (
                    <Input
                      className="rounded-xl border-slate-200 text-sm font-bold bg-white"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm font-extrabold text-slate-900">{selTask.title}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {selTask.source === "employee" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">Self Created</span>
                    )}
                    {selTask.projectTitle ? (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><FolderOpen size={10} />{selTask.projectTitle}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Personal Task</span>
                    )}
                    {selTask.dueDate && !editMode && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />{new Date(selTask.dueDate).toLocaleDateString("en-US", { day:"numeric", month:"short" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selTask.source === "employee" && !editMode && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete task"
                    >
                      {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                  <button
                    onClick={() => setEditMode((v) => !v)}
                    className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors"
                    title={editMode ? "Cancel edit" : "Edit task"}
                  >
                    {editMode ? <X size={15} /> : <Pencil size={15} />}
                  </button>
                  <Select value={selTask.status} onValueChange={(v) => handleStatusChange(selTask.id, v)} disabled={updatingStatus}>
                    <SelectTrigger className={`rounded-xl text-xs font-bold border w-30 bg-white ${TASK_STATUS[selTask.status]?.text}`}>
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
            </div>

            {/* Scrollable body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">

              {/* Description view (non-edit) */}
              {!editMode && selTask.description && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <div
                    className="task-desc text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: selTask.description }}
                  />
                </div>
              )}

              {/* Edit form */}
              {editMode && (
                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Edit Task</p>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                    <TaskRichEditor
                      key={selTask.id}
                      content={editForm.description}
                      onChange={(html) => setEditForm((f) => ({ ...f, description: html }))}
                      placeholder="Task details…"
                      minHeight="80px"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
                      <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-xs bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date</label>
                      <Input type="date" className="rounded-xl border-slate-200 text-xs bg-white"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs"
                      onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
                      onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <><Loader2 size={12} className="animate-spin mr-1" />Saving…</> : <><Save size={12} className="mr-1" />Save Changes</>}
                    </Button>
                  </div>
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
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">No comments yet. Add the first one!</p>
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
                  <Input
                    className="rounded-xl border-slate-200 text-sm flex-1"
                    placeholder="Write a comment…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                  />
                  <Button size="sm"
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
    </Employeelayout>
  );
}
