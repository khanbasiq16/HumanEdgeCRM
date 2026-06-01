"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

const stripHtml = (html) => html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
import {
  FolderKanban, Loader2, Calendar, ChevronRight, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

export default function EmployeeProjectsPage() {
  const { user }    = useSelector((s) => s.User);
  const { slug }    = useParams();
  const router      = useRouter();
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");

  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    axios.get(`/api/projects/employee/${eid}`)
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

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
    <Employeelayout>
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">My Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">{counts.all} project{counts.all !== 1 ? "s" : ""} you&apos;re part of</p>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[["all","All"],["active","Active"],["on-hold","On Hold"],["completed","Completed"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filter === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}>
                {l} <span className="ml-1 opacity-60">{counts[v] ?? ""}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8 rounded-xl border-slate-200 text-sm w-full sm:w-56"
              placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-slate-200">
            <FolderKanban size={40} className="text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">
              {projects.length === 0 ? "You haven't been added to any projects yet" : "No projects match your search"}
            </p>
            {projects.length === 0 && (
              <p className="text-xs text-slate-400 text-center max-w-xs">
                When an admin invites you to a project and you accept, it will appear here.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((proj) => {
              const sc = STATUS_STYLE[proj.status] || STATUS_STYLE.active;
              const myMember = (proj.members || []).find(
                (m) => m.id === (user?.employeeId || user?.id)
              );
              return (
                <div key={proj.id}
                  onClick={() => router.push(`/employee/${slug}/projects/${proj.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[proj.priority] || PRIORITY_STYLE.medium}`}>
                      {proj.priority?.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
                    {proj.description ? stripHtml(proj.description) : "No description provided."}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {proj.deadline
                          ? new Date(proj.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                          : "No deadline"}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                        {(proj.members || []).filter((m) => m.status === "accepted").length} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {myMember && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          myMember.status === "accepted" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        }`}>
                          {myMember.status === "accepted" ? "Member" : "Pending"}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Employeelayout>
  );
}
