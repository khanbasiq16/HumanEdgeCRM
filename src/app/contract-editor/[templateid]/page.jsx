"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Loader2, FileDown, ChevronDown,
  ChevronLeft, Grid, Type, Image as ImageIcon, Tag, Palette,
  Square, Circle, Minus, Triangle, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Trash2, Copy,
  Building2, X, MoveUp, MoveDown, RotateCcw, Minus as LineIcon,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  Layers, FileText,
} from "lucide-react";

/* ─────────────── Config ─────────────── */
const A4_W = 750;
const A4_H = 1060;

const FONT_FAMILIES = [
  "Arial","Times New Roman","Georgia","Helvetica","Courier New",
  "Trebuchet MS","Verdana","Palatino Linotype","Garamond",
];

const CLIENT_VARS = [
  "Client Name","Client Address","Client Email","Client Phone",
  "Company Name","Contract Date","Date",
];

const BG_COLORS = [
  "#ffffff","#f8fafc","#fef9f0","#f0f9ff","#f0fdf4",
  "#fdf4ff","#fff1f2","#f1f5f9","#0f172a","#1e1b4b",
];

/* ─────────────── Fabric helpers ─────── */
let _fab = null;
const getFab = async () => {
  if (_fab) return _fab;
  _fab = await import("fabric");
  return _fab;
};

/* ─────────────── Sidebar panels ─────── */
const SIDEBAR_ITEMS = [
  { id:"elements", icon:Grid,      label:"Elements"  },
  { id:"text",     icon:Type,      label:"Text"      },
  { id:"images",   icon:ImageIcon, label:"Images"    },
  { id:"vars",     icon:Tag,       label:"Variables" },
  { id:"design",   icon:Palette,   label:"Design"    },
];

/* ────────────── Elements Panel ─────── */
const SHAPES = [
  { id:"rect",          label:"Rectangle",    render: () => <div className="w-8 h-5 rounded-sm bg-slate-700" /> },
  { id:"rect-outline",  label:"Rect Outline", render: () => <div className="w-8 h-5 rounded-sm border-2 border-slate-700" /> },
  { id:"circle",        label:"Circle",       render: () => <div className="w-6 h-6 rounded-full bg-slate-700" /> },
  { id:"circle-outline",label:"Circle Line",  render: () => <div className="w-6 h-6 rounded-full border-2 border-slate-700" /> },
  { id:"line",          label:"Line",         render: () => <div className="w-8 h-0 border-t-2 border-slate-700 mt-3" /> },
  { id:"triangle",      label:"Triangle",
    render: () => (
      <svg width="28" height="24" viewBox="0 0 28 24">
        <polygon points="14,2 26,22 2,22" fill="#374151" />
      </svg>
    )
  },
  { id:"arrow",         label:"Arrow",
    render: () => (
      <svg width="28" height="20" viewBox="0 0 28 20">
        <line x1="2" y1="10" x2="22" y2="10" stroke="#374151" strokeWidth="2"/>
        <polygon points="22,5 28,10 22,15" fill="#374151"/>
      </svg>
    )
  },
  { id:"star",          label:"Star",
    render: () => (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <polygon points="14,2 17,10 26,10 19,15 22,24 14,19 6,24 9,15 2,10 11,10" fill="#374151"/>
      </svg>
    )
  },
];

const ElementsPanel = ({ onAdd }) => (
  <div className="p-4">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Shapes</p>
    <div className="grid grid-cols-3 gap-2">
      {SHAPES.map(shape => (
        <button
          key={shape.id}
          onClick={() => onAdd(shape.id)}
          className="flex flex-col items-center gap-1.5 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="h-7 flex items-center justify-center">{shape.render()}</div>
          <span className="text-[10px] text-slate-500 font-medium leading-none">{shape.label}</span>
        </button>
      ))}
    </div>
    <div className="mt-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Lines & Dividers</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id:"hline",  label:"H Line", render:()=><div className="w-16 border-t-2 border-slate-700"/> },
          { id:"vline",  label:"V Line", render:()=><div className="border-l-2 border-slate-700 h-6"/> },
          { id:"dashed", label:"Dashed", render:()=><div className="w-16 border-t-2 border-dashed border-slate-700"/> },
          { id:"double", label:"Double", render:()=>(
            <div className="w-16 space-y-1">
              <div className="border-t-2 border-slate-700"/>
              <div className="border-t-2 border-slate-700"/>
            </div>
          )},
        ].map(l => (
          <button key={l.id} onClick={()=>onAdd(l.id)}
            className="flex flex-col items-center gap-1.5 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <div className="h-7 flex items-center justify-center">{l.render()}</div>
            <span className="text-[10px] text-slate-500 font-medium">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Text Panel ──────────── */
const TEXT_PRESETS = [
  { label:"Heading",    text:"Heading Text",    fontSize:32, fontWeight:"bold",   fontFamily:"Arial" },
  { label:"Subheading", text:"Subheading Text", fontSize:22, fontWeight:"bold",   fontFamily:"Arial" },
  { label:"Body Text",  text:"Body paragraph text here.", fontSize:14, fontWeight:"normal", fontFamily:"Arial" },
  { label:"Caption",    text:"Caption or small text",    fontSize:11, fontWeight:"normal", fontFamily:"Arial" },
];

const TextPanel = ({ onAddText }) => (
  <div className="p-4 space-y-4">
    <button
      onClick={() => onAddText("Add your text here", { fontSize:16, fontFamily:"Arial" })}
      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
    >
      <Type size={15} /> Add a text box
    </button>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Text Styles</p>
      <div className="space-y-2">
        {TEXT_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onAddText(p.text, p)}
            className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <span
              className="block text-slate-800"
              style={{ fontSize:`${Math.min(p.fontSize/1.6, 22)}px`, fontWeight:p.fontWeight, fontFamily:p.fontFamily }}
            >{p.label}</span>
            <span className="text-[10px] text-slate-400">{p.fontSize}px · {p.fontWeight}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Images Panel ──────────── */
const ImagesPanel = ({ onAddImage }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) { toast.error("Paste an image URL first"); return; }
    setLoading(true);
    const ok = await onAddImage(url.trim());
    if (ok) { setUrl(""); toast.success("Image added!"); }
    else      toast.error("Could not load image. Check the URL.");
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add from URL</p>
        <div className="space-y-2">
          <input
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 bg-slate-50 placeholder:text-slate-400"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={e => e.key==="Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
            {loading ? "Loading…" : "Add Image"}
          </button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-[11px] text-blue-700 font-medium">Tip: Use direct image links ending in .jpg, .png, .svg or .webp</p>
      </div>
    </div>
  );
};

/* ────────────── Variables Panel ──────────── */
const VariablesPanel = ({ onInsert }) => (
  <div className="p-4 space-y-4">
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
        Select a text element on canvas first, then click a variable to insert it.
      </p>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Contract Variables</p>
      <div className="space-y-1.5">
        {CLIENT_VARS.map(v => (
          <button
            key={v}
            onClick={() => onInsert(v)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 text-sm text-slate-700 font-medium transition-all"
          >
            <span>[{v}]</span>
            <span className="text-[10px] text-slate-400 font-normal">insert →</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Design Panel ──────────── */
const DesignPanel = ({ bgColor, onBgChange, onApplyTemplate }) => {
  const QUICK_TEMPLATES = [
    { label:"Classic Blue",    bg:"#ffffff", accent:"#1e40af" },
    { label:"Dark Pro",        bg:"#0f172a", accent:"#3b82f6" },
    { label:"Warm Paper",      bg:"#fef9f0", accent:"#b45309" },
    { label:"Fresh Mint",      bg:"#f0fdf4", accent:"#15803d" },
    { label:"Royal Purple",    bg:"#fdf4ff", accent:"#6d28d9" },
    { label:"Clean Rose",      bg:"#fff1f2", accent:"#be185d" },
  ];

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Page Background</p>
        <div className="grid grid-cols-5 gap-2">
          {BG_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onBgChange(c)}
              className={`w-full aspect-square rounded-lg border-2 transition-all ${bgColor===c?"border-blue-500 scale-110 shadow-md":"border-slate-200 hover:border-slate-400"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Custom:</label>
          <input
            type="color"
            value={bgColor}
            onChange={e => onBgChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
          />
          <span className="text-xs text-slate-400 font-mono">{bgColor}</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Themes</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => onApplyTemplate(t)}
              className="p-2.5 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex gap-1 mb-1.5">
                <div className="h-3 flex-1 rounded" style={{ background: t.bg === "#ffffff" ? "#f1f5f9" : t.bg }} />
                <div className="h-3 w-3 rounded" style={{ background: t.accent }} />
              </div>
              <p className="text-[10px] text-slate-600 font-semibold truncate">{t.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ────────────── Properties Panel ──────────── */
const PropertiesPanel = ({ props: p, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, onClose, canvas }) => {
  if (!p) return null;

  const isText  = p.type === "i-text" || p.type === "textbox" || p.type === "text";
  const isShape = !isText;

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 font-semibold shrink-0 w-16">{label}</span>
      {children}
    </div>
  );

  const NumInput = ({ val, onChange, min, max, suffix="" }) => (
    <div className="flex items-center gap-1">
      <input
        type="number" min={min} max={max}
        value={val ?? ""}
        onChange={e => onChange(Number(e.target.value))}
        className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-slate-50 text-center"
      />
      {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
    </div>
  );

  const alignHCanvasFn = (align) => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (align === "left")   obj.set("left", 0);
    if (align === "center") obj.set("left", (A4_W - obj.getScaledWidth()) / 2);
    if (align === "right")  obj.set("left", A4_W - obj.getScaledWidth());
    canvas.renderAll();
    onUpdate("left", obj.left);
  };
  const alignVCanvasFn = (align) => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (align === "top")    obj.set("top", 0);
    if (align === "middle") obj.set("top", (A4_H - obj.getScaledHeight()) / 2);
    if (align === "bottom") obj.set("top", A4_H - obj.getScaledHeight());
    canvas.renderAll();
    onUpdate("top", obj.top);
  };

  return (
    <aside className="w-[250px] shrink-0 bg-white border-l border-[#e6e6e6] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6e6e6]">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Properties</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-5">

        {/* TEXT PROPERTIES */}
        {isText && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Text</p>

            {/* Font family */}
            <select
              value={p.fontFamily || "Arial"}
              onChange={e => onUpdate("fontFamily", e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 outline-none focus:border-blue-400"
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* Font size */}
            <Row label="Size">
              <NumInput val={p.fontSize} onChange={v => onUpdate("fontSize", v)} min={6} max={200} suffix="px" />
            </Row>

            {/* Bold / Italic */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdate("fontWeight", p.fontWeight==="bold"?"normal":"bold")}
                className={`p-2 rounded-lg border text-sm font-bold transition-all ${p.fontWeight==="bold"?"bg-blue-600 text-white border-blue-600":"border-slate-200 hover:bg-slate-50"}`}
              >B</button>
              <button
                onClick={() => onUpdate("fontStyle", p.fontStyle==="italic"?"normal":"italic")}
                className={`p-2 rounded-lg border text-sm italic transition-all ${p.fontStyle==="italic"?"bg-blue-600 text-white border-blue-600":"border-slate-200 hover:bg-slate-50"}`}
              >I</button>
              <button
                onClick={() => onUpdate("underline", !p.underline)}
                className={`p-2 rounded-lg border text-sm underline transition-all ${p.underline?"bg-blue-600 text-white border-blue-600":"border-slate-200 hover:bg-slate-50"}`}
              >U</button>
            </div>

            {/* Text align */}
            <div className="flex items-center gap-1">
              {[["left",AlignLeft],["center",AlignCenter],["right",AlignRight]].map(([v,Icon])=>(
                <button key={v} onClick={()=>onUpdate("textAlign",v)}
                  className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${p.textAlign===v?"bg-blue-600 text-white border-blue-600":"border-slate-200 hover:bg-slate-50"}`}
                >
                  <Icon size={13}/>
                </button>
              ))}
            </div>

            {/* Text color */}
            <Row label="Color">
              <div className="flex items-center gap-2">
                <input type="color" value={p.fill||"#000000"} onChange={e=>onUpdate("fill",e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <span className="text-[10px] text-slate-500 font-mono">{p.fill||"#000000"}</span>
              </div>
            </Row>
          </div>
        )}

        {/* SHAPE PROPERTIES */}
        {isShape && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Shape</p>
            <Row label="Fill">
              <div className="flex items-center gap-2">
                <input type="color" value={p.fill==="transparent"||!p.fill?"#3b82f6":p.fill}
                  onChange={e=>onUpdate("fill",e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <button onClick={()=>onUpdate("fill","transparent")}
                  className={`text-[10px] px-2 py-1 rounded border transition-all ${p.fill==="transparent"||!p.fill?"bg-slate-200 font-bold":"border-slate-200 hover:bg-slate-50"}`}
                >None</button>
              </div>
            </Row>
            <Row label="Stroke">
              <div className="flex items-center gap-2">
                <input type="color" value={p.stroke==="transparent"||!p.stroke?"#374151":p.stroke}
                  onChange={e=>onUpdate("stroke",e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <NumInput val={p.strokeWidth} onChange={v=>onUpdate("strokeWidth",v)} min={0} max={20} suffix="px" />
              </div>
            </Row>
          </div>
        )}

        {/* ALIGNMENT */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Align on Page</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Horiz</span>
            {[["left","Left"],["center","Center"],["right","Right"]].map(([v,l])=>(
              <button key={v} onClick={()=>alignHCanvasFn(v)}
                className="flex-1 text-[10px] font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
              >{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Vert</span>
            {[["top","Top"],["middle","Mid"],["bottom","Bot"]].map(([v,l])=>(
              <button key={v} onClick={()=>alignVCanvasFn(v)}
                className="flex-1 text-[10px] font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
              >{l}</button>
            ))}
          </div>
        </div>

        {/* POSITION & SIZE */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Position & Size</p>
          <div className="grid grid-cols-2 gap-2">
            {[["X","left"],["Y","top"]].map(([l,k])=>(
              <div key={k} className="space-y-0.5">
                <p className="text-[10px] text-slate-400">{l}</p>
                <input type="number" value={p[k]??0} onChange={e=>{onUpdate(k,Number(e.target.value));}}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:border-blue-400 text-center"
                />
              </div>
            ))}
            {[["W","width"],["H","height"]].map(([l,k])=>(
              <div key={k} className="space-y-0.5">
                <p className="text-[10px] text-slate-400">{l}</p>
                <input type="number" value={p[k]??0} readOnly
                  className="w-full text-xs border border-slate-100 rounded-lg px-2 py-1.5 bg-slate-50/60 text-center text-slate-400"
                />
              </div>
            ))}
          </div>
          <Row label="Rotate">
            <NumInput val={p.angle} onChange={v=>onUpdate("angle",v)} min={-360} max={360} suffix="°" />
          </Row>
          <Row label="Opacity">
            <div className="flex items-center gap-2 flex-1">
              <input type="range" min={0} max={100} value={p.opacity??100}
                onChange={e=>onUpdate("opacity",Number(e.target.value)/100)}
                className="flex-1 h-1 accent-blue-600"
              />
              <span className="text-[10px] text-slate-500 w-8 text-right">{p.opacity??100}%</span>
            </div>
          </Row>
        </div>

        {/* LAYER */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Layer</p>
          <div className="flex gap-1.5">
            <button onClick={onMoveUp}   className="flex-1 flex items-center justify-center gap-1 py-2 text-xs border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all">
              <MoveUp size={12}/> Forward
            </button>
            <button onClick={onMoveDown} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all">
              <MoveDown size={12}/> Back
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Actions</p>
          <div className="flex gap-1.5">
            <button onClick={onDuplicate} className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all">
              <Copy size={12}/> Copy
            </button>
            <button onClick={onDelete}   className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs border border-red-200 rounded-xl hover:bg-red-50 text-red-500 transition-all">
              <Trash2 size={12}/> Delete
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ─────────────────── Main Editor ─────────────────── */
export default function ContractEditorPage() {
  const { templateid } = useParams();
  const router = useRouter();

  /* ── State ── */
  const [template,     setTemplate]     = useState(null);
  const [templateName, setTemplateName] = useState("Untitled Contract");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [exportOpen,   setExportOpen]   = useState(false);
  const [canvasReady,  setCanvasReady]  = useState(false);
  const [bgColor,      setBgColor]      = useState("#ffffff");

  // Sidebar
  const [activePanel,  setActivePanel]  = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Selection / properties
  const [selProps,      setSelProps]      = useState(null);
  // FIX 1: store canvas in state so PropertiesPanel always gets current instance
  const [fabricCanvas,  setFabricCanvas]  = useState(null);
  // FIX 2: store fetched canvas data in state to eliminate window.__pendingCanvasData race
  const [savedCanvasData, setSavedCanvasData] = useState(null);

  /* ── Refs ── */
  const canvasElRef = useRef(null);
  const fabricRef   = useRef(null);
  const exportRef   = useRef(null);
  const dirty       = useRef(false);

  /* ── Google Fonts ── */
  useEffect(() => {
    const link     = document.createElement("link");
    link.rel       = "stylesheet";
    link.href      = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch{} };
  }, []);

  /* ── Close export dropdown on outside click ── */
  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Init Fabric.js canvas ── */
  useEffect(() => {
    let fc = null;
    // FIX 6: cancellation flag prevents double-init (React StrictMode mounts twice)
    let cancelled = false;
    const init = async () => {
      if (!canvasElRef.current) return;
      const { Canvas } = await getFab();
      if (cancelled) return;              // guard after every await
      fc = new Canvas(canvasElRef.current, {
        width: A4_W, height: A4_H,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
      });
      fabricRef.current = fc;
      setFabricCanvas(fc);               // FIX 1: update state so PropertiesPanel gets real instance
      setCanvasReady(true);

      const readProps = (obj) => {
        if (!obj) { setSelProps(null); return; }
        setSelProps({
          type:         obj.type,
          fill:         typeof obj.fill === "string" ? obj.fill : "#3b82f6",
          stroke:       obj.stroke || "transparent",
          strokeWidth:  obj.strokeWidth || 0,
          opacity:      Math.round((obj.opacity ?? 1) * 100),
          left:         Math.round(obj.left ?? 0),
          top:          Math.round(obj.top  ?? 0),
          width:        Math.round(obj.getScaledWidth?.() ?? (obj.width ?? 0)),
          height:       Math.round(obj.getScaledHeight?.() ?? (obj.height ?? 0)),
          angle:        Math.round(obj.angle ?? 0),
          fontSize:     obj.fontSize  ?? 16,
          fontFamily:   obj.fontFamily ?? "Arial",
          fontWeight:   obj.fontWeight ?? "normal",
          fontStyle:    obj.fontStyle  ?? "normal",
          underline:    obj.underline  ?? false,
          textAlign:    obj.textAlign  ?? "left",
        });
      };

      fc.on("selection:created", (e) => readProps(e.selected?.[0]));
      fc.on("selection:updated", (e) => readProps(e.selected?.[0]));
      fc.on("selection:cleared", ()  => setSelProps(null));
      fc.on("object:modified",   (e) => { readProps(e.target); dirty.current = true; });
      fc.on("object:added",      ()  => { dirty.current = true; });
      fc.on("object:removed",    ()  => { dirty.current = true; });
    };

    init();
    return () => {
      cancelled = true;                  // FIX 6: prevent in-flight init from completing
      if (fc) { try { fc.dispose(); } catch{} fabricRef.current = null; setFabricCanvas(null); }
    };
  }, []);

  /* ── Fetch template ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/templates/${templateid}`);
        if (res.data.success) {
          const t = res.data.template;
          setTemplate(t);
          setTemplateName(t.templateName || "Untitled Contract");
          if (t.bgColor) setBgColor(t.bgColor);
          // FIX 2: store in state, not window global, so canvasReady effect always sees it
          if (t.canvasData) setSavedCanvasData(t.canvasData);
        }
      } catch { toast.error("Failed to load template"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  /* ── Load canvas data once BOTH canvas is ready AND data has arrived ── */
  // FIX 2: both canvasReady and savedCanvasData in deps — fires regardless of which resolves first
  useEffect(() => {
    if (!canvasReady || !fabricRef.current || !savedCanvasData) return;
    fabricRef.current.loadFromJSON(savedCanvasData).then(() => {
      fabricRef.current?.renderAll();
    }).catch(() => {});
  }, [canvasReady, savedCanvasData]);

  /* ── Apply bg color ── */
  useEffect(() => {
    if (!canvasReady || !fabricRef.current) return;
    fabricRef.current.backgroundColor = bgColor;
    fabricRef.current.renderAll();
  }, [bgColor, canvasReady]);

  /* ── Save ── */
  const handleSave = async () => {
    // FIX 10: skip if nothing changed (dirty flag check)
    if (!dirty.current && !saving) {
      toast("No changes to save", { icon: "✓" }); return;
    }
    setSaving(true);
    try {
      // FIX 4: use undefined (not null) when canvas isn't ready — undefined is excluded by API guard
      const canvasData = fabricRef.current ? fabricRef.current.toJSON() : undefined;
      await axios.patch(`/api/templates/${templateid}`, { templateName, canvasData, bgColor });
      dirty.current = false;
      toast.success("Template saved!");
    } catch { toast.error("Failed to save"); }
    finally   { setSaving(false); }
  };

  /* ── Add shape ── */
  const handleAddShape = async (shapeId) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const { Rect, Circle, Line, Triangle, Polyline, Polygon } = await getFab();
    let obj;
    const cx = A4_W / 2, cy = A4_H / 3;

    switch (shapeId) {
      case "rect":
        obj = new Rect({ left:cx-100, top:cy, width:200, height:120, fill:"#3b82f6", rx:4, ry:4 }); break;
      case "rect-outline":
        obj = new Rect({ left:cx-100, top:cy, width:200, height:120, fill:"transparent", stroke:"#3b82f6", strokeWidth:2, rx:4, ry:4 }); break;
      case "circle":
        obj = new Circle({ left:cx-60, top:cy, radius:60, fill:"#3b82f6" }); break;
      case "circle-outline":
        obj = new Circle({ left:cx-60, top:cy, radius:60, fill:"transparent", stroke:"#3b82f6", strokeWidth:2 }); break;
      case "line":
      case "hline":
        obj = new Line([0,0,300,0], { left:cx-150, top:cy, stroke:"#374151", strokeWidth:2 }); break;
      case "vline":
        obj = new Line([0,0,0,200], { left:cx, top:cy-100, stroke:"#374151", strokeWidth:2 }); break;
      case "dashed":
        obj = new Line([0,0,300,0], { left:cx-150, top:cy, stroke:"#374151", strokeWidth:2, strokeDashArray:[8,6] }); break;
      case "double": {
        // FIX 3: Fabric v6 add() takes one object at a time
        const l1 = new Line([0,0,300,0], { left:cx-150, top:cy-3, stroke:"#374151", strokeWidth:2 });
        const l2 = new Line([0,0,300,0], { left:cx-150, top:cy+3, stroke:"#374151", strokeWidth:2 });
        fc.add(l1); fc.add(l2); fc.setActiveObject(l2); fc.renderAll();
        return;
      }
      case "triangle":
        obj = new Triangle({ left:cx-50, top:cy, width:100, height:100, fill:"#3b82f6" }); break;
      case "arrow": {
        const pts = [
          { x:0, y:8 },{ x:60, y:8 },{ x:60, y:0 },{ x:80, y:15 },
          { x:60, y:30 },{ x:60, y:22 },{ x:0, y:22 }
        ];
        obj = new Polygon(pts, { left:cx-40, top:cy, fill:"#3b82f6" }); break;
      }
      case "star": {
        const starPts = [];
        for (let i=0;i<10;i++){
          const r = i%2===0?50:22;
          const a = (Math.PI/5)*i - Math.PI/2;
          starPts.push({ x:50+r*Math.cos(a), y:50+r*Math.sin(a) });
        }
        obj = new Polygon(starPts, { left:cx-50, top:cy-50, fill:"#3b82f6" }); break;
      }
      default: return;
    }
    if (obj) { fc.add(obj); fc.setActiveObject(obj); fc.renderAll(); }
  };

  /* ── Add text ── */
  const handleAddText = async (text, opts = {}) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const { IText } = await getFab();
    const obj = new IText(text, {
      left: A4_W / 2, top: 200,
      fontSize:   opts.fontSize  || 16,
      fontFamily: opts.fontFamily || "Arial",
      fontWeight: opts.fontWeight || "normal",
      fill: "#1a1a1a",
      originX: "center",
    });
    fc.add(obj); fc.setActiveObject(obj); fc.renderAll();
  };

  /* ── Add image ── */
  const handleAddImage = async (url) => {
    const fc = fabricRef.current;
    if (!fc) return false;
    try {
      const { FabricImage } = await getFab();
      const img = await FabricImage.fromURL(url, { crossOrigin:"anonymous" });
      const scale = Math.min(300/img.width, 300/img.height, 1);
      img.set({ left:A4_W/2-150, top:200, scaleX:scale, scaleY:scale });
      fc.add(img); fc.setActiveObject(img); fc.renderAll();
      return true;
    } catch { return false; }
  };

  /* ── Insert variable into selected text ── */
  const handleInsertVar = (varName) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj || !["i-text","textbox","text"].includes(obj.type)) {
      toast.error("Select a text element first"); return;
    }
    obj.set("text", (obj.text||"") + ` [${varName}]`);
    fc.renderAll(); dirty.current = true;
    toast.success(`[${varName}] inserted`);
  };

  /* ── Update selected object property ── */
  const handleUpdateProp = (key, value) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) return;
    obj.set(key, value);
    fc.renderAll(); dirty.current = true;
    setSelProps(prev => prev ? { ...prev, [key]: value } : null);
  };

  /* ── Delete selected ── */
  const handleDelete = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) return;
    fc.remove(obj); fc.discardActiveObject(); fc.renderAll();
    setSelProps(null);
  };

  /* ── Duplicate selected ── */
  const handleDuplicate = async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) return;
    const clone = await obj.clone();
    clone.set({ left:(obj.left||0)+20, top:(obj.top||0)+20 });
    fc.add(clone); fc.setActiveObject(clone); fc.renderAll();
  };

  /* ── Layer order ── */
  const handleMoveUp   = () => { const fc=fabricRef.current; if(!fc)return; const o=fc.getActiveObject(); if(o){fc.bringObjectForward(o); fc.renderAll();} };
  const handleMoveDown = () => { const fc=fabricRef.current; if(!fc)return; const o=fc.getActiveObject(); if(o){fc.sendObjectBackwards(o); fc.renderAll();} };

  /* ── Apply bg theme ── */
  const handleApplyTemplate = (t) => {
    setBgColor(t.bg);
    // Apply accent to all shapes
    const fc = fabricRef.current;
    if (!fc) return;
    fc.getObjects().forEach(obj => {
      if (obj.type !== "i-text" && obj.type !== "textbox") {
        if (obj.fill && obj.fill !== "transparent") obj.set("fill", t.accent);
        if (obj.stroke && obj.stroke !== "transparent") obj.set("stroke", t.accent);
      }
    });
    fc.renderAll();
  };

  /* ── Export PDF ── */
  const handleExportPDF = async () => {
    setExporting(true); setExportOpen(false);
    try {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.discardActiveObject(); fc.renderAll();
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = fc.toDataURL({ format:"jpeg", quality:0.95, multiplier:2 });
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      pdf.addImage(dataUrl, "JPEG", 0, 0, 210, 297);
      pdf.save(`${templateName||"contract"}.pdf`);
      toast.success("PDF downloaded!");
    } catch(e) { toast.error("PDF export failed"); }
    finally { setExporting(false); }
  };

  /* ── Export PPTX ── */
  const handleExportPPTX = async () => {
    setExporting(true); setExportOpen(false);
    try {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.discardActiveObject(); fc.renderAll();
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = fc.toDataURL({ format:"png", multiplier:1.5 });
      const { default: pptxgen } = await import("pptxgenjs");
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";
      const slide = pres.addSlide();
      if (template?.company?.name) {
        slide.addText(template.company.name, { x:0.3,y:0.1,w:12,h:0.5,fontSize:14,bold:true,color:"1e293b",fontFace:"Arial" });
      }
      slide.addImage({ data:dataUrl, x:0,y:0,w:"100%",h:"100%" });
      await pres.writeFile({ fileName:`${templateName||"contract"}.pptx` });
      toast.success("PPTX downloaded!");
    } catch(e) { toast.error("PPTX export failed: "+e.message); }
    finally { setExporting(false); }
  };

  /* ── Keyboard shortcuts ── */
  // FIX 5: use refs for handlers so the effect never holds stale closures
  const handleSaveRef      = useRef(handleSave);
  const handleDeleteRef    = useRef(handleDelete);
  const handleDuplicateRef = useRef(handleDuplicate);
  useEffect(() => { handleSaveRef.current      = handleSave;      });
  useEffect(() => { handleDeleteRef.current    = handleDelete;    });
  useEffect(() => { handleDuplicateRef.current = handleDuplicate; });

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selProps) {
        e.preventDefault(); handleDeleteRef.current();
      }
      if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); handleSaveRef.current(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="d") { e.preventDefault(); handleDuplicateRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selProps]);

  /* ── Sidebar toggle ── */
  const handleSidebarItem = (id) => {
    if (id === activePanel && !panelCollapsed) { setActivePanel(null); return; }
    setActivePanel(id); setPanelCollapsed(false);
  };

  const company = template?.company;
  const logoSrc = company?.companylogo || company?.companyLogo;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f3f5]">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f1f3f5]">

      {/* ─── HEADER ─── */}
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-4 border-b border-[#e0e0e0]"
        style={{ background:"linear-gradient(90deg,#0099ff 0%,#4c6fff 100%)" }}
      >
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div className="w-px h-5 bg-white/30" />

        {/* Template name */}
        <input
          value={templateName}
          onChange={e=>setTemplateName(e.target.value)}
          className="text-sm font-semibold text-white bg-transparent outline-none border-none min-w-0 w-52 placeholder:text-white/60"
          placeholder="Contract name…"
        />

        <div className="ml-auto flex items-center gap-2">
          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button onClick={()=>setExportOpen(p=>!p)} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
            >
              {exporting ? <Loader2 size={12} className="animate-spin"/> : <FileDown size={12}/>}
              Export
              <ChevronDown size={10} className={`transition-transform ${exportOpen?"rotate-180":""}`}/>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-xl w-44 z-50 overflow-hidden">
                <button onClick={handleExportPDF}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText size={13} className="text-red-500"/> Export PDF
                </button>
                <div className="border-t border-slate-100"/>
                <button onClick={handleExportPPTX}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Layers size={13} className="text-orange-500"/> Export PPTX
                </button>
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <span className="hidden md:block text-[10px] text-white/50 font-medium">Ctrl+S to save</span>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? <><Loader2 size={12} className="animate-spin"/>Saving…</> : <><Save size={12}/>Save</>}
          </button>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── PRIMARY SIDEBAR (64px) ─── */}
        <nav className="w-16 shrink-0 bg-[#f5f5f5] border-r border-[#e6e6e6] flex flex-col items-center pt-2">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleSidebarItem(item.id)}
              className={`
                w-full flex flex-col items-center justify-center gap-1 py-3
                text-[10px] font-semibold transition-colors cursor-pointer
                ${activePanel===item.id && !panelCollapsed
                  ? "bg-[#e6e6e6] text-slate-800"
                  : "text-slate-500 hover:bg-[#e6e6e6] hover:text-slate-700"}
              `}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ─── SECONDARY PANEL (slides in) ─── */}
        <div
          className="relative shrink-0 bg-white border-r border-[#e6e6e6] overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: activePanel && !panelCollapsed ? 280 : 0, opacity: activePanel && !panelCollapsed ? 1 : 0 }}
        >
          {activePanel && (
            <div className="w-[280px] h-full flex flex-col">
              {/* Panel header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6e6e6] shrink-0">
                <span className="text-sm font-bold text-slate-800 capitalize">
                  {SIDEBAR_ITEMS.find(i=>i.id===activePanel)?.label}
                </span>
                <button onClick={()=>{setActivePanel(null);}} className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X size={14}/>
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {activePanel==="elements"  && <ElementsPanel onAdd={handleAddShape} />}
                {activePanel==="text"      && <TextPanel onAddText={handleAddText} />}
                {activePanel==="images"    && <ImagesPanel onAddImage={handleAddImage} />}
                {activePanel==="vars"      && <VariablesPanel onInsert={handleInsertVar} />}
                {activePanel==="design"    && <DesignPanel bgColor={bgColor} onBgChange={setBgColor} onApplyTemplate={handleApplyTemplate} />}
              </div>
            </div>
          )}

          {/* Collapse handle */}
          {activePanel && (
            <button
              onClick={()=>setPanelCollapsed(p=>!p)}
              className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-[#e6e6e6] shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ChevronLeft size={12} className={`transition-transform ${panelCollapsed?"rotate-180":""}`}/>
            </button>
          )}
        </div>

        {/* ─── CANVAS AREA ─── */}
        <main className="flex-1 overflow-auto bg-[#f1f3f5] flex flex-col items-center py-8 px-6 gap-4">

          {/* Company header bar */}
          {company && (
            <div className="w-full max-w-[750px] bg-white rounded-xl border border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm shrink-0">
              {logoSrc
                ? <img src={logoSrc} alt={company.name} className="h-9 object-contain shrink-0"/>
                : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Building2 size={15} className="text-slate-400"/></div>
              }
              <div>
                <p className="text-sm font-bold text-slate-900">{company.name}</p>
                {company.companyAddress && <p className="text-[11px] text-slate-400">{company.companyAddress}</p>}
              </div>
              <span className="ml-auto text-[10px] text-slate-300 font-medium italic">Company header preview</span>
            </div>
          )}

          {/* Fabric canvas wrapper */}
          <div className="rounded-sm shadow-[0_4px_40px_rgba(0,0,0,0.12)] overflow-hidden shrink-0">
            <canvas ref={canvasElRef} />
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Del</kbd> delete</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+D</kbd> duplicate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+S</kbd> save</span>
          </div>
        </main>

        {/* ─── PROPERTIES PANEL (right) ─── */}
        <PropertiesPanel
          props={selProps}
          canvas={fabricCanvas}
          onUpdate={handleUpdateProp}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onClose={()=>{ fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); setSelProps(null); }}
        />
      </div>
    </div>
  );
}
