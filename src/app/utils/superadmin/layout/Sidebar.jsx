"use client";
import React, { useState, useEffect } from "react";
import {
  Home, Calendar, LogOut, Users, PersonStanding, CardSim,
  NotepadTextDashed, Settings, ArrowLeft, Building, DollarSign,
  Receipt, BadgeDollarSign, ChevronLeft, ChevronRight, Landmark, Layers,
  FolderKanban, ClipboardList, BarChart3, ChevronDown, Megaphone, UserCog,
  CalendarCheck,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { logout } from "@/features/Slice/UserSlice";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.User);

  const isAttendancePath = pathname.startsWith("/admin/attendance");
  const [attendanceOpen, setAttendanceOpen] = useState(isAttendancePath);
  // FIX 7: sync accordion state when pathname changes (e.g. browser back/forward, direct URL)
  useEffect(() => { if (isAttendancePath) setAttendanceOpen(true); }, [isAttendancePath]);

  /* ── nav data ──────────────────────────────────────────── */
  const isSuperAdmin = user?.role === "superAdmin";
  const perms        = user?.permissions || [];
  const can          = (p) => isSuperAdmin || perms.includes(p);

  const allDashboardLinks = [
    { href: "/admin",               label: "Dashboard",     icon: Home,             perm: null              },
    { href: "/admin/companies",     label: "Companies",     icon: Building,         perm: "companies"       },
    { href: "/admin/clients",       label: "Clients",       icon: PersonStanding,   perm: "companies"       },
    { href: "/admin/employees",     label: "Employees",     icon: Users,            perm: "employees"       },
    { href: "/admin/departments",   label: "Departments",   icon: Layers,           perm: "employees"       },
    { href: "/admin/templates",     label: "Templates",     icon: NotepadTextDashed,perm: "templates"       },
    { type: "attendance-group",     perm: "attendance"                                                      },
    { href: "/admin/leaves",        label: "Leave Applications", icon: CalendarCheck, perm: "attendance"    },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone,        perm: "announcements"   },
    { href: "/admin/projects",      label: "Projects",      icon: FolderKanban,     perm: "tasks"           },
    { href: "/admin/tasks",         label: "All Tasks",     icon: ClipboardList,    perm: "tasks"           },
    { href: "/admin/accounts",      label: "Accounts",      icon: DollarSign,       perm: "accounts"        },
    { href: "/admin/banks",         label: "Bank Accounts", icon: Landmark,         perm: "accounts"        },
    { href: "/admin/taxes",         label: "Taxes",         icon: BadgeDollarSign,  perm: "accounts"        },
    { href: "/admin/expenses",      label: "Expenses",      icon: Receipt,          perm: "accounts"        },
    { href: "/admin/invoices",      label: "Invoices",      icon: CardSim,          perm: "invoice"         },
    { href: "/admin/members",        label: "Members",       icon: UserCog,          perm: "members"         },
  ];

  const attendanceSubLinks = [
    { href: "/admin/attendance",        label: "All Employee Attendance" },
    { href: "/admin/attendance/report", label: "Salary Report"            },
  ];

  const dashboardLinks = allDashboardLinks.filter((l) => l.perm === null || can(l.perm));

  const parts     = pathname.split("/");
  const companyId = pathname.startsWith("/admin/company/") ? parts[3] : null;
  const bankId    = pathname.startsWith("/admin/bank/")    ? parts[3] : null;

  const companyDetailsLinks = companyId ? [
    { href: `/admin/company/${companyId}`,           label: "General",   icon: Home },
    { href: `/admin/company/${companyId}/clients`,   label: "Clients",   icon: PersonStanding },
    { href: `/admin/company/${companyId}/invoices`,  label: "Invoices",  icon: CardSim },
    { href: `/admin/company/${companyId}/templates`, label: "Templates", icon: NotepadTextDashed },
  ] : [];

  const bankDetailsLinks = bankId ? [
    { href: `/admin/bank/${bankId}`,          label: "General",  icon: Home },
    { href: `/admin/bank/${bankId}/transfer`, label: "Transfer", icon: NotepadTextDashed },
    { href: `/admin/bank/${bankId}/loans`,    label: "Loans",    icon: BadgeDollarSign },
  ] : [];

  let links = dashboardLinks;
  if (pathname.startsWith("/admin/company/")) links = companyDetailsLinks;
  if (pathname.startsWith("/admin/bank/"))    links = bankDetailsLinks;

  const showBackButton =
    pathname.startsWith("/admin/company/") || pathname.startsWith("/admin/bank/");

  /* ── logout ────────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      const res = await axios.get("/api/logout");
      if (res.data.success) {
        dispatch(logout());
        router.push("/superadmin/sign-in");
        toast.success("Logged out successfully");
      }
    } catch {
      toast.error("Logout failed");
    }
  };

  const isSettingsActive = pathname === "/admin/settings";

  /* ── render ─────────────────────────────────────────────── */
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-[73px] left-0 z-40 bg-white border-r border-slate-200
          flex flex-col h-[calc(100vh-73px)] overflow-visible
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Collapse handle ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
            hidden lg:flex absolute -right-3 top-5 z-50
            w-6 h-6 items-center justify-center
            rounded-full bg-white border border-slate-200 shadow-md
            text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-blue-100
            transition-all duration-200
          "
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>

        {/* ── Nav links ──────────────────────────────────── */}
        <nav className="flex-1 px-2 pt-3 pb-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {links.map((link) => {
            /* ── Attendance expandable group (sentinel) ── */
            if (link.type === "attendance-group") {
              return (
                <div key="attendance-group" className="mb-0.5">
                  {/* FIX 8: collapsed state → Link navigates directly; expanded → button toggles submenu */}
                  {collapsed ? (
                    <Link
                      href="/admin/attendance"
                      title="Attendance"
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-lg
                        text-sm font-medium transition-all
                        ${isAttendancePath
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                      `}
                    >
                      <Calendar size={18} className={`shrink-0 ${isAttendancePath ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                    </Link>
                  ) : (
                  <button
                    onClick={() => setAttendanceOpen((o) => !o)}
                    className={`
                      w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium transition-all
                      ${isAttendancePath
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                    `}
                  >
                    <Calendar
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isAttendancePath ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span className="flex-1 text-left truncate">Attendance</span>
                    <motion.span
                      animate={{ rotate: attendanceOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown size={14} className={isAttendancePath ? "text-blue-500" : "text-slate-400"} />
                    </motion.span>
                  </button>
                  )}

                  <AnimatePresence initial={false}>
                    {!collapsed && attendanceOpen && (
                      <motion.div
                        key="attendance-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 pl-3 border-l border-slate-200 mt-0.5 space-y-0.5">
                          {attendanceSubLinks.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                  flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all
                                  ${isSubActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                                `}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? "bg-blue-500" : "bg-slate-300"}`} />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            /* ── Regular link ── */
            const Icon     = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : ""}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                  text-sm font-medium transition-all
                  ${isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom actions ─────────────────────────────── */}
        <div className="px-2 py-3 border-t border-slate-100 space-y-0.5">
          {showBackButton && (
            <Link
              href="/admin"
              title={collapsed ? "Back" : ""}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft size={18} className="shrink-0 text-slate-400" />
              {!collapsed && <span>Back</span>}
            </Link>
          )}

          {can("settings") && (
            <Link
              href="/admin/settings"
              title={collapsed ? "Settings" : ""}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isSettingsActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <Settings
                size={18}
                className={`shrink-0 ${isSettingsActive ? "text-blue-600" : "text-slate-400"}`}
              />
              {!collapsed && <span>Settings</span>}
            </Link>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : ""}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Version */}
          <div className={`pt-2 mt-1 border-t border-slate-100 flex ${collapsed ? "justify-center" : "items-center justify-between px-1"}`}>
            {!collapsed && <span className="text-[10px] text-slate-400 font-medium">HumanEdge</span>}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
