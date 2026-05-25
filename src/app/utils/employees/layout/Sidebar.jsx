"use client";
import React, { useState, useEffect } from "react";
import {
  Home, Calendar, LogOut, Users, PersonStanding, CardSim,
  Settings, ArrowLeft, ChevronLeft, ChevronRight,
  ClipboardCheck, Building, FileText, ClipboardList, Mail,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { logout } from "@/features/Slice/UserSlice";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { resetTimer } from "@/features/Slice/StopwatchSlice";
import { resetCheckIn } from "@/features/Slice/CheckInSlice";
import { resetCheckOut } from "@/features/Slice/CheckOutSlice";

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.User);
  const [unreadLetters, setUnreadLetters] = useState(0);

  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    axios.get(`/api/letters/employee?employeeId=${eid}`)
      .then(res => {
        const unread = (res.data.letters || []).filter(l => !l.isRead).length;
        setUnreadLetters(unread);
      })
      .catch(() => {});
  }, [user, pathname]);

  const segments     = pathname.split("/");
  const employeeSlug = segments[2] || "";

  /* ── nav links ─────────────────────────────────────────── */
  let dashboardLinks = [
    { href: `/employee/${employeeSlug}`,             label: "Dashboard",  icon: Home,          badge: null },
    { href: `/employee/${employeeSlug}/attendance`,  label: "Attendance", icon: Calendar,      badge: null },
    { href: `/employee/${employeeSlug}/tasks`,       label: "My Tasks",   icon: ClipboardList, badge: null },
    { href: `/employee/${employeeSlug}/letters`,     label: "My Letters", icon: Mail,          badge: unreadLetters || null },
  ];

  if (user?.department?.departmentName?.toLowerCase() === "sales") {
    dashboardLinks.splice(1, 0, {
      href: `/employee/${employeeSlug}/companies`,
      label: "Companies",
      icon: Building,
    });
  }

  const parts     = pathname.split("/");
  const companyId = parts[4] || null;
  const isInCompany = pathname.startsWith(`/employee/${employeeSlug}/company`);

  const companyDetailsLinks = companyId ? [
    { href: `/employee/${employeeSlug}/company/${companyId}`,           label: "General",   icon: Home },
    { href: `/employee/${employeeSlug}/company/${companyId}/clients`,   label: "Clients",   icon: PersonStanding },
    { href: `/employee/${employeeSlug}/company/${companyId}/invoices`,  label: "Invoices",  icon: CardSim },
    { href: `/employee/${employeeSlug}/company/${companyId}/contracts`, label: "Contracts", icon: FileText },
  ] : [];

  const links = isInCompany ? companyDetailsLinks : dashboardLinks;

  const isSettingsActive  = pathname === `/employee/${employeeSlug}/settings`;
  const isAttendanceActive = pathname === `/employee/${employeeSlug}/mark-attendance`;

  /* ── logout ─────────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      const res = await axios.get("/api/logout");
      if (res.data.success) {
        dispatch(logout());
        dispatch(resetTimer());
        dispatch(resetCheckIn());
        dispatch(resetCheckOut());
        router.push("/");
        toast.success("Logged out successfully");
      }
    } catch {
      toast.error("Failed to logout");
    }
  };

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
        {/* ── Collapse handle (floating circle like admin) ── */}
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
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1">{link.label}</span>
                )}
                {link.badge && !collapsed && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                    {link.badge}
                  </span>
                )}
                {link.badge && collapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom actions ─────────────────────────────── */}
        <div className="px-2 py-3 border-t border-slate-100 space-y-0.5">

          {/* Mark Attendance — primary CTA */}
          <Link
            href={`/employee/${employeeSlug}/mark-attendance`}
            title={collapsed ? "Mark Attendance" : ""}
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-1
              ${isAttendanceActive
                ? "bg-blue-700 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"}
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <ClipboardCheck size={18} className="shrink-0" />
            {!collapsed && <span>Mark Attendance</span>}
          </Link>

          {isInCompany && (
            <Link
              href={`/employee/${employeeSlug}`}
              title={collapsed ? "Back" : ""}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <ArrowLeft size={18} className="shrink-0 text-slate-400" />
              {!collapsed && <span>Back</span>}
            </Link>
          )}

          <Link
            href={`/employee/${employeeSlug}/settings`}
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

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : ""}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
