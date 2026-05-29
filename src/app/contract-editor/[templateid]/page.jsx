"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import dynamic from "next/dynamic";
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), { ssr: false });
import {
  ArrowLeft, Save, Loader2, FileDown, ChevronDown,
  ChevronLeft, Grid, Type, Image as ImageIcon, Tag, Palette,
  Square, Circle, Minus, Triangle, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Trash2, Copy,
  Building2, X, MoveUp, MoveDown, RotateCcw, Minus as LineIcon,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  Layers, FileText, PenLine, Film, Music, LayoutList, Monitor,
  MousePointer2, Pen, Paintbrush, Eraser,
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

/* ─────────── Canvas contrast helper ─────────── */
const getContrastColors = (bg) => {
  const h = (bg||"#ffffff").replace("#","");
  if (h.length !== 6) return { isDark:false, text:"#0f172a", sub:"#64748b", accent:"#1e3a8a", line:"#e2e8f0", altLine:"#cbd5e1", header:"#1e3a8a" };
  const r=parseInt(h.slice(0,2),16)/255, g=parseInt(h.slice(2,4),16)/255, b=parseInt(h.slice(4,6),16)/255;
  const lum = 0.299*r + 0.587*g + 0.114*b;
  const dark = lum < 0.45;
  return {
    isDark:  dark,
    text:    dark ? "#ffffff"  : "#0f172a",
    sub:     dark ? "#94a3b8"  : "#64748b",
    accent:  dark ? "#60a5fa"  : "#1e3a8a",
    line:    dark ? "#1e293b"  : "#f1f5f9",
    altLine: dark ? "#334155"  : "#cbd5e1",
    header:  "#1e3a8a",
  };
};

/* ─────────────── Sidebar panels ─────── */
const SIDEBAR_ITEMS = [
  { id:"templates", icon:LayoutList, label:"Templates" },
  { id:"elements",  icon:Grid,      label:"Elements"  },
  { id:"text",      icon:Type,      label:"Text"      },
  { id:"draw",      icon:Pen,       label:"Draw"      },
  { id:"signature", icon:PenLine,   label:"Sign"      },
  { id:"images",    icon:ImageIcon, label:"Images"    },
  { id:"vars",      icon:Tag,       label:"Variables" },
  { id:"design",    icon:Palette,   label:"Design"    },
  { id:"company",   icon:Building2, label:"Company"   },
];

/* ─────────── Signature fonts ─────── */
const SIG_FONTS = [
  { id:"dancing",    name:"Dancing Script", css:"'Dancing Script', cursive"  },
  { id:"great",      name:"Great Vibes",    css:"'Great Vibes', cursive"     },
  { id:"pacifico",   name:"Pacifico",       css:"'Pacifico', cursive"        },
  { id:"satisfy",    name:"Satisfy",        css:"'Satisfy', cursive"         },
  { id:"caveat",     name:"Caveat",         css:"'Caveat', cursive"          },
  { id:"sacramento", name:"Sacramento",     css:"'Sacramento', cursive"      },
];

/* ─────────── Table presets ─────── */
const TABLE_PRESETS = [
  { label:"2 × 2",         rows:2, cols:2, header:false },
  { label:"3 × 3",         rows:3, cols:3, header:false },
  { label:"4 × 4",         rows:4, cols:4, header:false },
  { label:"3 cols + header",rows:4, cols:3, header:true  },
  { label:"4 cols + header",rows:5, cols:4, header:true  },
];

/* ────────────── Elements Panel ─────── */
const BASIC_SHAPES = [
  { id:"rect",           label:"Rectangle",
    render:()=><div className="w-9 h-6 rounded bg-slate-700"/> },
  { id:"rect-outline",   label:"Rect Outline",
    render:()=><div className="w-9 h-6 rounded border-2 border-slate-700"/> },
  { id:"rounded-rect",   label:"Rounded",
    render:()=><div className="w-9 h-6 rounded-xl bg-slate-700"/> },
  { id:"circle",         label:"Circle",
    render:()=><div className="w-7 h-7 rounded-full bg-slate-700"/> },
  { id:"circle-outline", label:"Circle Line",
    render:()=><div className="w-7 h-7 rounded-full border-2 border-slate-700"/> },
  { id:"triangle",       label:"Triangle",
    render:()=><svg width="28" height="24" viewBox="0 0 28 24"><polygon points="14,2 26,22 2,22" fill="#374151"/></svg> },
  { id:"triangle-down",  label:"Tri Down",
    render:()=><svg width="28" height="24" viewBox="0 0 28 24"><polygon points="14,22 26,2 2,2" fill="#374151"/></svg> },
  { id:"diamond",        label:"Diamond",
    render:()=><svg width="28" height="32" viewBox="0 0 28 32"><polygon points="14,1 27,16 14,31 1,16" fill="#374151"/></svg> },
  { id:"pentagon",       label:"Pentagon",
    render:()=><svg width="28" height="28" viewBox="0 0 100 100"><polygon points="50,5 97,36 80,91 20,91 3,36" fill="#374151"/></svg> },
  { id:"hexagon",        label:"Hexagon",
    render:()=><svg width="28" height="28" viewBox="0 0 100 100"><polygon points="50,5 93,27 93,73 50,95 7,73 7,27" fill="#374151"/></svg> },
  { id:"star",           label:"Star",
    render:()=><svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,2 17,10 26,10 19,15 22,24 14,19 6,24 9,15 2,10 11,10" fill="#374151"/></svg> },
  { id:"cross",          label:"Cross",
    render:()=><svg width="24" height="24" viewBox="0 0 100 100"><polygon points="35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35" fill="#374151"/></svg> },
  { id:"arrow",          label:"Arrow →",
    render:()=><svg width="32" height="20" viewBox="0 0 32 20"><line x1="2" y1="10" x2="22" y2="10" stroke="#374151" strokeWidth="2.5"/><polygon points="22,5 30,10 22,15" fill="#374151"/></svg> },
  { id:"arrow-double",   label:"Arrow ↔",
    render:()=><svg width="32" height="20" viewBox="0 0 32 20"><line x1="6" y1="10" x2="26" y2="10" stroke="#374151" strokeWidth="2.5"/><polygon points="6,5 0,10 6,15" fill="#374151"/><polygon points="26,5 32,10 26,15" fill="#374151"/></svg> },
  { id:"callout",        label:"Callout",
    render:()=><svg width="32" height="28" viewBox="0 0 80 60"><rect x="0" y="0" width="70" height="44" rx="6" fill="#374151"/><polygon points="10,44 20,44 15,58" fill="#374151"/></svg> },
  { id:"badge",          label:"Badge",
    render:()=><svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#374151"/></svg> },
  { id:"octagon",        label:"Octagon",
    render:()=><svg width="28" height="28" viewBox="0 0 100 100"><polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill="#374151"/></svg> },
  { id:"trapezoid",      label:"Trapezoid",
    render:()=><svg width="32" height="20" viewBox="0 0 100 60"><polygon points="15,0 85,0 100,60 0,60" fill="#374151"/></svg> },
  { id:"parallelogram",  label:"Parallel",
    render:()=><svg width="32" height="20" viewBox="0 0 100 60"><polygon points="20,0 100,0 80,60 0,60" fill="#374151"/></svg> },
  { id:"chevron",        label:"Chevron",
    render:()=><svg width="32" height="20" viewBox="0 0 100 60"><polygon points="0,0 70,0 100,30 70,60 0,60 30,30" fill="#374151"/></svg> },
  { id:"heart",          label:"Heart",
    render:()=><svg width="28" height="24" viewBox="0 0 100 90"><path d="M50,30 C50,20 40,5 25,5 C10,5 0,15 0,30 C0,60 50,90 50,90 C50,90 100,60 100,30 C100,15 90,5 75,5 C60,5 50,20 50,30 Z" fill="#374151"/></svg> },
  { id:"cloud",          label:"Cloud",
    render:()=><svg width="32" height="20" viewBox="0 0 100 70"><path d="M20,60 Q5,60 5,45 Q5,30 20,30 Q20,15 35,15 Q45,5 60,10 Q75,5 80,20 Q95,20 95,35 Q95,50 80,50 Q80,60 65,60 Z" fill="#374151"/></svg> },
  { id:"lightning",      label:"Lightning",
    render:()=><svg width="20" height="28" viewBox="0 0 50 80"><polygon points="30,0 15,42 25,42 10,80 42,35 28,35 45,0" fill="#374151"/></svg> },
  { id:"speech-bubble",  label:"Speech",
    render:()=><svg width="30" height="26" viewBox="0 0 80 70"><path d="M5,0 Q0,0 0,5 L0,45 Q0,50 5,50 L25,50 L25,65 L40,50 L75,50 Q80,50 80,45 L80,5 Q80,0 75,0 Z" fill="#374151"/></svg> },
  { id:"cylinder",       label:"Cylinder",
    render:()=><svg width="24" height="30" viewBox="0 0 60 90"><rect x="0" y="15" width="60" height="60" fill="#374151"/><ellipse cx="30" cy="15" rx="30" ry="12" fill="#4b5563"/><ellipse cx="30" cy="75" rx="30" ry="12" fill="#1f2937"/></svg> },
  { id:"moon",           label:"Moon",
    render:()=><svg width="24" height="28" viewBox="0 0 60 70"><path d="M30,5 A28,28 0 1,0 30,65 A18,18 0 1,1 30,5 Z" fill="#374151"/></svg> },
  { id:"bracket-l",      label:"[ Bracket",
    render:()=><svg width="16" height="28" viewBox="0 0 30 80"><path d="M25,2 L8,2 Q2,2 2,8 L2,72 Q2,78 8,78 L25,78" stroke="#374151" strokeWidth="6" fill="none" strokeLinecap="round"/></svg> },
  { id:"bracket-r",      label:"Bracket ]",
    render:()=><svg width="16" height="28" viewBox="0 0 30 80"><path d="M5,2 L22,2 Q28,2 28,8 L28,72 Q28,78 22,78 L5,78" stroke="#374151" strokeWidth="6" fill="none" strokeLinecap="round"/></svg> },
];

const LINE_SHAPES = [
  { id:"hline",  label:"H Line",  render:()=><div className="w-16 border-t-2 border-slate-700"/> },
  { id:"vline",  label:"V Line",  render:()=><div className="border-l-2 border-slate-700 h-6"/> },
  { id:"dashed", label:"Dashed",  render:()=><div className="w-16 border-t-2 border-dashed border-slate-700"/> },
  { id:"double", label:"Double",  render:()=><div className="w-16 space-y-1"><div className="border-t-2 border-slate-700"/><div className="border-t-2 border-slate-700"/></div> },
  { id:"dotted", label:"Dotted",  render:()=><div className="w-16 border-t-2 border-dotted border-slate-700"/> },
  { id:"thick",  label:"Thick",   render:()=><div className="w-16 border-t-4 border-slate-700"/> },
];

const FORM_ELEMENTS = [
  { id:"form-input",    label:"Text Field",
    render:()=>(
      <div className="w-full space-y-0.5">
        <div className="text-[7px] text-slate-500 font-semibold">Label</div>
        <div className="border border-slate-300 rounded h-3 bg-white w-full"/>
      </div>
    )
  },
  { id:"form-textarea", label:"Text Area",
    render:()=>(
      <div className="w-full space-y-0.5">
        <div className="text-[7px] text-slate-500 font-semibold">Label</div>
        <div className="border border-slate-300 rounded h-5 bg-white w-full"/>
      </div>
    )
  },
  { id:"form-checkbox", label:"Checkbox",
    render:()=>(
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border-2 border-slate-400 rounded bg-white shrink-0"/>
        <div className="text-[8px] text-slate-500">Option</div>
      </div>
    )
  },
  { id:"form-radio",    label:"Radio",
    render:()=>(
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border-2 border-slate-400 rounded-full bg-white shrink-0"/>
        <div className="text-[8px] text-slate-500">Option</div>
      </div>
    )
  },
  { id:"form-dropdown", label:"Dropdown",
    render:()=>(
      <div className="w-full border border-slate-300 rounded h-3.5 bg-white flex items-center justify-between px-1">
        <div className="text-[7px] text-slate-400">Select...</div>
        <div className="text-[6px] text-slate-400">▾</div>
      </div>
    )
  },
];

const MEDIA_ELEMENTS = [
  { id:"media-video", label:"Video",
    render:()=>(
      <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center">
        <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent border-l-white ml-0.5"/>
      </div>
    )
  },
  { id:"media-audio", label:"Audio",
    render:()=>(
      <div className="w-10 h-7 bg-indigo-900 rounded flex items-center justify-center gap-px px-1">
        {[2,3,4,3,4,3,2,3,4].map((h,i)=>(
          <div key={i} className="w-0.5 bg-indigo-300 rounded-full" style={{height:`${h*2}px`}}/>
        ))}
      </div>
    )
  },
  { id:"media-sheet", label:"Sheet",
    render:()=>(
      <div className="grid gap-px w-10 h-7" style={{gridTemplateColumns:"repeat(3,1fr)",gridTemplateRows:"repeat(3,1fr)"}}>
        {Array(9).fill(0).map((_,i)=>(
          <div key={i} className={`${i<3?"bg-emerald-600":"bg-slate-100"} border border-slate-200`}/>
        ))}
      </div>
    )
  },
];

const MOCKUP_ELEMENTS = [
  { id:"mockup-browser", label:"Browser",
    render:()=>(
      <div className="w-10 h-7 bg-slate-100 rounded border border-slate-300 overflow-hidden">
        <div className="h-2.5 bg-slate-200 flex items-center gap-0.5 px-0.5">
          {["bg-red-400","bg-yellow-400","bg-green-400"].map((c,i)=>(
            <div key={i} className={`w-1 h-1 rounded-full ${c}`}/>
          ))}
        </div>
        <div className="h-px bg-slate-300"/>
        <div className="p-0.5 flex flex-col gap-0.5">
          <div className="h-0.5 bg-slate-300 rounded w-full"/>
          <div className="h-0.5 bg-slate-300 rounded w-3/4"/>
          <div className="h-0.5 bg-slate-300 rounded w-1/2"/>
        </div>
      </div>
    )
  },
  { id:"mockup-phone", label:"Phone",
    render:()=>(
      <div className="w-6 h-10 bg-slate-800 rounded-xl border border-slate-600 flex flex-col items-center pt-1 pb-1 gap-0.5 mx-auto">
        <div className="w-2 h-0.5 bg-slate-600 rounded-full"/>
        <div className="flex-1 w-5 bg-slate-100 rounded"/>
        <div className="w-2 h-2 rounded-full border border-slate-600"/>
      </div>
    )
  },
  { id:"mockup-card", label:"Card",
    render:()=>(
      <div className="w-10 h-7 bg-gradient-to-br from-blue-600 to-violet-600 rounded border border-slate-300 p-0.5">
        <div className="h-1 bg-white/30 rounded w-4 mb-0.5"/>
        <div className="flex flex-col gap-0.5 mt-auto">
          <div className="h-0.5 bg-white/60 rounded w-full"/>
          <div className="h-0.5 bg-white/40 rounded w-3/4"/>
        </div>
      </div>
    )
  },
];

/* ─────────────── Contract Templates ─────────────── */
const CONTRACT_TEMPLATES = [
  /* 1 ─ Service Agreement */
  {
    id:"service-agreement", name:"Service Agreement", category:"Business", headerH:85,
    desc:"Full service contract with compensation & termination clauses",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#1e3a8a"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">SERVICE AGREEMENT</span>
        </div>
        {[80,92,68,86,72,90,60].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?cc.accent+"80":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]"; const cAddr=co?.companyAddress||"[Company Address]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#1e3a8a",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"SERVICE AGREEMENT",x:pW/2-200,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:400,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"Effective Date: [Contract Date]     |     Ref No.: SA-001",x:50,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"PARTIES",x:50,y:146,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:`Service Provider: ${cName}\n${cAddr}`,x:50,y:168,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"i-text",text:"Client: [Client Name]\n[Client Address]",x:pW/2+10,y:168,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"line",x:50,y:218,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"1.  SCOPE OF SERVICES",x:50,y:236,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Service Provider shall provide the services described herein. The specific scope,\ndeliverables, and timelines shall be mutually agreed and documented in Exhibit A.",x:50,y:258,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"2.  COMPENSATION & PAYMENT",x:50,y:305,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Client agrees to pay per the agreed fee schedule. Invoices are payable within 30 days.\nOverdue invoices accrue interest at 1.5% per month.",x:50,y:327,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"3.  TERM & TERMINATION",x:50,y:374,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"This Agreement commences on the Effective Date and continues until services are complete\nor terminated by either party upon 30 days written notice.",x:50,y:396,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"4.  CONFIDENTIALITY",x:50,y:443,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Both parties agree to hold in confidence all proprietary information and not disclose it\nto third parties during the term and for two (2) years thereafter.",x:50,y:465,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"5.  INTELLECTUAL PROPERTY",x:50,y:512,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"All work product created under this Agreement shall be owned by Client upon full payment.\nService Provider retains rights to pre-existing tools and methodologies.",x:50,y:534,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"6.  LIMITATION OF LIABILITY",x:50,y:581,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Service Provider's total liability shall not exceed fees paid in the prior 3 months.\nNeither party shall be liable for indirect or consequential damages.",x:50,y:603,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"7.  GOVERNING LAW",x:50,y:650,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"This Agreement is governed by the laws of the jurisdiction of the Service Provider.\nDisputes shall first be attempted to resolve through mediation.",x:50,y:672,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"IN WITNESS WHEREOF, the parties have duly executed this Agreement as of the date first written above.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CLIENT SIGNATURE",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATURE",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 2 ─ NDA */
  {
    id:"nda", name:"Non-Disclosure Agreement", category:"Legal", headerH:85,
    desc:"Mutual NDA with confidentiality obligations and remedies",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-0.5" style={{background:"#1e293b"}}>
          <span className="text-[4px] font-bold tracking-widest text-white">NON-DISCLOSURE AGREEMENT</span>
        </div>
        <div className="h-0.5 mb-1.5" style={{background:"#3b82f6",width:"100%"}}/>
        {[90,72,85,60,88,65,78].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?cc.accent+"80":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]"; const cAddr=co?.companyAddress||"[Company Address]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#1e293b",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"NON-DISCLOSURE AGREEMENT",x:pW/2-230,y:18,fontSize:24,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:460,align:"center"});
      push({type:"i-text",text:"CONFIDENTIAL",x:pW/2-55,y:50,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#94a3b8",width:110,align:"center"});
      push({type:"line",x:0,y:85,points:[0,0,pW,0],stroke:"#3b82f6",strokeWidth:3,fill:"transparent"});
      push({type:"i-text",text:"Effective Date: [Contract Date]",x:50,y:108,fontSize:12,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"DISCLOSING PARTY",x:50,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:`${cName}\n${cAddr}`,x:50,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"i-text",text:"RECEIVING PARTY",x:pW/2+10,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"[Client Name]\n[Client Address]\n[Client Email]",x:pW/2+10,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"line",x:50,y:228,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"1.  DEFINITION OF CONFIDENTIAL INFORMATION",x:50,y:246,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"\"Confidential Information\" means any data or information that is proprietary to the\nDisclosing Party and not generally known, including business strategies, client lists,\nfinancial data, technical specifications, and trade secrets.",x:50,y:268,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"2.  OBLIGATIONS OF THE RECEIVING PARTY",x:50,y:335,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"The Receiving Party shall: (a) hold all Confidential Information in strict confidence;\n(b) not disclose any Confidential Information to third parties without prior written\nconsent; (c) use it solely for the purpose of evaluating the business relationship.",x:50,y:357,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"3.  EXCLUSIONS",x:50,y:430,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Information that (a) is publicly known through no breach of this Agreement; (b) was\nrightfully in Receiving Party's possession prior to disclosure; or (c) is required\nto be disclosed by law or court order, shall not be considered Confidential.",x:50,y:452,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"4.  TERM",x:50,y:520,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"This Agreement shall remain in effect for three (3) years from the Effective Date,\nunless earlier terminated by mutual written agreement of both parties.",x:50,y:542,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"5.  RETURN OF INFORMATION",x:50,y:589,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Upon request or termination, the Receiving Party shall promptly return or destroy\nall Confidential Information and certify such destruction in writing.",x:50,y:611,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"6.  REMEDIES",x:50,y:658,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"The parties acknowledge that breach may cause irreparable harm. Either party may\nseek injunctive relief without posting bond or proving actual damages.",x:50,y:680,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Both parties agree to be bound by the terms of this Non-Disclosure Agreement.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"DISCLOSING PARTY",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"RECEIVING PARTY",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 3 ─ Employment Contract */
  {
    id:"employment", name:"Employment Contract", category:"HR", headerH:85,
    desc:"Full employment agreement with compensation & benefits",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#15803d"}}>
          <span className="text-[5px] font-bold tracking-wider text-white">EMPLOYMENT CONTRACT</span>
        </div>
        {[80,65,90,70,80,65,88].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?"#16a34a80":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]"; const cAddr=co?.companyAddress||"[Company Address]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#15803d",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"EMPLOYMENT AGREEMENT",x:pW/2-200,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:400,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"line",x:0,y:85,points:[0,0,pW,0],stroke:"#16a34a",strokeWidth:2,fill:"transparent"});
      push({type:"i-text",text:"Start Date: [Contract Date]     |     Position: [Job Title]",x:50,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"EMPLOYER",x:50,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:`${cName}\n${cAddr}`,x:50,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"i-text",text:"EMPLOYEE",x:pW/2+10,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"[Client Name]\n[Client Address]\n[Client Email]",x:pW/2+10,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"line",x:50,y:222,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"1.  POSITION & DUTIES",x:50,y:240,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"The Employee is hired for the position of [Job Title] reporting to [Manager Name].\nDuties include those outlined in the attached job description and as reasonably directed.",x:50,y:262,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"2.  COMPENSATION & BENEFITS",x:50,y:308,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"Base Salary: [Salary Amount] per annum, paid [bi-weekly / monthly].\nBenefits: Health insurance, paid time off, and other benefits per company policy.\nPerformance bonuses subject to annual review.",x:50,y:330,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"3.  WORKING HOURS & LOCATION",x:50,y:395,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"Standard hours: 40 hours per week, Monday to Friday. Primary work location: [Office\nAddress]. Remote arrangements are subject to manager approval.",x:50,y:417,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"4.  PROBATIONARY PERIOD",x:50,y:464,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"The first 90 days constitute a probationary period. Either party may terminate\nemployment with 7 days written notice during this period.",x:50,y:486,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"5.  TERMINATION",x:50,y:533,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"After probation, either party may terminate with 30 days written notice.\nEmployer may terminate immediately for cause without notice.",x:50,y:555,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"6.  CONFIDENTIALITY & NON-COMPETE",x:50,y:602,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"Employee agrees to maintain confidentiality of all company information and, for 12\nmonths post-termination, shall not work for direct competitors in the same market.",x:50,y:624,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"7.  GOVERNING LAW",x:50,y:671,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#15803d"});
      push({type:"i-text",text:"This Agreement is governed by the employment laws of [Jurisdiction].\nAny disputes shall be resolved through the applicable employment tribunal.",x:50,y:693,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"By signing below, both parties agree to the terms and conditions of this Employment Agreement.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"EMPLOYEE SIGNATURE",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"EMPLOYER SIGNATURE",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 4 ─ Freelance Contract */
  {
    id:"freelance", name:"Freelance Contract", category:"Business", headerH:0,
    desc:"Simple freelance work agreement with milestones & IP",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-1 mb-1" style={{background:cc.accent,width:"100%",borderRadius:2}}/>
        <div className="h-3 flex items-center mb-1">
          <span style={{fontSize:6,fontWeight:"bold",color:cc.text,letterSpacing:1}}>FREELANCE CONTRACT</span>
        </div>
        <div className="h-px mb-1.5" style={{background:cc.altLine}}/>
        {[75,90,65,80,70,85,60].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:6,fill:cc.accent,stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"FREELANCE SERVICE CONTRACT",x:50,y:26,fontSize:24,fontFamily:"Arial",fontWeight:"bold",fill:cc.text});
      push({type:"i-text",text:`Between ${cName} (Freelancer) and [Client Name] (Client)`,x:50,y:58,fontSize:12,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:82,points:[0,0,pW-100,0],stroke:cc.accent,strokeWidth:2,fill:"transparent"});
      push({type:"i-text",text:"Project: [Project Name]  |  Start: [Contract Date]  |  Budget: [Amount]",x:50,y:98,fontSize:11,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:118,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"1.  PROJECT SCOPE",x:50,y:136,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Freelancer agrees to deliver the following:\n• [Deliverable 1 — description]\n• [Deliverable 2 — description]\n• [Deliverable 3 — description]\nAll work shall meet the quality standards agreed upon in writing by both parties.",x:50,y:158,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"2.  TIMELINE & MILESTONES",x:50,y:256,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Milestone 1: [Description]  —  Due: [Date]\nMilestone 2: [Description]  —  Due: [Date]\nFinal Delivery: [Date]\nTimeline adjustments require written agreement from both parties.",x:50,y:278,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"3.  PAYMENT TERMS",x:50,y:357,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Total project fee: [Amount]. Payment schedule:\n• 50% deposit due upon signing\n• 25% upon Milestone 1 approval\n• 25% upon final delivery\nPayments due within 7 days of invoice.",x:50,y:379,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"4.  REVISIONS",x:50,y:462,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"This contract includes [number] rounds of revisions per deliverable.\nAdditional revisions billed at [Rate]/hr with a 2-hour minimum.",x:50,y:484,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"5.  INTELLECTUAL PROPERTY",x:50,y:531,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Upon receipt of final payment, all rights to the completed work transfer to Client.\nFreelancer retains the right to display work in their portfolio.",x:50,y:553,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"6.  INDEPENDENT CONTRACTOR",x:50,y:600,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Freelancer is an independent contractor, not an employee, and is responsible for\nall applicable taxes. No employment benefits apply.",x:50,y:622,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"7.  TERMINATION",x:50,y:669,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Either party may terminate with 14 days written notice. Client shall pay for all\nwork completed up to the termination date.",x:50,y:691,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Agreed and accepted by both parties as of the project start date.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CLIENT SIGNATURE",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"FREELANCER SIGNATURE",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 5 ─ Consulting Agreement */
  {
    id:"consulting", name:"Consulting Agreement", category:"Business", headerH:85,
    desc:"Professional consulting contract with retainer option",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#7c3aed"}}>
          <span className="text-[5px] font-bold tracking-wider text-white">CONSULTING AGREEMENT</span>
        </div>
        {[80,65,88,72,85,60,78].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===4?"#7c3aed60":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]"; const cAddr=co?.companyAddress||"[Company Address]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#7c3aed",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"CONSULTING AGREEMENT",x:pW/2-200,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:400,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"line",x:0,y:85,points:[0,0,pW,0],stroke:"#a78bfa",strokeWidth:2,fill:"transparent"});
      push({type:"i-text",text:"Agreement Date: [Contract Date]     |     Ref: CA-[Year]-001",x:50,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CONSULTANT",x:50,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:`${cName}\n${cAddr}`,x:50,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"i-text",text:"CLIENT",x:pW/2+10,y:146,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"[Client Name]\n[Client Address]",x:pW/2+10,y:165,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-70});
      push({type:"line",x:50,y:215,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"1.  CONSULTING SERVICES",x:50,y:233,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Consultant shall provide expert advisory and consulting services as mutually agreed.\nServices shall be delivered with professional skill and to industry standards.",x:50,y:255,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"2.  ENGAGEMENT & FEES",x:50,y:302,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Retainer: [Monthly Amount] per month, OR Project Rate: [Amount].\nHourly rate for additional services: [Rate]/hr. Expenses reimbursed with receipts.\nInvoices payable within 15 days of receipt.",x:50,y:324,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"3.  TERM",x:50,y:387,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Engagement commences [Contract Date] and continues for [duration] unless\nrenewed in writing or terminated with 30 days notice by either party.",x:50,y:409,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"4.  INDEPENDENT CONTRACTOR",x:50,y:456,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Consultant is an independent contractor. This Agreement does not create\nan employment relationship. Consultant handles all applicable taxes.",x:50,y:478,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"5.  CONFIDENTIALITY & NON-SOLICITATION",x:50,y:525,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Consultant shall maintain strict confidentiality. For 12 months post-engagement,\nConsultant shall not solicit or hire Client's employees or solicit Client's customers.",x:50,y:547,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"6.  OWNERSHIP OF WORK PRODUCT",x:50,y:594,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"All deliverables created specifically for Client become Client's property upon full\npayment. Consultant's pre-existing intellectual property remains Consultant's.",x:50,y:616,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"7.  LIMITATION OF LIABILITY",x:50,y:663,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#7c3aed"});
      push({type:"i-text",text:"Total liability shall not exceed fees paid in the prior 3 months. Neither party\nshall be liable for indirect, special, or consequential damages.",x:50,y:685,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"The parties have executed this Consulting Agreement as of the date first written above.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CLIENT SIGNATURE",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CONSULTANT SIGNATURE",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 6 ─ Client Proposal */
  {
    id:"proposal", name:"Client Proposal", category:"Sales", headerH:130,
    desc:"Project proposal with timeline and pricing breakdown",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1" style={{background:"#0f172a"}}>
          <span className="text-[5px] font-bold tracking-wider text-white">PROJECT PROPOSAL</span>
        </div>
        <div className="flex gap-1 mb-1">
          <div className="flex-1 h-3 rounded-sm" style={{background:cc.line}}/>
          <div className="flex-1 h-3 rounded-sm" style={{background:cc.line}}/>
        </div>
        {[70,88,62,80,74].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:130,fill:"#0f172a",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"PROJECT PROPOSAL",x:50,y:24,fontSize:30,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff"});
      push({type:"i-text",text:`Prepared by ${cName}`,x:50,y:64,fontSize:13,fontFamily:"Arial",fill:"#94a3b8"});
      push({type:"i-text",text:"Prepared for: [Client Name]  |  Date: [Contract Date]  |  Valid 30 days",x:50,y:90,fontSize:11,fontFamily:"Arial",fill:"#64748b"});
      push({type:"line",x:50,y:150,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"rect",x:50,y:166,width:pW/2-70,height:92,fill:cc.line,stroke:"transparent",strokeWidth:0,cornerRadius:6});
      push({type:"i-text",text:"PROJECT OVERVIEW",x:64,y:180,fontSize:10,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"[Brief project description\nand key objectives.\nExpected outcomes here.]",x:64,y:198,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-90});
      push({type:"rect",x:pW/2+10,y:166,width:pW/2-60,height:92,fill:cc.line,stroke:"transparent",strokeWidth:0,cornerRadius:6});
      push({type:"i-text",text:"ENGAGEMENT DETAILS",x:pW/2+24,y:180,fontSize:10,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Start Date: [Contract Date]\nDuration: [Duration]\nBudget: [Amount]",x:pW/2+24,y:198,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW/2-80});
      push({type:"i-text",text:"PROPOSED SOLUTION",x:50,y:284,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Based on our understanding of your requirements, we propose the following solution:\n[Detailed description of the proposed approach, methodology, and deliverables.\nThis section explains how our solution directly addresses the client's needs.]",x:50,y:306,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"DELIVERABLES",x:50,y:374,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Phase 1 — Discovery & Planning: Kickoff meeting, requirements doc, project plan\nPhase 2 — Development & Execution: Core deliverables, weekly progress reports\nPhase 3 — Review & Delivery: Quality review, final deliverables, documentation",x:50,y:396,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"TIMELINE",x:50,y:460,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      ["Phase 1  —  Weeks 1–2","Phase 2  —  Weeks 3–6","Phase 3  —  Weeks 7–8"].forEach((label,i)=>{
        push({type:"rect",x:50,y:482+i*34,width:180+i*40,height:22,fill:cc.accent+(i===0?"":"99"),stroke:"transparent",strokeWidth:0,cornerRadius:4});
        push({type:"i-text",text:label,x:60,y:488+i*34,fontSize:10,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff"});
      });
      push({type:"i-text",text:"INVESTMENT",x:50,y:598,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"rect",x:50,y:618,width:pW-100,height:60,fill:cc.line,stroke:"transparent",strokeWidth:0,cornerRadius:6});
      push({type:"i-text",text:"Phase 1: [Amount]          Phase 2: [Amount]          Phase 3: [Amount]",x:68,y:634,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-140});
      push({type:"i-text",text:"TOTAL INVESTMENT: [Total Amount]",x:68,y:656,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent,width:pW-140});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To accept this proposal, please sign below. This proposal is valid for 30 days from issue date.",x:50,y:pH-178,fontSize:11,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"",x:60,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:60,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"CLIENT ACCEPTANCE",x:60,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Client Name]  |  Date: _____________",x:60,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-260;
      push({type:"i-text",text:"",x:rx,y:pH-132,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:200});
      push({type:"line",x:rx,y:pH-90,points:[0,0,200,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED BY",x:rx,y:pH-78,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}  |  Date: _____________`,x:rx,y:pH-64,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },
];

/* ────────────── Templates Panel ──────────── */
const TemplatesPanel = ({ bgColor, company, onApplyTemplate }) => {
  const cc = getContrastColors(bgColor);
  const categories = [...new Set(CONTRACT_TEMPLATES.map(t => t.category))];
  return (
    <div className="p-4 space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
          Click a template to load it onto the canvas. Previews match your current canvas background color.
        </p>
      </div>
      {categories.map(cat => (
        <div key={cat}>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{cat}</p>
          <div className="space-y-2">
            {CONTRACT_TEMPLATES.filter(t => t.category === cat).map(t => (
              <button key={t.id}
                onClick={() => onApplyTemplate(t)}
                className="w-full text-left border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="h-[76px] w-full overflow-hidden relative">
                  {t.preview(bgColor, cc)}
                </div>
                <div className="px-3 py-2 bg-white group-hover:bg-blue-50 transition-colors border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-4">
    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    {children}
  </div>
);

const ShapeBtn = ({ item, onClick }) => (
  <button onClick={onClick}
    className="flex flex-col items-center gap-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
  >
    <div className="h-8 w-full flex items-center justify-center">{item.render()}</div>
    <span className="text-[9px] text-slate-500 font-medium leading-none text-center truncate w-full">{item.label}</span>
  </button>
);

const ElementsPanel = ({ onAdd, onAddTable }) => (
  <div className="p-4">
    <Section title="Basic Shapes">
      <div className="grid grid-cols-4 gap-1.5">
        {BASIC_SHAPES.map(s => <ShapeBtn key={s.id} item={s} onClick={()=>onAdd(s.id)}/>)}
      </div>
    </Section>

    <Section title="Lines & Dividers">
      <div className="grid grid-cols-3 gap-1.5">
        {LINE_SHAPES.map(l => <ShapeBtn key={l.id} item={l} onClick={()=>onAdd(l.id)}/>)}
      </div>
    </Section>

    <Section title="Tables">
      <div className="space-y-1.5">
        {TABLE_PRESETS.map(t => (
          <button key={t.label} onClick={()=>onAddTable(t.rows, t.cols, t.header)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
          >
            <div className="grid shrink-0" style={{ gridTemplateColumns:`repeat(${Math.min(t.cols,3)},1fr)`, gap:1, width:36 }}>
              {Array.from({ length: Math.min(t.rows,3)*Math.min(t.cols,3) }).map((_,i)=>(
                <div key={i} className="bg-slate-700 rounded-[1px]" style={{ height:8 }}/>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{t.label}</p>
              <p className="text-[10px] text-slate-400">{t.rows} rows × {t.cols} cols{t.header?" · header":""}</p>
            </div>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Form Elements">
      <div className="grid grid-cols-2 gap-1.5">
        {FORM_ELEMENTS.map(f => (
          <button key={f.id} onClick={()=>onAdd(f.id)}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-all"
          >
            <div className="w-full flex items-center justify-center h-7">{f.render()}</div>
            <span className="text-[9px] text-slate-500 font-medium text-center w-full truncate">{f.label}</span>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Media">
      <div className="grid grid-cols-3 gap-1.5">
        {MEDIA_ELEMENTS.map(m => (
          <button key={m.id} onClick={()=>onAdd(m.id)}
            className="flex flex-col items-center gap-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all"
          >
            <div className="h-8 w-full flex items-center justify-center">{m.render()}</div>
            <span className="text-[9px] text-slate-500 font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Mockups">
      <div className="grid grid-cols-3 gap-1.5">
        {MOCKUP_ELEMENTS.map(m => (
          <button key={m.id} onClick={()=>onAdd(m.id)}
            className="flex flex-col items-center gap-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all"
          >
            <div className="h-10 w-full flex items-center justify-center">{m.render()}</div>
            <span className="text-[9px] text-slate-500 font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </Section>
  </div>
);

/* ────────────── Text Panel ──────────── */
const TEXT_PRESETS = [
  { label:"Heading",    text:"Heading Text",             fontSize:32, fontWeight:"bold",   fontFamily:"Arial"           },
  { label:"Subheading", text:"Subheading Text",          fontSize:22, fontWeight:"bold",   fontFamily:"Arial"           },
  { label:"Body Text",  text:"Body paragraph text here.",fontSize:14, fontWeight:"normal", fontFamily:"Arial"           },
  { label:"Caption",    text:"Caption or small text",    fontSize:11, fontWeight:"normal", fontFamily:"Arial"           },
  { label:"Quote",      text:'"Quoted text goes here."', fontSize:16, fontWeight:"normal", fontFamily:"Georgia", fontStyle:"italic" },
  { label:"Label",      text:"LABEL TEXT",               fontSize:11, fontWeight:"bold",   fontFamily:"Arial"           },
];

const TextPanel = ({ onAddText }) => (
  <div className="p-4 space-y-5">
    <button
      onClick={() => onAddText("Add your text here", { fontSize:16, fontFamily:"Arial" })}
      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
    >
      <Type size={15} /> Add a text box
    </button>
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Text Styles</p>
      <div className="space-y-1.5">
        {TEXT_PRESETS.map(p => (
          <button key={p.label} onClick={() => onAddText(p.text, p)}
            className="w-full text-left px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <span className="block text-slate-800 truncate"
              style={{ fontSize:`${Math.min(p.fontSize/1.6,20)}px`, fontWeight:p.fontWeight, fontFamily:p.fontFamily, fontStyle:p.fontStyle||"normal" }}
            >{p.label}</span>
            <span className="text-[10px] text-slate-400">{p.fontSize}px · {p.fontWeight}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Signature Block Presets ──────────── */
const SIG_BLOCK_PRESETS = [
  { label:"Client / Company",    leftLabel:"Client Signature",   rightLabel:"Company Signature", cols:2 },
  { label:"Owner / Occupant",    leftLabel:"Shop Owner",         rightLabel:"The Occupant",       cols:2 },
  { label:"Employee / Employer", leftLabel:"Employee",           rightLabel:"Employer / HR",      cols:2 },
  { label:"Witness Fields",      leftLabel:"Witness 1",          rightLabel:"Witness 2",           cols:2 },
  { label:"Single Signature",    leftLabel:"Authorized Signature", rightLabel:"",                 cols:1 },
];

/* ────────────── Signature Panel ──────────── */
const SignaturePanel = ({ onAddSignature, onAddSignatureBlock }) => {
  const [tab,     setTab]     = useState("type");
  const [sigText, setSigText] = useState("");
  const [selFont, setSelFont] = useState(SIG_FONTS[0]);

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[["type","Type Sign"],["block","Sign Block"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
              tab===id ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >{lbl}</button>
        ))}
      </div>

      {/* ── Type Signature tab ── */}
      {tab === "type" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
              Type your name, pick a style, then click <strong>Add Signature</strong>. Double-click to edit on canvas.
            </p>
          </div>

          <input
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 bg-white placeholder:text-slate-300"
            value={sigText}
            onChange={e => setSigText(e.target.value)}
            placeholder="Type your name…"
          />

          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Choose a Style</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:hidden">
              {SIG_FONTS.map(f => (
                <button key={f.id} onClick={() => setSelFont(f)}
                  className={`w-full px-3 py-3 rounded-xl border text-left transition-all ${
                    selFont.id === f.id
                      ? "border-blue-400 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <span style={{ fontFamily:f.css, fontSize:28, color:"#1e293b", lineHeight:1.2, display:"block" }}>
                    {sigText || "Your Signature"}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">{f.name}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { if (!sigText.trim()) return; onAddSignature(sigText.trim(), selFont); }}
            disabled={!sigText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <PenLine size={14}/> Add Signature to Canvas
          </button>
        </>
      )}

      {/* ── Signature Block tab ── */}
      {tab === "block" && (
        <>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <p className="text-[11px] text-violet-800 font-medium leading-relaxed">
              Click a preset to add a signature block at the bottom of your contract. Double-click the signature area to type.
            </p>
          </div>

          <div className="space-y-2">
            {SIG_BLOCK_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => onAddSignatureBlock(preset)}
                className="w-full text-left px-3 py-3 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-all group"
              >
                <p className="text-xs font-semibold text-slate-700 mb-2 group-hover:text-violet-700">{preset.label}</p>
                {preset.cols === 2 ? (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="h-5 mb-1 border-b-2 border-slate-300" style={{fontFamily:"'Dancing Script',cursive",fontSize:14,color:"#94a3b8",lineHeight:1.6}}>  </div>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{preset.leftLabel}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 mb-1 border-b-2 border-slate-300"/>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{preset.rightLabel}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="h-5 mb-1 border-b-2 border-slate-300"/>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{preset.leftLabel}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ────────────── Images Panel ──────────── */
const ImagesPanel = ({ onAddImage }) => {
  const [url,        setUrl]        = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef(null);

  /* ── Add from URL ── */
  const handleAddUrl = async () => {
    if (!url.trim()) { toast.error("Paste an image URL first"); return; }
    setUrlLoading(true);
    const ok = await onAddImage(url.trim());
    if (ok) { setUrl(""); toast.success("Image added!"); }
    else      toast.error("Could not load image — check the URL.");
    setUrlLoading(false);
  };

  /* ── Upload from computer ── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setUploading(true);
    try {
      // Read file as data URL (base64) — works offline, no server needed
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const ok = await onAddImage(dataUrl);
      if (ok) toast.success(`${file.name} added!`);
      else     toast.error("Could not add image.");
    } catch {
      toast.error("Failed to read file.");
    } finally {
      setUploading(false);
      // reset so same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 space-y-5">

      {/* ── Upload from computer ── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Upload from Computer</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-60 group"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-blue-500"/>
          ) : (
            <ImageIcon size={24} className="text-slate-300 group-hover:text-blue-400 transition-colors"/>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600">
              {uploading ? "Adding…" : "Click to upload"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, SVG, WEBP</p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-slate-200"/>
        <span className="text-[11px] text-slate-400 font-medium">or</span>
        <div className="flex-1 h-px bg-slate-200"/>
      </div>

      {/* ── Add from URL ── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add from URL</p>
        <div className="space-y-2">
          <input
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 bg-slate-50 placeholder:text-slate-400"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={e => e.key==="Enter" && handleAddUrl()}
          />
          <button
            onClick={handleAddUrl}
            disabled={urlLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {urlLoading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
            {urlLoading ? "Loading…" : "Add from URL"}
          </button>
        </div>
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
const PAGE_SIZES = [
  { label:"A4 Portrait",   w:750,  h:1060 },
  { label:"A4 Landscape",  w:1060, h:750  },
  { label:"A3 Portrait",   w:1060, h:1500 },
  { label:"US Letter",     w:770,  h:1000 },
  { label:"Square",        w:800,  h:800  },
  { label:"Business Card", w:350,  h:200  },
];

const DesignPanel = ({ bgColor, onBgChange, onApplyTemplate, onResizePage, pageW, pageH }) => {
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

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Page Size</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {PAGE_SIZES.map(s => (
            <button key={s.label} onClick={() => onResizePage(s.w, s.h)}
              className={`p-2 border rounded-xl text-left transition-all ${
                pageW===s.w && pageH===s.h
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <div className="border border-slate-400 rounded-[1px]"
                  style={{ width: s.w > s.h ? 16 : 11, height: s.w > s.h ? 11 : 16 }}/>
                <p className="text-[10px] text-slate-600 font-semibold truncate">{s.label}</p>
              </div>
              <p className="text-[9px] text-slate-400">{s.w}×{s.h}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-semibold shrink-0">Custom:</span>
          <input type="number" defaultValue={pageW} onBlur={e=>onResizePage(Number(e.target.value), pageH)}
            className="w-16 text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none focus:border-blue-400 text-center"
            placeholder="W"
          />
          <span className="text-[10px] text-slate-400">×</span>
          <input type="number" defaultValue={pageH} onBlur={e=>onResizePage(pageW, Number(e.target.value))}
            className="w-16 text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none focus:border-blue-400 text-center"
            placeholder="H"
          />
          <span className="text-[10px] text-slate-400">px</span>
        </div>
      </div>
    </div>
  );
};

/* ────────────── Company Panel ──────────── */
const CompanyPanel = ({ company, onAddText, onAddImage }) => {
  if (!company) return (
    <div className="p-6 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <Building2 size={20} className="text-slate-300"/>
      </div>
      <p className="text-sm text-slate-400 font-medium">No company linked</p>
      <p className="text-[11px] text-slate-300">Assign a company to this template first.</p>
    </div>
  );

  const logo  = company.companylogo || company.companyLogo;
  const email = company.companyEmail || company.companyemail;
  const web   = company.companyWebsite?.replace(/^https?:\/\/(www\.)?/, "");

  const AddBtn = ({ label, value, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group text-left"
    >
      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-slate-400 group-hover:text-blue-500"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-xs text-slate-700 font-medium truncate">{value}</p>
      </div>
      <span className="text-[10px] text-slate-300 group-hover:text-blue-400 shrink-0">+ add</span>
    </button>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Company card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        {logo ? (
          <img src={logo} alt={company.name} className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 shrink-0"/>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-slate-400"/>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{company.name}</p>
          {company.companyAddress && <p className="text-[11px] text-slate-500 mt-0.5">{company.companyAddress}</p>}
        </div>
      </div>

      {/* Add to canvas */}
      <div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Add to Canvas</p>
        <div className="space-y-1.5">
          {/* Logo */}
          {logo && (
            <button
              onClick={() => onAddImage(logo)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-all group text-left"
            >
              <img src={logo} alt="" className="w-7 h-7 rounded object-contain border border-slate-100 shrink-0"/>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Logo</p>
                <p className="text-xs text-slate-700 font-medium truncate">Company Logo</p>
              </div>
              <span className="text-[10px] text-slate-300 group-hover:text-violet-400 shrink-0">+ add</span>
            </button>
          )}
          {/* Name */}
          {company.name && (
            <AddBtn label="Company Name" value={company.name}
              icon={Type} onClick={() => onAddText(company.name, { fontSize:22, fontWeight:"bold" })} />
          )}
          {/* Address */}
          {company.companyAddress && (
            <AddBtn label="Address" value={company.companyAddress}
              icon={Type} onClick={() => onAddText(company.companyAddress, { fontSize:12 })} />
          )}
          {/* Phone */}
          {company.companyPhoneNumber && (
            <AddBtn label="Phone" value={company.companyPhoneNumber}
              icon={Type} onClick={() => onAddText(company.companyPhoneNumber, { fontSize:12 })} />
          )}
          {/* Email */}
          {email && (
            <AddBtn label="Email" value={email}
              icon={Type} onClick={() => onAddText(email, { fontSize:12 })} />
          )}
          {/* Website */}
          {web && (
            <AddBtn label="Website" value={web}
              icon={Type} onClick={() => onAddText(web, { fontSize:12 })} />
          )}
        </div>
      </div>

      {/* Add full header block */}
      <button
        onClick={() => {
          if (company.name)             onAddText(company.name,             { fontSize:20, fontWeight:"bold",   top:60  });
          if (company.companyAddress)   onAddText(company.companyAddress,   { fontSize:11, top:90  });
          if (email)                    onAddText(email,                    { fontSize:11, top:108 });
          if (company.companyPhoneNumber) onAddText(company.companyPhoneNumber, { fontSize:11, top:126 });
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
      >
        <Building2 size={13}/> Add Full Company Header
      </button>
    </div>
  );
};

/* ────────────── Shared color palette ──────────── */
const PALETTE = [
  "#000000","#ffffff","#1e293b","#475569","#94a3b8",
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#6366f1","#8b5cf6","#ec4899","#f43f5e",
  "#78350f","#166534","#1e3a8a","#4c1d95","#831843",
];

/* Inline colour picker — no OS dialog, lives entirely inside the panel */
const InlinePicker = ({ value, onChange, allowNone = false }) => {
  const nativeRef = useRef(null);
  const current = (!value || value === "transparent") ? "#000000" : value;

  return (
    <div className="space-y-2">
      {/* Swatch grid */}
      <div className="grid grid-cols-10 gap-1">
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            className={`w-5 h-5 rounded transition-all border-2 ${
              value === c ? "border-blue-500 scale-110 shadow" : "border-transparent hover:border-slate-400"
            }`}
            style={{ background: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #e2e8f0" : undefined }}
          />
        ))}
      </div>

      {/* Current colour + hex input + native eyedropper */}
      <div className="flex items-center gap-2">
        {/* coloured square that opens native picker */}
        <div
          className="relative w-7 h-7 rounded-lg border border-slate-200 cursor-pointer shrink-0 overflow-hidden"
          style={{ background: current }}
          title="Custom colour"
        >
          <input
            ref={nativeRef}
            type="color"
            value={current}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        {/* hex text */}
        <input
          type="text"
          value={value === "transparent" ? "none" : (value || "#000000")}
          onChange={e => {
            const v = e.target.value.trim();
            if (v === "none" || v === "") { if (allowNone) onChange("transparent"); return; }
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none focus:border-blue-400"
        />
        {allowNone && (
          <button
            onClick={() => onChange("transparent")}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
              value === "transparent" ? "bg-slate-200 font-bold border-slate-400" : "border-slate-200 hover:bg-slate-50"
            }`}
          >None</button>
        )}
      </div>
    </div>
  );
};

/* ────────────── Draw Panel ──────────── */
const DrawPanel = ({ drawTool, setDrawTool, brushSize, setBrushSize, brushColor, setBrushColor }) => {
  const TOOLS = [
    { id:"select", icon:MousePointer2, label:"Select", desc:"Move & resize objects" },
    { id:"pen",    icon:Pen,           label:"Pen",    desc:"Fine precise strokes"  },
    { id:"brush",  icon:Paintbrush,    label:"Brush",  desc:"Thick paint strokes"  },
    { id:"eraser", icon:Eraser,        label:"Eraser", desc:"Erase drawn content"  },
  ];
  return (
    <div className="p-4 space-y-5">
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tools</p>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setDrawTool(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              drawTool === t.id
                ? "border-blue-400 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              drawTool === t.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              <t.icon size={16}/>
            </div>
            <div className="text-left">
              <p className={`text-xs font-semibold ${drawTool===t.id?"text-blue-700":"text-slate-700"}`}>{t.label}</p>
              <p className="text-[10px] text-slate-400">{t.desc}</p>
            </div>
            {drawTool === t.id && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shrink-0"/>}
          </button>
        ))}
      </div>

      {drawTool !== "select" && (
        <>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Brush Size</p>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={30} value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <div className="w-9 h-9 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <div className="rounded-full bg-slate-700"
                  style={{ width: Math.max(2, Math.min(brushSize * 0.75, 24)), height: Math.max(2, Math.min(brushSize * 0.75, 24)) }}/>
              </div>
            </div>
            <p className="text-center text-[11px] text-slate-500 font-mono mt-1">{brushSize}px</p>
          </div>

          {drawTool !== "eraser" && (
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Color</p>
              <InlinePicker value={brushColor} onChange={setBrushColor} />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-[11px] text-blue-700 font-medium">
              {drawTool==="pen"    ? "Click and drag on the canvas to draw." :
               drawTool==="brush"  ? "Click and drag to paint thick strokes." :
               "Drag over drawn strokes to erase them."}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

/* ────────────── Properties Panel ──────────── */
const PropertiesPanel = ({ props: p, onUpdate, onAlignH, onAlignV, onDelete, onDuplicate, onMoveUp, onMoveDown, onClose }) => {
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

  // Alignment handlers now received as props (defined in main component with fabricRef access)

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
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Color</p>
              <InlinePicker value={p.fill||"#000000"} onChange={v=>onUpdate("fill",v)} />
            </div>

            {/* Signature font quick-selector */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Signature Styles</p>
              <div className="grid grid-cols-2 gap-1">
                {SIG_FONTS.map(f => (
                  <button key={f.id}
                    onClick={() => onUpdate("fontFamily", f.css)}
                    className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                      p.fontFamily === f.css
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <span style={{ fontFamily:f.css, fontSize:16, display:"block", lineHeight:1.3, color:"#1e293b" }}>Abc</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{f.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SHAPE PROPERTIES */}
        {isShape && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Shape</p>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Fill</p>
              <InlinePicker value={p.fill||"#3b82f6"} onChange={v=>onUpdate("fill",v)} allowNone />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Stroke</p>
              <InlinePicker value={p.stroke||"transparent"} onChange={v=>onUpdate("stroke",v)} allowNone />
              <div className="mt-1.5">
                <Row label="Width">
                  <NumInput val={p.strokeWidth} onChange={v=>onUpdate("strokeWidth",v)} min={0} max={20} suffix="px" />
                </Row>
              </div>
            </div>
          </div>
        )}

        {/* ALIGNMENT ON PAGE */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Align on Page</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Horiz</span>
            {[["left","Left"],["center","Center"],["right","Right"]].map(([v,l])=>(
              <button key={v} onClick={()=>onAlignH(v)}
                className="flex-1 text-[10px] font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
              >{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Vert</span>
            {[["top","Top"],["middle","Mid"],["bottom","Bot"]].map(([v,l])=>(
              <button key={v} onClick={()=>onAlignV(v)}
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

/* ═══════════════════════════════════════════════════════════
   MAIN EDITOR  —  Konva-powered
   ═══════════════════════════════════════════════════════════ */
export default function ContractEditorPage() {
  const { templateid } = useParams();
  const router = useRouter();

  /* ── ID helper ── */
  const genId = () => `s${Date.now()}${Math.random().toString(36).slice(2,6)}`;

  /* ── State ── */
  const [shapes,       setShapes]       = useState([]);
  const [selectedId,   setSelectedId]   = useState(null);
  const [drawingLine,  setDrawingLine]  = useState(null);
  const [template,     setTemplate]     = useState(null);
  const [templateName, setTemplateName] = useState("Untitled Contract");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [exportOpen,   setExportOpen]   = useState(false);
  const [bgColor,      setBgColor]      = useState("#ffffff");
  const [pageW,        setPageW]        = useState(A4_W);
  const [pageH,        setPageH]        = useState(A4_H);
  const [drawTool,     setDrawTool]     = useState("select");
  const [brushSize,    setBrushSize]    = useState(3);
  const [brushColor,   setBrushColor]   = useState("#000000");
  const [activePanel,  setActivePanel]  = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selProps,     setSelProps]     = useState(null);

  /* ── Refs ── */
  const stageRef  = useRef(null);
  const exportRef = useRef(null);
  const dirty     = useRef(false);

  /* ── Shape helpers ── */
  const addShape = useCallback((shape) => {
    const s = { scaleX:1, scaleY:1, rotation:0, opacity:1, ...shape, id: shape.id || genId() };
    setShapes(prev => [...prev, s]);
    setSelectedId(s.id);
    dirty.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateShape = useCallback((id, props) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...props } : s));
    dirty.current = true;
  }, []);

  /* ── Read selected shape into PropertiesPanel format ── */
  const syncProps = useCallback((id, currentShapes) => {
    if (!id) { setSelProps(null); return; }
    const shape = (currentShapes || []).find(s => s.id === id);
    if (!shape) { setSelProps(null); return; }
    setSelProps({
      type:        ["i-text","text","signature"].includes(shape.type) ? "i-text" : shape.type,
      fill:        shape.fill        || "#3b82f6",
      stroke:      shape.stroke      || "transparent",
      strokeWidth: shape.strokeWidth || 0,
      opacity:     Math.round((shape.opacity ?? 1) * 100),
      left:        Math.round(shape.x  ?? 0),
      top:         Math.round(shape.y  ?? 0),
      width:       Math.round((shape.width  || (shape.radius||50)*2 || 100) * (shape.scaleX||1)),
      height:      Math.round((shape.height || (shape.radius||50)*2 || 100) * (shape.scaleY||1)),
      angle:       Math.round(shape.rotation ?? 0),
      fontSize:    shape.fontSize   ?? 16,
      fontFamily:  shape.fontFamily ?? "Arial",
      fontWeight:  shape.fontWeight ?? "normal",
      fontStyle:   shape.fontStyle  ?? "normal",
      underline:   shape.underline  ?? false,
      textAlign:   shape.align      ?? "left",
    });
  }, []);

  useEffect(() => {
    setShapes(prev => { syncProps(selectedId, prev); return prev; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ── Google Fonts ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&family=Sacramento&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch{} };
  }, []);

  /* ── Close export dropdown ── */
  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
          if (t.canvasData) {
            try {
              const data = typeof t.canvasData === "string" ? JSON.parse(t.canvasData) : t.canvasData;
              if (data?.version?.startsWith("konva")) {
                if (data.shapes)  setShapes(data.shapes);
                if (data.pageW)   setPageW(data.pageW);
                if (data.pageH)   setPageH(data.pageH);
                if (data.bgColor) setBgColor(data.bgColor);
              } else {
                toast("Previous template format not compatible — starting fresh.", { icon:"ℹ️" });
              }
            } catch {}
          }
        }
      } catch { toast.error("Failed to load template"); }
      finally  { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateid]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvasData = JSON.stringify({ version:"konva-v1", shapes, bgColor, pageW, pageH });
      await axios.patch(`/api/templates/${templateid}`, { templateName, canvasData, bgColor });
      dirty.current = false;
      toast.success("Template saved!");
    } catch { toast.error("Failed to save"); }
    finally  { setSaving(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, shapes, bgColor, pageW, pageH, templateName, templateid]);

  /* ── Add shape ── */
  const handleAddShape = useCallback((shapeId) => {
    const cx = pageW / 2, cy = pageH / 3;
    const base = { fill:"#3b82f6", stroke:"transparent", strokeWidth:0 };

    switch (shapeId) {
      /* ── Basic ── */
      case "rect":          addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, ...base }); break;
      case "rect-outline":  addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, fill:"transparent", stroke:"#3b82f6", strokeWidth:2 }); break;
      case "rounded-rect":  addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, cornerRadius:20, ...base }); break;
      case "circle":        addShape({ type:"circle",  x:cx, y:cy, radius:60, ...base }); break;
      case "circle-outline":addShape({ type:"circle",  x:cx, y:cy, radius:60, fill:"transparent", stroke:"#3b82f6", strokeWidth:2 }); break;
      case "triangle":      addShape({ type:"polygon", x:cx, y:cy, sides:3, radius:60, ...base }); break;
      case "triangle-down": addShape({ type:"polygon", x:cx, y:cy, sides:3, radius:60, rotation:180, ...base }); break;
      case "diamond":       addShape({ type:"polygon", x:cx, y:cy, sides:4, radius:60, rotation:45, ...base }); break;
      case "pentagon":      addShape({ type:"polygon", x:cx, y:cy, sides:5, radius:60, ...base }); break;
      case "hexagon":       addShape({ type:"polygon", x:cx, y:cy, sides:6, radius:60, ...base }); break;
      case "octagon":       addShape({ type:"polygon", x:cx, y:cy, sides:8, radius:60, ...base }); break;
      case "star":          addShape({ type:"star",    x:cx, y:cy, numPoints:5, innerRadius:22, outerRadius:55, ...base }); break;
      case "badge":         addShape({ type:"circle",  x:cx, y:cy, radius:45, ...base }); break;
      /* ── Polygon shapes ── */
      case "cross":         addShape({ type:"line", x:cx-50, y:cy-50, closed:true, ...base, points:[35,0,65,0,65,35,100,35,100,65,65,65,65,100,35,100,35,65,0,65,0,35,35,35] }); break;
      case "arrow":         addShape({ type:"line", x:cx-45, y:cy-18, closed:true, ...base, points:[0,10,60,10,60,0,90,18,60,36,60,26,0,26] }); break;
      case "arrow-double":  addShape({ type:"line", x:cx-50, y:cy-18, closed:true, ...base, points:[0,18,25,0,25,12,75,12,75,0,100,18,75,36,75,24,25,24,25,36] }); break;
      case "callout":       addShape({ type:"line", x:cx-40, y:cy-33, closed:true, ...base, points:[0,0,80,0,80,50,25,50,15,65,10,50,0,50] }); break;
      case "trapezoid":     addShape({ type:"line", x:cx-50, y:cy-30, closed:true, ...base, points:[15,0,85,0,100,60,0,60] }); break;
      case "parallelogram": addShape({ type:"line", x:cx-50, y:cy-30, closed:true, ...base, points:[20,0,100,0,80,60,0,60] }); break;
      case "chevron":       addShape({ type:"line", x:cx-50, y:cy-30, closed:true, ...base, points:[0,0,70,0,100,30,70,60,0,60,30,30] }); break;
      case "lightning":     addShape({ type:"line", x:cx-25, y:cy-45, closed:true, fill:"#eab308", stroke:"transparent", strokeWidth:0, points:[30,0,15,42,25,42,10,80,42,35,28,35,45,0] }); break;
      /* ── Path shapes ── */
      case "heart":         addShape({ type:"path", x:cx-50, y:cy-50, pathData:"M 50,30 C 50,20 40,5 25,5 C 10,5 0,15 0,30 C 0,60 50,90 50,90 C 50,90 100,60 100,30 C 100,15 90,5 75,5 C 60,5 50,20 50,30 Z", fill:"#ef4444", stroke:"transparent", strokeWidth:0 }); break;
      case "cloud":         addShape({ type:"path", x:cx-60, y:cy-40, pathData:"M 20,60 Q 5,60 5,45 Q 5,30 20,30 Q 20,15 35,15 Q 45,5 60,10 Q 75,5 80,20 Q 95,20 95,35 Q 95,50 80,50 Q 80,60 65,60 Z", fill:"#94a3b8", stroke:"transparent", strokeWidth:0 }); break;
      case "moon":          addShape({ type:"path", x:cx-30, y:cy-35, pathData:"M 30,5 A 28,28 0 1,0 30,65 A 18,18 0 1,1 30,5 Z", fill:"#f59e0b", stroke:"transparent", strokeWidth:0 }); break;
      case "speech-bubble": addShape({ type:"path", x:cx-45, y:cy-40, pathData:"M 5,0 Q 0,0 0,5 L 0,50 Q 0,55 5,55 L 25,55 L 25,70 L 42,55 L 80,55 Q 85,55 85,50 L 85,5 Q 85,0 80,0 Z", fill:"#3b82f6", stroke:"transparent", strokeWidth:0 }); break;
      case "bracket-l":     addShape({ type:"path", x:cx-20, y:cy-50, pathData:"M 25,2 L 8,2 Q 2,2 2,8 L 2,72 Q 2,78 8,78 L 25,78", fill:"transparent", stroke:"#374151", strokeWidth:6 }); break;
      case "bracket-r":     addShape({ type:"path", x:cx-10, y:cy-50, pathData:"M 5,2 L 22,2 Q 28,2 28,8 L 28,72 Q 28,78 22,78 L 5,78", fill:"transparent", stroke:"#374151", strokeWidth:6 }); break;
      /* ── Lines ── */
      case "hline":  addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, fill:"transparent" }); break;
      case "vline":  addShape({ type:"line", x:cx, y:cy-100, points:[0,0,0,200], stroke:"#374151", strokeWidth:2, fill:"transparent" }); break;
      case "dashed": addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, dash:[10,6], fill:"transparent" }); break;
      case "dotted": addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, dash:[2,6],  fill:"transparent" }); break;
      case "thick":  addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:6, fill:"transparent" }); break;
      case "double": {
        const i1 = genId(), i2 = genId();
        setShapes(p => [...p,
          { id:i1, type:"line", x:cx-150, y:cy-3, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:i2, type:"line", x:cx-150, y:cy+3, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        setSelectedId(i2); dirty.current = true; return;
      }
      /* ── Cylinder ── */
      case "cylinder": {
        const ids = [genId(),genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"rect",    x:cx-40, y:cy-43, width:80, height:80, fill:"#3b82f6", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"ellipse", x:cx,    y:cy-43, radiusX:40, radiusY:14, fill:"#60a5fa", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"ellipse", x:cx,    y:cy+37, radiusX:40, radiusY:14, fill:"#1d4ed8", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; return;
      }
      /* ── Form elements ── */
      case "form-input": {
        const ids = [genId(),genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"i-text", text:"Field Label",       x:cx-100, y:cy-36, fontSize:11, fontFamily:"Arial", fontWeight:"bold", fill:"#374151", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"rect",   x:cx-100, y:cy-18, width:200, height:32, fill:"#ffffff", stroke:"#94a3b8", strokeWidth:1, cornerRadius:4, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"i-text", text:"Enter text here...", x:cx-94,  y:cy-9,  fontSize:11, fontFamily:"Arial", fill:"#94a3b8", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Text field added"); return;
      }
      case "form-textarea": {
        const ids = [genId(),genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"i-text", text:"Field Label",       x:cx-100, y:cy-72, fontSize:11, fontFamily:"Arial", fontWeight:"bold", fill:"#374151", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"rect",   x:cx-100, y:cy-54, width:200, height:80, fill:"#ffffff", stroke:"#94a3b8", strokeWidth:1, cornerRadius:4, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"i-text", text:"Enter text here...", x:cx-94,  y:cy-46, fontSize:11, fontFamily:"Arial", fill:"#94a3b8", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Text area added"); return;
      }
      case "form-checkbox": {
        const ids = [genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"rect",   x:cx-60, y:cy-10, width:20, height:20, fill:"#ffffff", stroke:"#64748b", strokeWidth:1.5, cornerRadius:3, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"i-text", text:"Checkbox label", x:cx-34, y:cy-6, fontSize:13, fontFamily:"Arial", fill:"#374151", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; return;
      }
      case "form-radio": {
        const ids = [genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"circle", x:cx-50, y:cy, radius:10, fill:"#ffffff", stroke:"#64748b", strokeWidth:1.5, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"i-text", text:"Radio option", x:cx-34, y:cy-6, fontSize:13, fontFamily:"Arial", fill:"#374151", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; return;
      }
      case "form-dropdown": {
        const ids = [genId(),genId(),genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"i-text", text:"Field Label",    x:cx-100, y:cy-36, fontSize:11, fontFamily:"Arial", fontWeight:"bold", fill:"#374151", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"rect",   x:cx-100, y:cy-18, width:200, height:32, fill:"#ffffff", stroke:"#94a3b8", strokeWidth:1, cornerRadius:4, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"i-text", text:"Select option...", x:cx-94, y:cy-9, fontSize:11, fontFamily:"Arial", fill:"#94a3b8", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[3], type:"line",   x:cx+80, y:cy-4, closed:true, points:[0,0,10,0,5,7], fill:"#64748b", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Dropdown added"); return;
      }
      /* ── Media ── */
      case "media-video": {
        const ids = [genId(),genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"rect",    x:cx-120, y:cy-75, width:240, height:150, fill:"#1e293b", cornerRadius:8, stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"polygon", x:cx+10,  y:cy,    sides:3, radius:28, rotation:90, fill:"rgba(255,255,255,0.85)", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, opacity:1 },
          { id:ids[2], type:"i-text",  text:"VIDEO PLACEHOLDER", x:cx-70, y:cy+52, fontSize:10, fontFamily:"Arial", fontWeight:"bold", fill:"#64748b", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Video placeholder added"); return;
      }
      case "media-audio": {
        const ids = [genId(),genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"rect",   x:cx-140, y:cy-30, width:280, height:60, fill:"#1e1b4b", cornerRadius:30, stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"i-text", text:"AUDIO  ▶  Track Title", x:cx-100, y:cy-7, fontSize:13, fontFamily:"Arial", fontWeight:"bold", fill:"#c4b5fd", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Audio placeholder added"); return;
      }
      case "media-sheet": handleAddTable(5, 4, true); return;
      /* ── Mockups ── */
      case "mockup-browser": {
        const ids = Array.from({length:7},()=>genId());
        setShapes(p => [...p,
          { id:ids[0], type:"rect",   x:cx-160, y:cy-130, width:320, height:240, fill:"#f1f5f9", stroke:"#cbd5e1", strokeWidth:1, cornerRadius:8, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"rect",   x:cx-160, y:cy-130, width:320, height:34, fill:"#e2e8f0", cornerRadius:8, stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"circle", x:cx-144, y:cy-113, radius:6, fill:"#ef4444", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[3], type:"circle", x:cx-126, y:cy-113, radius:6, fill:"#eab308", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[4], type:"circle", x:cx-108, y:cy-113, radius:6, fill:"#22c55e", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[5], type:"rect",   x:cx-80,  y:cy-124, width:130, height:16, fill:"#ffffff", stroke:"#cbd5e1", strokeWidth:1, cornerRadius:8, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[6], type:"i-text", text:"Browser Mockup", x:cx-70, y:cy-20, fontSize:14, fontFamily:"Arial", fill:"#94a3b8", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Browser mockup added"); return;
      }
      case "mockup-phone": {
        const ids = Array.from({length:4},()=>genId());
        setShapes(p => [...p,
          { id:ids[0], type:"rect",   x:cx-50, y:cy-100, width:100, height:200, fill:"#1e293b", cornerRadius:18, stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"rect",   x:cx-42, y:cy-80,  width:84,  height:152, fill:"#f1f5f9", cornerRadius:4,  stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"rect",   x:cx-18, y:cy-103, width:36,  height:9,   fill:"#0f172a", cornerRadius:4,  stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[3], type:"circle", x:cx,    y:cy+110, radius:10, fill:"#334155", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Phone mockup added"); return;
      }
      case "mockup-card": {
        const ids = Array.from({length:5},()=>genId());
        setShapes(p => [...p,
          { id:ids[0], type:"rect",   x:cx-160, y:cy-50, width:320, height:180, fill:"#1e3a8a", cornerRadius:12, stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"circle", x:cx+120, y:cy-30, radius:60, fill:"rgba(255,255,255,0.08)", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[2], type:"circle", x:cx+150, y:cy+40, radius:50, fill:"rgba(255,255,255,0.06)", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[3], type:"i-text", text:"COMPANY NAME", x:cx-148, y:cy-38, fontSize:14, fontFamily:"Arial", fontWeight:"bold", fill:"#ffffff", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[4], type:"i-text", text:"John Doe\nJob Title  ·  email@company.com", x:cx-148, y:cy+30, fontSize:16, fontFamily:"Georgia", fill:"#bfdbfe", scaleX:1, scaleY:1, rotation:0, opacity:1 },
        ]);
        dirty.current = true; toast.success("Business card mockup added"); return;
      }
      default: break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH, addShape]);

  /* ── Add table ── */
  const handleAddTable = useCallback((rows, cols, hasHeader) => {
    const cellW = Math.min(120, (pageW - 80) / cols);
    const cellH = 34;
    const startX = (pageW - cols * cellW) / 2;
    const startY = 220;
    const ns = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isH = hasHeader && r === 0;
        const isA = !isH && r % 2 === 0;
        ns.push({ id:genId(), type:"rect",   x:startX+c*cellW, y:startY+r*cellH, width:cellW, height:cellH, fill:isH?"#1e3a8a":(isA?"#f8fafc":"#ffffff"), stroke:"#cbd5e1", strokeWidth:1, scaleX:1, scaleY:1, rotation:0, opacity:1 });
        ns.push({ id:genId(), type:"i-text", text:isH?`Column ${c+1}`:"", x:startX+c*cellW+6, y:startY+r*cellH+8, fontSize:11, fontFamily:"Arial", fontWeight:isH?"bold":"normal", fill:isH?"#ffffff":"#374151", width:cellW-12, scaleX:1, scaleY:1, rotation:0, opacity:1 });
      }
    }
    setShapes(p => [...p, ...ns]);
    dirty.current = true;
    toast.success(`${rows}×${cols} table added — double-click cells to edit`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW]);

  /* ── Add typed signature ── */
  const handleAddSignature = useCallback((text, fontObj) => {
    const sigY = pageH - 180;
    const id1 = genId(), id2 = genId();
    setShapes(p => [...p,
      { id:id1, type:"i-text", text, x:pageW/2-110, y:sigY, fontSize:42, fontFamily:fontObj.css, fill:"#1e293b", width:220, align:"center", scaleX:1, scaleY:1, rotation:0, opacity:1 },
      { id:id2, type:"line",   x:pageW/2-110, y:sigY+54, points:[0,0,220,0], stroke:"#1e293b", strokeWidth:1, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 },
    ]);
    setSelectedId(id1);
    dirty.current = true;
    toast.success("Signature added!");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH]);

  /* ── Add signature block ── */
  const handleAddSignatureBlock = useCallback((preset) => {
    const blockY = pageH - 160;
    const lineW  = 210;
    const ns = [];
    const mkField = (x, label) => {
      ns.push({ id:genId(), type:"i-text", text:"",    x, y:blockY,    width:lineW, fontSize:32, fontFamily:"'Dancing Script',cursive", fill:"#1e293b", scaleX:1, scaleY:1, rotation:0, opacity:1 });
      ns.push({ id:genId(), type:"line",   x, y:blockY+46, points:[0,0,lineW,0], stroke:"#374151", strokeWidth:1, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 });
      ns.push({ id:genId(), type:"i-text", text:label, x, y:blockY+56, fontSize:10, fontFamily:"Arial", fontWeight:"bold", fill:"#64748b", scaleX:1, scaleY:1, rotation:0, opacity:1 });
    };
    if (preset.cols === 1) mkField(pageW/2 - lineW/2, preset.leftLabel);
    else { mkField(60, preset.leftLabel); mkField(pageW - 60 - lineW, preset.rightLabel); }
    setShapes(p => [...p, ...ns]);
    dirty.current = true;
    toast.success("Signature block added — double-click to type");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH]);

  /* ── Add text ── */
  const handleAddText = useCallback((text, opts = {}) => {
    addShape({ type:"i-text", text, x:opts.left??pageW/2-150, y:opts.top??Math.min(200,pageH/4), fontSize:opts.fontSize||16, fontFamily:opts.fontFamily||"Arial", fontWeight:opts.fontWeight||"normal", fontStyle:opts.fontStyle||"normal", fill:"#1a1a1a", width:300 });
  }, [addShape, pageW, pageH]);

  /* ── Add image ── */
  const handleAddImage = useCallback(async (src) => {
    try {
      const img = new window.Image();
      if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
      const sc = Math.min(300 / img.naturalWidth, 300 / img.naturalHeight, 1);
      addShape({ type:"image", src, x:pageW/2-(img.naturalWidth*sc)/2, y:180, width:img.naturalWidth*sc, height:img.naturalHeight*sc });
      return true;
    } catch { return false; }
  }, [addShape, pageW]);

  /* ── Insert variable ── */
  const handleInsertVar = useCallback((varName) => {
    if (!selectedId) { toast.error("Select a text element first"); return; }
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape || !["i-text","text","signature"].includes(shape.type)) { toast.error("Select a text element first"); return; }
    updateShape(selectedId, { text: (shape.text||"") + ` [${varName}]` });
    toast.success(`[${varName}] inserted`);
  }, [selectedId, shapes, updateShape]);

  /* ── Update property ── */
  const handleUpdateProp = useCallback((key, value) => {
    if (!selectedId) return;
    const MAP = { left:"x", top:"y", angle:"rotation", textAlign:"align" };
    const shapeKey = MAP[key] || key;
    const shapeVal = key === "opacity" ? value / 100 : value;
    updateShape(selectedId, { [shapeKey]: shapeVal });
    setSelProps(prev => prev ? { ...prev, [key]: value } : null);
  }, [selectedId, updateShape]);

  /* ── Align on page ── */
  const handleAlignH = useCallback((align) => {
    if (!selectedId) return;
    const s = shapes.find(x => x.id === selectedId);
    if (!s) return;
    const w = (s.width||(s.radius||50)*2||100) * (s.scaleX||1);
    const x = align==="left" ? 0 : align==="center" ? (pageW-w)/2 : pageW-w;
    updateShape(selectedId, { x });
    setSelProps(prev => prev ? { ...prev, left: Math.round(x) } : null);
  }, [selectedId, shapes, pageW, updateShape]);

  const handleAlignV = useCallback((align) => {
    if (!selectedId) return;
    const s = shapes.find(x => x.id === selectedId);
    if (!s) return;
    const h = (s.height||(s.radius||50)*2||100) * (s.scaleY||1);
    const y = align==="top" ? 0 : align==="middle" ? (pageH-h)/2 : pageH-h;
    updateShape(selectedId, { y });
    setSelProps(prev => prev ? { ...prev, top: Math.round(y) } : null);
  }, [selectedId, shapes, pageH, updateShape]);

  /* ── Delete / Duplicate / Layers ── */
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setShapes(p => p.filter(s => s.id !== selectedId));
    setSelectedId(null); setSelProps(null);
    dirty.current = true;
  }, [selectedId]);

  const handleDuplicate = useCallback(() => {
    if (!selectedId) return;
    const s = shapes.find(x => x.id === selectedId);
    if (!s) return;
    const clone = { ...s, id:genId(), x:(s.x||0)+20, y:(s.y||0)+20 };
    setShapes(p => [...p, clone]);
    setSelectedId(clone.id);
    dirty.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, shapes]);

  const handleMoveUp   = useCallback(() => {
    if (!selectedId) return;
    setShapes(p => { const i=p.findIndex(s=>s.id===selectedId); if(i<0||i===p.length-1) return p; const n=[...p]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; });
  }, [selectedId]);
  const handleMoveDown = useCallback(() => {
    if (!selectedId) return;
    setShapes(p => { const i=p.findIndex(s=>s.id===selectedId); if(i<=0) return p; const n=[...p]; [n[i],n[i-1]]=[n[i-1],n[i]]; return n; });
  }, [selectedId]);

  /* ── Resize page ── */
  const handleResizePage = useCallback((w, h) => { if(w&&h){ setPageW(w); setPageH(h); } }, []);

  /* ── Apply theme ── */
  const handleApplyTemplate = useCallback((t) => {
    setBgColor(t.bg);
    setShapes(p => p.map(s => {
      if (["i-text","text","signature"].includes(s.type)) return s;
      const u = {};
      if (s.fill   && s.fill   !== "transparent") u.fill   = t.accent;
      if (s.stroke && s.stroke !== "transparent") u.stroke = t.accent;
      return { ...s, ...u };
    }));
  }, []);

  /* ── Apply contract template ── */
  const handleApplyContractTemplate = useCallback(async (tmpl) => {
    const cc  = getContrastColors(bgColor);
    const co  = template?.company;
    const built = tmpl.build(pageW, pageH, cc, co, genId);

    /* ── Inject company logo ── */
    const logoSrc = co?.companylogo || co?.companyLogo;
    if (logoSrc) {
      try {
        const img = new window.Image();
        if (!logoSrc.startsWith("data:")) img.crossOrigin = "anonymous";
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = logoSrc; });
        const maxSize = tmpl.headerH > 0 ? tmpl.headerH - 16 : 60;
        const sc  = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
        const lw  = Math.round(img.naturalWidth  * sc);
        const lh  = Math.round(img.naturalHeight * sc);
        const ly  = tmpl.headerH > 0 ? Math.round((tmpl.headerH - lh) / 2) : 12;
        built.splice(tmpl.headerH > 0 ? 1 : built.length, 0, {
          id:genId(), type:"image", src:logoSrc,
          x:pageW-50-lw, y:ly, width:lw, height:lh,
          scaleX:1, scaleY:1, rotation:0, opacity:1,
        });
      } catch { /* logo load failed — skip */ }
    }

    /* ── Tag shapes for dynamic bg-recoloring ── */
    // Build reverse map: hex color string → role name (from current contrast colors)
    const colorToRole = {};
    for (const [role, val] of Object.entries(cc)) {
      if (typeof val === "string") colorToRole[val] = role;
    }

    const newShapes = built.map(s => {
      const tagged = { ...s, _tmpl: true };
      // Shapes inside the colored header area are brand — never recolor them
      if (tmpl.headerH > 0 && (s.y ?? 0) < tmpl.headerH) {
        tagged._brand = true;
        return tagged;
      }
      // Assign role tags so bg changes can update colors automatically
      if (s.fill   && colorToRole[s.fill])   tagged._fillRole   = colorToRole[s.fill];
      if (s.stroke && colorToRole[s.stroke]) tagged._strokeRole = colorToRole[s.stroke];
      return tagged;
    });

    setShapes(newShapes);
    setSelectedId(null);
    setTemplateName(tmpl.name);
    dirty.current = true;
    toast.success(`"${tmpl.name}" loaded — double-click text to edit`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor, pageW, pageH, template]);

  /* ── Export PDF ── */
  const handleExportPDF = useCallback(async () => {
    setExporting(true); setExportOpen(false);
    try {
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio:2 });
      if (!dataUrl) return;
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297);
      pdf.save(`${templateName||"contract"}.pdf`);
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF export failed"); }
    finally  { setExporting(false); }
  }, [templateName]);

  /* ── Export PPTX ── */
  const handleExportPPTX = useCallback(async () => {
    setExporting(true); setExportOpen(false);
    try {
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio:1.5 });
      if (!dataUrl) return;
      const { default: pptxgen } = await import("pptxgenjs");
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";
      pres.addSlide().addImage({ data:dataUrl, x:0, y:0, w:"100%", h:"100%" });
      await pres.writeFile({ fileName:`${templateName||"contract"}.pptx` });
      toast.success("PPTX downloaded!");
    } catch(e) { toast.error("PPTX export failed: "+e.message); }
    finally    { setExporting(false); }
  }, [templateName]);

  /* ── Keyboard shortcuts ── */
  const saveRef = useRef(handleSave); const delRef = useRef(handleDelete); const dupRef = useRef(handleDuplicate);
  useEffect(() => { saveRef.current = handleSave; });
  useEffect(() => { delRef.current  = handleDelete; });
  useEffect(() => { dupRef.current  = handleDuplicate; });
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if ((e.key==="Delete"||e.key==="Backspace") && selectedId) { e.preventDefault(); delRef.current(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); saveRef.current(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="d") { e.preventDefault(); dupRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  /* ── Recolor template shapes when canvas bg changes ── */
  const prevBgRef = useRef(bgColor);
  useEffect(() => {
    const prev = prevBgRef.current;
    prevBgRef.current = bgColor;
    if (prev === bgColor) return;
    // Only act when there are tagged template shapes present
    setShapes(curr => {
      if (!curr.some(s => s._tmpl && !s._brand && (s._fillRole || s._strokeRole))) return curr;
      const newCC = getContrastColors(bgColor);
      return curr.map(s => {
        if (!s._tmpl || s._brand) return s;
        const u = {};
        if (s._fillRole   && newCC[s._fillRole])   u.fill   = newCC[s._fillRole];
        if (s._strokeRole && newCC[s._strokeRole]) u.stroke = newCC[s._strokeRole];
        return Object.keys(u).length ? { ...s, ...u } : s;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor]);

  /* ── Sidebar toggle ── */
  const handleSidebarItem = (id) => {
    if (id===activePanel && !panelCollapsed) { setActivePanel(null); return; }
    setActivePanel(id); setPanelCollapsed(false);
  };

  const company = template?.company;

  /* ════════════════════════ JSX ════════════════════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f1f3f5]">

      {/* ─── HEADER ─── */}
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-4 border-b border-[#e0e0e0]"
        style={{ background:"linear-gradient(90deg,#0099ff 0%,#4c6fff 100%)" }}
      >
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors">
          <ArrowLeft size={17}/>
        </button>
        <div className="w-px h-5 bg-white/30"/>
        <input value={templateName} onChange={e=>setTemplateName(e.target.value)}
          className="text-sm font-semibold text-white bg-transparent outline-none border-none min-w-0 w-52 placeholder:text-white/60"
          placeholder="Contract name…"
        />
        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={exportRef}>
            <button onClick={()=>setExportOpen(p=>!p)} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
            >
              {exporting ? <Loader2 size={12} className="animate-spin"/> : <FileDown size={12}/>}
              Export <ChevronDown size={10} className={`transition-transform ${exportOpen?"rotate-180":""}`}/>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-xl w-44 z-50 overflow-hidden">
                <button onClick={handleExportPDF}  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
                  <FileText size={13} className="text-red-500"/> Export PDF
                </button>
                <div className="border-t border-slate-100"/>
                <button onClick={handleExportPPTX} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
                  <Layers size={13} className="text-orange-500"/> Export PPTX
                </button>
              </div>
            )}
          </div>
          <span className="hidden md:block text-[10px] text-white/50 font-medium">Ctrl+S to save</span>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? <><Loader2 size={12} className="animate-spin"/>Saving…</> : <><Save size={12}/>Save</>}
          </button>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Primary sidebar */}
        <nav className="w-16 shrink-0 bg-[#f5f5f5] border-r border-[#e6e6e6] flex flex-col items-center pt-2">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={()=>handleSidebarItem(item.id)}
              className={`w-full flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors cursor-pointer ${
                activePanel===item.id && !panelCollapsed
                  ? "bg-[#e6e6e6] text-slate-800"
                  : "text-slate-500 hover:bg-[#e6e6e6] hover:text-slate-700"
              }`}
            >
              <item.icon size={18}/>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Secondary panel */}
        <div className="relative shrink-0 bg-white border-r border-[#e6e6e6] transition-all duration-300 ease-in-out"
          style={{ width: activePanel && !panelCollapsed ? 280 : 0, opacity: activePanel && !panelCollapsed ? 1 : 0 }}
        >
          {activePanel && (
            <div className="w-[280px] h-full flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6e6e6] shrink-0">
                <span className="text-sm font-bold text-slate-800 capitalize">
                  {SIDEBAR_ITEMS.find(i=>i.id===activePanel)?.label}
                </span>
                <button onClick={()=>setActivePanel(null)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X size={14}/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {activePanel==="templates" && <TemplatesPanel bgColor={bgColor} company={company} onApplyTemplate={handleApplyContractTemplate}/>}
                {activePanel==="elements"  && <ElementsPanel  onAdd={handleAddShape}    onAddTable={handleAddTable}/>}
                {activePanel==="text"      && <TextPanel       onAddText={handleAddText}/>}
                {activePanel==="draw"      && <DrawPanel       drawTool={drawTool}       setDrawTool={setDrawTool} brushSize={brushSize} setBrushSize={setBrushSize} brushColor={brushColor} setBrushColor={setBrushColor}/>}
                {activePanel==="signature" && <SignaturePanel  onAddSignature={handleAddSignature} onAddSignatureBlock={handleAddSignatureBlock}/>}
                {activePanel==="images"    && <ImagesPanel     onAddImage={handleAddImage}/>}
                {activePanel==="vars"      && <VariablesPanel  onInsert={handleInsertVar}/>}
                {activePanel==="design"    && <DesignPanel     bgColor={bgColor} onBgChange={setBgColor} onApplyTemplate={handleApplyTemplate} onResizePage={handleResizePage} pageW={pageW} pageH={pageH}/>}
                {activePanel==="company"   && <CompanyPanel    company={company}  onAddText={handleAddText} onAddImage={handleAddImage}/>}
              </div>
            </div>
          )}
          {activePanel && (
            <button onClick={()=>setPanelCollapsed(p=>!p)}
              className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-[#e6e6e6] shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ChevronLeft size={12} className={`transition-transform ${panelCollapsed?"rotate-180":""}`}/>
            </button>
          )}
        </div>

        {/* Canvas area */}
        <main className="flex-1 overflow-auto bg-[#f1f3f5] py-8 px-6">
          <div style={{ minWidth: pageW+48 }} className="mx-auto flex flex-col items-center gap-4">

            <div style={{ position:"relative" }}>
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-3 z-10 rounded-sm"
                  style={{ width:pageW, height:pageH }}
                >
                  <Loader2 size={32} className="animate-spin text-blue-400"/>
                  <p className="text-sm text-slate-400 font-medium">Loading template…</p>
                </div>
              )}

              {/* Konva canvas — loaded client-side only */}
              <KonvaCanvas
                stageRef={stageRef}
                shapes={shapes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={updateShape}
                drawTool={drawTool}
                brushColor={brushColor}
                brushSize={brushSize}
                bgColor={bgColor}
                pageW={pageW}
                pageH={pageH}
                drawingLine={drawingLine}
                setDrawingLine={setDrawingLine}
                setShapes={setShapes}
                dirty={dirty}
              />
            </div>

            {/* Hints */}
            {!loading && (
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pb-4">
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Del</kbd> delete</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+D</kbd> duplicate</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+S</kbd> save</span>
                <span>Double-click text to edit</span>
              </div>
            )}
          </div>
        </main>

        {/* Properties panel */}
        <PropertiesPanel
          props={selProps}
          onUpdate={handleUpdateProp}
          onAlignH={handleAlignH}
          onAlignV={handleAlignV}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onClose={() => { setSelectedId(null); setSelProps(null); }}
        />
      </div>
    </div>
  );
}

/* ─────────────────── Main Editor ─────────────────── */
