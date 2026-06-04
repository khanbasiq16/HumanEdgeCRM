"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FolderKanban, Plus, Search, ChevronRight, Loader2, Calendar,
  Pencil, Trash2, AlertTriangle, Zap, Signal, TrendingUp,
  X, ArrowRight, Bold, Italic, List, ListOrdered, Heading2, Quote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUS_STYLE = {
  active:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",  dot: "bg-blue-500",    label: "Active"    },
  "on-hold": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200", dot: "bg-amber-500",   label: "On Hold"   },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500",label: "Completed" },
};
const PRIORITY_STYLE = {
  low:    "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-red-100   text-red-600",
};

const BLANK_FORM = { title: "", description: "", priority: "medium", status: "active", deadline: "" };

const Page = () => {
  const { user }  = useSelector((s) => s.User);
  const router    = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_FORM);

  // Edit dialog
  const [editOpen,    setEditOpen]    = useState(false);
  const [editSaving,  setEditSaving]  = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editForm,    setEditForm]    = useState(BLANK_FORM);

  // Delete dialog
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteProject, setDeleteProject] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects/get-all");
      setProjects(res.data.projects || []);
    } catch { toast.error("Failed to load projects"); }
    finally   { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return toast.error("Title is required");
    setCreating(true);
    try {
      const res = await axios.post("/api/projects/create", {
        ...createForm,
        createdBy: user?.employeeName || user?.name || "Admin",
      });
      if (res.data.success) {
        toast.success("Project created!");
        setProjects((p) => [res.data.project, ...p]);
        setCreateOpen(false);
        setCreateForm(BLANK_FORM);
      }
    } catch { toast.error("Failed to create project"); }
    finally   { setCreating(false); }
  };

  const openEdit = (e, proj) => {
    e.stopPropagation();
    setEditProject(proj);
    setEditForm({
      title:       proj.title || "",
      description: proj.description || "",
      priority:    proj.priority || "medium",
      status:      proj.status || "active",
      deadline:    proj.deadline || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm.title.trim()) return toast.error("Title is required");
    setEditSaving(true);
    try {
      await axios.patch(`/api/projects/${editProject.id}`, editForm);
      setProjects((prev) =>
        prev.map((p) => p.id === editProject.id ? { ...p, ...editForm } : p)
      );
      toast.success("Project updated!");
      setEditOpen(false);
    } catch { toast.error("Failed to update project"); }
    finally   { setEditSaving(false); }
  };

  const openDelete = (e, proj) => {
    e.stopPropagation();
    setDeleteProject(proj);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/projects/${deleteProject.id}`);
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      toast.success("Project and all its tasks deleted");
      setDeleteOpen(false);
    } catch { toast.error("Failed to delete project"); }
    finally   { setDeleting(false); }
  };

  const filtered = useMemo(() => {
    let list = projects;
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, filter, search]);

  const counts = useMemo(() => ({
    all:       projects.length,
    active:    projects.filter((p) => p.status === "active").length,
    "on-hold": projects.filter((p) => p.status === "on-hold").length,
    completed: projects.filter((p) => p.status === "completed").length,
  }), [projects]);

  return (
    <SuperAdminlayout>
      <section className="w-full max-w-6xl">
        <Superbreadcrumb path="Projects" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">{counts.all} total projects</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            <Plus size={16} /> New Project
          </Button>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[["all", "All"], ["active", "Active"], ["on-hold", "On Hold"], ["completed", "Completed"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filter === v
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {l} <span className="ml-1 opacity-60">{counts[v] ?? ""}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-8 rounded-xl border-slate-200 text-sm w-full sm:w-56"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <FolderKanban size={40} className="text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((proj) => {
              const sc = STATUS_STYLE[proj.status] || STATUS_STYLE.active;
              return (
                <div
                  key={proj.id}
                  onClick={() => router.push(`/admin/projects/${proj.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group relative"
                >
                  {/* Edit / Delete buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => openEdit(e, proj)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-400 shadow-sm transition-all"
                      title="Edit project"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => openDelete(e, proj)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:text-red-500 text-slate-400 shadow-sm transition-all"
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[proj.priority] || PRIORITY_STYLE.medium}`}>
                      {proj.priority?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 pr-14">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
                    {proj.description
                      ? proj.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : "No description provided."}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {proj.deadline
                        ? new Date(proj.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                        : "No deadline"}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create Project Dialog ──────────────────────────────── */}
        <ProjectFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreate}
          loading={creating}
          mode="create"
        />

        {/* ── Edit Project Dialog ────────────────────────────────── */}
        <ProjectFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          loading={editSaving}
          mode="edit"
        />

        {/* ── Delete Confirmation Dialog ─────────────────────────── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} /> Delete Project
              </DialogTitle>
            </DialogHeader>
            <div className="my-3 space-y-3">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteProject?.title}"</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600 font-semibold">This will permanently delete:</p>
                <ul className="text-xs text-red-500 mt-1 space-y-0.5 list-disc list-inside">
                  <li>The project and all its settings</li>
                  <li>All tasks created under this project</li>
                  <li>All team member assignments</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={14} className="animate-spin mr-1.5" />Deleting…</> : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </SuperAdminlayout>
  );
};

/* ── Pill option data ── */
const PRIORITY_OPTS = [
  { value: "low",    label: "Low",    icon: Signal,     color: "text-slate-500",  ring: "ring-slate-300",  activeBg: "bg-slate-800 text-white",  activeDot: "bg-slate-400" },
  { value: "medium", label: "Medium", icon: TrendingUp, color: "text-amber-600",  ring: "ring-amber-300",  activeBg: "bg-amber-500 text-white",  activeDot: "bg-amber-400" },
  { value: "high",   label: "High",   icon: Zap,        color: "text-red-500",    ring: "ring-red-300",    activeBg: "bg-red-500   text-white",  activeDot: "bg-red-400"   },
];
const STATUS_OPTS = [
  { value: "active",    label: "Active",    dot: "bg-blue-500",    activeBg: "bg-blue-600    text-white" },
  { value: "on-hold",   label: "On Hold",   dot: "bg-amber-400",   activeBg: "bg-amber-500   text-white" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500", activeBg: "bg-emerald-600 text-white" },
];

/* ── Toolbar button helper ── */
const TB = ({ active, onClick, children, title }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs ${
      active
        ? "bg-blue-100 text-blue-700 shadow-inner"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    }`}
  >
    {children}
  </button>
);

/* ── Rich text editor for project description ── */
function ProjectRichEditor({ content, onChange, editorKey }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: content || "",
    editorProps: {
      attributes: {
        class: "min-h-[100px] text-sm text-slate-700 focus:outline-none px-3 py-2.5 leading-relaxed",
        "data-placeholder": "Describe the project goals, scope, or any relevant context…",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Re-sync content when editorKey changes (dialog re-open / edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKey]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-white/80 flex-wrap">
        <TB active={editor.isActive("bold")}         onClick={() => editor.chain().focus().toggleBold().run()}         title="Bold"><Bold size={12}/></TB>
        <TB active={editor.isActive("italic")}       onClick={() => editor.chain().focus().toggleItalic().run()}       title="Italic"><Italic size={12}/></TB>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <TB active={editor.isActive("heading",{level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()} title="Heading"><Heading2 size={12}/></TB>
        <TB active={editor.isActive("bulletList")}   onClick={() => editor.chain().focus().toggleBulletList().run()}   title="Bullet List"><List size={12}/></TB>
        <TB active={editor.isActive("orderedList")}  onClick={() => editor.chain().focus().toggleOrderedList().run()}  title="Numbered List"><ListOrdered size={12}/></TB>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <TB active={editor.isActive("blockquote")}   onClick={() => editor.chain().focus().toggleBlockquote().run()}   title="Quote"><Quote size={12}/></TB>
      </div>
      {/* Editable area */}
      <EditorContent editor={editor} />
    </div>
  );
}

/* ── Bouncing dots (used while creating) ── */
function BouncingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function ProjectFormDialog({ open, onClose, form, setForm, onSubmit, loading, mode }) {
  const isEdit   = mode === "edit";
  const titleRef = useRef(null);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 80);
      setEditorKey((k) => k + 1); // reset editor when dialog opens
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-300/40 gap-0 max-h-[90vh] flex flex-col">

        <AnimatePresence mode="wait">
          <motion.div
            key={open ? "open" : "closed"}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* ── Header bar (clean, no colored bg) ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isEdit ? "bg-slate-100" : "bg-blue-50"}`}>
                  {isEdit
                    ? <Pencil size={15} className="text-slate-600" />
                    : <FolderKanban size={15} className="text-blue-600" />}
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 leading-none">
                    {isEdit ? "Edit Project" : "Create New Project"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEdit ? "Update the project details" : "Set up your project workspace"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !loading && onClose()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Form body ── */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Project Name <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <input
                  ref={titleRef}
                  className="w-full text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 bg-transparent border-0 border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-2 transition-colors"
                  placeholder="e.g. Website Redesign, Q3 Campaign…"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && !loading && form.title?.trim() && onSubmit()}
                />
              </div>

              {/* Description — rich text */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                <ProjectRichEditor
                  editorKey={editorKey}
                  content={form.description}
                  onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                />
              </div>

              {/* Priority + Deadline side by side */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTS.map(({ value, label, icon: Icon, color, activeBg }) => (
                      <motion.button
                        key={value}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setForm((f) => ({ ...f, priority: value }))}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                          form.priority === value
                            ? `${activeBg} border-transparent shadow-sm`
                            : `bg-white ${color} border-slate-200 hover:border-slate-300`
                        }`}
                      >
                        <Icon size={13} />
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Deadline</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      className="pl-8 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                      value={form.deadline}
                      onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTS.map(({ value, label, dot, activeBg }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setForm((f) => ({ ...f, status: value }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        form.status === value
                          ? `${activeBg} border-transparent shadow-sm`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${form.status === value ? "bg-white/80" : dot}`} />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
              <button
                onClick={() => !loading && onClose()}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>

              <motion.button
                whileHover={!loading && form.title?.trim() ? { scale: 1.02 } : {}}
                whileTap={!loading && form.title?.trim() ? { scale: 0.97 } : {}}
                onClick={onSubmit}
                disabled={loading || !form.title?.trim()}
                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEdit ? "bg-slate-800 hover:bg-slate-900" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {/* shimmer while loading */}
                {loading && (
                  <motion.span
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {loading ? (
                  <>
                    <BouncingDots />
                    <span>{isEdit ? "Saving" : "Creating"}</span>
                  </>
                ) : (
                  <>
                    <span>{isEdit ? "Save Changes" : "Create Project"}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

      </DialogContent>
    </Dialog>
  );
}

export default Page;
