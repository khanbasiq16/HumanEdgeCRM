"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Bell, Search, Menu, X, UserCheck, Timer as TimerIcon, Building2, Check, FolderKanban, Loader2, Settings, LogOut, ChevronDown, Megaphone } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/features/Slice/UserSlice";
import { resetTimer } from "@/features/Slice/StopwatchSlice";
import { resetCheckIn } from "@/features/Slice/CheckInSlice";
import { resetCheckOut } from "@/features/Slice/CheckOutSlice";
import toast from "react-hot-toast";
import Timer from "../components/attendance/Timer";
import { usePathname } from "next/navigation";
import EmployeeCommandPalette from "../components/basecomponent/EmployeeCommandPalette";
import axios from "axios";

/* ── Notification panel ─────────────────────────────────── */
const NotificationPanel = ({ notifications, onMarkRead, onAcceptInvite }) => {
  const unread = notifications.filter(n => !n.isRead);

  const fmt = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const iconFor = (type) => {
    if (type === "project_invite")   return { bg: "bg-emerald-100", icon: <FolderKanban size={14} className="text-emerald-600"/> };
    if (type === "company_assigned") return { bg: "bg-violet-100",  icon: <Building2    size={14} className="text-violet-600"/>  };
    if (type === "announcement")     return { bg: "bg-amber-100",   icon: <Megaphone    size={14} className="text-amber-600"/>   };
    return { bg: "bg-blue-100", icon: <Bell size={14} className="text-blue-600"/> };
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800">Notifications</p>
          {unread.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full">{unread.length}</span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={onMarkRead}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Check size={11}/> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <Bell size={20} className="text-slate-200"/>
            <p className="text-xs text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const { bg, icon } = iconFor(n.type);
            const isProjectInvite = n.type === "project_invite";
            const alreadyAccepted = n.status === "accepted";

            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${
                  !n.isRead ? "bg-blue-50/50" : ""
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{fmt(n.createdAt)}</p>

                  {/* Accept button for project invites */}
                  {isProjectInvite && !alreadyAccepted && (
                    <button
                      onClick={() => onAcceptInvite(n)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                    >
                      {n._accepting
                        ? <Loader2 size={11} className="animate-spin"/>
                        : <Check size={11}/>}
                      {n._accepting ? "Accepting…" : "Accept Invite"}
                    </button>
                  )}
                  {isProjectInvite && alreadyAccepted && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check size={11}/> Accepted
                    </span>
                  )}
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"/>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ── Header ─────────────────────────────────────────────── */
const Header = ({ onMobileMenu, mobileOpen }) => {
  const { user }     = useSelector((state) => state.User);
  const dispatch     = useDispatch();
  const router       = useRouter();
  const pathname     = usePathname();
  const segments     = pathname.split("/");
  const employeeSlug = segments[2] || "";

  const [paletteOpen,    setPaletteOpen]    = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [notifications,  setNotifications]  = useState([]);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const notifRef    = useRef(null);
  const dropdownRef = useRef(null);

  const isSales = user?.department?.departmentName?.toLowerCase().includes("sales");

  /* fetch notifications */
  const fetchNotifications = async () => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    try {
      const res = await axios.get(`/api/employee-notifications/${eid}`);
      setNotifications(res.data.notifications || []);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* close notif panel on outside click */
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      const res = await axios.get("/api/logout");
      if (res.data.success) {
        dispatch(logout()); dispatch(resetTimer()); dispatch(resetCheckIn()); dispatch(resetCheckOut());
        router.push("/"); toast.success("Logged out successfully");
      }
    } catch { toast.error("Failed to logout"); }
  };

  /* Ctrl+K */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleMarkRead = async () => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    try {
      await axios.patch(`/api/employee-notifications/${eid}`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleAcceptInvite = async (notification) => {
    const eid = user?.employeeId || user?.id;
    if (!eid || !notification.projectId) return;
    // Mark as accepting in UI
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, _accepting: true } : n)
    );
    try {
      await axios.post("/api/projects/accept-invite", {
        projectId:      notification.projectId,
        employeeId:     eid,
        notificationId: notification.id,
      });
      setNotifications(prev =>
        prev.map(n => n.id === notification.id
          ? { ...n, status: "accepted", isRead: true, _accepting: false }
          : n
        )
      );
    } catch {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, _accepting: false } : n)
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const initials = (name) => {
    if (!name) return "E";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[73px] bg-white border-b border-slate-200 flex items-center px-3 md:px-5 gap-3">

        {/* Mobile menu toggle */}
        <button onClick={onMobileMenu}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0 transition-colors">
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1 shrink-0 sm:w-52">
          <div className="w-9 h-9 flex items-center justify-center p-0.5">
            <Image src="/logo.webp" alt="HumanEdge" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col leading-none gap-0.5">
            <span className="font-extrabold text-slate-900 text-[15px] tracking-tight">HumanEdge</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700 uppercase tracking-wide w-fit">
              <UserCheck size={9} strokeWidth={2.5} /> Employee
            </span>
          </div>
        </div>

        {/* Search (mobile icon) */}
        <button onClick={() => setPaletteOpen(true)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors shrink-0">
          <Search size={15} />
        </button>

        {/* Search bar */}
        <div className="hidden sm:block flex-1 max-w-md mx-auto">
          <button onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-sm hover:border-slate-300 hover:bg-slate-100 transition-colors">
            <Search size={14} className="shrink-0" />
            <span className="flex-1 text-left text-slate-400 text-sm">Search pages…</span>
            <div className="hidden sm:flex items-center gap-0.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono shadow-sm">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono shadow-sm">K</kbd>
            </div>
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto shrink-0">

          {/* Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <TimerIcon size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-blue-600 tabular-nums"><Timer /></span>
          </div>

          {/* Bell — with real notification count */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={18} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {unreadCount === 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notifOpen && (
              <NotificationPanel
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onAcceptInvite={handleAcceptInvite}
              />
            )}
          </div>

          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          {/* User card with dropdown */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {initials(user?.employeeName)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.employeeName || "Employee"}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                  {user?.department?.departmentName || user?.employeeemail}
                </p>
              </div>
              <ChevronDown size={13} className={`text-slate-400 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.employeeName || "Employee"}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.department?.departmentName || user?.employeeemail}</p>
                </div>
                <Link
                  href={`/employee/${employeeSlug}/settings`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400 shrink-0" /> Settings
                </Link>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} className="shrink-0" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <EmployeeCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        employeeSlug={employeeSlug}
        isSales={isSales}
      />
    </>
  );
};

export default Header;
