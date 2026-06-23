"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Calendar, LogOut, Users, PersonStanding, CardSim,
  Settings, ArrowLeft, ChevronLeft, ChevronRight,
  ClipboardCheck, Building, FileText, ClipboardList, Mail,
  FileSignature, Plus, X, Search, MapPin,
  User, Loader2, Building2, Receipt,
  Hash, DollarSign, FolderKanban, CalendarCheck,
  Megaphone, ChevronDown, ChevronUp,
} from "lucide-react";
import Clientdialog from "@/app/utils/employees/components/dialog/Clientdialog";
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
  const [unreadLetters,      setUnreadLetters]      = useState(0);
  const [announcementsOpen,  setAnnouncementsOpen]  = useState(false);
  const [announcements,      setAnnouncements]      = useState([]);
  const [annLoading,         setAnnLoading]         = useState(false);
  const [annExpanded,        setAnnExpanded]        = useState({});

  /* ── Companies (for sales dialogs) ── */
  const [saleCompanies, setSaleCompanies] = useState([]);

  /* ── Create Client dialog ── */
  const [clientOpen,       setClientOpen]       = useState(false);
  const [clientCompany,    setClientCompany]    = useState(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  /* ── Create Invoice dialog ── */
  const [invoiceOpen,     setInvoiceOpen]     = useState(false);
  const [invoiceCompany,  setInvoiceCompany]  = useState(null);
  const [invoiceCreating, setInvoiceCreating] = useState(false);
  const [invClients,      setInvClients]      = useState([]);
  const [invSearch,       setInvSearch]       = useState("");
  const [invFiltered,     setInvFiltered]     = useState([]);
  const [invSelClient,    setInvSelClient]    = useState(null);
  const [invHighlighted,  setInvHighlighted]  = useState(-1);
  const [invNumber,       setInvNumber]       = useState("");
  const [invDate,         setInvDate]         = useState("");
  const invSearchRef = useRef(null);

  /* ── Unread letters badge ── */
  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    axios.get(`/api/letters/employee?employeeId=${eid}`)
      .then(res => setUnreadLetters((res.data.letters || []).filter(l => !l.isRead).length))
      .catch(() => {});
  }, [user, pathname]);

  /* ── Fetch companies for sales user ── */
  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    /* fetch for ALL employees so quick-actions always work */
    axios.get(`/api/get-employee-companies/${eid}`)
      .then(r => setSaleCompanies(r.data.companies || []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ── Load clients when invoice company changes ── */
  useEffect(() => {
    if (!invoiceCompany) { setInvClients([]); setInvSelClient(null); setInvSearch(""); setInvFiltered([]); return; }
    setInvClients([]); setInvSelClient(null); setInvSearch(""); setInvFiltered([]);
    axios.get(`/api/get-all-clients/${invoiceCompany.companyslug}`)
      .then(r => setInvClients(r.data.clients || []))
      .catch(() => {});
  }, [invoiceCompany]);

  /* ── Filter clients as user types ── */
  useEffect(() => {
    setInvHighlighted(-1);
    if (!invSearch.trim()) { setInvFiltered([]); return; }
    setInvFiltered(invClients.filter(c => c.clientName?.toLowerCase().includes(invSearch.toLowerCase())));
  }, [invSearch, invClients]);

  /* ── Keyboard nav in client dropdown ── */
  const handleInvKeyDown = (e) => {
    if (invFiltered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setInvHighlighted(p => (p < invFiltered.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setInvHighlighted(p => (p > 0 ? p - 1 : invFiltered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (invHighlighted >= 0) {
        const c = invFiltered[invHighlighted];
        setInvSearch(c.clientName); setInvSelClient(c); setInvFiltered([]); setInvHighlighted(-1);
        invSearchRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setInvFiltered([]); setInvHighlighted(-1);
    }
  };

  const selectInvClient = useCallback((c) => {
    setInvSearch(c.clientName); setInvSelClient(c); setInvFiltered([]); setInvHighlighted(-1);
  }, []);

  /* ── Open dialogs ── */
  const openClientDialog = () => {
    setClientCompany(saleCompanies[0] || null);
    setClientOpen(true);
    setMobileOpen(false);
  };

  const openInvoiceDialog = () => {
    const first = saleCompanies[0] || null;
    setInvoiceCompany(first);
    setInvNumber(`INV-${Math.floor(100 + Math.random() * 900)}`);
    setInvDate(new Date().toLocaleDateString("en-GB"));
    setInvSearch(""); setInvSelClient(null); setInvFiltered([]);
    setInvoiceOpen(true);
    setMobileOpen(false);
  };


  /* ── Create Invoice ── */
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceCompany) return toast.error("Please select a company");
    if (!invSelClient)   return toast.error("Please select a client");
    setInvoiceCreating(true);
    try {
      const fd   = new FormData(e.target);
      const data = {
        companySlug:   invoiceCompany.companyslug,
        clientId:      invSelClient.id,
        invoiceNumber: invNumber,
        invoiceDate:   invDate,
        Description:   fd.get("invoiceDescription") || "",
        totalAmount:   Number(fd.get("invoiceAmount")),
        createdBy:     user?.employeeName,
        status:        "Draft",
        user_id:       user?.employeeId || user?.id,
        type:          "employee",
      };
      const res = await axios.post("/api/create-invoice", data);
      if (res.data.success) { toast.success("Invoice created!"); setInvoiceOpen(false); }
      else toast.error(res.data.error || "Failed");
    } catch { toast.error("Error creating invoice"); }
    finally { setInvoiceCreating(false); }
  };

  /* ── Nav setup ── */
  const segments     = pathname.split("/");
  const employeeSlug = segments[2] || "";

  let dashboardLinks = [
    { href: `/employee/${employeeSlug}`,            label: "Dashboard",   icon: Home,          badge: null },
    { href: `/employee/${employeeSlug}/attendance`, label: "Attendance",  icon: Calendar,      badge: null },
    { href: `/employee/${employeeSlug}/leaves`,     label: "Leave",       icon: CalendarCheck, badge: null },
    { href: `/employee/${employeeSlug}/tasks`,      label: "My Tasks",    icon: ClipboardList, badge: null },
    { href: `/employee/${employeeSlug}/projects`,   label: "My Projects", icon: FolderKanban,  badge: null },
    { href: `/employee/${employeeSlug}/letters`,    label: "My Letters",  icon: Mail,          badge: unreadLetters || null },
    { href: null, label: "Announcements", icon: Megaphone, badge: null, onClick: openAnnouncements },
  ];

  const depStr  = (user?.department?.departmentName || user?.designation || user?.role || "").toLowerCase();
  const isSales = depStr.includes("sales");
  if (isSales) {
    dashboardLinks.splice(1, 0,
      { href: `/employee/${employeeSlug}/sales-panel`, label: "Sales Panel", icon: FileSignature, badge: null },
      { href: `/employee/${employeeSlug}/companies`,   label: "Companies",   icon: Building,      badge: null }
    );
  }

  const parts       = pathname.split("/");
  const companyId   = parts[4] || null;
  const isInCompany = pathname.startsWith(`/employee/${employeeSlug}/company`);

  const companyDetailsLinks = companyId ? [
    { href: `/employee/${employeeSlug}/company/${companyId}`,           label: "General",   icon: Home },
    { href: `/employee/${employeeSlug}/company/${companyId}/clients`,   label: "Clients",   icon: PersonStanding },
    { href: `/employee/${employeeSlug}/company/${companyId}/invoices`,  label: "Invoices",  icon: CardSim },
    { href: `/employee/${employeeSlug}/company/${companyId}/contracts`, label: "Contracts", icon: FileText },
  ] : [];

  const links            = isInCompany ? companyDetailsLinks : dashboardLinks;
  const isSettingsActive = pathname === `/employee/${employeeSlug}/settings`;
  const isAttendanceActive = pathname === `/employee/${employeeSlug}/mark-attendance`;

  const openAnnouncements = async () => {
    setAnnouncementsOpen(true);
    setMobileOpen(false);
    if (announcements.length > 0) return;
    setAnnLoading(true);
    try {
      const res = await axios.get("/api/announcements");
      setAnnouncements(res.data.announcements || []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setAnnLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axios.get("/api/logout");
      if (res.data.success) {
        dispatch(logout()); dispatch(resetTimer()); dispatch(resetCheckIn()); dispatch(resetCheckOut());
        router.push("/"); toast.success("Logged out successfully");
      }
    } catch { toast.error("Failed to logout"); }
  };

  /* ── Company selector (pill buttons) ── */
  const CompanySelector = ({ value, onChange }) => (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
        <Building2 size={12} className="text-slate-400"/> Select Company <span className="text-red-500">*</span>
      </p>
      {saleCompanies.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No companies assigned</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {saleCompanies.map(co => (
            <button key={co.id} type="button" onClick={() => onChange(co)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                value?.id === co.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}>
              {(co.companylogo || co.companyLogo)
                ? <img src={co.companylogo || co.companyLogo} className="w-4 h-4 rounded object-contain" alt=""/>
                : <Building2 size={11}/>}
              {co.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
      )}

      <aside className={`
        fixed top-[73px] left-0 z-40 bg-white border-r border-slate-200
        flex flex-col h-[calc(100vh-73px)] overflow-visible
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute -right-3 top-5 z-50 w-6 h-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={11}/> : <ChevronLeft size={11}/>}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-3 pb-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href ? pathname === link.href : false;
            if (!link.href) {
              return (
                <button key={link.label} onClick={link.onClick} title={collapsed ? link.label : ""}
                  className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all text-slate-600 hover:bg-amber-50 hover:text-amber-700`}>
                  <Icon size={18} className="shrink-0 text-slate-400 group-hover:text-amber-600 transition-colors"/>
                  {!collapsed && <span className="truncate flex-1">{link.label}</span>}
                </button>
              );
            }
            return (
              <Link key={link.href} href={link.href} title={collapsed ? link.label : ""}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}>
                <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}/>
                {!collapsed && <span className="truncate flex-1">{link.label}</span>}
                {link.badge && !collapsed && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shrink-0">{link.badge}</span>
                )}
              </Link>
            );
          })}

          {/* Sales quick actions */}
          {isSales && !isInCompany && (
            <div className={`mt-2 ${!collapsed ? "border-t border-slate-100 pt-2" : ""}`}>
              {!collapsed && (
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5">Quick Actions</p>
              )}
              <button onClick={openClientDialog} title={collapsed ? "Create Client" : ""}
                className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all">
                <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  <Users size={16} className="text-slate-400 group-hover:text-violet-600 transition-colors"/>
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">Create Client</span>
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0"><Plus size={10}/></span>
                  </>
                )}
              </button>
              <button onClick={openInvoiceDialog} title={collapsed ? "Create Invoice" : ""}
                className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  <Receipt size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors"/>
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">Create Invoice</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Plus size={10}/></span>
                  </>
                )}
              </button>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-slate-100 space-y-0.5">
          <Link href={`/employee/${employeeSlug}/mark-attendance`} title={collapsed ? "Mark Attendance" : ""}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-1 ${isAttendanceActive ? "bg-blue-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700"} ${collapsed ? "justify-center" : ""}`}>
            <ClipboardCheck size={18} className="shrink-0"/>
            {!collapsed && <span>Mark Attendance</span>}
          </Link>
          {isInCompany && (
            <Link href={`/employee/${employeeSlug}`} title={collapsed ? "Back" : ""}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <ArrowLeft size={18} className="shrink-0 text-slate-400"/>
              {!collapsed && <span>Back</span>}
            </Link>
          )}
          <Link href={`/employee/${employeeSlug}/settings`} title={collapsed ? "Settings" : ""}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isSettingsActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Settings size={18} className={`shrink-0 ${isSettingsActive ? "text-blue-600" : "text-slate-400"}`}/>
            {!collapsed && <span>Settings</span>}
          </Link>
          <button onClick={handleLogout} title={collapsed ? "Logout" : ""}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={18} className="shrink-0"/>
            {!collapsed && <span>Logout</span>}
          </button>
          <div className={`pt-2 mt-1 border-t border-slate-100 flex ${collapsed ? "justify-center" : "items-center justify-between px-1"}`}>
            {!collapsed && <span className="text-[10px] text-slate-400 font-medium">HumanEdge</span>}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* ══ ANNOUNCEMENTS DIALOG ══ */}
      {announcementsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: "88vh" }}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Megaphone size={17} className="text-amber-500"/>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-900 leading-none">Announcements</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest updates from management</p>
              </div>
              <button onClick={() => setAnnouncementsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={15}/>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 py-4 space-y-3 bg-slate-50/50">
              {annLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={24} className="animate-spin text-amber-400"/>
                  <p className="text-xs text-slate-400">Loading announcements…</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Megaphone size={20} className="text-amber-300"/>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No announcements yet</p>
                  <p className="text-xs text-slate-400">Check back later for updates</p>
                </div>
              ) : (
                announcements.map((ann) => {
                  const expanded = !!annExpanded[ann.id];
                  const d = ann.createdAt
                    ? (() => { const dt = ann.createdAt.toDate ? ann.createdAt.toDate() : new Date(ann.createdAt.seconds ? ann.createdAt.seconds * 1000 : ann.createdAt); return dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); })()
                    : "—";
                  return (
                    <div key={ann.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone size={14} className="text-amber-500"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            <span className="text-[11px] text-slate-400">{d}</span>
                            {ann.createdBy && (
                              <span className="text-[11px] text-slate-400">by <span className="font-semibold text-slate-500">{ann.createdBy}</span></span>
                            )}
                          </div>
                        </div>
                        {ann.body && (
                          <button
                            onClick={() => setAnnExpanded(prev => ({ ...prev, [ann.id]: !prev[ann.id] }))}
                            className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0">
                            {expanded ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                            {expanded ? "Less" : "More"}
                          </button>
                        )}
                      </div>
                      {!ann.body && (
                        <div className="ml-11 h-px bg-slate-100"/>
                      )}
                      {ann.body && !expanded && (
                        <p className="text-xs text-slate-500 ml-11 line-clamp-2 leading-relaxed">{ann.body}</p>
                      )}
                      {ann.body && expanded && (
                        <div className="ml-11 p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-400">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</span>
              <button onClick={() => setAnnouncementsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CREATE CLIENT DIALOG — reuses shared Clientdialog ══ */}
      <Clientdialog
        open={clientOpen}
        onClose={() => setClientOpen(false)}
        companies={saleCompanies}
        showCompanySelector
        companySlug={clientCompany?.companyslug}
        companyName={clientCompany?.name}
        hideTrigger
      />

      {/* ══════════════════════════════════════
          CREATE INVOICE DIALOG  (admin-style)
      ══════════════════════════════════════ */}
      {invoiceOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl overflow-hidden" style={{ maxHeight: "92vh" }}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Receipt size={15} className="text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">Generate Invoice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Creates a new draft invoice</p>
                </div>
                <button onClick={() => setInvoiceOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={15}/>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/40">

                {/* Company selector */}
                <CompanySelector value={invoiceCompany} onChange={setInvoiceCompany}/>

                {/* Invoice meta band */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash size={9}/> Invoice No.
                    </p>
                    <p className="text-sm font-extrabold text-blue-600">{invNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={9}/> Date
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{invDate}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 size={9}/> Company
                    </p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{invoiceCompany?.name || "—"}</p>
                  </div>
                </div>

                {/* Client search */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400"/> Select Client <span className="text-red-500">*</span>
                    </label>
                    <button type="button" onClick={() => setCreateClientOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors">
                      <Plus size={10}/> Create Client
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <input
                      ref={invSearchRef}
                      value={invSearch}
                      onChange={e => {
                        setInvSearch(e.target.value);
                        if (invSelClient && invSelClient.clientName !== e.target.value) setInvSelClient(null);
                      }}
                      onKeyDown={handleInvKeyDown}
                      onBlur={() => setTimeout(() => setInvFiltered([]), 120)}
                      disabled={!invoiceCompany}
                      placeholder={invoiceCompany ? "Search client name…" : "Select a company first"}
                      className="w-full h-9 text-sm bg-white border border-slate-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    {invFiltered.length > 0 && (
                      <div className="absolute z-50 bg-white border border-slate-200 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {invFiltered.map((c, idx) => (
                          <div key={c.id}
                            onMouseDown={e => { e.preventDefault(); selectInvClient(c); }}
                            className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                              idx === invHighlighted ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                            }`}>
                            <span className="font-medium">{c.clientName}</span>
                            <span className="text-xs text-slate-400 ml-2">({c.clientEmail})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected client preview */}
                {invSelClient && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-emerald-600"/>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{invSelClient.clientName}</span>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                      <Mail size={11} className="text-emerald-500 shrink-0"/>{invSelClient.clientEmail}
                    </div>
                    {invSelClient.clientAddress && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 ml-9">
                        <MapPin size={11} className="text-emerald-500 shrink-0"/>{invSelClient.clientAddress}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400"/> Description
                  </label>
                  <textarea name="invoiceDescription" rows={3}
                    placeholder="Describe the services rendered…"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"/>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-slate-400"/> Total Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                    <input name="invoiceAmount" type="number" step="0.01" placeholder="0.00" required
                      className="w-full h-9 text-sm bg-white border border-slate-200 rounded-lg pl-7 pr-3 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"/>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
                <button type="button" onClick={() => setInvoiceOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={invoiceCreating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
                  {invoiceCreating
                    ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
                    : <><Receipt size={14}/> Save as Draft</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client — opened from inside invoice dialog */}
      <Clientdialog
        open={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        companySlug={invoiceCompany?.companyslug}
        companyName={invoiceCompany?.name}
        hideTrigger
        onSuccess={() => {
          if (!invoiceCompany) return;
          axios.get(`/api/get-all-clients/${invoiceCompany.companyslug}`)
            .then(r => setInvClients(r.data.clients || []))
            .catch(() => {});
        }}
      />
    </>
  );
};

export default Sidebar;
