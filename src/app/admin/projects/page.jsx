"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FolderKanban, Plus, Search, ChevronRight, Loader2, Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const Page = () => {
  const { user }  = useSelector((s) => s.User);
  const router    = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [open,     setOpen]     = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", status: "active", deadline: "",
  });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects/get-all");
      setProjects(res.data.projects || []);
    } catch { toast.error("Failed to load projects"); }
    finally   { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setCreating(true);
    try {
      const res = await axios.post("/api/projects/create", {
        ...form,
        createdBy: user?.employeeName || user?.name || "Admin",
      });
      if (res.data.success) {
        toast.success("Project created!");
        setProjects((p) => [res.data.project, ...p]);
        setOpen(false);
        setForm({ title: "", description: "", priority: "medium", status: "active", deadline: "" });
      }
    } catch { toast.error("Failed to create project"); }
    finally   { setCreating(false); }
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
            onClick={() => setOpen(true)}
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[proj.priority] || PRIORITY_STYLE.medium}`}>
                      {proj.priority?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
                    {proj.description || "No description provided."}
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

        {/* Create Project Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title *</label>
                <Input
                  className="rounded-xl border-slate-200"
                  placeholder="Project title…"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
                <Textarea
                  className="rounded-xl border-slate-200 resize-none"
                  placeholder="What is this project about…"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
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
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
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
                <Input
                  type="date"
                  className="rounded-xl border-slate-200"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 size={14} className="animate-spin mr-1.5" />Creating…</> : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </SuperAdminlayout>
  );
};

export default Page;
