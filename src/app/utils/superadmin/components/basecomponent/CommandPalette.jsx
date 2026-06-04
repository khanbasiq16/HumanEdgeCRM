"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Building2, Users, ClipboardList,
  Receipt, Settings, FileText, Landmark, Calculator, Wallet,
  User, X, Loader2, CornerDownLeft, Layers, FolderKanban,
  Megaphone, CardSim, UserCog, Calendar, BarChart3,
} from "lucide-react";
import axios from "axios";

/* ── Static page links — must mirror Sidebar.jsx exactly ── */
const PAGES = [
  { label: "Dashboard",           sub: "Overview & stats",              href: "/admin",                    icon: LayoutDashboard, permission: null            },
  { label: "Companies",           sub: "Manage all companies",          href: "/admin/companies",          icon: Building2,       permission: "companies"     },
  { label: "Employees",           sub: "View & manage staff",           href: "/admin/employees",          icon: Users,           permission: "employees"     },
  { label: "Departments",         sub: "Manage departments",            href: "/admin/departments",        icon: Layers,          permission: "employees"     },
  { label: "Templates",           sub: "Letter & contract templates",   href: "/admin/templates",          icon: FileText,        permission: "templates"     },
  { label: "Attendance",          sub: "Daily attendance records",      href: "/admin/attendance",         icon: Calendar,        permission: "attendance"    },
  { label: "Salary Report",       sub: "Attendance & salary report",    href: "/admin/attendance/report",  icon: BarChart3,       permission: "attendance"    },
  { label: "Announcements",       sub: "Broadcast announcements",       href: "/admin/announcements",      icon: Megaphone,       permission: "announcements" },
  { label: "Projects",            sub: "Manage projects",               href: "/admin/projects",           icon: FolderKanban,    permission: "tasks"         },
  { label: "All Tasks",           sub: "View and manage tasks",         href: "/admin/tasks",              icon: ClipboardList,   permission: "tasks"         },
  { label: "Accounts",            sub: "Financial accounts",            href: "/admin/accounts",           icon: Wallet,          permission: "accounts"      },
  { label: "Bank Accounts",       sub: "Bank & payment accounts",       href: "/admin/banks",              icon: Landmark,        permission: "accounts"      },
  { label: "Taxes",               sub: "Tax configurations",            href: "/admin/taxes",              icon: Calculator,      permission: "accounts"      },
  { label: "Expenses",            sub: "Expense tracking",              href: "/admin/expenses",           icon: Receipt,         permission: "accounts"      },
  { label: "Invoices",            sub: "Company invoices & billing",    href: "/admin/invoices",           icon: CardSim,         permission: "invoice"       },
  { label: "Admin Members",       sub: "Manage admin team members",     href: "/admin/settings",           icon: UserCog,         permission: "members"       },
  { label: "Settings",            sub: "System preferences",            href: "/admin/settings",           icon: Settings,        permission: "settings"      },
];

const TYPE_ICON  = { employee: User,      company: Building2, template: FileText  };
const TYPE_BADGE = {
  employee: "bg-blue-50 text-blue-600 border border-blue-100",
  company:  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  template: "bg-violet-50 text-violet-600 border border-violet-100",
};

/* ── Highlight matching text ── */
const Highlight = ({ text = "", query = "" }) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-100 text-blue-700 rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

/* ── Group label ── */
const GroupLabel = ({ children }) => (
  <p className="px-2 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
    {children}
  </p>
);

/* ══ CommandPalette ══════════════════════════════════════════ */
export default function CommandPalette({ open, onClose, permissions = [], role }) {
  const isSuperAdmin = role === "superAdmin";
  const router   = useRouter();
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState({ employees: [], companies: [], templates: [] });
  const [loading,   setLoading]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const canSee = (permission) => !permission || isSuperAdmin || permissions.includes(permission);

  /* filtered static pages */
  const filteredPages = PAGES.filter(p =>
    canSee(p.permission) && (
      !query.trim() ||
      p.label.toLowerCase().includes(query.toLowerCase()) ||
      p.sub.toLowerCase().includes(query.toLowerCase())
    )
  );

  const visibleEmployees = canSee("employees") ? results.employees : [];
  const visibleCompanies = canSee("companies") ? results.companies : [];
  const visibleTemplates = canSee("templates") ? results.templates : [];

  const allItems = [
    ...filteredPages.map(p  => ({ ...p,  category: "pages"     })),
    ...visibleEmployees.map(e => ({ ...e, icon: User,      category: "employees" })),
    ...visibleCompanies.map(c => ({ ...c, icon: Building2, category: "companies" })),
    ...visibleTemplates.map(t => ({ ...t, icon: FileText,  category: "templates" })),
  ];

  /* debounced server search */
  const debounceRef = useRef(null);
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults({ employees: [], companies: [], templates: [] }); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setActiveIdx(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 220);
  };

  /* reset on open */
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ employees: [], companies: [], templates: [] });
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Ctrl+K global */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); if (open) onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* keyboard nav inside palette */
  const handleKeyDown = (e) => {
    if (e.key === "Escape")    { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[activeIdx]) navigate(allItems[activeIdx].href);
  };

  /* scroll active into view */
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const navigate = (href) => { router.push(href); onClose(); };
  const clearQ   = () => { setQuery(""); setResults({ employees: [], companies: [], templates: [] }); inputRef.current?.focus(); };

  if (!open) return null;

  const hasServer = visibleEmployees.length > 0 || visibleCompanies.length > 0 || visibleTemplates.length > 0;

  /* render one group of items */
  const renderGroup = (label, items, category) => {
    if (!items.length) return null;
    return (
      <div key={label}>
        <GroupLabel>{label}</GroupLabel>
        {items.map((item) => {
          const gi = allItems.findIndex(
            a => a.href === item.href && a.label === item.label && a.category === category
          );
          const Icon     = item.icon || TYPE_ICON[item.type];
          const isActive = gi === activeIdx;
          return (
            <button
              key={item.id || item.href}
              data-idx={gi}
              onMouseEnter={() => setActiveIdx(gi)}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                isActive ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              {/* Icon badge */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                item.type ? TYPE_BADGE[item.type] : "bg-slate-100 text-slate-500"
              }`}>
                {Icon && <Icon size={14} />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                  <Highlight text={item.label} query={query} />
                </p>
                {item.sub && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    <Highlight text={item.sub} query={query} />
                  </p>
                )}
              </div>

              {/* Enter hint */}
              {isActive && (
                <div className="shrink-0 w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <CornerDownLeft size={11} className="text-blue-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Palette container */}
      <div className="fixed z-[101] top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-[600px] px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden">

          {/* ── Search input row ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            {loading
              ? <Loader2 size={16} className="text-slate-400 shrink-0 animate-spin" />
              : <Search size={16} className="text-slate-400 shrink-0" />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search employees, companies, pages…"
              className="flex-1 bg-transparent outline-none text-slate-800 text-sm placeholder:text-slate-400 caret-blue-600"
            />
            {query && (
              
              <button onClick={clearQ} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-mono shrink-0">
              Esc
            </kbd>
          </div>

          {/* ── Results list ── */}
          <div
            ref={listRef}
            className="max-h-[400px] overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Pages */}
            {renderGroup("Pages", filteredPages.map(p => ({ ...p, category: "pages" })), "pages")}

            {/* Server results */}
            {hasServer && <>
              {renderGroup("Employees", visibleEmployees, "employees")}
              {renderGroup("Companies", visibleCompanies, "companies")}
              {renderGroup("Templates", visibleTemplates, "templates")}
            </>}

            {/* Empty state */}
            {allItems.length === 0 && !loading && query && (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search size={18} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">No results for <span className="font-semibold text-slate-700">"{query}"</span></p>
                <p className="text-xs text-slate-400 mt-1">Try a different keyword</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 shadow-sm">Esc</kbd>
                close
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">HumanEdge</span>
          </div>
        </div>
      </div>
    </>
  );
}
