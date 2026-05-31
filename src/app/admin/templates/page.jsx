"use client";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  NotepadText, Search, Building2, FileCheck, FileSignature,
  UserPlus, Loader2, Pencil, Trash2, AlertTriangle, Send, Mail,
  Download, ChevronDown, ChevronUp, Users, Calendar, CheckSquare, Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TemplateDialog from "@/app/utils/superadmin/components/dialog/TemplateDialog";

/* ─── Skeleton ─────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse flex items-center gap-4">
    <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-slate-100 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
    <div className="flex gap-2">
      <div className="h-7 w-16 bg-slate-100 rounded-lg" />
      <div className="h-7 w-16 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

/* ─── Contract history row (client sent OR sales employee assigned) ── */
const ContractHistoryRow = ({ item }) => {
  const date = item.assignedAt
    ? new Date(item.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const isClient = item.kind === "client";

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
      isClient
        ? "bg-violet-50/60 border-violet-100 hover:border-violet-200"
        : "bg-emerald-50/60 border-emerald-100 hover:border-emerald-200"
    }`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isClient ? "bg-violet-100" : "bg-emerald-100"
      }`}>
        <span className={`text-[10px] font-bold ${isClient ? "text-violet-700" : "text-emerald-700"}`}>
          {(item.name || "?")[0].toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
          {isClient
            ? <><Mail size={9} className="shrink-0"/><span className="truncate">{item.sub}</span></>
            : <><UserPlus size={9} className="shrink-0 text-emerald-500"/><span className="truncate">{item.sub}</span></>
          }
          <span className="shrink-0">· {date}</span>
        </p>
      </div>

      {/* Badge */}
      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${
        isClient
          ? item.emailSent ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      }`}>
        {isClient ? (item.emailSent ? "Sent" : "Saved") : "Assigned"}
      </span>
    </div>
  );
};

/* ─── Assigned letter row ────────────────────────────────── */
const AssignedRow = ({ letter, onDownloadLetter, downloadingLetter }) => {
  const date    = letter.assignedAt
    ? new Date(letter.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const isMe    = downloadingLetter === letter.id;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-blue-700">
          {(letter.employeeName || "?")[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{letter.employeeName || "—"}</p>
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <Calendar size={9} />{date}
          {letter.assignedBy && <span className="ml-1">· by {letter.assignedBy}</span>}
        </p>
      </div>
      <button
        onClick={() => onDownloadLetter(letter)}
        disabled={isMe}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-colors disabled:opacity-50 shrink-0"
      >
        {isMe ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
        PDF
      </button>
    </div>
  );
};

/* ─── Template row card ─────────────────────────────────── */
const TemplateCard = ({ template, onEdit, onAssign, onDelete, onDownload, downloading, onDownloadLetter, downloadingLetter }) => {
  const isContract  = (template.role === "Admin" || template.role === "Contract");
  const logoSrc     = template.company?.companylogo || template.company?.companyLogo;
  const isMe        = downloading === template.id;
  const [expanded,  setExpanded]  = useState(false);
  const [history,   setHistory]   = useState(null);
  const [loadingH,  setLoadingH]  = useState(false);

  const toggleHistory = async () => {
    if (!expanded && history === null) {
      setLoadingH(true);
      try {
        if (isContract) {
          const res = await axios.get(`/api/templates/contract-history?templateId=${template.id}`);
          setHistory(res.data.history || []);
        } else {
          const res = await axios.get(`/api/letters/by-template?templateId=${template.id}`);
          setHistory(res.data.letters || []);
        }
      } catch { setHistory([]); }
      finally   { setLoadingH(false); }
    }
    setExpanded(p => !p);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
      {/* Main row */}
      <div className="px-4 py-3.5 flex items-center gap-4">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
          {logoSrc
            ? <img src={logoSrc} alt="" className="w-full h-full object-contain p-0.5" />
            : <Building2 size={16} className="text-slate-300" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {template.templateName || "Untitled Template"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isContract ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
            }`}>
              {isContract ? <FileSignature size={9} /> : <FileCheck size={9} />}
              {isContract ? "Contract" : "Employee Letter"}
            </span>
            {template.company?.name && (
              <span className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <Building2 size={9} />{template.company.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* History toggle — both contracts and letters */}
          <button
            onClick={toggleHistory}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
              isContract
                ? "text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200"
                : "text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200"
            }`}
            title={isContract ? "View sent history" : "View assigned history"}
          >
            <Users size={12} />
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <button
            onClick={() => onAssign(template)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-colors"
          >
            <UserPlus size={12} /> Assign
          </button>
          <button
            onClick={() => onDownload(template)}
            disabled={isMe}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-colors disabled:opacity-50"
          >
            {isMe ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {isMe ? "…" : "PDF"}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-800 hover:text-white border border-slate-200 hover:border-slate-800 transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* History panel */}
      {expanded && (
        <div className={`border-t px-4 pb-4 pt-3 ${
          isContract ? "border-violet-100 bg-violet-50/30" : "border-slate-100 bg-slate-50/50"
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {isContract
              ? <><Send size={9} className="text-violet-500"/><span className="text-violet-500">Sent / Assigned History</span></>
              : <><Users size={9} className="text-slate-400"/><span className="text-slate-400">Assigned To</span></>
            }
            {history && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-[9px]">
                {history.length}
              </span>
            )}
          </p>
          {loadingH ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className={`animate-spin ${isContract ? "text-violet-400" : "text-blue-400"}`} />
            </div>
          ) : history?.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              {isContract ? "No contracts sent yet." : "Not assigned to anyone yet."}
            </p>
          ) : isContract ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {history.map(item => <ContractHistoryRow key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {history.map(letter => (
                <AssignedRow
                  key={letter.id}
                  letter={letter}
                  onDownloadLetter={onDownloadLetter}
                  downloadingLetter={downloadingLetter}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────── */
const Page = () => {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { user } = useSelector((s) => s.User);
  const { templates: rawTemplates } = useSelector((s) => s.Templates);
  const templates = Array.isArray(rawTemplates) ? rawTemplates : [];

  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("all");

  // Assign dialog
  const [assignOpen,     setAssignOpen]     = useState(false);
  const [assignTmpl,     setAssignTmpl]     = useState(null);
  const [employees,      setEmployees]      = useState([]);
  const [selEmployees,   setSelEmployees]   = useState([]); // multi-select (letters)
  const [empSearch,      setEmpSearch]      = useState("");
  const [assigning,      setAssigning]      = useState(false);
  // Contract mode: "send" = direct to client, "assign" = assign to sales employee
  const [contractMode,   setContractMode]   = useState("send");
  const [selSalesEmp,    setSelSalesEmp]    = useState("");   // single sales employee id
  const [salesEmpSearch, setSalesEmpSearch] = useState("");
  // Already-assigned employee IDs for the current template
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState(new Set());
  // Contract-specific fields
  const [clientName,     setClientName]     = useState("");
  const [clientEmail,    setClientEmail]    = useState("");
  const [clientPhone,    setClientPhone]    = useState("");
  const [clientAddress,  setClientAddress]  = useState("");
  const [contractDate,   setContractDate]   = useState("");
  const [contractMsg,    setContractMsg]    = useState("");

  // Download template preview
  const [downloading,      setDownloading]      = useState(null);
  // Download assigned letter
  const [downloadingLetter, setDownloadingLetter] = useState(null);

  // Delete dialog
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleteTmpl,  setDeleteTmpl]  = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    axios.get("/api/templates/get")
      .then(res => { if (res.data.success) dispatch(createtemplate(res.data.templates || [])); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get("/api/get-all-employees")
      .then(res => setEmployees(res.data.employees || []))
      .catch(() => {});
  }, []);

  /* ── Assign ── */
  const isContract = (t) => t?.role === "Admin" || t?.role === "Contract";

  const openAssign = async (t) => {
    setAssignTmpl(t);
    setSelEmployees([]); setEmpSearch("");
    setClientName(""); setClientEmail(""); setClientPhone("");
    setClientAddress(""); setContractDate(""); setContractMsg("");
    setContractMode("send"); setSelSalesEmp(""); setSalesEmpSearch("");
    setAlreadyAssignedIds(new Set());
    setAssignOpen(true);

    /* Fetch already-assigned employee IDs for this template */
    try {
      const res = await axios.get(`/api/letters/by-template?templateId=${t.id}`);
      const ids = (res.data.letters || []).map(l => l.employeeId).filter(Boolean);
      setAlreadyAssignedIds(new Set(ids));
    } catch { /* silent — worst case user sees no badge */ }
  };

  // Employees filtered by sales — checks department, designation, or role
  const salesEmployees = employees.filter(e => {
    const dept = typeof e.department === "object"
      ? (e.department?.departmentName || "")
      : (e.department || "");
    const fields = [dept, e.designation || "", e.role || "", e.employeeRole || ""];
    return fields.some(f => f.toLowerCase().includes("sales"));
  });

  const toggleEmployee = (id) =>
    setSelEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );

  const handleAssign = async () => {
    setAssigning(true);
    try {
      if (isContract(assignTmpl)) {
        /* ── Assign to sales employee ── */
        if (contractMode === "assign") {
          if (!selSalesEmp) { setAssigning(false); return toast.error("Please select a sales employee"); }
          try {
            const res = await axios.post("/api/letters/assign", {
              templateId:  assignTmpl.id,
              employeeIds: [selSalesEmp],
              assignedBy:  user?.employeeName || user?.name || "Admin",
            });
            if (res.data.success) {
              toast.success("Contract assigned to sales employee!");
              setAssignOpen(false);
            } else toast.error(res.data.error || "Failed to assign");
          } catch (err) {
            toast.error(err?.response?.data?.error || "Failed to assign contract");
          }
          return;
        }
        /* ── Send directly to client ── */
        if (!clientEmail) { setAssigning(false); return toast.error("Client email is required"); }
        const res = await axios.post("/api/templates/assign-contract", {
          templateId:   assignTmpl.id,
          clientName, clientEmail, clientPhone, clientAddress,
          contractDate, message: contractMsg,
        });
        if (res.data.success) {
          toast.success(res.data.emailSent ? "Contract sent via email!" : "Saved — but check SMTP settings");
          setAssignOpen(false);
        } else toast.error(res.data.message || "Failed to send contract");
      } else {
        if (selEmployees.length === 0) return toast.error("Select at least one employee");
        const res = await axios.post("/api/letters/assign", {
          templateId:  assignTmpl.id,
          employeeIds: selEmployees,
          assignedBy:  user?.employeeName || user?.name || "Admin",
        });
        if (res.data.success) {
          const msg = res.data.message || `Letter assigned to ${res.data.assigned} employee${res.data.assigned !== 1 ? "s" : ""}!`;
          toast.success(msg);
          if (res.data.alreadyAssigned > 0 && res.data.assigned === 0) return;
          setAssignOpen(false);
        } else {
          /* 409 = already assigned */
          toast.error(res.data.error || "Failed to assign");
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error;
      toast.error(msg || "Failed to process assignment");
    }
    finally { setAssigning(false); }
  };

  /* ── Delete ── */
  const openDelete = (t) => { setDeleteTmpl(t); setDeleteOpen(true); };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/templates/${deleteTmpl.id}`);
      dispatch(createtemplate(templates.filter(t => t.id !== deleteTmpl.id)));
      toast.success("Template deleted");
      setDeleteOpen(false);
    } catch { toast.error("Failed to delete template"); }
    finally   { setDeleting(false); }
  };

  /* ── Download assigned letter as PDF ── */
  const handleDownloadLetter = async (letter) => {
    setDownloadingLetter(letter.id);
    try {
      const { pdf, Document, Page, Text, View, StyleSheet, Image } =
        await import("@react-pdf/renderer");

      const c = letter.company;
      const toBase64 = (imgUrl) =>
        new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width  = img.naturalWidth  || 200;
              canvas.height = img.naturalHeight || 200;
              canvas.getContext("2d").drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch { resolve(null); }
          };
          img.onerror = () => resolve(null);
          img.src = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        });

      const logoBase64 = c?.companylogo ? await toBase64(c.companylogo) : null;

      const S = StyleSheet.create({
        page:      { padding: "14mm 16mm", fontFamily: "Times-Roman", fontSize: 11 },
        header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5pt solid #0f172a", paddingBottom: 12, marginBottom: 4 },
        logoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 8 },
        logo:      { height: 40, width: 40, objectFit: "contain" },
        coName:    { fontSize: 15, fontFamily: "Times-Bold", color: "#0f172a" },
        coAddr:    { fontSize: 9, color: "#64748b", marginTop: 2 },
        contact:   { textAlign: "right", fontSize: 9, color: "#475569", lineHeight: 1.6 },
        body:      { paddingTop: 14 },
        h1:        { fontSize: 18, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h2:        { fontSize: 14, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h3:        { fontSize: 12, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 6, marginTop: 10 },
        para:      { fontSize: 11, color: "#374151", lineHeight: 1.7, marginBottom: 8 },
        dateLine:  { fontSize: 11, color: "#374151", textAlign: "right", marginBottom: 12 },
        divider:   { borderTop: "1pt solid #cbd5e1", marginVertical: 10 },
        sigBlock:  { marginTop: 20, marginBottom: 8 },
        sigLine:   { borderBottom: "2pt solid #0f172a", width: 140, marginBottom: 5 },
        sigLabel:  { fontSize: 10, color: "#374151" },
        footer:    { borderTop: "1pt solid #cbd5e1", paddingTop: 8, textAlign: "center", marginTop: 36 },
        footerTxt: { fontSize: 8, color: "#94a3b8", marginTop: 1 },
      });

      const renderBlock = (block, idx) => {
        const align = block.align || "left";
        switch (block.type) {
          case "heading": {
            const hStyle = block.headingLevel === "h1" ? S.h1 : block.headingLevel === "h3" ? S.h3 : S.h2;
            return <Text key={idx} style={[hStyle, { textAlign: align }]}>{block.content || ""}</Text>;
          }
          case "text":    return <Text key={idx} style={[S.para,     { textAlign: align }]}>{block.content || ""}</Text>;
          case "date-line": return <Text key={idx} style={S.dateLine}>{block.content || ""}</Text>;
          case "divider": return <View key={idx} style={S.divider} />;
          case "signature":
            return (
              <View key={idx} style={S.sigBlock}>
                {block.signatureText && (
                  <Text style={{ fontFamily: "Times-BoldItalic", fontSize: 22, color: "#1a2e4a", marginBottom: 2 }}>
                    {block.signatureText}
                  </Text>
                )}
                <View style={S.sigLine} />
                <Text style={S.sigLabel}>{block.label || "Authorized Signatory"}</Text>
              </View>
            );
          default: return null;
        }
      };

      const MyDoc = (
        <Document>
          <Page size="A4" style={S.page}>
            {logoBase64 && (
              <Image src={logoBase64} style={{ position: "absolute", top: 130, left: 102, width: 300, height: 300, opacity: 0.07 }} />
            )}
            {c && (
              <View style={S.header}>
                <View style={S.logoRow}>
                  {logoBase64 && <Image src={logoBase64} style={S.logo} />}
                  <View>
                    <Text style={S.coName}>{c.name || ""}</Text>
                    {c.companyAddress && <Text style={S.coAddr}>{c.companyAddress}</Text>}
                  </View>
                </View>
                <View>
                  {c.companyPhoneNumber && <Text style={S.contact}>{c.companyPhoneNumber}</Text>}
                  {c.companyEmail       && <Text style={S.contact}>{c.companyEmail}</Text>}
                  {c.companyWebsite     && <Text style={S.contact}>{c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</Text>}
                </View>
              </View>
            )}
            <View style={S.body}>
              {(letter.blocks || []).map(renderBlock)}
            </View>
            {c && (
              <View style={S.footer}>
                {c.companyAddress && <Text style={S.footerTxt}>{c.companyAddress.toUpperCase()}</Text>}
                {c.companyWebsite && <Text style={S.footerTxt}>{c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</Text>}
              </View>
            )}
          </Page>
        </Document>
      );

      const blob = await pdf(MyDoc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${letter.templateName || "Letter"} - ${letter.employeeName || "Employee"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingLetter(null);
    }
  };

  /* ── Download template as PDF ── */
  const handleDownloadTemplate = async (tmpl) => {
    setDownloading(tmpl.id);
    try {
      const { pdf, Document, Page, Text, View, StyleSheet, Image } =
        await import("@react-pdf/renderer");

      const c = tmpl.company;
      const logoSrc = c?.companylogo || c?.companyLogo;

      const toBase64 = (imgUrl) =>
        new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width  = img.naturalWidth  || 200;
              canvas.height = img.naturalHeight || 200;
              canvas.getContext("2d").drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch { resolve(null); }
          };
          img.onerror = () => resolve(null);
          img.src = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        });

      const logoBase64 = logoSrc ? await toBase64(logoSrc) : null;

      const S = StyleSheet.create({
        page:      { padding: "14mm 16mm", fontFamily: "Times-Roman", fontSize: 11 },
        header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5pt solid #0f172a", paddingBottom: 12, marginBottom: 4 },
        logoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 8 },
        logo:      { height: 40, width: 40, objectFit: "contain" },
        coName:    { fontSize: 15, fontFamily: "Times-Bold", color: "#0f172a" },
        coAddr:    { fontSize: 9, color: "#64748b", marginTop: 2 },
        contact:   { textAlign: "right", fontSize: 9, color: "#475569", lineHeight: 1.6 },
        body:      { paddingTop: 14 },
        h1:        { fontSize: 18, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h2:        { fontSize: 14, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h3:        { fontSize: 12, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 6, marginTop: 10 },
        para:      { fontSize: 11, color: "#374151", lineHeight: 1.7, marginBottom: 8 },
        dateLine:  { fontSize: 11, color: "#374151", textAlign: "right", marginBottom: 12 },
        divider:   { borderTop: "1pt solid #cbd5e1", marginVertical: 10 },
        sigBlock:  { marginTop: 20, marginBottom: 8 },
        sigLine:   { borderBottom: "2pt solid #0f172a", width: 140, marginBottom: 5 },
        sigLabel:  { fontSize: 10, color: "#374151" },
        footer:    { borderTop: "1pt solid #cbd5e1", paddingTop: 8, textAlign: "center", marginTop: 36 },
        footerTxt: { fontSize: 8, color: "#94a3b8", marginTop: 1 },
      });

      const renderBlock = (block, idx) => {
        const align = block.align || "left";
        switch (block.type) {
          case "heading": {
            const hStyle = block.headingLevel === "h1" ? S.h1 : block.headingLevel === "h3" ? S.h3 : S.h2;
            return <Text key={idx} style={[hStyle, { textAlign: align }]}>{block.content || ""}</Text>;
          }
          case "text":
            return <Text key={idx} style={[S.para, { textAlign: align }]}>{block.content || ""}</Text>;
          case "date-line":
            return <Text key={idx} style={S.dateLine}>{block.content || ""}</Text>;
          case "divider":
            return <View key={idx} style={S.divider} />;
          case "signature":
            return (
              <View key={idx} style={S.sigBlock}>
                {block.signatureText && (
                  <Text style={{ fontFamily: "Times-BoldItalic", fontSize: 22, color: "#1a2e4a", marginBottom: 2 }}>
                    {block.signatureText}
                  </Text>
                )}
                <View style={S.sigLine} />
                <Text style={S.sigLabel}>{block.label || "Authorized Signatory"}</Text>
              </View>
            );
          default:
            return null;
        }
      };

      const MyDoc = (
        <Document>
          <Page size="A4" style={S.page}>
            {logoBase64 && (
              <Image src={logoBase64} style={{ position: "absolute", top: 130, left: 102, width: 300, height: 300, opacity: 0.07 }} />
            )}
            {c && (
              <View style={S.header}>
                <View style={S.logoRow}>
                  {logoBase64 && <Image src={logoBase64} style={S.logo} />}
                  <View>
                    <Text style={S.coName}>{c.name || ""}</Text>
                    {c.companyAddress && <Text style={S.coAddr}>{c.companyAddress}</Text>}
                  </View>
                </View>
                <View>
                  {c.companyPhoneNumber && <Text style={S.contact}>{c.companyPhoneNumber}</Text>}
                  {(c.companyEmail || c.companyemail) && <Text style={S.contact}>{c.companyEmail || c.companyemail}</Text>}
                  {c.companyWebsite && <Text style={S.contact}>{c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</Text>}
                </View>
              </View>
            )}
            <View style={S.body}>
              {(tmpl.fields || []).map(renderBlock)}
            </View>
            {c && (
              <View style={S.footer}>
                {c.companyAddress && <Text style={S.footerTxt}>{c.companyAddress.toUpperCase()}</Text>}
                {c.companyWebsite && <Text style={S.footerTxt}>{c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</Text>}
              </View>
            )}
          </Page>
        </Document>
      );

      const blob = await pdf(MyDoc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${tmpl.templateName || "Template"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = useMemo(() => {
    let list = templates;
    if (filterType !== "all") list = list.filter(t => filterType === "contract" ? (t.role === "Admin" || t.role === "Contract") : t.role !== "Admin");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.templateName || "").toLowerCase().includes(q) ||
        (t.company?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, filterType, search]);

  const counts = {
    all:      templates.length,
    letter:   templates.filter(t => t.role !== "Admin").length,
    contract: templates.filter(t => (t.role === "Admin" || t.role === "Contract")).length,
  };

  return (
    <SuperAdminlayout>
      <section className="w-full max-w-4xl">
        <Superbreadcrumb path="Templates" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-400 mt-0.5">{counts.all} total · {counts.letter} letters · {counts.contract} contracts</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {[["all","All"],["letter","Letters"],["contract","Contracts"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilterType(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filterType === v
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {l} <span className="opacity-60 ml-1">{counts[v]}</span>
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 text-sm rounded-xl w-full sm:w-56"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <NotepadText size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                {search || filterType !== "all" ? "No templates match your filters" : "No templates yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Create your first template to get started</p>
            </div>
            {!search && filterType === "all" && <TemplateDialog />}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={tmpl => router.push(
                  (tmpl.role === "Admin" || tmpl.role === "Contract")
                    ? `/contract-editor/${tmpl.id}`
                    : `/template-editor/${tmpl.id}`
                )}
                onAssign={openAssign}
                onDelete={openDelete}
                onDownload={handleDownloadTemplate}
                downloading={downloading}
                onDownloadLetter={handleDownloadLetter}
                downloadingLetter={downloadingLetter}
              />
            ))}
          </div>
        )}

        {/* ── Assign / Send Dialog ── */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {isContract(assignTmpl)
                  ? <><Send size={16} className="text-violet-600" /> Send Contract to Client</>
                  : <><UserPlus size={16} className="text-emerald-600" /> Assign Letter to Employee</>}
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-4">
              {/* Template info chip */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                {isContract(assignTmpl)
                  ? <FileSignature size={13} className="text-violet-500 shrink-0" />
                  : <FileCheck size={13} className="text-blue-500 shrink-0" />}
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{isContract(assignTmpl) ? "Contract" : "Employee Letter"}</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{assignTmpl?.templateName || "Untitled Template"}</p>
                </div>
              </div>

              {isContract(assignTmpl) ? (
                /* ── Contract section ── */
                <>
                  {/* Mode tabs */}
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setContractMode("send")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        contractMode === "send"
                          ? "bg-white text-violet-700 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Send size={12}/> Send to Client
                    </button>
                    <button
                      onClick={() => setContractMode("assign")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        contractMode === "assign"
                          ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <UserPlus size={12}/> Assign to Sales
                    </button>
                  </div>

                  {contractMode === "send" ? (
                    /* ── Send directly to client ── */
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Client Name</label>
                          <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corp" className="rounded-xl border-slate-200 text-sm h-9" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Client Email *</label>
                          <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" className="rounded-xl border-slate-200 text-sm h-9" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Client Phone</label>
                          <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+92 300 0000000" className="rounded-xl border-slate-200 text-sm h-9" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Contract Date</label>
                          <Input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} className="rounded-xl border-slate-200 text-sm h-9" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Client Address</label>
                        <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="123 Business Ave, City, Country" className="rounded-xl border-slate-200 text-sm h-9" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Message to Client (optional)</label>
                        <Textarea
                          value={contractMsg}
                          onChange={e => setContractMsg(e.target.value)}
                          placeholder="Please review the attached contract and let us know if you have any questions…"
                          className="rounded-xl border-slate-200 text-sm resize-none"
                          rows={3}
                        />
                      </div>
                      <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 flex items-start gap-2">
                        <Mail size={12} className="mt-0.5 shrink-0" />
                        The contract will be sent to the client&apos;s email with all variables substituted.
                      </p>
                    </>
                  ) : (
                    /* ── Assign to sales employee ── */
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Select Sales Employee *
                          {salesEmployees.length > 0 && (
                            <span className="ml-2 text-[10px] text-slate-400 font-normal">
                              ({salesEmployees.length} available)
                            </span>
                          )}
                        </label>

                        {/* Search */}
                        <div className="relative mb-2">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <Input
                            placeholder="Search sales employees…"
                            value={salesEmpSearch}
                            onChange={e => setSalesEmpSearch(e.target.value)}
                            className="pl-8 h-8 text-xs rounded-lg border-slate-200"
                          />
                        </div>

                        {/* List */}
                        <div className="max-h-52 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                          {salesEmployees.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">
                              No employees with Sales role found
                            </p>
                          ) : (
                            salesEmployees
                              .filter(e =>
                                !salesEmpSearch.trim() ||
                                (e.employeeName || "").toLowerCase().includes(salesEmpSearch.toLowerCase())
                              )
                              .map(emp => {
                                const checked    = selSalesEmp === emp.id;
                                const isAssigned = alreadyAssignedIds.has(emp.id);
                                const dept = typeof emp.department === "object"
                                  ? emp.department?.departmentName
                                  : emp.department || "";
                                const role = emp.role || emp.employeeRole || emp.designation || "";
                                return (
                                  <div
                                    key={emp.id}
                                    onClick={() => !isAssigned && setSelSalesEmp(emp.id)}
                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors border ${
                                      isAssigned
                                        ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-100"
                                        : checked
                                          ? "bg-emerald-50 border-emerald-300 cursor-pointer"
                                          : "hover:bg-slate-50 border-transparent cursor-pointer"
                                    }`}
                                  >
                                    {/* Radio / Check icon */}
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                      isAssigned ? "border-slate-300 bg-slate-100"
                                      : checked   ? "border-emerald-600 bg-emerald-600"
                                                  : "border-slate-300"
                                    }`}>
                                      {isAssigned
                                        ? <span className="text-[8px] text-slate-400 font-bold">✓</span>
                                        : checked && <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                                      }
                                    </div>
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                      isAssigned ? "bg-slate-100" : "bg-emerald-100"
                                    }`}>
                                      <span className={`text-[11px] font-bold ${
                                        isAssigned ? "text-slate-400" : "text-emerald-700"
                                      }`}>
                                        {(emp.employeeName || "?")[0].toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs font-semibold truncate ${isAssigned ? "text-slate-400" : "text-slate-800"}`}>
                                        {emp.employeeName || "—"}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {role && <span className={isAssigned ? "text-slate-400" : "text-emerald-600 font-medium"}>{role}</span>}
                                        {dept && <span className="ml-1">· {dept}</span>}
                                      </p>
                                    </div>
                                    {/* Already assigned badge */}
                                    {isAssigned && (
                                      <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                        Already Assigned
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-start gap-2">
                        <UserPlus size={12} className="mt-0.5 shrink-0"/>
                        This contract will be assigned to the selected sales employee. They can then process and send it to the client.
                      </p>
                    </>
                  )}
                </>
              ) : (
                /* ── Employee letter multi-select ── */
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Select Employees *
                        {selEmployees.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {selEmployees.length} selected
                          </span>
                        )}
                      </label>
                      {selEmployees.length > 0 && (
                        <button
                          onClick={() => setSelEmployees([])}
                          className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Search employees */}
                    <div className="relative mb-2">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search employees…"
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg border-slate-200"
                      />
                    </div>

                    {/* Checkbox list */}
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                      {employees
                        .filter(emp =>
                          !empSearch.trim() ||
                          (emp.employeeName || "").toLowerCase().includes(empSearch.toLowerCase())
                        )
                        .map(emp => {
                          const checked    = selEmployees.includes(emp.id);
                          const isAssigned = alreadyAssignedIds.has(emp.id);
                          const dept       = typeof emp.department === "object"
                            ? emp.department?.departmentName
                            : emp.department || "";
                          return (
                            <div
                              key={emp.id}
                              onClick={() => !isAssigned && toggleEmployee(emp.id)}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors ${
                                isAssigned
                                  ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-100"
                                  : checked
                                    ? "bg-blue-50 border-blue-200 cursor-pointer"
                                    : "hover:bg-slate-50 border-transparent cursor-pointer"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                isAssigned ? "bg-slate-200 border-0"
                                : checked   ? "bg-blue-600"
                                            : "border-2 border-slate-300"
                              }`}>
                                {(checked || isAssigned) && (
                                  <span className={`text-[10px] font-bold ${isAssigned ? "text-slate-400" : "text-white"}`}>✓</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold truncate ${isAssigned ? "text-slate-400" : "text-slate-800"}`}>
                                  {emp.employeeName || "—"}
                                </p>
                                {dept && <p className="text-[10px] text-slate-400 truncate">{dept}</p>}
                              </div>
                              {isAssigned && (
                                <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                  Already Assigned
                                </span>
                              )}
                            </div>
                          );
                        })}
                      {employees.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No employees found</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    Selected employees will receive this letter in their portal and can view &amp; download it.
                  </p>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setAssignOpen(false)} disabled={assigning}>Cancel</Button>
              {isContract(assignTmpl) ? (
                contractMode === "assign" ? (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    onClick={handleAssign}
                    disabled={assigning || !selSalesEmp}
                  >
                    {assigning
                      ? <><Loader2 size={14} className="animate-spin mr-1.5" />Assigning…</>
                      : <><UserPlus size={14} className="mr-1.5" />Assign to Sales Employee</>}
                  </Button>
                ) : (
                  <Button
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                    onClick={handleAssign}
                    disabled={assigning || !clientEmail}
                  >
                    {assigning
                      ? <><Loader2 size={14} className="animate-spin mr-1.5" />Sending…</>
                      : <><Send size={14} className="mr-1.5" />Send Contract</>}
                  </Button>
                )
              ) : (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  onClick={handleAssign}
                  disabled={assigning || selEmployees.length === 0}
                >
                  {assigning
                    ? <><Loader2 size={14} className="animate-spin mr-1.5" />Assigning…</>
                    : <><UserPlus size={14} className="mr-1.5" />Assign to {selEmployees.length || ""} {selEmployees.length === 1 ? "Employee" : "Employees"}</>}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm Dialog ── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} /> Delete Template
              </DialogTitle>
            </DialogHeader>
            <div className="my-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-900">
                  {deleteTmpl?.templateName || "this template"}
                </span>?
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><Loader2 size={14} className="animate-spin mr-1.5" />Deleting…</> : <><Trash2 size={14} className="mr-1.5" />Delete</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </SuperAdminlayout>
  );
};

export default Page;
