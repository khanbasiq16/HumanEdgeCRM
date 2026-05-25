"use client";
import React, { useEffect, useState } from "react";
import { Bell, Search, Menu, X, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import CommandPalette from "@/app/utils/superadmin/components/basecomponent/CommandPalette";

const Header = ({ onMobileMenu, mobileOpen }) => {
  const { user } = useSelector((state) => state.User);
  const [paletteOpen, setPaletteOpen] = useState(false);

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
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={18} className="text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          <div className="hidden sm:flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initials(user?.name)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || "Super Admin"}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{user?.email}</p>
            </div>
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
