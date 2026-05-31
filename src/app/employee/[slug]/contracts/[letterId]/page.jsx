"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  ArrowLeft, FileSignature, Send, Loader2, ChevronDown,
  User, Mail, Phone, MapPin, X, PenLine, Plus, Search,
  Building2, CheckCircle2,
} from "lucide-react";

const KonvaCanvas = dynamic(
  () => import("@/app/contract-editor/[templateid]/KonvaCanvas"),
  { ssr: false }
);

/* ── Signature fonts ── */
const SIG_FONTS = [
  { id: "dancing",  name: "Dancing Script", css: "'Dancing Script', cursive" },
  { id: "great",    name: "Great Vibes",    css: "'Great Vibes', cursive"    },
  { id: "pacifico", name: "Pacifico",       css: "'Pacifico', cursive"       },
  { id: "satisfy",  name: "Satisfy",        css: "'Satisfy', cursive"        },
];

/* ── Send to Client Dialog ── */
const SendDialog = ({ open, onClose, onSend, clients, loadingClients, sending }) => {
  const [selClient,  setSelClient]  = useState(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customName,  setCustomName]  = useState("");
  const [message,     setMessage]     = useState("");
  const [search,      setSearch]      = useState("");
  const [useCustom,   setUseCustom]   = useState(false);

  if (!open) return null;

  const filtered = clients.filter(c =>
    !search.trim() || (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (useCustom) {
      if (!customEmail) return toast.error("Enter client email");
      onSend({ clientName: customName, clientEmail: customEmail, message });
    } else {
      if (!selClient) return toast.error("Select a client");
      onSend({
        clientId:      selClient.id,
        clientName:    selClient.name,
        clientEmail:   selClient.email,
        clientPhone:   selClient.phone,
        clientAddress: selClient.address,
        message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "88vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-violet-600"/>
            <h2 className="text-sm font-bold text-slate-800">Send Contract to Client</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={15}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden">
          {/* Toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setUseCustom(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!useCustom ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>
              My Clients
            </button>
            <button onClick={() => setUseCustom(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${useCustom ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>
              New Client
            </button>
          </div>

          {!useCustom ? (
            /* Select from existing clients */
            <>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search your clients…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50"
                />
              </div>
              {loadingClients ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-violet-400"/></div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No clients found. Use "New Client" tab.</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {filtered.map(c => (
                    <div key={c.id} onClick={() => setSelClient(c)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${
                        selClient?.id === c.id
                          ? "bg-violet-50 border-violet-300"
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        selClient?.id === c.id ? "bg-violet-200" : "bg-slate-100"
                      }`}>
                        <span className={`text-xs font-bold ${selClient?.id === c.id ? "text-violet-700" : "text-slate-500"}`}>
                          {(c.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{c.name || "—"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                      </div>
                      {selClient?.id === c.id && <CheckCircle2 size={14} className="text-violet-600 shrink-0"/>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Custom client */
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Client Name</label>
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Client Email *</label>
                <input type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"/>
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Please review the attached contract…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none"/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-60 transition-colors">
            {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
            {sending ? "Sending…" : "Send Contract"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ MAIN CONTRACT VIEW PAGE ═══════════════ */
export default function SalesContractPage() {
  const { slug, letterId } = useParams();
  const router  = useRouter();
  const { user } = useSelector(s => s.User);

  const [letter,     setLetter]    = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [shapes,     setShapes]    = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pageW,      setPageW]     = useState(750);
  const [pageH,      setPageH]     = useState(1060);
  const [bgColor,    setBgColor]   = useState("#ffffff");

  /* Sidebar */
  const [sigText,    setSigText]   = useState("");
  const [sigFont,    setSigFont]   = useState(SIG_FONTS[0]);
  const [appendix,   setAppendix]  = useState("");

  /* Send dialog */
  const [sendOpen,       setSendOpen]       = useState(false);
  const [clients,        setClients]        = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [sending,        setSending]        = useState(false);

  const stageRef    = useRef(null);
  const drawingLine = useRef(null);
  const dirty       = useRef(false);

  const genId = () => `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

  /* Load letter + canvas data */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/letters/by-id?letterId=${letterId}`);
        if (!res.data.success) { toast.error("Contract not found"); return; }
        const l = res.data.letter;
        setLetter(l);

        /* 1️⃣ Try canvasData stored in the letter itself (new assignments) */
        let canvasData = l.canvasData;

        /* 2️⃣ If missing (old assignment), fetch directly from template */
        if (!canvasData && l.templateId) {
          try {
            const tmplRes = await axios.get(`/api/templates/${l.templateId}`);
            if (tmplRes.data.success) canvasData = tmplRes.data.template?.canvasData;
          } catch { /* template fetch failed — canvas will be empty */ }
        }

        if (canvasData) {
          const data = typeof canvasData === "string" ? JSON.parse(canvasData) : canvasData;
          if (data?.shapes) setShapes(data.shapes);
          if (data?.pageW)  setPageW(data.pageW);
          if (data?.pageH)  setPageH(data.pageH);
          if (data?.bgColor) setBgColor(data.bgColor);
        }
      } catch { toast.error("Failed to load contract"); }
      finally { setLoading(false); }
    };
    if (letterId) load();
  }, [letterId]);

  /* Load Google fonts */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  /* Load employee clients when send dialog opens */
  useEffect(() => {
    if (!sendOpen) return;
    const eid = user?.employeeId || user?.id;
    if (!eid) return;
    setLoadingClients(true);
    axios.get(`/api/employee/my-clients?employeeId=${eid}`)
      .then(r => setClients(r.data.clients || []))
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, [sendOpen, user]);

  /* Add signature to canvas */
  const handleAddSignature = useCallback(() => {
    if (!sigText.trim()) return toast.error("Type your signature first");
    const sigY = pageH - 200;
    const id1  = genId(), id2 = genId(), id3 = genId();
    setShapes(p => [...p,
      { id: id1, type: "i-text", text: sigText, x: pageW - 310, y: sigY, fontSize: 38,
        fontFamily: sigFont.css, fill: "#1e293b", width: 250, align: "center",
        scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      { id: id2, type: "line", x: pageW - 310, y: sigY + 50, points: [0, 0, 250, 0],
        stroke: "#1e293b", strokeWidth: 1, fill: "transparent",
        scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      { id: id3, type: "i-text", text: "CLIENT SIGNATURE", x: pageW - 310, y: sigY + 60,
        fontSize: 9, fontFamily: "Arial", fontWeight: "bold", fill: "#64748b",
        scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    ]);
    toast.success("Signature added to canvas");
    setSigText("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigText, sigFont, pageW, pageH]);

  /* Add appendix text to canvas */
  const handleAddAppendix = useCallback(() => {
    if (!appendix.trim()) return toast.error("Type appendix content first");
    const id1 = genId(), id2 = genId();
    setShapes(p => [...p,
      { id: id1, type: "i-text", text: "APPENDIX", x: 50, y: pageH - 200, fontSize: 13,
        fontFamily: "Arial", fontWeight: "bold", fill: "#1e3a8a",
        scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      { id: id2, type: "i-text", text: appendix, x: 50, y: pageH - 178, fontSize: 12,
        fontFamily: "Arial", fill: "#374151", width: pageW - 100,
        scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    ]);
    toast.success("Appendix added");
    setAppendix("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendix, pageW, pageH]);

  /* Send contract to client */
  const handleSend = async (clientInfo) => {
    setSending(true);
    try {
      const res = await axios.post("/api/employee/send-contract", {
        letterId, ...clientInfo,
      });
      if (res.data.success) {
        toast.success(res.data.emailSent ? "Contract sent to client!" : "Saved — check SMTP settings");
        setSendOpen(false);
      } else toast.error(res.data.error || "Failed to send");
    } catch { toast.error("Failed to send contract"); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f1f3f5]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3"/>
        <p className="text-sm text-slate-500">Loading contract…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f1f3f5]">

      {/* ─── Header ─── */}
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-4 border-b border-[#e0e0e0] bg-white">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={17}/>
        </button>
        <div className="w-px h-5 bg-slate-200"/>
        <div className="flex items-center gap-2 min-w-0">
          <FileSignature size={16} className="text-violet-600 shrink-0"/>
          <p className="text-sm font-bold text-slate-800 truncate">{letter?.templateName || "Contract"}</p>
          {letter?.company?.name && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
              <Building2 size={10}/>{letter.company.name}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-medium">Read Only</span>
          <button
            onClick={() => setSendOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Send size={13}/> Send to Client
          </button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Canvas ─── */}
        <main className="flex-1 overflow-auto bg-[#f1f3f5] py-8 px-6 flex flex-col items-center">
          {shapes.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center gap-3 mt-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FileSignature size={24} className="text-violet-400"/>
              </div>
              <p className="text-sm font-semibold text-slate-500">Contract canvas is empty</p>
              <p className="text-xs text-slate-400">The admin may not have saved this contract canvas yet.</p>
            </div>
          ) : (
            /* Outer wrapper: overlay on top blocks all clicks → read-only */
            <div className="relative" style={{ userSelect: "none" }}>
              <div
                className="absolute inset-0 z-10"
                style={{ cursor: "default" }}
                onMouseDown={e => e.preventDefault()}
                onPointerDown={e => e.preventDefault()}
              />
              <KonvaCanvas
                stageRef={stageRef}
                shapes={shapes}
                selectedId={null}
                selectedIds={[]}
                onSelect={() => {}}
                onSelectMultiple={() => {}}
                onChange={() => {}}
                drawTool="select"
                brushColor="#000"
                brushSize={3}
                bgColor={bgColor}
                pageW={pageW}
                pageH={pageH}
                drawingLine={null}
                setDrawingLine={() => {}}
                setShapes={setShapes}
                dirty={dirty}
              />
            </div>
          )}
          <p className="mt-4 text-[11px] text-slate-400">
            Contract is read-only. Add signature or appendix from the sidebar, then send to client.
          </p>
        </main>

        {/* ─── Sidebar ─── */}
        <aside className="w-[280px] shrink-0 bg-white border-l border-[#e6e6e6] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">

          {/* Signature section */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <PenLine size={11} className="text-violet-500"/> Client Signature
            </p>

            {/* Font picker */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {SIG_FONTS.map(f => (
                <button key={f.id} onClick={() => setSigFont(f)}
                  className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                    sigFont.id === f.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-200"
                  }`}>
                  <span style={{ fontFamily: f.css, fontSize: 18, display: "block", lineHeight: 1.3, color: "#1e293b" }}>Abc</span>
                  <p className="text-[8px] text-slate-400 mt-0.5 truncate">{f.name}</p>
                </button>
              ))}
            </div>

            {/* Preview */}
            {sigText && (
              <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-center overflow-hidden">
                <span style={{ fontFamily: sigFont.css, fontSize: 28, color: "#1e293b", lineHeight: 1.2 }}>
                  {sigText}
                </span>
              </div>
            )}

            <input
              value={sigText} onChange={e => setSigText(e.target.value)}
              placeholder="Type your name…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 mb-2"
            />
            <button onClick={handleAddSignature}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors">
              <Plus size={13}/> Add Signature to Contract
            </button>
          </div>

          {/* Appendix section */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Plus size={11} className="text-blue-500"/> Appendix
            </p>
            <textarea
              value={appendix} onChange={e => setAppendix(e.target.value)}
              placeholder="Type appendix content to add at the end of the contract…"
              rows={5}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 resize-none mb-2"
            />
            <button onClick={handleAddAppendix}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
              <Plus size={13}/> Add Appendix to Contract
            </button>
          </div>

          {/* Send to client */}
          <div className="p-4">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Send size={11} className="text-violet-500"/> Send to Client
            </p>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Select one of your clients to send this contract. The client will receive it via email.
            </p>
            <button onClick={() => setSendOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-violet-200">
              <Send size={14}/> Send to Client
            </button>
          </div>

        </aside>
      </div>

      {/* ─── Send Dialog ─── */}
      <SendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSend={handleSend}
        clients={clients}
        loadingClients={loadingClients}
        sending={sending}
      />
    </div>
  );
}
