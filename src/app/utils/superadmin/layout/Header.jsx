"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Search, Menu, X, ShieldCheck, Settings, LogOut, ChevronDown, ShieldAlert, ShieldPlus, ShieldMinus } from "lucide-react";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { logout } from "@/features/Slice/UserSlice";
import CommandPalette from "@/app/utils/superadmin/components/basecomponent/CommandPalette";

const Header = ({ onMobileMenu, mobileOpen }) => {
  const { user }   = useSelector((state) => state.User);
  const dispatch   = useDispatch();
  const router     = useRouter();
  const [paletteOpen,   setPaletteOpen]   = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [bellOpen,      setBellOpen]      = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const bellRef     = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await axios.get(`/api/admin/notifications/${user.uid}`);
      if (res.data.success) setNotifications(res.data.notifications || []);
    } catch { /* silent */ }
  }, [user?.uid]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleBellOpen = async () => {
    setBellOpen((o) => !o);
    if (!bellOpen && unreadCount > 0) {
      try {
        await axios.patch(`/api/admin/notifications/${user.uid}`);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch { /* silent */ }
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    if (bellOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

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

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = (name) => {
    if (!name) return "SA";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[73px] bg-white border-b border-slate-200 flex items-center px-3 md:px-5 gap-3">

        {/* ── Mobile menu toggle ── */}
        <button
          onClick={onMobileMenu}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0 transition-colors"
        >
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* ── Brand ── */}
        <div className="flex items-center gap-1 shrink-0 w-52">
          <div className="w-9 h-9 rounded-xl bg-white shrink-0 shadow-sm flex items-center justify-center p-0.5">
            <Image src="/logo.webp" alt="HumanEdge" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col leading-none gap-0.5">
            <span className="font-extrabold text-slate-900 text-[15px] tracking-tight">HumanEdge</span>
            {user?.role === "admin" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded text-[10px] font-bold text-violet-700 uppercase tracking-wide w-fit">
                <ShieldCheck size={9} strokeWidth={2.5} /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700 uppercase tracking-wide w-fit">
                <ShieldCheck size={9} strokeWidth={2.5} /> Super Admin
              </span>
            )}
          </div>
        </div>

        {/* ── Search: icon-only on mobile, full bar on sm+ ── */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Search size={15} />
        </button>

        <div className="hidden sm:block flex-1 max-w-md mx-auto">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-sm hover:border-slate-300 hover:bg-slate-100 transition-colors group"
          >
            <Search size={14} className="shrink-0" />
            <span className="flex-1 text-left text-slate-400 text-sm">Search everything…</span>
            <div className="hidden sm:flex items-center gap-0.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono shadow-sm">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono shadow-sm">K</kbd>
            </div>
          </button>
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Bell with notification panel */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={handleBellOpen}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell size={18} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  {unreadCount === 0 && <span className="text-[10px] text-slate-400">All caught up</span>}
                </div>
                <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell size={22} className="text-slate-200" />
                      <p className="text-xs text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isAdded   = n.type === "permission_added";
                      const isRemoved = n.type === "permission_removed";
                      const iconBg    = isAdded ? "bg-emerald-100" : isRemoved ? "bg-red-100" : "bg-violet-100";
                      const iconColor = isAdded ? "text-emerald-600" : isRemoved ? "text-red-500" : "text-violet-600";
                      const NotifIcon = isAdded ? ShieldPlus : isRemoved ? ShieldMinus : ShieldAlert;
                      const rowBg     = n.isRead ? "" : isAdded ? "bg-emerald-50/40" : isRemoved ? "bg-red-50/30" : "bg-blue-50/40";
                      return (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${rowBg}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                            <NotifIcon size={14} className={iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                            {n.createdAt && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          {!n.isRead && <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isAdded ? "bg-emerald-500" : isRemoved ? "bg-red-500" : "bg-blue-500"}`} />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {initials(user?.name)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || "Super Admin"}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[130px]">{user?.email}</p>
              </div>
              <ChevronDown size={13} className={`text-slate-400 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || "Super Admin"}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                </div>
                {(user?.role === "superAdmin" || user?.permissions?.includes("settings")) && (
                  <Link
                    href="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={14} className="text-slate-400 shrink-0" /> Settings
                  </Link>
                )}
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

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        permissions={user?.permissions || []}
        role={user?.role}
      />
    </>
  );
};

export default Header;
