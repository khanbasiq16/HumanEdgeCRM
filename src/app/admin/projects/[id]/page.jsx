"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, Search, Loader2, User, Calendar, MessageSquare,
  ChevronRight, Send, Save, CheckCircle2, Users, UserPlus, X, AlertCircle,
  Pencil, Trash2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TASK_STATUS = {
  pending:      { label: "Pending",     bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  "in-progress":{ label: "In Progress", bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  working:      { label: "Working",     bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  completed:    { label: "Completed",   bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
};
const PRIORITY_STYLE = {
  low:    "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-red-100   text-red-600",
};

export default function ProjectDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user } = useSelector((s) => s.User);

  const [project,    setProject]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [members,    setMembers]    = useState([]);  // project team members
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [sf,         setSf]         = useState("all");

  // Edit project dialog
  const [editOpen,   setEditOpen]   = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm,   setEditForm]   = useState({ title: "", description: "", priority: "medium", status: "active", deadline: "" });

  // Delete project dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Add member dialog
  const [memberOpen,      setMemberOpen]      = useState(false);
  const [selectedMember,  setSelectedMember]  = useState("");
  const [addingMember,    setAddingMember]    = useState(false);
  const [removingId,      setRemovingId]      = useState(null);
  const [memberSearch,    setMemberSearch]    = useState("");

  // Create task dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [taskForm,   setTaskForm]   = useState({
    title: "", description: "", assignedTo: "", priority: "medium", dueDate: "",
  });

  // Task detail dialog
  const [selTask,         setSelTask]         = useState(null);
  const [taskOpen,        setTaskOpen]        = useState(false);
  const [newComment,      setNewComment]      = useState("");
  const [addingComment,   setAddingComment]   = useState(false);
  const [remark,          setRemark]          = useState("");
  const [savingRemark,    setSavingRemark]    = useState(false);
  const [updatingStatus,  setUpdatingStatus]  = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, empRes] = await Promise.all([
        axios.get(`/api/projects/${id}`),
        axios.get(`/api/tasks/get-by-project/${id}`),
        axios.get("/api/get-all-employees"),
      ]);
      const proj = projRes.data.project || null;
      setProject(proj);
      setTasks(tasksRes.data.tasks || []);
      setEmployees(empRes.data.employees || []);
      setMembers(proj?.members || []);
    } catch { toast.error("Failed to load project"); }
    finally   { setLoading(false); }
  };

  const openEditProject = () => {
    setEditForm({
      title:       project?.title || "",
      description: project?.description || "",
      priority:    project?.priority || "medium",
      status:      project?.status || "active",
      deadline:    project?.deadline || "",
    });
    setEditOpen(true);
  };

  const handleEditProject = async () => {
    if (!editForm.title.trim()) return toast.error("Title is required");
    setEditSaving(true);
    try {
      await axios.patch(`/api/projects/${id}`, editForm);
      setProject((p) => ({ ...p, ...editForm }));
      toast.success("Project updated!");
      setEditOpen(false);
    } catch { toast.error("Failed to update project"); }
    finally   { setEditSaving(false); }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/projects/${id}`);
      toast.success("Project deleted");
      router.push("/admin/projects");
    } catch { toast.error("Failed to delete project"); }
    finally   { setDeleting(false); }
  };

  // Employees not yet in the project
  const availableToAdd = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    return employees.filter((e) => !memberIds.has(e.id));
  }, [employees, members]);

  const filteredAvailable = useMemo(() => {
    if (!memberSearch.trim()) return availableToAdd;
    const q = memberSearch.toLowerCase();
    return availableToAdd.filter(
      (e) => e.employeeName?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q)
    );
  }, [availableToAdd, memberSearch]);

  const handleAddMember = async () => {
    if (!selectedMember) return toast.error("Please select an employee");
    const emp = employees.find((e) => e.id === selectedMember);
    if (!emp) return;
    setAddingMember(true);
    try {
      const newMember = { id: emp.id, name: emp.employeeName, department: emp.department || "", status: "pending" };
      const updated   = [...members, newMember];

      await Promise.all([
        axios.patch(`/api/projects/${id}`, { members: updated }),
        axios.post("/api/employee-notifications/create", {
          employeeId:   emp.id,
          type:         "project_invite",
          title:        "Project Invitation",
          body:         `You have been invited to join "${project?.title || "a project"}". Accept to become a team member.`,
          projectId:    id,
          projectTitle: project?.title || "",
        }),
      ]);

      setMembers(updated);
      setSelectedMember("");
      setMemberSearch("");
      setMemberOpen(false);
      toast.success(`Invitation sent to ${emp.employeeName}`);
    } catch { toast.error("Failed to send invitation"); }
    finally   { setAddingMember(false); }
  };

  const handleRemoveMember = async (memberId) => {
    setRemovingId(memberId);
    try {
      const updated = members.filter((m) => m.id !== memberId);
      await axios.patch(`/api/projects/${id}`, { members: updated });
      setMembers(updated);
      toast.success("Member removed");
    } catch { toast.error("Failed to remove member"); }
    finally   { setRemovingId(null); }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.assignedTo) {
      return toast.error("Title and assignee are required");
    }
    setCreating(true);
    try {
      const member = members.find((m) => m.id === taskForm.assignedTo);
      const res = await axios.post("/api/tasks/create", {
        ...taskForm,
        type:           "project",
        source:         "admin",
        projectId:      id,
        projectTitle:   project?.title || "",
        assignedToName: member?.name || "",
        createdBy:      user?.employeeName || user?.name || "Admin",
      });
      if (res.data.success) {
        toast.success("Task created!");
        setTasks((t) => [res.data.task, ...t]);
        setCreateOpen(false);
        setTaskForm({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
      }
    } catch { toast.error("Failed to create task"); }
    finally   { setCreating(false); }
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

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (sf !== "all") list = list.filter((t) => t.status === sf);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title?.toLowerCase().includes(q) || t.assignedToName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, sf, search]);

  const tc = useMemo(() => ({
    total:        tasks.length,
    completed:    tasks.filter((t) => t.status === "completed").length,
    "in-progress":tasks.filter((t) => t.status === "in-progress").length,
    working:      tasks.filter((t) => t.status === "working").length,
    pending:      tasks.filter((t) => t.status === "pending").length,
  }), [tasks]);

  if (loading) return (
    <SuperAdminlayout>
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    </SuperAdminlayout>
  );

  return (
    <SuperAdminlayout>
      <section className="w-full max-w-6xl">
        <Superbreadcrumb path={`Projects / ${project?.title || "Project"}`} />

        {/* Back + header */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => router.push("/admin/projects")}
            className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 truncate">{project?.title}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_STYLE[project?.priority] || PRIORITY_STYLE.medium}`}>
                {project?.priority?.toUpperCase()}
              </span>
            </div>
            {project?.description && (
              <div
                className="text-sm text-slate-400 mt-0.5 prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openEditProject}
              className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-400 bg-white transition-all"
              title="Edit project"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-xl border border-slate-200 hover:border-red-400 hover:text-red-500 text-slate-400 bg-white transition-all"
              title="Delete project"
            >
              <Trash2 size={15} />
            </button>
            <Button
              onClick={() => {
                if (members.length === 0) {
                  toast.error("Add at least one team member before creating tasks");
                  return;
                }
                setCreateOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
            >
              <Plus size={15} /> Add Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",       val: tc.total,          cls: "" },
            { label: "Completed",   val: tc.completed,      cls: "bg-emerald-50 border-emerald-200" },
            { label: "In Progress", val: tc["in-progress"], cls: "bg-blue-50 border-blue-200"       },
            { label: "Pending",     val: tc.pending,        cls: "" },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 p-4 text-center ${cls}`}>
              <p className="text-2xl font-extrabold text-slate-900">{val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Team Members Section ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <h2 className="text-sm font-extrabold text-slate-800">Team Members</h2>
              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                {members.length}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => { setMemberOpen(true); setMemberSearch(""); setSelectedMember(""); }}
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs h-8 px-3 flex items-center gap-1.5"
              disabled={availableToAdd.length === 0}
            >
              <UserPlus size={13} /> Add Member
            </Button>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle size={28} className="text-amber-400" />
              <p className="text-sm font-semibold text-amber-700">No team members yet</p>
              <p className="text-xs text-amber-500 text-center max-w-xs">
                Add team members to this project first. Only team members can be assigned tasks.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const isPending = m.status === "pending";
                return (
                  <div
                    key={m.id}
                    className={`inline-flex items-center gap-2 border rounded-xl px-3 py-2 ${
                      isPending ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isPending ? "bg-amber-400" : "bg-blue-600"
                    }`}>
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-none">{m.name}</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${isPending ? "text-amber-500" : "text-emerald-500"}`}>
                        {isPending ? "Pending" : "Accepted"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={removingId === m.id}
                      className="ml-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {removingId === m.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <X size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            {[["all","All"],["pending","Pending"],["in-progress","In Progress"],["working","Working"],["completed","Completed"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSf(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  sf === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >{l}</button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8 rounded-xl border-slate-200 text-sm w-full sm:w-52" placeholder="Search tasks…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 size={36} className="text-slate-200" />
            <p className="text-slate-400 text-sm font-medium">No tasks found</p>
            {members.length === 0 && (
              <p className="text-xs text-amber-500 font-medium">Add team members above to start creating tasks</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const sc = TASK_STATUS[task.status] || TASK_STATUS.pending;
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
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><User size={10} />{task.assignedToName || "Unassigned"}</span>
                      {task.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />{new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {(task.comments?.length > 0) && (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><MessageSquare size={10} />{task.comments.length}</span>
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

        {/* ── Edit Project Dialog ───────────────────────────────── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil size={15} className="text-blue-500" /> Edit Project
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title *</label>
                <Input className="rounded-xl border-slate-200" placeholder="Project title…"
                  value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
                <Textarea className="rounded-xl border-slate-200 resize-none" placeholder="What is this project about…" rows={3}
                  value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger className="rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Status</label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger className="rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Deadline</label>
                <Input type="date" className="rounded-xl border-slate-200"
                  value={editForm.deadline} onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleEditProject} disabled={editSaving}>
                {editSaving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Saving…</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Project Dialog ──────────────────────────────── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} /> Delete Project
              </DialogTitle>
            </DialogHeader>
            <div className="my-3 space-y-3">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{project?.title}"</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600 font-semibold">This will permanently delete:</p>
                <ul className="text-xs text-red-500 mt-1 space-y-0.5 list-disc list-inside">
                  <li>The project and all its settings</li>
                  <li>All {tasks.length} task{tasks.length !== 1 ? "s" : ""} in this project</li>
                  <li>All team member assignments</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={handleDeleteProject} disabled={deleting}>
                {deleting ? <><Loader2 size={14} className="animate-spin mr-1.5" />Deleting…</> : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Add Member Dialog ──────────────────────────────────── */}
        <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
          <DialogContent className="sm:max-w-sm rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus size={16} className="text-blue-500" /> Add Team Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-8 rounded-xl border-slate-200 text-sm"
                  placeholder="Search employees…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
                {filteredAvailable.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {availableToAdd.length === 0 ? "All employees are already in this project" : "No employees match your search"}
                  </p>
                ) : (
                  filteredAvailable.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedMember(emp.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all ${
                        selectedMember === emp.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {emp.employeeName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{emp.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{emp.department || "—"}</p>
                      </div>
                      {selectedMember === emp.id && (
                        <CheckCircle2 size={14} className="text-blue-500 ml-auto shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setMemberOpen(false)} disabled={addingMember}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                onClick={handleAddMember}
                disabled={addingMember || !selectedMember}
              >
                {addingMember ? <><Loader2 size={14} className="animate-spin mr-1.5" />Adding…</> : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Create Task Dialog ─────────────────────────────────── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader><DialogTitle className="text-base font-bold">New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Task Title *</label>
                <Input className="rounded-xl border-slate-200" placeholder="What needs to be done…"
                  value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
                <Textarea className="rounded-xl border-slate-200 resize-none" placeholder="Task details…" rows={2}
                  value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Assign To *</label>
                <Select value={taskForm.assignedTo} onValueChange={(v) => setTaskForm((f) => ({ ...f, assignedTo: v }))}>
                  <SelectTrigger className="rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Select team member…" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.department || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 mt-1">Only project team members can be assigned tasks</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v }))}>
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
                    value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleCreateTask} disabled={creating}>
                {creating ? <><Loader2 size={14} className="animate-spin mr-1.5" />Creating…</> : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Task Detail Dialog ─────────────────────────────────── */}
        {selTask && (
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Task header */}
              <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-extrabold text-slate-900">{selTask.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[selTask.priority] || PRIORITY_STYLE.medium}`}>
                        {selTask.priority?.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><User size={10} />{selTask.assignedToName}</span>
                      {selTask.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />{new Date(selTask.dueDate).toLocaleDateString("en-US", { day:"numeric", month:"short", year:"numeric" })}
                        </span>
                      )}
                    </div>
                    {selTask.description && <p className="text-xs text-slate-500 mt-2">{selTask.description}</p>}
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
                    <Button size="sm"
                      className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs h-7 px-3"
                      onClick={handleSaveRemark} disabled={savingRemark}
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
                              <span className="text-[10px] text-slate-400 mt-0.5">{c.authorName} · {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
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
      </section>
    </SuperAdminlayout>
  );
}
