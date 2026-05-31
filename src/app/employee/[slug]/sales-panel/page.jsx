"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Building2, FileSignature, ChevronRight, Loader2,
  Send, FileDown, Save, Plus, PenLine, X, Search, CheckCircle2,
  FileText, Users, Eye, ChevronDown, MailOpen, AlertCircle,
  Bold, Italic, Underline, Type, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Trash2,
  User, Mail, Phone, MapPin, Globe,
} from "lucide-react";

/* ── Canvas contrast helper (same as contract-editor) ── */
const getContrastColors = (bg) => {
  const h = (bg || "#ffffff").replace("#", "");
  if (h.length !== 6) return { isDark: false, text: "#0f172a", sub: "#64748b", accent: "#1e3a8a", altLine: "#cbd5e1" };
  const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
  const lum  = 0.299*r + 0.587*g + 0.114*b;
  const dark = lum < 0.45;
  return {
    isDark:  dark,
    text:    dark ? "#ffffff"  : "#0f172a",
    sub:     dark ? "#94a3b8"  : "#64748b",
    accent:  dark ? "#60a5fa"  : "#1e3a8a",
    altLine: dark ? "#334155"  : "#cbd5e1",
  };
};

const KonvaCanvas = dynamic(
  () => import("@/app/contract-editor/[templateid]/KonvaCanvas"),
  { ssr: false }
);

/* ── Convert contentEditable HTML → plain canvas text ── */
function htmlToCanvasText(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;

  /* Convert <ul><li> → bullet lines */
  div.querySelectorAll("ul li").forEach(li => {
    li.prepend("• ");
  });
  /* Convert <ol><li> → numbered lines */
  div.querySelectorAll("ol").forEach(ol => {
    ol.querySelectorAll("li").forEach((li, i) => {
      li.prepend(`${i + 1}. `);
    });
  });
  /* <br> and block elements → newlines */
  div.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
  div.querySelectorAll("p,div,li,ul,ol,h1,h2,h3").forEach(el => {
    if (el.textContent) el.after("\n");
  });

  return (div.textContent || div.innerText || "")
    .replace(/ /g, " ")     // non-breaking → regular space
    .replace(/[ \t]{2,}/g, " ")   // collapse multiple spaces
    .replace(/\n{3,}/g, "\n\n")   // max two blank lines
    .trim();
}

/* ── Appendix Rich Text Editor ──
   editMode=false → "Add" form (empty, Append button)
   editMode=true  → "Edit" form (pre-filled, live canvas update, Delete button) */
const AppendixEditor = ({ onAdd, onLiveUpdate, onDelete, initialText = "", editMode = false }) => {
  const editorRef       = useRef(null);
  const [isEmpty,       setIsEmpty]       = useState(!initialText);
  const [fontSize,      setFontSize]      = useState("13");
  const [activeFormats, setActiveFormats] = useState({});

  /* Pre-fill editor on mount (edit mode only) */
  useEffect(() => {
    if (editMode && editorRef.current && initialText) {
      editorRef.current.innerText = initialText;
      setIsEmpty(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    syncFormats();
  };

  const syncFormats = () => {
    setActiveFormats({
      bold:                document.queryCommandState("bold"),
      italic:              document.queryCommandState("italic"),
      underline:           document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
      justifyLeft:         document.queryCommandState("justifyLeft"),
      justifyCenter:       document.queryCommandState("justifyCenter"),
      justifyRight:        document.queryCommandState("justifyRight"),
    });
  };

  /* Normalize text from contentEditable for canvas rendering.
     - Replace &nbsp; ( ) with regular spaces — Konva renders them
       with different metrics causing unreadable/odd-looking text.
     - Collapse runs of spaces to single space (except intentional indents).
     - Cap consecutive blank lines at 2. */
  const getLiveText = () => {
    const raw = editorRef.current?.innerText ?? "";
    return raw
      .replace(/ /g, " ")          // non-breaking space → regular space
      .replace(/[ \t]{2,}/g, " ")        // collapse multiple spaces/tabs
      .replace(/\n{3,}/g, "\n\n");       // max two consecutive blank lines
  };

  const handleInput = () => {
    const empty = !editorRef.current?.textContent?.trim();
    setIsEmpty(empty);
    syncFormats();
    /* Live update — fire even when empty so deletions reflect on canvas */
    if (editMode && onLiveUpdate) {
      onLiveUpdate(getLiveText());
    }
  };

  /* Also fire live update when toolbar formatting changes */
  const handleToolbarAction = (cmd) => {
    exec(cmd);
    if (editMode && onLiveUpdate) {
      /* Use setTimeout so execCommand finishes before reading innerText */
      setTimeout(() => onLiveUpdate(getLiveText()), 0);
    }
  };

  /* Add mode: append new block */
  const handleAdd = () => {
    const text = htmlToCanvasText(editorRef.current?.innerHTML || "");
    if (!text.trim()) return toast.error("Write some content first");
    onAdd?.(text, fontSize);
    editorRef.current.innerHTML = "";
    setIsEmpty(true);
  };

  const ToolBtn = ({ cmd, icon: Icon, title, active }) => (
    <button
      onMouseDown={e => { e.preventDefault(); handleToolbarAction(cmd); }}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        active ? "bg-blue-600 text-white" : "hover:bg-slate-200 text-slate-600"
      }`}
    >
      <Icon size={13}/>
    </button>
  );

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
        <ToolBtn cmd="bold"                icon={Bold}        title="Bold"          active={activeFormats.bold}/>
        <ToolBtn cmd="italic"              icon={Italic}      title="Italic"        active={activeFormats.italic}/>
        <ToolBtn cmd="underline"           icon={Underline}   title="Underline"     active={activeFormats.underline}/>
        <div className="w-px h-4 bg-slate-300 mx-1"/>
        <ToolBtn cmd="insertUnorderedList" icon={List}        title="Bullet List"   active={activeFormats.insertUnorderedList}/>
        <ToolBtn cmd="insertOrderedList"   icon={ListOrdered} title="Numbered List" active={activeFormats.insertOrderedList}/>
        <div className="w-px h-4 bg-slate-300 mx-1"/>
        <ToolBtn cmd="justifyLeft"         icon={AlignLeft}   title="Align Left"    active={activeFormats.justifyLeft}/>
        <ToolBtn cmd="justifyCenter"       icon={AlignCenter} title="Align Center"  active={activeFormats.justifyCenter}/>
        <ToolBtn cmd="justifyRight"        icon={AlignRight}  title="Align Right"   active={activeFormats.justifyRight}/>
        <div className="w-px h-4 bg-slate-300 mx-1"/>
        <div className="flex items-center gap-1">
          <Type size={10} className="text-slate-400"/>
          <select
            value={fontSize}
            onChange={e => setFontSize(e.target.value)}
            className="text-[11px] border border-slate-200 rounded-lg px-1 py-0.5 bg-white outline-none focus:border-blue-400 cursor-pointer"
          >
            {["10","11","12","13","14","16","18","20","24"].map(s => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>
      </div>

      {/* ContentEditable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        data-placeholder={editMode
          ? "Edit appendix content…"
          : "Type appendix content…\n• Bullet points\n1. Numbered lists\nBold, Italic, and more"}
        className="min-h-[120px] max-h-[220px] overflow-y-auto w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-sm text-slate-700 bg-white [&::-webkit-scrollbar]:hidden"
        style={{ fontSize: fontSize + "px", lineHeight: 1.6 }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          white-space: pre-line;
          font-size: 12px;
        }
        [contenteditable] ul { padding-left: 1.2em; list-style: disc; }
        [contenteditable] ol { padding-left: 1.2em; list-style: decimal; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>

      {/* Add mode: Append button */}
      {!editMode && (
        <button onClick={handleAdd} disabled={isEmpty}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors">
          <Plus size={12}/> Append to Contract
        </button>
      )}

      {/* Edit mode: live hint + delete */}
      {editMode && (
        <>
          <p className="text-[9px] text-blue-500 text-center">Editing updates canvas instantly</p>
          {onDelete && (
            <button onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors">
              <Trash2 size={12}/> Delete Appendix
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* ── Signature font options ── */
const SIG_FONTS = [
  { id: "dancing",  name: "Dancing Script", css: "'Dancing Script', cursive" },
  { id: "great",    name: "Great Vibes",    css: "'Great Vibes', cursive"    },
  { id: "pacifico", name: "Pacifico",       css: "'Pacifico', cursive"       },
  { id: "satisfy",  name: "Satisfy",        css: "'Satisfy', cursive"        },
];

/* ── Mini rich-text editor for "New Client" description fields ── */
const MiniRichEditor = ({ placeholder, editorRef, hiddenRef, name }) => {
  const [formats, setFormats] = useState({});
  const sync = () => {
    setFormats({
      bold:    document.queryCommandState("bold"),
      italic:  document.queryCommandState("italic"),
      ul:      document.queryCommandState("insertUnorderedList"),
      ol:      document.queryCommandState("insertOrderedList"),
    });
    if (hiddenRef?.current) hiddenRef.current.value = editorRef.current?.innerText ?? "";
  };
  const exec = (cmd) => { document.execCommand(cmd, false, null); editorRef.current?.focus(); sync(); };
  const Btn = ({ cmd, icon: Icon, active }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); exec(cmd); }}
      className={`p-1 rounded-md transition-all ${active ? "bg-blue-600 text-white" : "hover:bg-slate-200 text-slate-500"}`}>
      <Icon size={11}/>
    </button>
  );
  return (
    <div>
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-t-xl border-b-0">
        <Btn cmd="bold"                icon={Bold}        active={formats.bold}/>
        <Btn cmd="italic"              icon={Italic}      active={formats.italic}/>
        <div className="w-px h-3 bg-slate-300 mx-0.5"/>
        <Btn cmd="insertUnorderedList" icon={List}        active={formats.ul}/>
        <Btn cmd="insertOrderedList"   icon={ListOrdered} active={formats.ol}/>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={sync} onKeyUp={sync} onMouseUp={sync}
        data-placeholder={placeholder}
        className="min-h-[70px] max-h-[110px] overflow-y-auto w-full border border-slate-200 rounded-b-xl px-3 py-2 outline-none focus:border-blue-400 text-xs text-slate-700 bg-white [&::-webkit-scrollbar]:hidden"
        style={{ lineHeight: 1.6 }}
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue=""/>
    </div>
  );
};

/* ══════════════════════════════════════════
   SEND TO CLIENT DIALOG
══════════════════════════════════════════ */
const SendToClientDialog = ({ open, onClose, onSend, company, sending }) => {
  const { user }       = useSelector(s => s.User);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selClient,    setSelClient]    = useState(null);
  const [message,      setMessage]      = useState("");
  const [search,       setSearch]       = useState("");
  const [tab,          setTab]          = useState("existing");

  /* New client fields */
  const [nName,    setNName]    = useState("");
  const [nEmail,   setNEmail]   = useState("");
  const [nPhone,   setNPhone]   = useState("");
  const [nAddr,    setNAddr]    = useState("");
  const [nWeb,     setNWeb]     = useState("");
  const projRef    = useRef(null);
  const projHidden = useRef(null);
  const pkgRef     = useRef(null);
  const pkgHidden  = useRef(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !company?.companyslug) return;
    setLoading(true);
    setSelClient(null); setSearch(""); setMessage("");
    setNName(""); setNEmail(""); setNPhone(""); setNAddr(""); setNWeb("");
    if (projRef.current) projRef.current.innerHTML = "";
    if (pkgRef.current)  pkgRef.current.innerHTML  = "";
    axios.get(`/api/get-all-clients/${company.companyslug}`)
      .then(r => setClients(r.data.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [open, company]);

  if (!open) return null;

  const filtered = clients.filter(c =>
    !search.trim() ||
    (c.clientName  || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.clientEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (tab === "existing") {
      if (!selClient) return toast.error("Please select a client");
      onSend({ clientId: selClient.id, clientName: selClient.clientName,
        clientEmail: selClient.clientEmail, clientPhone: selClient.clientPhone,
        clientAddress: selClient.clientAddress, message });
    } else {
      if (!nEmail.trim()) return toast.error("Client email is required");
      /* Create client in DB first */
      setCreating(true);
      try {
        await axios.post("/api/employee/create-client", {
          companyName:     company?.companyslug || "",
          clientName:      nName,
          clientEmail:     nEmail,
          clientPhone:     nPhone,
          clientAddress:   nAddr,
          clientWebsite:   nWeb,
          projectsDetails: projHidden.current?.value || "",
          packageDetails:  pkgHidden.current?.value  || "",
          employeeid:      user?.employeeId || user?.id,
        });
      } catch { /* non-fatal — still send contract */ }
      finally { setCreating(false); }
      onSend({ clientName: nName, clientEmail: nEmail, clientPhone: nPhone,
        clientAddress: nAddr, message });
    }
  };

  const Field = ({ icon: Icon, label, type = "text", val, set, placeholder, required }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"/>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Send size={14} className="text-violet-600"/>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Send Contract to Client</h2>
              {company && <p className="text-[10px] text-slate-400">{company.name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={15}/>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {[["existing","Company Clients"],["new","New Client"]].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>{l}</button>
            ))}
          </div>

          {tab === "existing" ? (
            <>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search clients of ${company?.name || "company"}…`}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50"/>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-400"/></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-center">
                  <Users size={24} className="text-slate-200"/>
                  <p className="text-xs text-slate-400">
                    {clients.length === 0 ? `No clients for ${company?.name || "this company"}` : "No clients match"}
                  </p>
                  <button onClick={() => setTab("new")} className="text-xs text-blue-600 font-semibold hover:underline mt-1">
                    Add a new client →
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {filtered.map(c => (
                    <div key={c.id} onClick={() => setSelClient(c)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${
                        selClient?.id === c.id ? "bg-blue-50 border-blue-300" : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        selClient?.id === c.id ? "bg-blue-200 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {(c.clientName || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{c.clientName || "—"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.clientEmail}</p>
                      </div>
                      {selClient?.id === c.id && <CheckCircle2 size={14} className="text-blue-600 shrink-0"/>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── New Client form — same design as Clientdialog ── */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field icon={User}  label="Client Name" val={nName}  set={setNName}  placeholder="John Doe"            required/>
                <Field icon={Mail}  label="Email"       val={nEmail} set={setNEmail} placeholder="client@example.com"  required type="email"/>
                <Field icon={Phone} label="Phone"       val={nPhone} set={setNPhone} placeholder="+92 300 0000000"/>
                <Field icon={MapPin}label="Address"     val={nAddr}  set={setNAddr}  placeholder="City, Country"/>
              </div>
              <Field icon={Globe} label="Website" val={nWeb} set={setNWeb} placeholder="https://example.com"/>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Details</label>
                <MiniRichEditor placeholder="Describe project scope, timeline…" editorRef={projRef} hiddenRef={projHidden} name="projectsDetails"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Package Details</label>
                <MiniRichEditor placeholder="Describe package, pricing…" editorRef={pkgRef} hiddenRef={pkgHidden} name="packageDetails"/>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message to Client (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Please review the attached contract…"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 resize-none [&::-webkit-scrollbar]:hidden"/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || creating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60 transition-colors shadow-sm shadow-blue-200">
            {(sending || creating) ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
            {creating ? "Creating…" : sending ? "Sending…" : "Send Contract"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN SALES PANEL PAGE
══════════════════════════════════════════ */
export default function SalesPanelPage() {
  const { slug } = useParams();
  const router   = useRouter();
  const { user } = useSelector(s => s.User);

  /* ── Company + Contract State ── */
  const [companies,      setCompanies]      = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompany,  setSelectedCompany]  = useState(null);

  const [contracts,       setContracts]       = useState([]);
  const [loadingContracts,setLoadingContracts] = useState(false);
  const [selectedContract,setSelectedContract] = useState(null);

  /* ── Canvas State ── */
  const [shapes,     setShapes]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds,setSelectedIds]= useState([]);
  const [pageW,      setPageW]      = useState(750);
  const [pageH,      setPageH]      = useState(1060);
  const [bgColor,    setBgColor]    = useState("#ffffff");
  const [loadingCanvas, setLoadingCanvas] = useState(false);
  const [drawingLine,   setDrawingLine]   = useState(null);

  /* ── Sidebar state ── */
  const [sigFont, setSigFont] = useState(SIG_FONTS[0]);

  /* ── Dialog state ── */
  const [sendOpen,  setSendOpen]  = useState(false);
  const [sending,   setSending]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const stageRef = useRef(null);
  const dirty    = useRef(false);
  const genId    = () => `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

  /* ── Update a shape property ── */
  const updateShape = useCallback((id, props) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...props } : s));
    dirty.current = true;
  }, []);

  /* ── Identify editable shapes: signature fields OR appendix blocks ── */
  const isSignatureShape = useCallback((shape) => {
    if (!shape) return false;
    const ff = (shape.fontFamily || "").toLowerCase();
    return ff.includes("cursive") || ff.includes("dancing") || ff.includes("great vibes") ||
           ff.includes("pacifico") || ff.includes("satisfy") || ff.includes("caveat") ||
           ff.includes("sacramento");
  }, []);

  const isEditableShape = useCallback((shape) => {
    if (!shape) return false;
    return isSignatureShape(shape) || !!shape._appendix;
  }, [isSignatureShape]);

  /* currently selected shape (for font application) */
  const selectedShape  = shapes.find(s => s.id === selectedId) || null;
  const isTextSelected = selectedShape && ["i-text","text","signature"].includes(selectedShape.type);

  /* Find the ONE appendix content shape (if any exists on this canvas).
     We limit to one appendix per contract, so we just take the first match. */
  const existingAppendixContent = shapes.find(
    s => s._appendix && s.type === "i-text" && s.text !== "APPENDIX"
  ) || null;

  /* ── Locked canvas handlers — signature + appendix shapes are interactive ── */
  const handleSelectLocked = useCallback((id) => {
    if (!id) { setSelectedId(null); setSelectedIds([]); return; }
    const shape = shapes.find(s => s.id === id);
    if (isEditableShape(shape)) {
      setSelectedId(id); setSelectedIds([]);
    } else {
      setSelectedId(null); setSelectedIds([]);
    }
  }, [shapes, isEditableShape]);

  const handleChangeLocked = useCallback((id, props) => {
    const shape = shapes.find(s => s.id === id);
    if (!isEditableShape(shape)) return;
    updateShape(id, props);
  }, [shapes, isEditableShape, updateShape]);

  /* ── Delete selected appendix block on Delete / Backspace ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selectedId) return;
      /* only allow deleting if target is not an input/textarea */
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      const shape = shapes.find(s => s.id === selectedId);
      if (!shape?._appendix) return;
      e.preventDefault();
      setShapes(prev => prev.filter(s => !s._appendix));
      setSelectedId(null);
      dirty.current = true;
      toast.success("Appendix removed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, shapes]);

  /* ── Ctrl+S → save contract ──
     Use a ref so the keydown handler always calls the LATEST handleSave,
     which closes over the current shapes state (avoids stale closure). */
  const handleSaveRef = useRef(null);
  useEffect(() => { handleSaveRef.current = handleSave; });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // runs once — always current via ref

  /* ── Apply selected font to currently selected canvas text ── */
  const applyFont = useCallback((font) => {
    setSigFont(font);
    if (selectedId && isTextSelected) {
      updateShape(selectedId, { fontFamily: font.css });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isTextSelected, updateShape]);

  /* ── Load Google Fonts ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  /* ── 1. Load assigned companies ── */
  useEffect(() => {
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    setLoadingCompanies(true);
    axios.get(`/api/get-employee-companies/${eid}`)
      .then(r => {
        const companies = r.data.companies || [];
        setCompanies(companies);
        if (companies.length > 0) setSelectedCompany(companies[0]);
      })
      .catch(() => toast.error("Failed to load companies"))
      .finally(() => setLoadingCompanies(false));
  }, [user]);

  /* ── 2. Load contracts for selected company ── */
  useEffect(() => {
    if (!selectedCompany) return;
    const eid = user?.employeeId || user?.id;
    if (!eid) return;

    setLoadingContracts(true);
    setContracts([]);
    setSelectedContract(null);
    setShapes([]);

    axios.get(`/api/letters/employee-contracts?employeeId=${eid}`)
      .then(r => {
        const all = r.data.contracts || [];
        /* Filter by selected company name */
        const forCompany = all.filter(c =>
          c.company?.name === selectedCompany.name ||
          c.company?.name?.toLowerCase() === selectedCompany.name?.toLowerCase()
        );
        setContracts(forCompany);
        if (forCompany.length > 0) setSelectedContract(forCompany[0]);
      })
      .catch(() => toast.error("Failed to load contracts"))
      .finally(() => setLoadingContracts(false));
  }, [selectedCompany, user]);

  /* ── 3. Load canvas when contract selected ──
       Dependency is selectedContract.id (string) — not the whole object —
       so React fires the effect reliably on every contract switch.       ── */
  const contractId = selectedContract?.id ?? null;

  useEffect(() => {
    if (!contractId || !selectedContract) { setShapes([]); setLoadingCanvas(false); return; }

    let cancelled = false;
    setLoadingCanvas(true);
    setShapes([]);   // clear immediately so no stale shapes flash

    const loadCanvas = async () => {
      try {
        /* Use the letter's own saved canvas — but only if it has actual shapes.
           Fall back to the template when: (a) no letter canvas, or (b) letter
           was accidentally saved with an empty shapes array.                   */
        let canvasData = selectedContract.canvasData ?? null;

        const hasShapes = (raw) => {
          if (!raw) return false;
          try {
            const d = typeof raw === "string" ? JSON.parse(raw) : raw;
            return Array.isArray(d.shapes) && d.shapes.length > 0;
          } catch { return false; }
        };

        if (!hasShapes(canvasData) && selectedContract.templateId) {
          try {
            const r = await axios.get(`/api/templates/${selectedContract.templateId}`);
            if (r.data.success && r.data.template?.canvasData) {
              canvasData = r.data.template.canvasData;
            }
          } catch { /* stay with existing canvasData */ }
        }

        if (cancelled) return;

        if (canvasData) {
          const data = typeof canvasData === "string" ? JSON.parse(canvasData) : canvasData;
          setShapes(data.shapes   || []);
          setPageW(data.pageW     || 750);
          setPageH(data.pageH     || 1060);
          setBgColor(data.bgColor || "#ffffff");
        } else {
          setShapes([]);
          setPageW(750); setPageH(1060); setBgColor("#ffffff");
        }
      } catch {
        if (!cancelled) setShapes([]);
      } finally {
        if (!cancelled) setLoadingCanvas(false);
      }
    };

    loadCanvas();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  /* ── Add appendix between body content and signature section ──
     Strategy: bottom 280px of the current canvas = signature zone.
     Appendix goes just below body content, signature zone shifts down. ── */
  const handleAddAppendix = useCallback((text, fontSize) => {
    if (!text.trim()) return;
    const cc = getContrastColors(bgColor);
    const fs = Number(fontSize) || 12;

    setShapes(prev => {
      /* Threshold: anything in the last 280px is the signature section */
      const sigZoneStart = pageH - 280;

      const bodyShapes = prev.filter(s => (s.y ?? 0) < sigZoneStart);
      const sigShapes  = prev.filter(s => (s.y ?? 0) >= sigZoneStart);

      /* Bottom Y of body content.
         Arial avg char width ≈ 0.53× fontSize; Konva lineHeight defaults to 1
         so visual line height ≈ fontSize × 1.15 (slight descender padding).
         Only word-wrap shapes that have an explicit width set. */
      const estLineH = (sFs) => sFs * 1.15;
      const estCharsPerLine = (w, sFs) => Math.max(1, Math.floor(w / (sFs * 0.53)));

      const bodyBottom = bodyShapes.reduce((max, s) => {
        const sy = s.y ?? 0;
        let h = 0;
        if (["i-text","text","signature"].includes(s.type)) {
          const sFs = s.fontSize || 14;
          if (s.width) {
            const cpl   = estCharsPerLine(s.width, sFs);
            const lines = (s.text || "").split("\n").reduce((t, para) =>
              t + (para.trim() ? Math.max(1, Math.ceil(para.length / cpl)) : 1), 0);
            h = estLineH(sFs) * lines;
          } else {
            h = estLineH(sFs) * Math.max((s.text || "").split("\n").length, 1);
          }
        } else if (s.type === "line") {
          h = 2;
        } else {
          h = s.height ?? 30;
        }
        return Math.max(max, sy + h);
      }, 0);

      /* Appendix starts 30px below body content */
      const appendixY = bodyBottom + 30;

      /* Estimate visual lines for the new appendix text using same metrics */
      const textWidth    = pageW - 100;
      const cpl          = estCharsPerLine(textWidth, fs);
      const lineCount    = text.split("\n").reduce((total, para) =>
        total + (para.trim() ? Math.max(1, Math.ceil(para.length / cpl)) : 1), 0);

      /* +55 covers APPENDIX label row + separator line + top/bottom margins */
      const appendixH   = lineCount * estLineH(fs) + 55;
      const appendixEnd = appendixY + appendixH;

      /* Anchor sig shapes relative to the new sig-zone start so they are
         ALWAYS correctly positioned after the appendix — regardless of how
         many appendixes have been added. */
      const newSigStart  = appendixEnd + 30;
      const shiftedSig   = sigShapes.map(s => ({
        ...s,
        y: newSigStart + Math.max(0, (s.y ?? 0) - sigZoneStart),
      }));

      /* Canvas height = new sig zone start + original sig zone height + margin */
      const newPageH = Math.max(pageH, newSigStart + 280 + 40);
      if (newPageH > pageH) setPageH(newPageH);

      const groupId = genId();
      const id1 = genId(), id2 = genId(), id3 = genId();
      return [
        ...bodyShapes,
        { id: id1, type: "line", x: 50, y: appendixY, points: [0, 0, pageW - 100, 0],
          stroke: cc.altLine, strokeWidth: 1, fill: "transparent",
          scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
          _appendix: true, _appendixGroup: groupId },
        { id: id2, type: "i-text", text: "APPENDIX", x: 50, y: appendixY + 12,
          fontSize: 11, fontFamily: "Arial", fontWeight: "bold", fill: cc.accent,
          scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
          _appendix: true, _appendixGroup: groupId },
        { id: id3, type: "i-text", text, x: 50, y: appendixY + 32,
          fontSize: fs, fontFamily: "Arial", fill: cc.text, width: pageW - 100,
          scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
          _appendix: true, _appendixGroup: groupId },
        ...shiftedSig,
      ];
    });

    dirty.current = true;
    toast.success("Appendix added to contract");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor, pageW, pageH]);


  /* ── Save (persist shapes back to assigned_letters) ── */
  const handleSave = async () => {
    if (!selectedContract?.id) return;
    setSaving(true);
    try {
      const canvasData = JSON.stringify({ version: "konva-v1", shapes, pageW, pageH, bgColor });
      await axios.patch(`/api/letters/save-canvas`, {
        letterId: selectedContract.id,
        canvasData,
      });
      /* Update in-memory contract so switching away and back loads the saved version */
      const updated = { ...selectedContract, canvasData };
      setSelectedContract(updated);
      setContracts(prev => prev.map(c => c.id === selectedContract.id ? updated : c));
      dirty.current = false;
      toast.success("Contract saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  /* ── Export PDF ── */
  const handleExportPDF = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const jsPDF   = (await import("jspdf")).default;
      const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297);
      pdf.save(`${selectedContract?.templateName || "contract"}.pdf`);
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF export failed"); }
    finally { setExporting(false); }
  };

  /* ── Send to Client ── */
  const handleSend = async (clientInfo) => {
    if (!selectedContract?.id) return;
    setSending(true);
    try {
      const res = await axios.post("/api/employee/send-contract", {
        letterId: selectedContract.id,
        ...clientInfo,
      });
      if (res.data.success) {
        toast.success(res.data.emailSent ? "Contract sent to client!" : "Saved — check SMTP settings");
        setSendOpen(false);
      } else toast.error(res.data.error || "Failed to send");
    } catch { toast.error("Failed to send contract"); }
    finally { setSending(false); }
  };

  /* ════════ RENDER ════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f1f3f5]">

      {/* ══ HEADER ══ */}
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-4 bg-white border-b border-slate-200 shadow-sm">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0">
          <ArrowLeft size={17}/>
        </button>
        <div className="w-px h-5 bg-slate-200"/>

        {/* Company + Contract breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedCompany ? (
            <>
              <div className="flex items-center gap-1.5 shrink-0">
                {(selectedCompany.companylogo || selectedCompany.companyLogo) ? (
                  <img src={selectedCompany.companylogo || selectedCompany.companyLogo}
                    className="w-5 h-5 rounded object-contain" alt=""/>
                ) : (
                  <Building2 size={14} className="text-slate-400"/>
                )}
                <span className="text-xs font-semibold text-slate-600">{selectedCompany.name}</span>
              </div>
              {selectedContract && (
                <>
                  <ChevronRight size={12} className="text-slate-300 shrink-0"/>
                  <FileSignature size={13} className="text-violet-500 shrink-0"/>
                  <span className="text-sm font-bold text-slate-800 truncate">
                    {selectedContract.templateName || "Contract"}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-sm font-bold text-slate-800">Sales Panel</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedContract && (
            <>
              <button onClick={handleSave} disabled={saving || !dirty.current}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors">
                {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={handleExportPDF} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-blue-600 disabled:opacity-50 transition-colors">
                {exporting ? <Loader2 size={12} className="animate-spin"/> : <FileDown size={12}/>}
                PDF
              </button>
              <button onClick={() => setSendOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                <Send size={12}/> Send to Client
              </button>
            </>
          )}
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT SIDEBAR: Companies + Contracts ══ */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

          {/* Companies section */}
          <div className="px-3 pt-4 pb-2 shrink-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Building2 size={10}/> Companies
            </p>
            {loadingCompanies ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-slate-300"/>
              </div>
            ) : companies.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic px-1 py-2">No companies assigned</p>
            ) : (
              <div className="space-y-0.5">
                {companies.map(co => (
                  <button key={co.id} onClick={() => setSelectedCompany(co)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                      selectedCompany?.id === co.id
                        ? "bg-violet-50 border border-violet-200 text-violet-800"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}>
                    {(co.companylogo || co.companyLogo) ? (
                      <img src={co.companylogo || co.companyLogo}
                        className="w-6 h-6 rounded object-contain bg-slate-100 shrink-0" alt=""/>
                    ) : (
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        <Building2 size={12} className="text-slate-400"/>
                      </div>
                    )}
                    <span className="text-xs font-semibold truncate">{co.name}</span>
                    {selectedCompany?.id === co.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"/>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 my-1"/>

          {/* Contracts section */}
          <div className="px-3 pb-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 pt-2">
              <FileSignature size={10}/> Contracts
              {contracts.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[9px] font-bold">
                  {contracts.length}
                </span>
              )}
            </p>

            {loadingContracts ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-slate-300"/>
              </div>
            ) : !selectedCompany ? (
              <p className="text-[11px] text-slate-400 italic px-1">Select a company first</p>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <FileText size={20} className="text-slate-200"/>
                <p className="text-[11px] text-slate-400">No contracts assigned for {selectedCompany.name}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {contracts.map(c => (
                  <button key={c.id} onClick={() => setSelectedContract(c)}
                    className={`w-full flex items-start gap-2 px-2.5 py-2.5 rounded-xl text-left transition-all ${
                      selectedContract?.id === c.id
                        ? "bg-violet-50 border border-violet-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}>
                    <FileSignature size={13} className={`mt-0.5 shrink-0 ${
                      selectedContract?.id === c.id ? "text-violet-600" : "text-slate-400"
                    }`}/>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${
                        selectedContract?.id === c.id ? "text-violet-800" : "text-slate-700"
                      }`}>
                        {c.templateName || "Contract"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.assignedAt
                          ? new Date(c.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })
                          : ""}
                      </p>
                    </div>
                    {!c.isRead && (
                      <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1"/>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ══ CANVAS AREA ══ */}
        <main className="flex-1 overflow-auto bg-[#f1f3f5] flex flex-col items-center py-8 px-4">
          {!selectedContract ? (
            <div className="flex flex-col items-center justify-center gap-4 mt-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FileSignature size={28} className="text-violet-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">No contract selected</p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedCompany
                    ? `Select a contract from the sidebar to view it`
                    : "Select a company from the sidebar"}
                </p>
              </div>
            </div>
          ) : loadingCanvas ? (
            <div className="flex flex-col items-center justify-center gap-3 mt-20">
              <Loader2 size={28} className="animate-spin text-violet-400"/>
              <p className="text-sm text-slate-400">Loading contract canvas…</p>
            </div>
          ) : shapes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 mt-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <AlertCircle size={28} className="text-slate-300"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Contract canvas is empty</p>
                <p className="text-xs text-slate-400 mt-1">
                  The admin hasn't saved the canvas for this template yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Hint */}
              <div className="mb-3 flex items-center gap-2 self-start flex-wrap">
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <PenLine size={9}/> Double-click signature / appendix to edit
                </span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Trash2 size={9}/> Select appendix → Delete key to remove
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Eye size={9}/> Core content view-only
                </span>
              </div>

              {/* Canvas — signature fields editable, body content locked
                  key=contractId forces fresh Konva mount per contract       */}
              <KonvaCanvas
                key={contractId}
                stageRef={stageRef}
                shapes={shapes}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={handleSelectLocked}
                onSelectMultiple={(ids) => {
                  const editIds = ids.filter(id => isEditableShape(shapes.find(sh => sh.id === id)));
                  setSelectedIds(editIds); setSelectedId(null);
                }}
                onChange={handleChangeLocked}
                canEditShape={isEditableShape}
                drawTool="select"
                brushColor="#000"
                brushSize={3}
                bgColor={bgColor}
                pageW={pageW}
                pageH={pageH}
                drawingLine={drawingLine}
                setDrawingLine={setDrawingLine}
                setShapes={setShapes}
                dirty={dirty}
              />
            </>
          )}
        </main>

        {/* ══ RIGHT SIDEBAR: Appendix + Signature ══ */}
        <aside className="w-[260px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">

          {!selectedContract ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-xs text-slate-400">Select a contract to add signature or appendix</p>
            </div>
          ) : (
            <>
              {/* ── Client Signature ── */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <PenLine size={11} className="text-violet-500"/> Client Signature
                </p>

                {/* Context hint */}
                <p className={`text-[10px] mb-3 leading-relaxed ${isTextSelected ? "text-violet-600 font-semibold" : "text-slate-400"}`}>
                  {isTextSelected
                    ? "✓ Text selected — click a font to apply"
                    : "Select a signature on canvas or add a new one below"}
                </p>

                {/* Font picker — applies to selected text OR sets default for new sig */}
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {SIG_FONTS.map(f => {
                    const activeOnCanvas = isTextSelected && selectedShape?.fontFamily === f.css;
                    return (
                      <button key={f.id} onClick={() => applyFont(f)}
                        className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                          activeOnCanvas
                            ? "border-violet-500 bg-violet-100 ring-1 ring-violet-400"
                            : sigFont.id === f.id
                              ? "border-violet-400 bg-violet-50"
                              : "border-slate-200 bg-white hover:border-violet-300"
                        }`}>
                        <span style={{ fontFamily: f.css, fontSize: 17, display: "block", lineHeight: 1.3, color: "#1e293b" }}>
                          Abc
                        </span>
                        <p className="text-[8px] text-slate-400 mt-0.5 truncate">{f.name}</p>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* ── Appendix panel ─ edit if one exists, add if none ── */}
              <div className="p-4 border-b border-slate-100">
                {existingAppendixContent ? (
                  <>
                    <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <PenLine size={11}/> Edit Appendix
                    </p>
                    {/* key remounts editor fresh if the appendix was deleted & re-added */}
                    <AppendixEditor
                      key={existingAppendixContent.id}
                      editMode
                      initialText={existingAppendixContent.text || ""}
                      onLiveUpdate={(text) => {
                        updateShape(existingAppendixContent.id, { text });
                      }}
                      onDelete={() => {
                        setShapes(prev => prev.filter(s => !s._appendix));
                        setSelectedId(null);
                        dirty.current = true;
                        toast.success("Appendix removed");
                      }}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Plus size={11} className="text-blue-500"/> Add Appendix
                    </p>
                    <AppendixEditor onAdd={handleAddAppendix}/>
                  </>
                )}
              </div>

              {/* ── Send to Client shortcut ── */}
              <div className="p-4">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Send size={11} className="text-violet-500"/> Send to Client
                </p>
                {selectedCompany && (
                  <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                    Clients from <span className="font-semibold text-slate-600">{selectedCompany.name}</span> will be shown.
                  </p>
                )}
                <button onClick={() => setSendOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-violet-200">
                  <Send size={14}/> Send to Client
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Save first to include appendix &amp; signature
                </p>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ══ SEND TO CLIENT DIALOG ══ */}
      <SendToClientDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSend={handleSend}
        company={selectedCompany}
        sending={sending}
      />
    </div>
  );
}
