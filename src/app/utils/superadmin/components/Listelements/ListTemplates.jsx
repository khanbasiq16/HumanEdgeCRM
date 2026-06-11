"use client";
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  NotepadText, Search, SlidersHorizontal, FileText,
  Building2, ArrowRight, FileCheck, FileSignature,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import TemplateDialog from "../dialog/TemplateDialog";

/* ── Stat chip ─────────────────────────────────────────── */
const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

/* ── Skeleton card ─────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-slate-100 rounded w-full" />
    <div className="flex items-center justify-between">
      <div className="h-6 bg-slate-100 rounded-full w-28" />
      <div className="h-8 bg-slate-100 rounded-lg w-28" />
    </div>
  </div>
);

/* ── Template card ─────────────────────────────────────── */
const TemplateCard = ({ template, onClick }) => {
  const isContract = template.role === "Admin" || template.role === "Contract";
  const logoSrc    = template.company?.companylogo || template.company?.companyLogo;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:shadow-[0_4px_20px_0_rgba(59,130,246,0.08)] transition-all duration-200 flex flex-col cursor-pointer overflow-hidden"
    >
      {/* Card top accent */}
      <div className={`h-1 w-full ${isContract ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`} />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Logo or icon */}
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
            {logoSrc ? (
              <img src={logoSrc} alt={template.company?.name} className="w-full h-full object-contain" />
            ) : (
              <Building2 size={18} className="text-slate-400" />
            )}
          </div>

          {/* Name + company */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
              {template.templateName || "Untitled Template"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <Building2 size={10} />
              {template.company?.name || "—"}
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border
            ${isContract
              ? "bg-violet-50 text-violet-700 border-violet-200"
              : "bg-blue-50 text-blue-700 border-blue-200"}
          `}>
            {isContract
              ? <FileSignature size={10} />
              : <FileCheck size={10} />}
            {isContract ? "Contract" : "Employee Letter"}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
            Open Editor <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ────────────────────────────────────── */
const ListTemplates = ({ loading }) => {
  const router = useRouter();
  const { templates: rawTemplates } = useSelector((s) => s.Templates);
  const templates = Array.isArray(rawTemplates) ? rawTemplates : [];

  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("all");

  const filtered = useMemo(() =>
    templates.filter((t) => {
      const matchSearch = (t.templateName || "").toLowerCase().includes(search.toLowerCase()) ||
                          (t.company?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType   = filterType === "all" ||
                          (filterType === "contract" && (t.role === "Admin" || t.role === "Contract")) ||
                          (filterType === "letter"   && t.role !== "Admin" && t.role !== "Contract");
      return matchSearch && matchType;
    }),
  [templates, search, filterType]);

  const total     = templates.length;
  const contracts = templates.filter((t) => t.role === "Admin").length;
  const letters   = total - contracts;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        {/* Stats skeleton */}
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
        {/* Toolbar skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex gap-3 items-center">
          <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
          <div className="h-9 w-44 bg-slate-100 rounded-lg" />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Stats */}
      {total > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatChip label="Total"            value={total}     colorClass="bg-slate-50 border-slate-200 text-slate-700" />
          <StatChip label="Contracts"        value={contracts} colorClass="bg-violet-50 border-violet-200 text-violet-700" />
          <StatChip label="Employee Letters" value={letters}   colorClass="bg-blue-50 border-blue-200 text-blue-700" />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-full sm:w-44 text-sm bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="letter">Employee Letters</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <NotepadText size={28} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">
              {search || filterType !== "all" ? "No templates match your filters" : "No templates yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search || filterType !== "all" ? "Try adjusting your search or filter" : "Create your first template to get started"}
            </p>
          </div>
          {!search && filterType === "all" && <TemplateDialog />}
        </div>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => router.push(
                template.role === "Admin"
                  ? `/contract-editor/${template.id}`
                  : `/employee-letter-canvas/${template.id}`
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListTemplates;
