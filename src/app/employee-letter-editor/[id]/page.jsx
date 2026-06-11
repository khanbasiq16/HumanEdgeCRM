"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

import dynamic from "next/dynamic";
const KonvaCanvas = dynamic(() => import("@/app/contract-editor/[templateid]/KonvaCanvas"), { ssr: false });
import {
  ArrowLeft, Save, Loader2, FileDown, ChevronDown,
  ChevronLeft, Grid, Type, Image as ImageIcon, Tag, Palette,
  AlignLeft, AlignCenter, AlignRight, Trash2, Copy,
  User, X, MoveUp, MoveDown, RotateCcw, Minus as LineIcon,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  Layers, FileText, PenLine, Film, Music, LayoutList, Monitor,
  MousePointer2, Pen, Paintbrush, Eraser, Fingerprint,
} from "lucide-react";

/* ─────────────── Config ─────────────── */
const A4_W = 750;
const A4_H = 1060;

const FONT_FAMILIES = [
  "Arial","Times New Roman","Georgia","Helvetica","Courier New",
  "Trebuchet MS","Verdana","Palatino Linotype","Garamond",
];

const EMPLOYEE_VARS = [
  "Employee Name","Employee ID","Designation","Department",
  "Join Date","Salary","Company Name","Date",
  "From Date","To Date","Duration","Month","Year",
  "Manager Name","HR Name",
];

const BG_COLORS = [
  "#ffffff","#f8fafc","#fef9f0","#f0f9ff","#f0fdf4",
  "#fdf4ff","#fff1f2","#f1f5f9","#0f172a","#1e1b4b",
];

/* ─────────── Canvas contrast helper ─────────── */
const getContrastColors = (bg) => {
  const h = (bg||"#ffffff").replace("#","");
  if (h.length !== 6) return { isDark:false, text:"#0f172a", sub:"#64748b", accent:"#059669", line:"#e2e8f0", altLine:"#cbd5e1", header:"#059669" };
  const r=parseInt(h.slice(0,2),16)/255, g=parseInt(h.slice(2,4),16)/255, b=parseInt(h.slice(4,6),16)/255;
  const lum = 0.299*r + 0.587*g + 0.114*b;
  const dark = lum < 0.45;
  return {
    isDark:  dark,
    text:    dark ? "#ffffff"  : "#0f172a",
    sub:     dark ? "#94a3b8"  : "#64748b",
    accent:  dark ? "#34d399"  : "#059669",
    line:    dark ? "#1e293b"  : "#f1f5f9",
    altLine: dark ? "#334155"  : "#cbd5e1",
    header:  "#059669",
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
  { id:"employee",  icon:User,      label:"Employee"  },
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
  { id:"rect",           label:"Rectangle",   render:()=><div className="w-9 h-6 rounded bg-slate-700"/> },
  { id:"rect-outline",   label:"Rect Outline",render:()=><div className="w-9 h-6 rounded border-2 border-slate-700"/> },
  { id:"rounded-rect",   label:"Rounded",     render:()=><div className="w-9 h-6 rounded-xl bg-slate-700"/> },
  { id:"circle",         label:"Circle",      render:()=><div className="w-7 h-7 rounded-full bg-slate-700"/> },
  { id:"circle-outline", label:"Circle Line", render:()=><div className="w-7 h-7 rounded-full border-2 border-slate-700"/> },
  { id:"triangle",       label:"Triangle",    render:()=><svg width="28" height="24" viewBox="0 0 28 24"><polygon points="14,2 26,22 2,22" fill="#374151"/></svg> },
  { id:"diamond",        label:"Diamond",     render:()=><svg width="28" height="32" viewBox="0 0 28 32"><polygon points="14,1 27,16 14,31 1,16" fill="#374151"/></svg> },
  { id:"star",           label:"Star",        render:()=><svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,2 17,10 26,10 19,15 22,24 14,19 6,24 9,15 2,10 11,10" fill="#374151"/></svg> },
  { id:"arrow",          label:"Arrow →",     render:()=><svg width="32" height="20" viewBox="0 0 32 20"><line x1="2" y1="10" x2="22" y2="10" stroke="#374151" strokeWidth="2.5"/><polygon points="22,5 30,10 22,15" fill="#374151"/></svg> },
  { id:"badge",          label:"Badge",       render:()=><svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#374151"/></svg> },
];

const LINE_SHAPES = [
  { id:"hline",  label:"H Line", render:()=><div className="w-16 border-t-2 border-slate-700"/> },
  { id:"vline",  label:"V Line", render:()=><div className="border-l-2 border-slate-700 h-6"/> },
  { id:"dashed", label:"Dashed", render:()=><div className="w-16 border-t-2 border-dashed border-slate-700"/> },
  { id:"dotted", label:"Dotted", render:()=><div className="w-16 border-t-2 border-dotted border-slate-700"/> },
  { id:"thick",  label:"Thick",  render:()=><div className="w-16 border-t-4 border-slate-700"/> },
];

/* ─────────────── Letter Templates ─────────────── */
const LETTER_TEMPLATES = [
  /* 1 ─ Appreciation Letter */
  {
    id:"appreciation", name:"Appreciation Letter", category:"Recognition", headerH:85,
    desc:"Formal employee appreciation and recognition letter",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#059669"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">LETTER OF APPRECIATION</span>
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
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#059669",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"LETTER OF APPRECIATION",x:pW/2-220,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:440,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"Date: [Date]",x:pW-170,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub,align:"right",width:120});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To,\n[Employee Name]\n[Designation]\n[Department]",x:50,y:146,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:228,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Subject: Letter of Appreciation",x:50,y:246,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.accent});
      push({type:"i-text",text:"Dear [Employee Name],",x:50,y:278,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"On behalf of the management and entire team at [Company Name], we are truly pleased to\nformally acknowledge your outstanding performance, unwavering dedication, and the\nsignificant contributions you have made to our organization.",x:50,y:306,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"Your consistent commitment to excellence, professional conduct, and positive attitude have\nnot only helped achieve departmental goals but have also set a commendable example for\nyour colleagues. The management takes great pride in recognizing employees like you\nwho go above and beyond their responsibilities.",x:50,y:368,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"rect",x:50,y:448,width:pW-100,height:60,fill:cc.line,stroke:"transparent",strokeWidth:0,cornerRadius:6});
      push({type:"i-text",text:"Your efforts have directly contributed to the growth and success of [Company Name].\nWe deeply value your hard work and sincerely appreciate your dedication.",x:64,y:462,fontSize:12,fontFamily:"Arial",fill:cc.accent,width:pW-128});
      push({type:"i-text",text:"We look forward to your continued growth within the organization. Once again, thank you\nfor your outstanding service and dedication.\n\nWarm regards,",x:50,y:528,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATORY",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}`,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-280;
      push({type:"i-text",text:"",x:rx,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:rx,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"HR MANAGER",x:rx,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[HR Name]",x:rx,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 2 ─ Offer / Appointment Letter */
  {
    id:"offer-letter", name:"Offer Letter", category:"Onboarding", headerH:85,
    desc:"Employment offer / appointment letter with salary details",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#1e3a8a"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">LETTER OF APPOINTMENT</span>
        </div>
        {[75,88,60,82,70,85,55].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?"#3b82f680":cc.altLine,width:`${w}%`}}/>
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
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#1e3a8a",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"LETTER OF APPOINTMENT",x:pW/2-210,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:420,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"Date: [Date]",x:pW-170,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub,width:120});
      push({type:"line",x:50,y:128,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To,\n[Employee Name]\n[Designation]",x:50,y:146,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"Dear [Employee Name],",x:50,y:214,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"We are pleased to offer you the position of [Designation] in the [Department] Department\nat [Company Name]. After a thorough review of your qualifications, we are confident\nthat you will be a valuable addition to our team.",x:50,y:242,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"TERMS & CONDITIONS OF EMPLOYMENT",x:50,y:308,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#1e3a8a"});
      push({type:"rect",x:50,y:328,width:pW-100,height:130,fill:"#f0f9ff",stroke:"#bfdbfe",strokeWidth:1,cornerRadius:6});
      push({type:"i-text",text:"Position:          [Designation]\nDepartment:        [Department]\nDate of Joining:   [Join Date]\nEmployment Type:   Full-Time / Permanent\nMonthly Salary:    PKR [Salary]\nProbation Period:  3 Months",x:70,y:344,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-140});
      push({type:"i-text",text:"This offer is subject to successful verification of your qualifications and satisfactory\ncompletion of any pre-employment requirements.",x:50,y:476,fontSize:12,fontFamily:"Arial",fill:cc.sub,width:pW-100});
      push({type:"i-text",text:"Please sign and return a copy of this letter as your acceptance of the offer.\nWe look forward to welcoming you to [Company Name].",x:50,y:524,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATORY",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}`,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-280;
      push({type:"i-text",text:"",x:rx,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:rx,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"EMPLOYEE ACCEPTANCE",x:rx,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Employee Name]  |  Date: _____________",x:rx,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 3 ─ Experience / Service Letter */
  {
    id:"experience-letter", name:"Experience Letter", category:"Exit", headerH:85,
    desc:"Service / experience certificate for departing employees",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#1e293b"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">EXPERIENCE CERTIFICATE</span>
        </div>
        <div className="h-0.5 mb-1.5" style={{background:"#059669",width:"100%"}}/>
        {[88,70,82,60,76,88,55].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?cc.accent+"80":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto flex gap-3 pt-1">
          <div className="flex-1 border-t" style={{borderColor:cc.altLine}}/>
        </div>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#1e293b",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"EXPERIENCE CERTIFICATE",x:pW/2-210,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:420,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"line",x:0,y:85,points:[0,0,pW,0],stroke:"#059669",strokeWidth:3,fill:"transparent"});
      push({type:"i-text",text:"TO WHOM IT MAY CONCERN",x:pW/2-160,y:115,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub,width:320,align:"center"});
      push({type:"line",x:50,y:138,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"This is to certify that [Employee Name] (Employee ID: [Employee ID]) has served\nas [Designation] in the [Department] Department at [Company Name].",x:50,y:158,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"rect",x:50,y:220,width:pW-100,height:90,fill:cc.line,stroke:"transparent",strokeWidth:0,cornerRadius:6});
      push({type:"i-text",text:"Date of Joining:  [Join Date]\nDate of Leaving:  [To Date]\nTotal Duration:   [Duration]",x:70,y:236,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-140});
      push({type:"i-text",text:"During [his/her] tenure from [Join Date] to [To Date], [Employee Name] has demonstrated\nexceptional professionalism and competence. [He/She] was diligent, hardworking, and\na valued member of our team.",x:50,y:330,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"We wish [him/her] all the best in [his/her] future endeavors and recommend [him/her]\nwithout any reservation for any position that [he/she] may apply for.",x:50,y:400,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"Date: [Date]",x:pW-180,y:460,fontSize:11,fontFamily:"Arial",fill:cc.sub,width:130});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATORY",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:`${cName}`,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 4 ─ Warning Letter */
  {
    id:"warning-letter", name:"Warning Letter", category:"Disciplinary", headerH:85,
    desc:"Formal warning notice for disciplinary action",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#b91c1c"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">WARNING LETTER</span>
        </div>
        {[82,68,90,55,78,88,60].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?"#ef444480":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto border-t" style={{borderColor:"#fca5a5"}}/>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#b91c1c",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"WARNING LETTER",x:pW/2-180,y:22,fontSize:28,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:360,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"CONFIDENTIAL",x:50,y:108,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#b91c1c"});
      push({type:"i-text",text:"Date: [Date]",x:pW-180,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub,width:130});
      push({type:"line",x:50,y:130,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To,\n[Employee Name]\nEmployee ID: [Employee ID]\n[Designation] | [Department]",x:50,y:148,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:228,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Subject: Warning Letter",x:50,y:246,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#b91c1c"});
      push({type:"i-text",text:"Dear [Employee Name],",x:50,y:278,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"This letter is to formally notify you that your recent conduct/performance falls below\nthe standards expected by [Company Name]. Specifically, the following issue has been\nbrought to the attention of management:",x:50,y:306,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"rect",x:50,y:368,width:pW-100,height:70,fill:"#fef2f2",stroke:"#fca5a5",strokeWidth:1,cornerRadius:6});
      push({type:"i-text",text:"Issue / Violation:\n[Describe the specific issue or misconduct here]",x:70,y:382,fontSize:12,fontFamily:"Arial",fill:"#991b1b",width:pW-140});
      push({type:"i-text",text:"You are hereby warned that a repetition of such behavior may result in further\ndisciplinary action, up to and including termination of employment.",x:50,y:458,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"We expect immediate corrective action and a written response within 5 working days\nof receiving this letter.",x:50,y:510,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"MANAGER / HR",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:cName,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      const rx=pW-280;
      push({type:"i-text",text:"",x:rx,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:rx,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"EMPLOYEE ACKNOWLEDGMENT",x:rx,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:"[Employee Name]  |  Date: _____________",x:rx,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 5 ─ Salary Increment Letter */
  {
    id:"increment-letter", name:"Salary Increment Letter", category:"HR", headerH:85,
    desc:"Salary increment / raise announcement letter",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#6d28d9"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">SALARY INCREMENT</span>
        </div>
        {[70,85,60,92,68,80,55].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?"#8b5cf680":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto border-t" style={{borderColor:cc.altLine}}/>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#6d28d9",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"SALARY INCREMENT LETTER",x:pW/2-220,y:22,fontSize:24,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:440,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"Date: [Date]",x:pW-180,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub,width:130});
      push({type:"line",x:50,y:130,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To,\n[Employee Name]\nEmployee ID: [Employee ID]\n[Designation] | [Department]",x:50,y:148,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:228,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Subject: Salary Increment Effective [Date]",x:50,y:246,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#6d28d9"});
      push({type:"i-text",text:"Dear [Employee Name],",x:50,y:278,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"We are pleased to inform you that after reviewing your performance and contribution\nto [Company Name], the management has approved a salary increment effective from [Date].",x:50,y:306,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"rect",x:50,y:364,width:pW-100,height:90,fill:"#f5f3ff",stroke:"#c4b5fd",strokeWidth:1,cornerRadius:6});
      push({type:"i-text",text:"SALARY DETAILS",x:pW/2-60,y:376,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#6d28d9",width:120,align:"center"});
      push({type:"i-text",text:"Previous Salary:   PKR [Previous Amount]\nNew Salary:        PKR [Salary]\nIncrement Amount:  PKR [Increment Amount]\nEffective From:    [Date]",x:70,y:398,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-140});
      push({type:"i-text",text:"This increment is a reflection of your excellent performance and our confidence in\nyour abilities. We look forward to your continued dedication and contribution.",x:50,y:472,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATORY",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:cName,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },

  /* 6 ─ Leave Approval Letter */
  {
    id:"leave-approval", name:"Leave Approval Letter", category:"HR", headerH:85,
    desc:"Official leave approval / sanctioned leave letter",
    preview:(bg,cc)=>(
      <div className="w-full h-full flex flex-col overflow-hidden" style={{background:bg,padding:6}}>
        <div className="h-5 rounded-sm flex items-center justify-center mb-1.5" style={{background:"#0f766e"}}>
          <span className="text-[5px] font-bold tracking-widest text-white">LEAVE APPROVAL</span>
        </div>
        {[80,65,88,55,75,90,58].map((w,i)=>(
          <div key={i} className="h-1 rounded-full mb-0.5" style={{background:i===0||i===3?"#14b8a680":cc.altLine,width:`${w}%`}}/>
        ))}
        <div className="mt-auto border-t" style={{borderColor:cc.altLine}}/>
      </div>
    ),
    build:(pW,pH,cc,co,gId)=>{
      const s=[]; const push=(o)=>s.push({scaleX:1,scaleY:1,rotation:0,opacity:1,...o,id:gId()});
      const cName=co?.name||"[Company Name]";
      push({type:"rect",x:0,y:0,width:pW,height:85,fill:"#0f766e",stroke:"transparent",strokeWidth:0});
      push({type:"i-text",text:"LEAVE APPROVAL LETTER",x:pW/2-210,y:22,fontSize:26,fontFamily:"Arial",fontWeight:"bold",fill:"#ffffff",width:420,align:"center"});
      push({type:"i-text",text:cName,x:pW/2-200,y:55,fontSize:13,fontFamily:"Arial",fill:"rgba(255,255,255,0.7)",width:400,align:"center"});
      push({type:"i-text",text:"Date: [Date]",x:pW-180,y:108,fontSize:11,fontFamily:"Arial",fill:cc.sub,width:130});
      push({type:"line",x:50,y:130,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"To,\n[Employee Name]\nEmployee ID: [Employee ID]\n[Designation] | [Department]",x:50,y:148,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:228,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"Subject: Leave Approval",x:50,y:246,fontSize:13,fontFamily:"Arial",fontWeight:"bold",fill:"#0f766e"});
      push({type:"i-text",text:"Dear [Employee Name],",x:50,y:278,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"i-text",text:"With reference to your leave application, we are pleased to inform you that your leave\nhas been approved as per the details mentioned below:",x:50,y:306,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"rect",x:50,y:360,width:pW-100,height:100,fill:"#f0fdfa",stroke:"#99f6e4",strokeWidth:1,cornerRadius:6});
      push({type:"i-text",text:"LEAVE DETAILS",x:pW/2-60,y:372,fontSize:11,fontFamily:"Arial",fontWeight:"bold",fill:"#0f766e",width:120,align:"center"});
      push({type:"i-text",text:"Leave Type:     Annual / Casual / Medical / Other\nFrom Date:      [From Date]\nTo Date:        [To Date]\nTotal Days:     [Duration]",x:70,y:394,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-140});
      push({type:"i-text",text:"During your absence, please ensure that all pending tasks are completed or properly\nhandled. Report back to duty on [To Date + 1 day].",x:50,y:478,fontSize:12,fontFamily:"Arial",fill:cc.text,width:pW-100});
      push({type:"line",x:50,y:pH-190,points:[0,0,pW-100,0],stroke:cc.altLine,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"",x:60,y:pH-142,fontSize:34,fontFamily:"'Dancing Script',cursive",fill:cc.text,width:220});
      push({type:"line",x:60,y:pH-96,points:[0,0,220,0],stroke:cc.text,strokeWidth:1,fill:"transparent"});
      push({type:"i-text",text:"AUTHORIZED SIGNATORY",x:60,y:pH-84,fontSize:9,fontFamily:"Arial",fontWeight:"bold",fill:cc.sub});
      push({type:"i-text",text:cName,x:60,y:pH-70,fontSize:10,fontFamily:"Arial",fill:cc.text});
      return s;
    },
  },
];

/* ────────────── Templates Panel ──────────── */
const TemplatesPanel = ({ bgColor, employee, onApplyTemplate }) => {
  const cc = getContrastColors(bgColor);
  const categories = [...new Set(LETTER_TEMPLATES.map(t => t.category))];
  return (
    <div className="p-4 space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
          Click a template to load it onto the canvas. Customize text by double-clicking.
        </p>
      </div>
      {categories.map(cat => (
        <div key={cat}>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{cat}</p>
          <div className="space-y-2">
            {LETTER_TEMPLATES.filter(t => t.category === cat).map(t => (
              <button key={t.id}
                onClick={() => onApplyTemplate(t)}
                className="w-full text-left border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="h-[76px] w-full overflow-hidden relative">
                  {t.preview(bgColor, cc)}
                </div>
                <div className="px-3 py-2 bg-white group-hover:bg-emerald-50 transition-colors border-t border-slate-100">
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

/* ────────────── Elements Panel ──────────── */
const ElementsPanel = ({ onAdd, onAddTable }) => (
  <div className="p-4 space-y-5">
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Shapes</p>
      <div className="grid grid-cols-3 gap-2">
        {BASIC_SHAPES.map(sh => (
          <button key={sh.id} onClick={() => onAdd(sh.id)}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-8">{sh.render()}</div>
            <span className="text-[10px] text-slate-500 font-medium text-center leading-tight">{sh.label}</span>
          </button>
        ))}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Lines & Dividers</p>
      <div className="grid grid-cols-3 gap-2">
        {LINE_SHAPES.map(sh => (
          <button key={sh.id} onClick={() => onAdd(sh.id)}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-center w-10 h-8">{sh.render()}</div>
            <span className="text-[10px] text-slate-500 font-medium">{sh.label}</span>
          </button>
        ))}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Tables</p>
      <div className="space-y-1.5">
        {TABLE_PRESETS.map(t => (
          <button key={t.label} onClick={() => onAddTable(t.rows, t.cols, t.header)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all text-sm"
          >
            <span className="font-medium text-slate-700">{t.label}</span>
            <span className="text-[10px] text-slate-400">+ add</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Text Panel ──────────── */
const TextPanel = ({ onAddText }) => (
  <div className="p-4 space-y-3">
    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Add Text</p>
    {[
      { label:"Large Heading",  opts:{ fontSize:32, fontWeight:"bold" },   preview:"Large Heading"   },
      { label:"Medium Heading", opts:{ fontSize:22, fontWeight:"bold" },   preview:"Medium Heading"  },
      { label:"Small Heading",  opts:{ fontSize:16, fontWeight:"bold" },   preview:"Small Heading"   },
      { label:"Body Text",      opts:{ fontSize:13 },                      preview:"Body text here"  },
      { label:"Small Text",     opts:{ fontSize:10 },                      preview:"Small caption"   },
    ].map(t => (
      <button key={t.label} onClick={() => onAddText(t.preview, t.opts)}
        className="w-full flex items-center justify-between px-3 py-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
      >
        <span style={{ fontSize: Math.min(t.opts.fontSize, 20), fontWeight: t.opts.fontWeight || "normal", color:"#0f172a" }}>
          {t.label}
        </span>
        <span className="text-[10px] text-slate-300 group-hover:text-emerald-500">+ add</span>
      </button>
    ))}
  </div>
);

/* ────────────── Signature Panel ──────────── */
const SIGNATURE_PRESETS = [
  { label:"Single — Center",    cols:1, leftLabel:"Authorized Signatory" },
  { label:"Single — Employee",  cols:1, leftLabel:"Employee Signature" },
  { label:"Dual — Manager & HR",cols:2, leftLabel:"Manager / HOD", rightLabel:"HR Manager" },
  { label:"Dual — Auth & Emp",  cols:2, leftLabel:"Authorized Signatory", rightLabel:"Employee Signature" },
];
const SignaturePanel = ({ onAddSignatureBlock }) => (
  <div className="p-4 space-y-4">
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
        Select a signature block style to add to the canvas. Double-click to type a name.
      </p>
    </div>
    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Signature Blocks</p>
    <div className="space-y-2">
      {SIGNATURE_PRESETS.map(p => (
        <button key={p.label} onClick={() => onAddSignatureBlock(p)}
          className="w-full border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 transition-all group"
        >
          <div className="px-3 pt-3 pb-2 bg-white group-hover:bg-emerald-50 transition-colors">
            <div className={`flex ${p.cols === 2 ? "justify-between" : "justify-start"} gap-4 mb-1`}>
              {[p.leftLabel, ...(p.rightLabel ? [p.rightLabel] : [])].map((l, i) => (
                <div key={i} className="flex-1 max-w-[140px]">
                  <div className="h-4 border-b border-slate-400 mb-0.5"/>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">{l}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-slate-600">{p.label}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

/* ────────────── Images Panel ──────────── */
const ImagesPanel = ({ onAddImage }) => {
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAddImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Upload Image</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
      >
        <ImageIcon size={24} className="text-slate-300 group-hover:text-emerald-400"/>
        <p className="text-xs text-slate-500 font-medium">Click to upload image</p>
        <p className="text-[10px] text-slate-300">PNG, JPG, SVG, WebP</p>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
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
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Letter Variables</p>
      <div className="space-y-1.5">
        {EMPLOYEE_VARS.map(v => (
          <button
            key={v}
            onClick={() => onInsert(v)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 text-sm text-slate-700 font-medium transition-all"
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
  { label:"US Letter",     w:770,  h:1000 },
  { label:"Square",        w:800,  h:800  },
];

const DesignPanel = ({ bgColor, onBgChange, onResizePage, pageW, pageH }) => (
  <div className="p-4 space-y-5">
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Page Background</p>
      <div className="grid grid-cols-5 gap-2">
        {BG_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onBgChange(c)}
            className={`w-full aspect-square rounded-lg border-2 transition-all ${bgColor===c?"border-emerald-500 scale-110 shadow-md":"border-slate-200 hover:border-slate-400"}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={bgColor}
          onChange={e => onBgChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={bgColor}
          onChange={e => { if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(e.target.value)) onBgChange(e.target.value); }}
          maxLength={7}
          className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:border-emerald-400"
        />
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Page Size</p>
      <div className="space-y-1.5">
        {PAGE_SIZES.map(ps => (
          <button key={ps.label} onClick={() => onResizePage(ps.w, ps.h)}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
              pageW===ps.w&&pageH===ps.h
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <span>{ps.label}</span>
            <span className="text-slate-400">{ps.w}×{ps.h}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────── Employee Panel ──────────── */
const EmployeePanel = ({ employee, onAddText }) => {
  if (!employee) return (
    <div className="p-6 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <User size={20} className="text-slate-300"/>
      </div>
      <p className="text-sm text-slate-400 font-medium">No employee linked</p>
    </div>
  );

  const AddBtn = ({ label, value, onClick }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all group text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-xs text-slate-700 font-medium truncate">{value}</p>
      </div>
      <span className="text-[10px] text-slate-300 group-hover:text-emerald-400 shrink-0">+ add</span>
    </button>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-emerald-50 to-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{(employee.name||"E")[0].toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{employee.name || "Employee"}</p>
          {employee.designation && <p className="text-[11px] text-slate-500 mt-0.5">{employee.designation}</p>}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Add to Canvas</p>
        <div className="space-y-1.5">
          {employee.name        && <AddBtn label="Name"        value={employee.name}        onClick={()=>onAddText(employee.name,{fontSize:16,fontWeight:"bold"})}/>}
          {employee.employeeId  && <AddBtn label="Employee ID" value={employee.employeeId}  onClick={()=>onAddText(employee.employeeId,{fontSize:12})}/>}
          {employee.designation && <AddBtn label="Designation" value={employee.designation} onClick={()=>onAddText(employee.designation,{fontSize:13})}/>}
          {employee.department  && <AddBtn label="Department"  value={employee.department}  onClick={()=>onAddText(employee.department,{fontSize:12})}/>}
          {employee.joinDate    && <AddBtn label="Join Date"   value={employee.joinDate}    onClick={()=>onAddText(employee.joinDate,{fontSize:12})}/>}
          {employee.salary      && <AddBtn label="Salary"      value={employee.salary}      onClick={()=>onAddText(employee.salary,{fontSize:12})}/>}
        </div>
      </div>
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

const InlinePicker = ({ value, onChange, allowNone = false }) => {
  const nativeRef = useRef(null);
  const current = (!value || value === "transparent") ? "#000000" : value;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1">
        {PALETTE.map(c => (
          <button key={c} onClick={() => onChange(c)} title={c}
            className={`w-5 h-5 rounded transition-all border-2 ${value===c?"border-emerald-500 scale-110 shadow":"border-transparent hover:border-slate-400"}`}
            style={{ background:c, boxShadow:c==="#ffffff"?"inset 0 0 0 1px #e2e8f0":undefined }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 rounded-lg border border-slate-200 cursor-pointer shrink-0 overflow-hidden" style={{background:current}}>
          <input ref={nativeRef} type="color" value={current} onChange={e=>onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
        </div>
        <input type="text" value={value==="transparent"?"none":(value||"#000000")}
          onChange={e=>{const v=e.target.value.trim();if(v==="none"||v===""){if(allowNone)onChange("transparent");return;}if(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v))onChange(v);}}
          maxLength={7}
          className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none focus:border-emerald-400"
        />
        {allowNone && (
          <button onClick={()=>onChange("transparent")}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${value==="transparent"?"bg-slate-200 font-bold border-slate-400":"border-slate-200 hover:bg-slate-50"}`}
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
          <button key={t.id} onClick={()=>setDrawTool(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              drawTool===t.id?"border-emerald-400 bg-emerald-50 shadow-sm":"border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${drawTool===t.id?"bg-emerald-600 text-white":"bg-slate-100 text-slate-500"}`}>
              <t.icon size={16}/>
            </div>
            <div className="text-left">
              <p className={`text-xs font-semibold ${drawTool===t.id?"text-emerald-700":"text-slate-700"}`}>{t.label}</p>
              <p className="text-[10px] text-slate-400">{t.desc}</p>
            </div>
            {drawTool===t.id && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shrink-0"/>}
          </button>
        ))}
      </div>
      {drawTool !== "select" && (
        <>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Brush Size</p>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={30} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))} className="flex-1 accent-emerald-600"/>
              <div className="w-9 h-9 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <div className="rounded-full bg-slate-700" style={{width:Math.max(2,Math.min(brushSize*0.75,24)),height:Math.max(2,Math.min(brushSize*0.75,24))}}/>
              </div>
            </div>
            <p className="text-center text-[11px] text-slate-500 font-mono mt-1">{brushSize}px</p>
          </div>
          {drawTool !== "eraser" && (
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Color</p>
              <InlinePicker value={brushColor} onChange={setBrushColor}/>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ────────────── Properties Panel ──────────── */
const PropertiesPanel = ({ props: p, onUpdate, onAlignH, onAlignV, onDelete, onDuplicate, onMoveUp, onMoveDown, onBringToFront, onSendToBack, onClose }) => {
  if (!p) return null;
  const isText = p.type === "i-text" || p.type === "textbox" || p.type === "text";
  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 font-semibold shrink-0 w-16">{label}</span>
      {children}
    </div>
  );
  const NumInput = ({ val, onChange, min, max, suffix="" }) => (
    <div className="flex items-center gap-1">
      <input type="number" min={min} max={max} value={val??""} onChange={e=>onChange(Number(e.target.value))}
        className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 bg-slate-50 text-center"
      />
      {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
    </div>
  );

  return (
    <aside className="w-[250px] shrink-0 bg-white border-l border-[#e6e6e6] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6e6e6]">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Properties</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X size={14}/></button>
      </div>
      <div className="flex-1 p-4 space-y-5">
        {isText && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Text</p>
            <select value={p.fontFamily||"Arial"} onChange={e=>onUpdate("fontFamily",e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 outline-none focus:border-emerald-400"
            >
              {FONT_FAMILIES.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
            <Row label="Size"><NumInput val={p.fontSize} onChange={v=>onUpdate("fontSize",v)} min={6} max={200} suffix="px"/></Row>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>onUpdate("fontWeight",p.fontWeight==="bold"?"normal":"bold")}
                className={`p-2 rounded-lg border text-sm font-bold transition-all ${p.fontWeight==="bold"?"bg-emerald-600 text-white border-emerald-600":"border-slate-200 hover:bg-slate-50"}`}
              >B</button>
              <button onClick={()=>onUpdate("fontStyle",p.fontStyle==="italic"?"normal":"italic")}
                className={`p-2 rounded-lg border text-sm italic transition-all ${p.fontStyle==="italic"?"bg-emerald-600 text-white border-emerald-600":"border-slate-200 hover:bg-slate-50"}`}
              >I</button>
              <button onClick={()=>onUpdate("underline",!p.underline)}
                className={`p-2 rounded-lg border text-sm underline transition-all ${p.underline?"bg-emerald-600 text-white border-emerald-600":"border-slate-200 hover:bg-slate-50"}`}
              >U</button>
            </div>
            <div className="flex items-center gap-1">
              {[["left",AlignLeft],["center",AlignCenter],["right",AlignRight]].map(([v,Icon])=>(
                <button key={v} onClick={()=>onUpdate("textAlign",v)}
                  className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${p.textAlign===v?"bg-emerald-600 text-white border-emerald-600":"border-slate-200 hover:bg-slate-50"}`}
                ><Icon size={13}/></button>
              ))}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Color</p>
              <InlinePicker value={p.fill||"#000000"} onChange={v=>onUpdate("fill",v)}/>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Signature Styles</p>
              <div className="grid grid-cols-2 gap-1">
                {SIG_FONTS.map(f=>(
                  <button key={f.id} onClick={()=>onUpdate("fontFamily",f.css)}
                    className={`px-2 py-1.5 rounded-lg border text-left transition-all ${p.fontFamily===f.css?"border-emerald-400 bg-emerald-50":"border-slate-200 bg-white hover:border-emerald-200"}`}
                  >
                    <span style={{fontFamily:f.css,fontSize:16,display:"block",lineHeight:1.3,color:"#1e293b"}}>Abc</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{f.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {!isText && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Shape</p>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Fill</p>
              <InlinePicker value={p.fill||"#3b82f6"} onChange={v=>onUpdate("fill",v)} allowNone/>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Stroke</p>
              <InlinePicker value={p.stroke||"transparent"} onChange={v=>onUpdate("stroke",v)} allowNone/>
              <div className="mt-1.5">
                <Row label="Width"><NumInput val={p.strokeWidth} onChange={v=>onUpdate("strokeWidth",v)} min={0} max={20} suffix="px"/></Row>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Position & Size</p>
          <Row label="X"><NumInput val={p.left} onChange={v=>onUpdate("left",v)} min={-500} max={2000} suffix="px"/></Row>
          <Row label="Y"><NumInput val={p.top} onChange={v=>onUpdate("top",v)} min={-500} max={2000} suffix="px"/></Row>
          <Row label="Opacity"><NumInput val={p.opacity} onChange={v=>onUpdate("opacity",v)} min={0} max={100} suffix="%"/></Row>
          <Row label="Angle"><NumInput val={p.angle} onChange={v=>onUpdate("angle",v)} min={-360} max={360} suffix="°"/></Row>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Align on Page</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Horiz</span>
            {[["left","Left"],["center","Center"],["right","Right"]].map(([v,l])=>(
              <button key={v} onClick={()=>onAlignH(v)}
                className="flex-1 text-[10px] font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
              >{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 w-10 shrink-0">Vert</span>
            {[["top","Top"],["middle","Mid"],["bottom","Bot"]].map(([v,l])=>(
              <button key={v} onClick={()=>onAlignV(v)}
                className="flex-1 text-[10px] font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
              >{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Layers</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label:"Bring Fwd",  fn:onMoveUp,       icon:MoveUp   },
              { label:"Send Back",  fn:onMoveDown,     icon:MoveDown },
              { label:"To Front",   fn:onBringToFront, icon:Layers   },
              { label:"To Back",    fn:onSendToBack,   icon:Layers   },
            ].map(({label,fn,icon:Icon})=>(
              <button key={label} onClick={fn}
                className="flex items-center gap-1.5 px-2 py-2 text-[10px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all"
              ><Icon size={11}/>{label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button onClick={onDuplicate} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Copy size={12}/> Duplicate
          </button>
          <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 rounded-lg text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-all">
            <Trash2 size={12}/> Delete
          </button>
        </div>
      </div>
    </aside>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN LETTER EDITOR  —  Employee Perspective
   ═══════════════════════════════════════════════════════════ */
export default function EmployeeLetterEditorPage() {
  const { id } = useParams();
  const router = useRouter();

  const genId = () => `s${Date.now()}${Math.random().toString(36).slice(2,6)}`;

  const [shapes,       _setShapes]      = useState([]);
  const [selectedId,   setSelectedId]   = useState(null);
  const [drawingLine,  setDrawingLine]  = useState(null);
  const [letter,       setLetter]       = useState(null);
  const [employee,     setEmployee]     = useState(null);
  const [letterName,   setLetterName]   = useState("Untitled Letter");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [bgColor,      setBgColor]      = useState("#ffffff");
  const [pageW,        setPageW]        = useState(A4_W);
  const [pageH,        setPageH]        = useState(A4_H);
  const [drawTool,     setDrawTool]     = useState("select");
  const [brushSize,    setBrushSize]    = useState(3);
  const [brushColor,   setBrushColor]   = useState("#000000");
  const [activePanel,  setActivePanel]  = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selProps,     setSelProps]     = useState(null);
  const [selectedIds,  setSelectedIds]  = useState([]);

  /* ── Undo / Redo ── */
  const histRef = useRef({ stack: [[]], idx: 0 });
  const setShapes = useCallback((updater) => {
    _setShapes(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const h = histRef.current;
      let newStack = h.stack.slice(0, h.idx + 1);
      newStack.push(next);
      if (newStack.length > 60) newStack = newStack.slice(newStack.length - 60);
      h.stack = newStack;
      h.idx   = newStack.length - 1;
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    const h = histRef.current;
    if (h.idx <= 0) { toast("Nothing to undo"); return; }
    h.idx -= 1;
    _setShapes(h.stack[h.idx]);
    setSelectedId(null); setSelProps(null); setSelectedIds([]);
  }, []);

  const handleRedo = useCallback(() => {
    const h = histRef.current;
    if (h.idx >= h.stack.length - 1) { toast("Nothing to redo"); return; }
    h.idx += 1;
    _setShapes(h.stack[h.idx]);
    setSelectedId(null); setSelProps(null); setSelectedIds([]);
  }, []);

  const stageRef    = useRef(null);
  const dirty       = useRef(false);

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

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); handleDuplicate(); }
      if (e.key === "Delete" || e.key === "Backspace") handleDelete();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedIds, shapes]);

  /* ── Load letter ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/letters/by-id?letterId=${id}`);
        if (res.data.success) {
          const l = res.data.letter;
          setLetter(l);
          setLetterName(l.templateName || "Untitled Letter");

          /* Build employee info from letter data */
          if (l.employeeName || l.employeeId) {
            setEmployee({
              name:        l.employeeName || "",
              employeeId:  l.employeeId   || "",
              designation: l.designation  || "",
              department:   typeof l.department === "object"
                ? l.department?.departmentName || ""
                : l.department || "",
              joinDate:    l.joinDate     || "",
              salary:      l.salary       || "",
            });
          }

          /* Load canvas data — already resolved by the by-id API (with template fallback) */
          let canvasData = l.canvasData;
          if (canvasData) {
            const data = typeof canvasData === "string" ? JSON.parse(canvasData) : canvasData;
            if (data?.shapes) setShapes(data.shapes);
            if (data?.pageW)  setPageW(data.pageW);
            if (data?.pageH)  setPageH(data.pageH);
            if (data?.bgColor) setBgColor(data.bgColor);
          }
        }
      } catch { toast.error("Failed to load letter"); }
      finally  { setLoading(false); }
    };
    if (id) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvasData = JSON.stringify({ version:"konva-v1", shapes, bgColor, pageW, pageH });
      await axios.patch("/api/letters/save-canvas", { letterId: id, canvasData });
      dirty.current = false;
      toast.success("Letter saved!");
    } catch { toast.error("Failed to save"); }
    finally  { setSaving(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, shapes, bgColor, pageW, pageH, id]);

  /* ── Add shape ── */
  const handleAddShape = useCallback((shapeId) => {
    const cx = pageW / 2, cy = pageH / 3;
    const base = { fill:"#059669", stroke:"transparent", strokeWidth:0 };
    switch (shapeId) {
      case "rect":          addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, ...base }); break;
      case "rect-outline":  addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, fill:"transparent", stroke:"#059669", strokeWidth:2 }); break;
      case "rounded-rect":  addShape({ type:"rect",    x:cx-100, y:cy, width:200, height:120, cornerRadius:20, ...base }); break;
      case "circle":        addShape({ type:"circle",  x:cx, y:cy, radius:60, ...base }); break;
      case "circle-outline":addShape({ type:"circle",  x:cx, y:cy, radius:60, fill:"transparent", stroke:"#059669", strokeWidth:2 }); break;
      case "triangle":      addShape({ type:"polygon", x:cx, y:cy, sides:3, radius:60, ...base }); break;
      case "diamond":       addShape({ type:"polygon", x:cx, y:cy, sides:4, radius:60, rotation:45, ...base }); break;
      case "star":          addShape({ type:"star",    x:cx, y:cy, numPoints:5, innerRadius:22, outerRadius:55, ...base }); break;
      case "arrow": {
        const ids = [genId(), genId()];
        setShapes(p => [...p,
          { id:ids[0], type:"line", x:cx-100, y:cy, points:[0,0,200,0], stroke:"#059669", strokeWidth:3, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 },
          { id:ids[1], type:"polygon", x:cx+110, y:cy, sides:3, radius:16, rotation:90, fill:"#059669", stroke:"transparent", strokeWidth:0, scaleX:1, scaleY:1, opacity:1 },
        ]);
        dirty.current = true; return;
      }
      case "badge": addShape({ type:"circle", x:cx, y:cy, radius:45, ...base }); break;
      case "hline": addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 }); return;
      case "vline": addShape({ type:"line", x:cx, y:cy-100, points:[0,0,0,200], stroke:"#374151", strokeWidth:2, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 }); return;
      case "dashed":addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, dash:[10,8], fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 }); return;
      case "dotted":addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:2, dash:[2,6], fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 }); return;
      case "thick": addShape({ type:"line", x:cx-150, y:cy, points:[0,0,300,0], stroke:"#374151", strokeWidth:6, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 }); return;
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
        ns.push({ id:genId(), type:"rect",   x:startX+c*cellW, y:startY+r*cellH, width:cellW, height:cellH, fill:isH?"#059669":(isA?"#f0fdf4":"#ffffff"), stroke:"#cbd5e1", strokeWidth:1, scaleX:1, scaleY:1, rotation:0, opacity:1 });
        ns.push({ id:genId(), type:"i-text", text:isH?`Column ${c+1}`:"", x:startX+c*cellW+6, y:startY+r*cellH+8, fontSize:11, fontFamily:"Arial", fontWeight:isH?"bold":"normal", fill:isH?"#ffffff":"#374151", width:cellW-12, scaleX:1, scaleY:1, rotation:0, opacity:1 });
      }
    }
    setShapes(p => [...p, ...ns]);
    dirty.current = true;
    toast.success(`${rows}×${cols} table added — double-click cells to edit`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW]);

  /* ── Add signature block ── */
  const handleAddSignatureBlock = useCallback((preset) => {
    const blockY = pageH - 160;
    const lineW  = 210;
    const ns = [];
    const mkField = (x, label) => {
      ns.push({ id:genId(), type:"i-text", text:"", x, y:blockY, width:lineW, fontSize:32, fontFamily:"'Dancing Script',cursive", fill:"#1e293b", scaleX:1, scaleY:1, rotation:0, opacity:1 });
      ns.push({ id:genId(), type:"line", x, y:blockY+46, points:[0,0,lineW,0], stroke:"#374151", strokeWidth:1, fill:"transparent", scaleX:1, scaleY:1, rotation:0, opacity:1 });
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
    const cc = getContrastColors(bgColor);
    addShape({
      type:"i-text", text,
      x:    opts.left ?? pageW/2-150,
      y:    opts.top  ?? Math.min(200, pageH/4),
      fontSize:   opts.fontSize   || 16,
      fontFamily: opts.fontFamily || "Arial",
      fontWeight: opts.fontWeight || "normal",
      fontStyle:  opts.fontStyle  || "normal",
      fill:       opts.fill || cc.text,
      width: 300,
    });
  }, [addShape, pageW, pageH, bgColor]);

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
    if (selectedIds.length > 0) {
      const idSet = new Set(selectedIds);
      setShapes(p => p.filter(s => !idSet.has(s.id)));
      setSelectedIds([]); setSelectedId(null); setSelProps(null);
      dirty.current = true; return;
    }
    if (!selectedId) return;
    setShapes(p => p.filter(s => s.id !== selectedId));
    setSelectedId(null); setSelProps(null);
    dirty.current = true;
  }, [selectedId, selectedIds]);

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
  const handleBringToFront = useCallback(() => {
    if (!selectedId) return;
    setShapes(p => { const i=p.findIndex(s=>s.id===selectedId); if(i<0||i===p.length-1) return p; const n=[...p]; const [item]=n.splice(i,1); n.push(item); return n; });
    toast.success("Brought to front");
  }, [selectedId]);
  const handleSendToBack = useCallback(() => {
    if (!selectedId) return;
    setShapes(p => { const i=p.findIndex(s=>s.id===selectedId); if(i<=0) return p; const n=[...p]; const [item]=n.splice(i,1); n.unshift(item); return n; });
    toast.success("Sent to back");
  }, [selectedId]);

  /* ── Resize page ── */
  const handleResizePage = useCallback((w, h) => { if(w&&h){ setPageW(w); setPageH(h); } }, []);

  /* ── Apply letter template ── */
  const handleApplyLetterTemplate = useCallback(async (tmpl) => {
    const cc  = getContrastColors(bgColor);
    const co  = letter?.company;
    const built = tmpl.build(pageW, pageH, cc, co, genId);

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
      } catch { /* logo load failed */ }
    }

    setShapes(built);
    setSelectedId(null);
    setLetterName(tmpl.name);
    dirty.current = true;
    toast.success(`"${tmpl.name}" loaded — double-click text to edit`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor, pageW, pageH, letter]);

  /* ── Export PDF ── */
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio:2 });
      if (!dataUrl) return;
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297);
      pdf.save(`${letterName||"letter"}.pdf`);
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF export failed"); }
    finally  { setExporting(false); }
  }, [letterName]);

  /* ── Sidebar panel toggle ── */
  const handleSidebarItem = useCallback((id) => {
    if (activePanel === id && !panelCollapsed) setActivePanel(null);
    else { setActivePanel(id); setPanelCollapsed(false); }
  }, [activePanel, panelCollapsed]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f1f3f5]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3"/>
        <p className="text-sm text-slate-500">Loading letter editor…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f1f3f5]">

      {/* ─── Header ─── */}
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-4 bg-emerald-700 border-b border-emerald-800">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 transition-colors">
          <ArrowLeft size={17}/>
        </button>
        <div className="w-px h-5 bg-white/30"/>
        <input value={letterName} onChange={e=>setLetterName(e.target.value)}
          className="text-sm font-semibold text-white bg-transparent outline-none border-none min-w-0 w-52 placeholder:text-white/60"
          placeholder="Letter name…"
        />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
          >
            {exporting ? <Loader2 size={12} className="animate-spin"/> : <FileDown size={12}/>}
            Export PDF
          </button>
          <span className="hidden md:block text-[10px] text-white/50 font-medium">Ctrl+S to save</span>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? <><Loader2 size={12} className="animate-spin"/>Saving…</> : <><Save size={12}/>Save</>}
          </button>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Primary sidebar */}
        <nav className="w-16 shrink-0 bg-[#f5f5f5] border-r border-[#e6e6e6] flex flex-col items-center pt-2">
          {SIDEBAR_ITEMS.map(item => {
            const isActive = activePanel===item.id && !panelCollapsed;
            return (
              <motion.button
                key={item.id}
                onClick={()=>handleSidebarItem(item.id)}
                whileHover={{ scale: 1.06, backgroundColor: "#e6e6e6" }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`w-full flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold cursor-pointer relative ${
                  isActive ? "bg-[#e6e6e6] text-slate-800" : "text-slate-500"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-letter"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div animate={{ color: isActive ? "#059669" : undefined }} transition={{ duration: 0.15 }}>
                  <item.icon size={18}/>
                </motion.div>
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Secondary panel */}
        <div className="relative shrink-0 flex">
          <motion.div
            className="bg-white border-r border-[#e6e6e6] overflow-hidden h-full"
            animate={{ width: activePanel && !panelCollapsed ? 280 : 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <AnimatePresence mode="wait">
              {activePanel && !panelCollapsed && (
                <motion.div
                  key={activePanel}
                  className="w-[280px] h-full flex flex-col"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6e6e6] shrink-0">
                    <span className="text-sm font-bold text-slate-800 capitalize">
                      {SIDEBAR_ITEMS.find(i=>i.id===activePanel)?.label}
                    </span>
                    <button onClick={()=>setActivePanel(null)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                      <X size={14}/>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    {activePanel==="templates" && <TemplatesPanel bgColor={bgColor} employee={employee} onApplyTemplate={handleApplyLetterTemplate}/>}
                    {activePanel==="elements"  && <ElementsPanel  onAdd={handleAddShape} onAddTable={handleAddTable}/>}
                    {activePanel==="text"      && <TextPanel      onAddText={handleAddText}/>}
                    {activePanel==="draw"      && <DrawPanel      drawTool={drawTool} setDrawTool={setDrawTool} brushSize={brushSize} setBrushSize={setBrushSize} brushColor={brushColor} setBrushColor={setBrushColor}/>}
                    {activePanel==="signature" && <SignaturePanel onAddSignatureBlock={handleAddSignatureBlock}/>}
                    {activePanel==="images"    && <ImagesPanel    onAddImage={handleAddImage}/>}
                    {activePanel==="vars"      && <VariablesPanel onInsert={handleInsertVar}/>}
                    {activePanel==="design"    && <DesignPanel    bgColor={bgColor} onBgChange={setBgColor} onResizePage={handleResizePage} pageW={pageW} pageH={pageH}/>}
                    {activePanel==="employee"  && <EmployeePanel  employee={employee} onAddText={handleAddText}/>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {activePanel && (
            <button
              onClick={()=>setPanelCollapsed(p=>!p)}
              className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white border border-[#e6e6e6] shadow-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all"
            >
              <motion.div animate={{ rotate: panelCollapsed ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                <ChevronLeft size={12}/>
              </motion.div>
            </button>
          )}
        </div>

        {/* Canvas area */}
        <main className="flex-1 overflow-auto bg-[#f1f3f5] py-8 px-6">
          <div style={{ minWidth: pageW+48 }} className="mx-auto flex flex-col items-center gap-4">
            <div style={{ position:"relative" }}>
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-3 z-10 rounded-sm" style={{ width:pageW, height:pageH }}>
                  <Loader2 size={32} className="animate-spin text-emerald-400"/>
                  <p className="text-sm text-slate-400 font-medium">Loading letter…</p>
                </div>
              )}
              <KonvaCanvas
                stageRef={stageRef}
                shapes={shapes}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={(id) => { setSelectedId(id); setSelectedIds([]); }}
                onSelectMultiple={(ids) => { setSelectedIds(ids); setSelectedId(null); }}
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
            {!loading && (
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pb-4">
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Del</kbd> delete</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+Z</kbd> undo</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+Y</kbd> redo</span>
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
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onClose={() => { setSelectedId(null); setSelProps(null); }}
        />
      </div>
    </div>
  );
}
