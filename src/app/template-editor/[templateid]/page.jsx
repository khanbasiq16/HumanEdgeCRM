"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft, Save, Trash2, ChevronUp, ChevronDown,
  Heading1, AlignLeft, AlignCenter, AlignRight, Minus, PenLine,
  Calendar, Loader2, Building2, Tag, Type, Wand2, Receipt,
  Image as ImageIcon, Palette, FileDown, Info, Layers, Fingerprint, X, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";

/* ─────────────────────────── Themes ─────────────────────────── */
const THEMES = [
  { id:"blue",   name:"Ocean Blue",   primary:"#1e40af", accent:"#3b82f6", headerBg:"#1e3a8a", headerText:"#ffffff", divider:"#1e40af",  strip:"#3b82f6" },
  { id:"slate",  name:"Corporate",    primary:"#1e293b", accent:"#475569", headerBg:"#1e293b", headerText:"#ffffff", divider:"#334155",  strip:"#64748b" },
  { id:"green",  name:"Fresh Green",  primary:"#15803d", accent:"#22c55e", headerBg:"#14532d", headerText:"#ffffff", divider:"#15803d",  strip:"#22c55e" },
  { id:"amber",  name:"Warm Amber",   primary:"#b45309", accent:"#f59e0b", headerBg:"#78350f", headerText:"#ffffff", divider:"#b45309",  strip:"#f59e0b" },
  { id:"purple", name:"Royal Purple", primary:"#6d28d9", accent:"#8b5cf6", headerBg:"#4c1d95", headerText:"#ffffff", divider:"#6d28d9",  strip:"#8b5cf6" },
  { id:"teal",   name:"Teal Minimal", primary:"#0f766e", accent:"#14b8a6", headerBg:"#134e4a", headerText:"#ffffff", divider:"#0f766e",  strip:"#14b8a6" },
  { id:"rose",   name:"Rose Modern",  primary:"#be185d", accent:"#ec4899", headerBg:"#881337", headerText:"#ffffff", divider:"#be185d",  strip:"#ec4899" },
  { id:"dark",   name:"Midnight",     primary:"#111827", accent:"#374151", headerBg:"#030712", headerText:"#ffffff", divider:"#374151",  strip:"#4b5563" },
];
const DEFAULT_THEME = THEMES[0];

/* ─────────────────────────── Font stacks ─────────────────────── */
const FONT_STACKS = [
  { id:"serif",   name:"Classic Serif",  css:"'Times New Roman', Times, serif" },
  { id:"sans",    name:"Clean Sans",     css:"Arial, Helvetica, sans-serif" },
  { id:"georgia", name:"Georgia",        css:"Georgia, 'Times New Roman', serif" },
];
const DEFAULT_FONT = FONT_STACKS[0];

/* ─────────────────────────── Shortcodes ─────────────────────── */
const SHORTCODES = {
  Employee: ["Employee Name","Employee ID","Designation","Department","Join Date","Salary","Company Name","Date","From Date","To Date","Duration","Month","Year"],
  Admin:    ["Client Name","Client Address","Client Email","Client Phone","Company Name","Contract Date","Date"],
};

const mkId = () => uuidv4();

/* ─────────────────────────── Presets ────────────────────────── */
const EMPLOYEE_PRESETS = {
  appreciation: { name:"Appreciation Letter", blocks:[
    { type:"heading",   content:"Letter of Appreciation", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"text",      content:"Employee Name: [Employee Name]\nEmployee ID:   [Employee ID]\nDesignation:   [Designation]\nDepartment:    [Department]", align:"left" },
    { type:"divider" },
    { type:"text",      content:"Dear [Employee Name],", align:"left" },
    { type:"text",      content:"On behalf of the management and entire team at [Company Name], we are truly pleased to formally acknowledge your outstanding performance, unwavering dedication, and the significant contributions you have made to our organization.", align:"left" },
    { type:"text",      content:"Your consistent commitment to excellence, professional conduct, and positive attitude have not only helped achieve departmental goals but have also set a commendable example for your colleagues. The management takes great pride in recognizing employees like you who go above and beyond their responsibilities.", align:"left" },
    { type:"callout",   content:"Your efforts have directly contributed to the growth and success of [Company Name]. We deeply value your hard work and sincerely appreciate everything you bring to our team.", align:"left" },
    { type:"text",      content:"We look forward to your continued growth within the organization and are confident that you will achieve even greater milestones in the future. Once again, thank you for your outstanding service and dedication.\n\nWarm regards,", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"HR Manager" },
  ]},

  offer: { name:"Offer Letter", blocks:[
    { type:"heading",   content:"Letter of Appointment", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"text",      content:"To,\n[Employee Name]\n[Designation]", align:"left" },
    { type:"divider" },
    { type:"text",      content:"Dear [Employee Name],", align:"left" },
    { type:"text",      content:"We are pleased to offer you the position of [Designation] in the [Department] Department at [Company Name]. After a thorough review of your qualifications and interview performance, we are confident that you will be a valuable addition to our team.", align:"left" },
    { type:"heading",   content:"Terms & Conditions of Employment", headingLevel:"h3", align:"left" },
    { type:"text",      content:"Position:          [Designation]\nDepartment:        [Department]\nDate of Joining:   [Join Date]\nEmployment Type:   Full-Time / Permanent\nMonthly Salary:    PKR [Salary]\nProbation Period:  3 Months", align:"left" },
    { type:"callout",   content:"This offer is subject to successful verification of your educational qualifications, previous employment records, and satisfactory completion of any pre-employment requirements.", align:"left" },
    { type:"text",      content:"During the probation period, either party may terminate the employment with 7 days written notice. Upon successful completion of probation, the standard notice period of 1 month shall apply.\n\nPlease sign and return a copy of this letter as your acceptance of the offer. We look forward to welcoming you to [Company Name].", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"Employee Acceptance — [Employee Name] / Date" },
  ]},

  joining: { name:"Joining Letter", blocks:[
    { type:"heading",   content:"Joining / Welcome Letter", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"text",      content:"To,\n[Employee Name]\n[Designation] — [Department]", align:"left" },
    { type:"divider" },
    { type:"text",      content:"Dear [Employee Name],", align:"left" },
    { type:"text",      content:"On behalf of the entire team at [Company Name], we are delighted to welcome you as [Designation] in the [Department] Department. We are excited to have you join us and look forward to the contributions you will bring.", align:"left" },
    { type:"heading",   content:"Your Joining Details", headingLevel:"h3", align:"left" },
    { type:"text",      content:"Employee ID:       [Employee ID]\nDesignation:       [Designation]\nDepartment:        [Department]\nDate of Joining:   [Join Date]\nMonthly Salary:    PKR [Salary]\nReporting To:      HR / Line Manager", align:"left" },
    { type:"callout",   content:"Please report to the HR Department on your first day with all required original documents including CNIC, Educational Certificates, and Passport-size Photographs.", align:"left" },
    { type:"text",      content:"We are confident that your skills, experience, and enthusiasm will make a positive impact. Please feel free to reach out to the HR team for any queries or assistance during your onboarding.\n\nWe wish you a rewarding and successful career with [Company Name]. Welcome aboard!", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"HR Manager" },
  ]},

  experience: { name:"Experience Letter", blocks:[
    { type:"heading",   content:"Experience Certificate", headingLevel:"h2", align:"center" },
    { type:"heading",   content:"To Whom It May Concern", headingLevel:"h3", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"divider" },
    { type:"text",      content:"This is to certify that Mr./Ms. [Employee Name] bearing Employee ID [Employee ID] has been a valued employee of [Company Name] and served in the capacity of [Designation] in the [Department] Department.", align:"left" },
    { type:"text",      content:"Duration of Employment:   [From Date]  to  [To Date]\nDesignation:              [Designation]\nDepartment:               [Department]\nEmployee ID:              [Employee ID]", align:"left" },
    { type:"text",      content:"During the tenure of employment, [Employee Name] demonstrated exceptional professionalism, strong work ethics, and a high level of dedication towards assigned responsibilities. Their performance has consistently met and often exceeded the expectations of the management.", align:"left" },
    { type:"callout",   content:"[Employee Name] is leaving the organization on their own accord / upon completion of contract and we have no objection to their future employment. We wish them continued success in their career.", align:"left" },
    { type:"text",      content:"This certificate is issued on the request of the employee for their future reference.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"HR Manager — [Company Name]" },
  ]},

  internship: { name:"Internship Certificate", blocks:[
    { type:"heading",   content:"Internship Completion Certificate", headingLevel:"h2", align:"center" },
    { type:"heading",   content:"To Whom It May Concern", headingLevel:"h3", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"divider" },
    { type:"text",      content:"This is to certify that Mr./Ms. [Employee Name] has successfully completed their internship program at [Company Name] as [Designation] in the [Department] Department.", align:"left" },
    { type:"text",      content:"Internship Duration:   [From Date]  to  [To Date]  ([Duration])\nDepartment:            [Department]\nDesignation:           [Designation]\nSupervisor:            HR / Line Manager", align:"left" },
    { type:"text",      content:"Throughout the internship, [Employee Name] displayed a commendable level of enthusiasm, a strong desire to learn, and a professional approach towards all assigned tasks. They adapted quickly to the work environment and contributed positively to team activities.", align:"left" },
    { type:"callout",   content:"We appreciate [Employee Name]'s efforts and dedication during their time with us. We wish them all the best in their academic and professional endeavors.", align:"left" },
    { type:"text",      content:"This certificate is issued upon the successful completion of the internship program.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"HR Manager — [Company Name]" },
  ]},

  warning: { name:"Warning Letter", blocks:[
    { type:"heading",   content:"Warning Letter", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"text",      content:"To,\n[Employee Name]\nEmployee ID:   [Employee ID]\nDesignation:   [Designation]\nDepartment:    [Department]", align:"left" },
    { type:"divider" },
    { type:"text",      content:"Dear [Employee Name],", align:"left" },
    { type:"callout",   content:"This letter serves as a formal written warning regarding your conduct and/or performance that has come to the attention of the management. This matter is being treated with utmost seriousness.", align:"left" },
    { type:"heading",   content:"Nature of Violation / Concern", headingLevel:"h3", align:"left" },
    { type:"text",      content:"The management has observed the following issues that are in violation of company policies and code of conduct:\n\n1. [Describe specific issue or misconduct here]\n2. [Additional concern if applicable]\n\nThe incident(s) occurred on [Date] and have been documented by the concerned department.", align:"left" },
    { type:"text",      content:"You are hereby advised to immediately rectify the above-mentioned issues and ensure that such behavior/performance does not recur. Continued failure to meet the required standards will result in further disciplinary action, which may include suspension or termination of employment.", align:"left" },
    { type:"callout",   content:"You are required to submit a written explanation regarding this matter within 3 working days of receiving this letter. Failure to respond will be treated as acceptance of the stated concerns.", align:"left" },
    { type:"text",      content:"We sincerely hope that this serves as a constructive reminder and that you will make the necessary improvements. The management remains committed to supporting your growth within the organization.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory / HR Manager" },
    { type:"signature", label:"Employee Acknowledgement — [Employee Name] / Date" },
  ]},

  termination: { name:"Termination Letter", blocks:[
    { type:"heading",   content:"Letter of Termination of Employment", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Date]" },
    { type:"text",      content:"To,\n[Employee Name]\nEmployee ID:   [Employee ID]\nDesignation:   [Designation]\nDepartment:    [Department]", align:"left" },
    { type:"divider" },
    { type:"text",      content:"Dear [Employee Name],", align:"left" },
    { type:"text",      content:"We regret to inform you that after careful consideration, the management of [Company Name] has decided to terminate your employment as [Designation] in the [Department] Department, effective [Date].", align:"left" },
    { type:"heading",   content:"Reason for Termination", headingLevel:"h3", align:"left" },
    { type:"text",      content:"[State the reason clearly — e.g., repeated policy violations, performance issues, redundancy, end of contract, etc.]", align:"left" },
    { type:"callout",   content:"You are required to hand over all company property — including but not limited to access cards, laptops, documents, and any other assets — to the HR Department on or before your last working day.", align:"left" },
    { type:"heading",   content:"Final Settlement", headingLevel:"h3", align:"left" },
    { type:"text",      content:"Your final salary, pending dues, and any other applicable benefits will be settled and disbursed in accordance with company policy and applicable labor laws within [30] days of your last working day.", align:"left" },
    { type:"text",      content:"Please ensure a smooth handover of all pending work and responsibilities to your team/manager before your departure. The HR team will guide you through the offboarding process.\n\nWe wish you the best in your future endeavors.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"HR Manager — [Company Name]" },
  ]},

  payslip: { name:"Payslip / Salary Slip", blocks:[
    { type:"heading",   content:"Salary Slip", headingLevel:"h2", align:"center" },
    { type:"text",      content:"Employee Name:   [Employee Name]\nEmployee ID:     [Employee ID]\nDesignation:     [Designation]\nDepartment:      [Department]", align:"left" },
    { type:"payslip",   period:"[Month] [Year]",
      earnings:[
        { id:"pe1", label:"Basic Salary",           amount:"[Salary]" },
        { id:"pe2", label:"House Rent Allowance",   amount:"" },
        { id:"pe3", label:"Medical Allowance",      amount:"" },
        { id:"pe4", label:"Transport Allowance",    amount:"" },
        { id:"pe5", label:"Special Allowance",      amount:"" },
        { id:"pe6", label:"Overtime",               amount:"" },
      ],
      deductions:[
        { id:"pd1", label:"Income Tax (WHT)",       amount:"" },
        { id:"pd2", label:"EOBI Contribution",      amount:"" },
        { id:"pd3", label:"SESSI / PESSI",          amount:"" },
        { id:"pd4", label:"Loan / Advance",         amount:"" },
        { id:"pd5", label:"Other Deductions",       amount:"" },
      ],
      netPay:"[Salary]" },
    { type:"divider" },
    { type:"signature", label:"Authorized Signatory" },
    { type:"signature", label:"Employee Acknowledgement — [Employee Name]" },
  ]},
};

const CONTRACT_PRESETS = {
  nda: { name:"Non-Disclosure Agreement", blocks:[
    { type:"heading",   content:"Non-Disclosure Agreement", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Contract Date]" },
    { type:"text",      content:"This Non-Disclosure Agreement is entered into as of [Contract Date] between [Company Name] (\"Disclosing Party\") and [Client Name], located at [Client Address] (\"Receiving Party\").", align:"left" },
    { type:"callout",   content:"The Receiving Party agrees to keep confidential all non-public, proprietary, or confidential information disclosed by the Disclosing Party, including business plans, strategies, technical data, and trade secrets.", align:"left" },
    { type:"text",      content:"2. OBLIGATIONS: The Receiving Party shall use the Confidential Information solely for evaluating a potential business relationship and shall not disclose it to any third party.", align:"left" },
    { type:"text",      content:"3. TERM: This Agreement shall remain in effect for a period of two (2) years from the date first written above.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"[Company Name] — Authorized Signatory" },
    { type:"signature", label:"[Client Name] — Representative" },
  ]},
  proposal: { name:"Business Proposal", blocks:[
    { type:"heading",   content:"Business Proposal", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Contract Date]" },
    { type:"text",      content:"Prepared for: [Client Name]\nAddress: [Client Address]\nEmail: [Client Email]", align:"left" },
    { type:"text",      content:"Dear [Client Name],\n\nWe are pleased to present this business proposal outlining the services and solutions that [Company Name] can offer to your organization.", align:"left" },
    { type:"heading",   content:"Scope of Work", headingLevel:"h3", align:"left" },
    { type:"callout",   content:"All deliverables will be completed in accordance with the timeline and specifications agreed upon by both parties.", align:"left" },
    { type:"heading",   content:"Investment & Timeline", headingLevel:"h3", align:"left" },
    { type:"text",      content:"The total investment for the proposed services is subject to mutual agreement. The project commences upon signing.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"[Company Name] — Authorized Signatory" },
  ]},
  service: { name:"Service Agreement", blocks:[
    { type:"heading",   content:"Service Agreement", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Contract Date]" },
    { type:"text",      content:"This Service Agreement is entered into as of [Contract Date] between [Company Name] (\"Service Provider\") and [Client Name], located at [Client Address] (\"Client\").", align:"left" },
    { type:"text",      content:"1. SERVICES: The Service Provider agrees to provide services as mutually agreed upon by both parties.\n\n2. PAYMENT: The Client agrees to pay the Service Provider as per the agreed payment schedule. All payments due within 30 days of invoice.\n\n3. TERM: This Agreement commences on [Contract Date] and may be terminated by either party with 30 days written notice.", align:"left" },
    { type:"callout",   content:"4. CONFIDENTIALITY: Both parties agree to keep all business information exchanged during this agreement strictly confidential.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"[Company Name] — Authorized Signatory" },
    { type:"signature", label:"[Client Name] — Authorized Representative" },
  ]},
  consulting: { name:"Consulting Agreement", blocks:[
    { type:"heading",   content:"Consulting Agreement", headingLevel:"h2", align:"center" },
    { type:"date-line", content:"Date: [Contract Date]" },
    { type:"text",      content:"This Consulting Agreement is made as of [Contract Date] between [Company Name] (\"Consultant\") and [Client Name], located at [Client Address] (\"Client\").", align:"left" },
    { type:"text",      content:"1. CONSULTING SERVICES: The Consultant shall provide professional consulting services as agreed upon.\n\n2. COMPENSATION: The Client shall compensate the Consultant as per the agreed fee structure, payable within 15 business days.\n\n3. INDEPENDENT CONTRACTOR: The Consultant is an independent contractor.", align:"left" },
    { type:"callout",   content:"4. INTELLECTUAL PROPERTY: All work product created under this Agreement shall become the property of the Client upon full payment of fees.", align:"left" },
    { type:"text",      content:"5. TERM: This Agreement begins on [Contract Date] and may be terminated by either party with 30 days written notice.", align:"left" },
    { type:"divider" },
    { type:"signature", label:"[Company Name] — Consultant" },
    { type:"signature", label:"[Client Name] — Client Representative" },
  ]},
};

const ALL_PRESETS = { ...EMPLOYEE_PRESETS, ...CONTRACT_PRESETS };

const SIG_FONTS = [
  { id:"dancing",  name:"Dancing Script", css:"'Dancing Script', cursive" },
  { id:"great",    name:"Great Vibes",    css:"'Great Vibes', cursive"    },
  { id:"pacifico", name:"Pacifico",       css:"'Pacifico', cursive"       },
  { id:"satisfy",  name:"Satisfy",        css:"'Satisfy', cursive"        },
  { id:"caveat",   name:"Caveat",         css:"'Caveat', cursive"         },
];

/* ─────────────────── Stamp utilities ─────────────────────── */
function _esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function generateStampSVG({ topText="COMPANY NAME HERE", bottomText="STATE HERE", centerText="SEAL", middleText="", color="#6b7280", size=200, logoSrc="" }){
  const S=Number(size)||200, cx=S/2, cy=S/2;
  const r1=S*0.455, r2=S*0.415, r3=S*0.280, rt=S*0.350;
  const col=color||"#6b7280";
  const uid=Math.random().toString(36).slice(2,7);
  const topArc=`M ${(cx-rt).toFixed(1)},${cy} A ${rt},${rt} 0 0,0 ${(cx+rt).toFixed(1)},${cy}`;
  const tf=Math.round(S*0.068), bf=Math.round(S*0.058), cf=Math.round(S*0.115), mf=Math.round(S*0.058);
  if(logoSrc){
    const imgR=r3*0.82, imgSize=imgR*2, imgX=(cx-imgR).toFixed(1), imgY=(cy-imgR).toFixed(1);
    const centerTextY=middleText?(cy-r3*0.38).toFixed(1):cy.toFixed(1);
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><defs><clipPath id="cc${uid}"><circle cx="${cx}" cy="${cy}" r="${imgR.toFixed(1)}"/></clipPath><path id="ta${uid}" d="${topArc}"/></defs><circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="2.5 2.5"/><circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${col}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${col}" stroke-width="1.5"/><image href="${logoSrc}" x="${imgX}" y="${imgY}" width="${imgSize.toFixed(1)}" height="${imgSize.toFixed(1)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#cc${uid})"/><text font-size="${tf}" font-family="Arial,sans-serif" font-weight="bold" fill="${col}" letter-spacing="2.5"><textPath href="#ta${uid}" startOffset="50%" text-anchor="middle">${_esc(topText)}</textPath></text><g transform="rotate(180,${cx},${cy})"><text font-size="${bf}" font-family="Arial,sans-serif" fill="${col}" letter-spacing="2"><textPath href="#ta${uid}" startOffset="50%" text-anchor="middle">${_esc(bottomText)}</textPath></text></g>${middleText?`<text x="${cx}" y="${centerTextY}" text-anchor="middle" dominant-baseline="middle" font-size="${mf}" font-family="Arial,sans-serif" fill="${col}" letter-spacing="2">${_esc(middleText)}</text>`:""}</svg>`;
  }
  const centerY=(middleText?(cy+cf*0.4):(cy+cf*0.18)).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="2.5 2.5"/><circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${col}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${col}" stroke-width="1.5"/><defs><path id="ta${uid}" d="${topArc}"/></defs><text font-size="${tf}" font-family="Arial,sans-serif" font-weight="bold" fill="${col}" letter-spacing="2.5"><textPath href="#ta${uid}" startOffset="50%" text-anchor="middle">${_esc(topText)}</textPath></text><g transform="rotate(180,${cx},${cy})"><text font-size="${bf}" font-family="Arial,sans-serif" fill="${col}" letter-spacing="2"><textPath href="#ta${uid}" startOffset="50%" text-anchor="middle">${_esc(bottomText)}</textPath></text></g>${middleText?`<text x="${cx}" y="${(cy-r3*0.38).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${mf}" font-family="Arial,sans-serif" fill="${col}" letter-spacing="2">${_esc(middleText)}</text>`:""}<text x="${cx}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" font-size="${cf}" font-family="Arial,sans-serif" font-weight="bold" fill="${col}">${_esc(centerText)}</text></svg>`;
}

async function toBase64DataUrl(src){
  if(!src) return "";
  if(src.startsWith("data:")) return src;
  try{ const res=await fetch(src); const blob=await res.blob(); return await new Promise((ok,err)=>{ const r=new FileReader(); r.onload=ev=>ok(ev.target.result); r.onerror=err; r.readAsDataURL(blob); }); }catch{ return ""; }
}

const STAMP_COLORS = ["#6b7280","#1e3a8a","#111827","#b91c1c","#166534","#6d28d9"];

/* ─── Stamp Editor Modal ─── */
const StampEditorModal = ({ stamp, companyName, companyLogo, onSave, onClose, onInsert }) => {
  const [topText,     setTopText]     = useState((stamp?.topText    || companyName || "COMPANY NAME HERE").toUpperCase());
  const [bottomText,  setBottomText]  = useState((stamp?.bottomText || "STATE HERE").toUpperCase());
  const [centerText,  setCenterText]  = useState((stamp?.centerText || "SEAL").toUpperCase());
  const [middleText,  setMiddleText]  = useState((stamp?.middleText || "").toUpperCase());
  const [color,       setColor]       = useState(stamp?.color  || "#6b7280");
  const [size,        setSize]        = useState(stamp?.size   || 200);
  const [logoSrc,     setLogoSrc]     = useState(stamp?.logoSrc || "");
  const [logoLoading, setLogoLoading] = useState(false);
  const logoRef = useRef(null);

  const svgStr  = generateStampSVG({ topText, bottomText, centerText, middleText, color, size, logoSrc });
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
  const current = { ...(stamp||{}), id: stamp?.id || Date.now().toString(), topText, bottomText, centerText, middleText, color, size, logoSrc };

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    if(!file.type.startsWith("image/")){ toast.error("Select an image"); return; }
    setLogoLoading(true);
    try{ const b64=await new Promise((ok,er)=>{ const r=new FileReader(); r.onload=ev=>ok(ev.target.result); r.onerror=er; r.readAsDataURL(file); }); setLogoSrc(b64); }
    catch{ toast.error("Failed to read image"); }
    finally{ setLogoLoading(false); e.target.value=""; }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col" style={{maxHeight:"92vh"}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2"><Fingerprint size={17} className="text-blue-600"/><h2 className="text-base font-bold text-slate-800">Stamp Editor</h2></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15}/></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[55%] p-5 space-y-4 overflow-y-auto border-r border-slate-100 [&::-webkit-scrollbar]:hidden">
            {[["Top Text (Company Name)",topText,v=>setTopText(v.toUpperCase()),"COMPANY NAME"],["Bottom Text (City/State)",bottomText,v=>setBottomText(v.toUpperCase()),"CITY / STATE"],["Center Text",centerText,v=>setCenterText(v.toUpperCase()),"SEAL"],["Middle Text (optional)",middleText,v=>setMiddleText(v.toUpperCase()),"e.g. REGISTERED"]].map(([lbl,val,set,ph])=>(
              <div key={lbl}>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{lbl}</p>
                <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white tracking-wide"/>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Logo Inside Stamp</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
              {logoSrc ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 flex items-center justify-center bg-white shrink-0"><img src={logoSrc} alt="" className="w-full h-full object-contain"/></div>
                  <div className="flex-1"><p className="text-xs font-semibold text-slate-700">Logo added</p><p className="text-[10px] text-slate-400">Shows inside stamp circle</p></div>
                  <button onClick={()=>setLogoSrc("")} className="text-[10px] text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50">Remove</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={()=>logoRef.current?.click()} disabled={logoLoading} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-sm text-slate-500 hover:text-blue-600 font-medium transition-all disabled:opacity-60">
                    {logoLoading?<Loader2 size={14} className="animate-spin"/>:<ImageIcon size={14}/>} {logoLoading?"Loading…":"Upload Logo"}
                  </button>
                  {companyLogo && (
                    <button onClick={async()=>{ setLogoLoading(true); const b=await toBase64DataUrl(companyLogo); if(b) setLogoSrc(b); else toast.error("Could not load logo"); setLogoLoading(false); }} disabled={logoLoading} className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 text-xs font-semibold text-slate-600 hover:text-violet-700 transition-all disabled:opacity-60">
                      <img src={companyLogo} alt="" className="w-5 h-5 rounded object-contain border border-slate-100"/> Use Company Logo
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Ink Color</p>
              <div className="flex flex-wrap gap-2 items-center">
                {STAMP_COLORS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${color===c?"border-blue-500 scale-110 shadow":"border-slate-200 hover:border-slate-400"}`} style={{background:c}}/>
                ))}
                <div className="relative w-7 h-7 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer">
                  <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/>
                  <div className="w-full h-full" style={{background:color}}/>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Size: {size}px</p>
              <input type="range" min={100} max={280} value={size} onChange={e=>setSize(Number(e.target.value))} className="w-full accent-blue-600"/>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>Small</span><span>Large</span></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-5 bg-slate-50/60">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Live Preview</p>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-center" style={{minWidth:200,minHeight:200}}>
              <img src={dataUrl} alt="stamp preview" style={{width:Math.min(size,200),height:Math.min(size,200),objectFit:"contain"}}/>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 font-medium px-3 py-1.5">Cancel</button>
          <div className="flex gap-2">
            <button onClick={()=>{ onSave(current); toast.success("Stamp saved!"); }} className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">Save Stamp</button>
            <button onClick={()=>onInsert(dataUrl, size)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
              <Fingerprint size={13}/> Add to Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Stamp Panel (sidebar) ─── */
const StampPanel = ({ company, onInsert }) => {
  const compKey = `stamps_letter_${company?.id || company?.name || "default"}`;
  const loadStamps = () => { try{ return JSON.parse(localStorage.getItem(compKey)||"[]"); }catch{ return []; } };
  const [stamps,  setStamps]  = useState(loadStamps);
  const [editing, setEditing] = useState(null);
  const persist = (arr) => { setStamps(arr); localStorage.setItem(compKey, JSON.stringify(arr)); };
  const handleSave   = (s)  => persist(stamps.some(x=>x.id===s.id)?stamps.map(x=>x.id===s.id?s:x):[...stamps,s]);
  const handleDelete = (id) => persist(stamps.filter(s=>s.id!==id));
  const companyLogo  = company?.companylogo || company?.companyLogo || "";

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
          <p className="text-[11px] text-violet-800 font-medium leading-relaxed">Create your company stamp and insert it into the letter.</p>
        </div>
        <button onClick={()=>setEditing(false)} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Fingerprint size={14}/> Create New Stamp
        </button>
        {stamps.length > 0 && (
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Saved Stamps</p>
            <div className="space-y-2">
              {stamps.map(s=>{
                const svg=generateStampSVG(s);
                const url=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                return (
                  <div key={s.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-3 p-3 bg-slate-50">
                      <img src={url} alt="stamp" className="w-14 h-14 object-contain shrink-0"/>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 truncate">{s.topText}</p>
                        <p className="text-[10px] text-slate-400">{s.logoSrc?"With logo":s.centerText}</p>
                        <p className="text-[9px] text-slate-300">{s.size}px</p>
                      </div>
                    </div>
                    <div className="flex border-t border-slate-100">
                      <button onClick={()=>setEditing(s)} className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Edit</button>
                      <div className="w-px bg-slate-100"/>
                      <button onClick={()=>onInsert(url, s.size)} className="flex-1 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">Insert</button>
                      <div className="w-px bg-slate-100"/>
                      <button onClick={()=>handleDelete(s.id)} className="px-3 py-2 text-red-400 hover:bg-red-50 transition-colors text-xs">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {editing !== null && (
        <StampEditorModal
          stamp={editing||null}
          companyName={company?.name}
          companyLogo={companyLogo}
          onSave={handleSave}
          onClose={()=>setEditing(null)}
          onInsert={(url,size)=>{ onInsert(url,size); setEditing(null); }}
        />
      )}
    </>
  );
};

const ELEMENT_TYPES = [
  { type:"heading",   label:"Heading",    icon:Heading1,   desc:"Title / section header" },
  { type:"text",      label:"Paragraph",  icon:AlignLeft,  desc:"Body text paragraph"    },
  { type:"callout",   label:"Callout Box",icon:Info,       desc:"Highlighted info box"   },
  { type:"image",     label:"Image",      icon:ImageIcon,  desc:"Photo or logo"          },
  { type:"date-line", label:"Date Line",  icon:Calendar,   desc:"Right-aligned date"     },
  { type:"divider",   label:"Divider",    icon:Minus,      desc:"Horizontal separator"   },
  { type:"signature", label:"Signature",  icon:PenLine,       desc:"Signature field"        },
  { type:"payslip",   label:"Payslip",    icon:Receipt,       desc:"Salary slip table"      },
  { type:"stamp",     label:"Stamp",      icon:Fingerprint,   desc:"Company seal / stamp"   },
];

const makeBlock = (type, overrides = {}) => {
  const base = {
    id: mkId(), type,
    content:      type==="heading" ? "New Heading" : type==="date-line" ? "Date: [Date]" : type==="callout" ? "Add your highlighted text here…" : "",
    label:        type==="signature" ? "Authorized Signatory" : "",
    headingLevel: "h2",
    align:        type==="heading" ? "center" : type==="date-line" ? "right" : "left",
    src:          "",
    width:        "100%",
    caption:      "",
  };
  if (type==="stamp") {
    Object.assign(base, { stampSrc: "", stampSize: 160, align: "left" });
  }
  if (type==="payslip") {
    Object.assign(base, {
      period:"[Month] [Year]",
      earnings:   [{ id:mkId(), label:"Basic Salary", amount:"[Salary]" },{ id:mkId(), label:"House Rent Allowance", amount:"" },{ id:mkId(), label:"Medical Allowance", amount:"" },{ id:mkId(), label:"Transport Allowance", amount:"" }],
      deductions: [{ id:mkId(), label:"Income Tax", amount:"" },{ id:mkId(), label:"EOBI", amount:"" }],
      netPay:"[Salary]",
    });
  }
  return { ...base, ...overrides };
};

/* ─────────────────────────── PPTX Export ─────────────────────── */
const exportPPTX = async (blocks, templateName, company, theme, fontStack) => {
  const { default: pptxgen } = await import("pptxgenjs");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  const hex = (c) => c.replace("#","");

  // Title slide
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: hex(theme.headerBg) };
  if (company?.name) {
    titleSlide.addText(company.name, { x:0.5,y:1.2,w:12,h:1.2, fontSize:36, bold:true, color:hex(theme.headerText), fontFace:"Arial" });
  }
  titleSlide.addText(templateName || "Document", { x:0.5,y:2.8,w:12,h:0.8, fontSize:20, color:hex(theme.headerText)+"cc", fontFace:"Arial" });
  const today = new Date().toLocaleDateString("en-PK",{ day:"2-digit", month:"long", year:"numeric" });
  titleSlide.addText(today, { x:0.5,y:6.8,w:12,h:0.4, fontSize:11, color:hex(theme.headerText)+"99", align:"right", fontFace:"Arial" });

  // Content slide(s)
  let slide = pres.addSlide();
  slide.background = { color:"FFFFFF" };
  let y = 0.4;
  const PAGE_H = 7.0;

  const newSlide = () => {
    slide = pres.addSlide();
    slide.background = { color:"FFFFFF" };
    y = 0.4;
  };

  for (const block of blocks) {
    if (y > PAGE_H - 0.6) newSlide();

    if (block.type==="heading") {
      const fs = block.headingLevel==="h1"?28:block.headingLevel==="h3"?16:22;
      const h  = fs/72*1.6 + 0.1;
      slide.addText(block.content||"", { x:0.5,y,w:12,h, fontSize:fs, bold:true, color:hex(theme.primary), align:block.align||"left", fontFace:"Arial" });
      y += h + 0.1;
    } else if (block.type==="text"||block.type==="date-line") {
      const lines  = (block.content||"").split("\n").length;
      const h      = Math.max(0.3, lines * 0.22 + 0.1);
      slide.addText(block.content||"", { x:0.5,y,w:12,h, fontSize:11, color:"374151", align:block.align||"left", valign:"top", fontFace:"Arial" });
      y += h + 0.08;
    } else if (block.type==="callout") {
      const lines = (block.content||"").split("\n").length;
      const h     = Math.max(0.4, lines * 0.22 + 0.2);
      slide.addText(block.content||"", {
        x:0.5,y,w:12,h, fontSize:11, color:hex(theme.primary),
        fill:{ color: hex(theme.accent)+"1a" },
        line:{ color:hex(theme.accent), width:1, dashType:"solid" },
        inset:0.08, fontFace:"Arial",
      });
      y += h + 0.1;
    } else if (block.type==="divider") {
      slide.addShape(pres.ShapeType.line, { x:0.5,y,w:12,h:0, line:{ color:hex(theme.divider), width:1 } });
      y += 0.25;
    } else if (block.type==="signature") {
      if (block.signatureText) {
        slide.addText(block.signatureText, { x:0.5,y,w:5,h:0.55, fontSize:20, italic:true, color:"1a2e4a", fontFace:"Georgia" });
        y += 0.5;
      }
      slide.addShape(pres.ShapeType.line, { x:0.5,y,w:3.5,h:0, line:{ color:"333333", width:1 } });
      y += 0.12;
      slide.addText(block.label||"Authorized Signatory", { x:0.5,y,w:5,h:0.28, fontSize:10, bold:true, color:"374151", fontFace:"Arial" });
      y += 0.4;
    } else if (block.type==="image" && block.src) {
      try {
        const imgH = 2.5;
        const imgW = block.width==="25%"?3:block.width==="50%"?6:block.width==="75%"?9:12;
        const imgX = block.align==="center"?(13-imgW)/2:block.align==="right"?12.5-imgW:0.5;
        slide.addImage({ path:block.src, x:imgX,y,w:imgW,h:imgH });
        y += imgH + 0.1;
        if (block.caption) {
          slide.addText(block.caption, { x:0.5,y,w:12,h:0.25, fontSize:9, italic:true, color:"9ca3af", align:"center", fontFace:"Arial" });
          y += 0.3;
        }
      } catch { /* skip failed image */ }
    }

    if (y > PAGE_H - 0.6 && block!==blocks[blocks.length-1]) newSlide();
  }

  // Footer on every content slide
  pres.slides.slice(1).forEach(s => {
    if (company?.name) {
      s.addText(company.name, { x:0.5,y:7.1,w:12,h:0.3, fontSize:8, color:"9ca3af", align:"center", fontFace:"Arial" });
    }
  });

  await pres.writeFile({ fileName:`${templateName||"template"}.pptx` });
  toast.success("PPTX downloaded!");
};

/* ─────────────────────────── Sub-components ──────────────────── */
const AlignBtn = ({ cur, val, icon: Icon, onClick }) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick(val); }}
    className={`p-0.5 rounded transition-colors ${cur===val?"bg-blue-100 text-blue-700":"hover:bg-slate-100 text-slate-400"}`}
  >
    <Icon size={10} />
  </button>
);

const CanvasBlock = ({ block, isActive, isFirst, isLast, theme, onActivate, onChange, onRemove, onMoveUp, onMoveDown, onCursorChange, dragHandle }) => {
  const textareaRef = useRef(null);
  const autoResize  = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, []);
  useEffect(() => { autoResize(); }, [block.content, autoResize]);

  const alignClass = { left:"text-left", center:"text-center", right:"text-right" }[block.align||"left"] || "text-left";
  const trackCursor = e => onCursorChange({ start:e.target.selectionStart, end:e.target.selectionEnd });

  const renderContent = () => {
    switch (block.type) {

      case "heading": {
        const sz = block.headingLevel==="h1"?"text-[26px]":block.headingLevel==="h3"?"text-base":"text-xl";
        return (
          <div className="space-y-1.5">
            {isActive && (
              <div className="flex items-center gap-1 flex-wrap">
                {[["h1","H1 – Title"],["h2","H2 – Section"],["h3","H3 – Sub"]].map(([v,l])=>(
                  <button key={v} onMouseDown={e=>{e.preventDefault();onChange({headingLevel:v});}}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${block.headingLevel===v?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-500 border-slate-200 hover:border-blue-300"}`}
                  >{l}</button>
                ))}
                <div className="ml-2 flex gap-0.5">
                  <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v=>onChange({align:v})} />
                  <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v=>onChange({align:v})} />
                  <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v=>onChange({align:v})} />
                </div>
              </div>
            )}
            <input
              className={`w-full bg-transparent outline-none border-none font-bold tracking-tight ${sz} ${alignClass}`}
              style={{ color: theme.primary }}
              value={block.content}
              placeholder="Heading…"
              onChange={e=>onChange({content:e.target.value})}
              onFocus={onActivate}
              onSelect={trackCursor}
              onKeyUp={trackCursor}
            />
          </div>
        );
      }

      case "text":
        return (
          <div>
            {isActive && (
              <div className="flex items-center gap-0.5 mb-1">
                <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v=>onChange({align:v})} />
                <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v=>onChange({align:v})} />
                <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v=>onChange({align:v})} />
              </div>
            )}
            <textarea
              ref={textareaRef}
              className={`w-full bg-transparent outline-none resize-none border-none text-[13px] text-slate-700 leading-[1.75] overflow-hidden ${alignClass}`}
              value={block.content} placeholder="Type content…" rows={1}
              onChange={e=>{onChange({content:e.target.value});autoResize();}}
              onFocus={onActivate} onSelect={trackCursor} onKeyUp={trackCursor}
              style={{ minHeight:"1.75rem" }}
            />
          </div>
        );

      case "callout":
        return (
          <div
            style={{ borderLeftColor:theme.accent, backgroundColor:theme.accent+"18" }}
            className="border-l-4 rounded-r-lg px-4 py-3 my-1"
          >
            {isActive && (
              <div className="flex items-center gap-0.5 mb-1.5">
                <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v=>onChange({align:v})} />
                <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v=>onChange({align:v})} />
                <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v=>onChange({align:v})} />
              </div>
            )}
            <textarea
              ref={textareaRef}
              className={`w-full bg-transparent outline-none resize-none border-none text-[13px] leading-[1.7] overflow-hidden font-medium ${alignClass}`}
              value={block.content} placeholder="Callout text…" rows={1}
              onChange={e=>{onChange({content:e.target.value});autoResize();}}
              onFocus={onActivate} onSelect={trackCursor} onKeyUp={trackCursor}
              style={{ minHeight:"1.5rem", color: theme.primary }}
            />
          </div>
        );

      case "image":
        return (
          <div className="my-2">
            <div className={block.align==="center"?"flex justify-center":block.align==="right"?"flex justify-end":""}>
              {block.src ? (
                <img
                  src={block.src} alt={block.caption||""}
                  style={{ width:block.width||"100%", maxWidth:"100%", display:"block" }}
                  className="rounded object-contain"
                  onError={e=>{e.target.style.display="none";}}
                />
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center bg-slate-50 w-full">
                  <ImageIcon size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Paste image URL below to add image</p>
                </div>
              )}
            </div>
            {block.caption && !isActive && (
              <p className="text-[11px] text-slate-400 mt-1 italic text-center">{block.caption}</p>
            )}
            {isActive && (
              <div className="mt-3 space-y-2 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <input
                  className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-white"
                  value={block.src||""}
                  placeholder="https://example.com/image.jpg"
                  onChange={e=>onChange({src:e.target.value})}
                />
                <div className="flex items-center gap-2">
                  <select
                    className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white flex-1"
                    value={block.width||"100%"}
                    onChange={e=>onChange({width:e.target.value})}
                  >
                    <option value="25%">Small (25%)</option>
                    <option value="50%">Medium (50%)</option>
                    <option value="75%">Large (75%)</option>
                    <option value="100%">Full Width</option>
                  </select>
                  <div className="flex gap-0.5">
                    <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v=>onChange({align:v})} />
                    <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v=>onChange({align:v})} />
                    <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v=>onChange({align:v})} />
                  </div>
                </div>
                <input
                  className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-white"
                  value={block.caption||""}
                  placeholder="Caption (optional)"
                  onChange={e=>onChange({caption:e.target.value})}
                />
              </div>
            )}
          </div>
        );

      case "date-line":
        return (
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent outline-none resize-none border-none text-[13px] text-slate-700 text-right overflow-hidden"
            value={block.content} placeholder="Date: [Date]" rows={1}
            onChange={e=>{onChange({content:e.target.value});autoResize();}}
            onFocus={onActivate} onSelect={trackCursor} onKeyUp={trackCursor}
            style={{ minHeight:"1.5rem" }}
          />
        );

      case "divider":
        return <hr style={{ borderColor: theme.divider }} className="border-t-2 my-1" />;

      case "signature": {
        const selFontId  = block.signatureFont||SIG_FONTS[0].id;
        const selFontCss = SIG_FONTS.find(f=>f.id===selFontId)?.css||SIG_FONTS[0].css;
        const preview    = block.signatureText||"Signature";
        return (
          <div className="py-2 space-y-2">
            <div>
              <div style={{ fontFamily:selFontCss, fontSize:"28px", color:theme.primary, lineHeight:1.1, minHeight:"34px" }}>
                {block.signatureText||""}
              </div>
              <div className="w-44 border-b-2 mt-1 mb-1" style={{ borderColor: theme.primary }} />
              <input
                className="bg-transparent outline-none border-none text-[12px] font-semibold text-slate-700"
                value={block.label} placeholder="Signature label…"
                onChange={e=>onChange({label:e.target.value})} onFocus={onActivate}
              />
            </div>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 space-y-2" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <PenLine size={12} className="text-slate-400 shrink-0" />
                <input
                  className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-blue-400"
                  value={block.signatureText||""} placeholder="Type signature name here…"
                  onChange={e=>onChange({signatureText:e.target.value})} onFocus={onActivate}
                />
              </div>
              <div className="grid grid-cols-3 gap-1">
                {SIG_FONTS.map(font=>(
                  <button key={font.id}
                    onMouseDown={e=>{e.preventDefault();onChange({signatureFont:font.id});}}
                    className={`px-1.5 py-1.5 rounded-md border text-left transition-all ${selFontId===font.id?"border-blue-400 bg-blue-50 shadow-sm":"border-slate-200 bg-white hover:border-blue-200"}`}
                  >
                    <div style={{ fontFamily:font.css, fontSize:"15px", color:theme.primary, lineHeight:1.25, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                      {preview}
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5 truncate">{font.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "stamp": {
        const alignClass = block.align==="center" ? "mx-auto" : block.align==="right" ? "ml-auto" : "";
        return (
          <div className="py-2">
            {block.stampSrc ? (
              <div className={`flex ${block.align==="center"?"justify-center":block.align==="right"?"justify-end":"justify-start"}`}>
                <img src={block.stampSrc} alt="stamp" style={{ width: block.stampSize||160, height: block.stampSize||160, objectFit:"contain" }}/>
              </div>
            ) : (
              <div className={`flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-300 text-xs font-medium ${alignClass}`} style={{ width:160, height:160 }}>
                <div className="text-center"><Fingerprint size={28} className="mx-auto mb-1 opacity-40"/><p>No stamp yet</p><p className="text-[10px]">Use Stamp tab to add</p></div>
              </div>
            )}
          </div>
        );
      }

      case "payslip": {
        const updateRow = (section,rowId,field,val) => onChange({ [section]:block[section].map(r=>r.id===rowId?{...r,[field]:val}:r) });
        const removeRow = (section,rowId) => onChange({ [section]:block[section].filter(r=>r.id!==rowId) });
        const addRow    = (section) => onChange({ [section]:[...(block[section]||[]),{id:mkId(),label:"",amount:""}] });

        const RowTable = ({ section, accentHead, accentBtn }) => (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider ${accentHead}`}>{section==="earnings"?"Earnings":"Deductions"}</p>
              {isActive && <button onMouseDown={e=>{e.preventDefault();addRow(section);}} className={`text-[10px] font-semibold ${accentBtn}`}>+ Add Row</button>}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left font-semibold text-slate-400 pb-1">Description</th>
                  <th className="text-right font-semibold text-slate-400 pb-1 w-28">Amount (PKR)</th>
                  {isActive && <th className="w-5" />}
                </tr>
              </thead>
              <tbody>
                {(block[section]||[]).map(row=>(
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1 pr-2">
                      <input className="bg-transparent outline-none w-full text-slate-700" value={row.label}
                        onChange={e=>updateRow(section,row.id,"label",e.target.value)} onFocus={onActivate} placeholder="Description…" />
                    </td>
                    <td className="py-1">
                      <input className="bg-transparent outline-none text-right text-slate-700 w-full" value={row.amount}
                        onChange={e=>updateRow(section,row.id,"amount",e.target.value)} onFocus={onActivate} placeholder="0.00" />
                    </td>
                    {isActive && (
                      <td className="py-1 text-center">
                        <button onMouseDown={e=>{e.preventDefault();removeRow(section,row.id);}} className="text-slate-300 hover:text-red-400">
                          <Trash2 size={10} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        return (
          <div className="border border-slate-200 rounded-xl overflow-hidden" style={{ fontFamily:"sans-serif" }}>
            <div className="text-white px-4 py-3 flex items-center justify-between" style={{ background:theme.headerBg }}>
              <span className="text-[11px] font-extrabold uppercase tracking-widest">Salary Slip</span>
              <div className="flex items-center gap-2 text-xs" style={{ color:theme.headerText+"bb" }}>
                <span>Pay Period:</span>
                <input
                  className="bg-transparent outline-none font-semibold border-b border-white/30 placeholder-white/40 w-28 text-xs"
                  style={{ color:theme.headerText }}
                  value={block.period||""} onChange={e=>onChange({period:e.target.value})} onFocus={onActivate} placeholder="[Month] [Year]"
                />
              </div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {[["Employee","[Employee Name]"],["Employee ID","[Employee ID]"],["Designation","[Designation]"],["Department","[Department]"],["Join Date","[Join Date]"],["Company","[Company Name]"]].map(([l,v])=>(
                  <div key={l} className="flex gap-2 text-[11px]">
                    <span className="text-slate-400 font-semibold w-20 shrink-0">{l}</span>
                    <span className="text-slate-500 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <RowTable section="earnings"   accentHead="text-emerald-700" accentBtn="text-emerald-600 hover:text-emerald-800" />
            <div className="border-t border-slate-100">
              <RowTable section="deductions" accentHead="text-red-600" accentBtn="text-red-500 hover:text-red-700" />
            </div>
            <div className="text-white px-4 py-3 flex items-center justify-between border-t border-white/10" style={{ background:theme.headerBg }}>
              <span className="text-[11px] font-extrabold uppercase tracking-widest">Net Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color:theme.headerText+"99" }}>PKR</span>
                <input
                  className="bg-transparent outline-none text-right text-base font-extrabold w-32"
                  style={{ color:theme.headerText }}
                  value={block.netPay||""} onChange={e=>onChange({netPay:e.target.value})} onFocus={onActivate} placeholder="[Salary]"
                />
              </div>
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div
      className={`relative group py-1.5 px-3 -mx-3 rounded-lg transition-all ${isActive?"bg-blue-50/60 ring-1 ring-blue-300 ring-offset-1":"hover:bg-slate-50/60"}`}
      onClick={onActivate}
    >
      {/* Floating toolbar */}
      <div className={`absolute -top-7 right-0 z-20 flex items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-sm px-1 py-0.5 transition-opacity ${isActive?"opacity-100 pointer-events-auto":"opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"}`}>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-0.5">{block.type}</span>
        <div className="w-px h-3 bg-slate-200 mx-0.5" />
        <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();onMoveUp();}}   disabled={isFirst} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronUp size={11} /></button>
        <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();onMoveDown();}} disabled={isLast}  className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronDown size={11} /></button>
        <div className="w-px h-3 bg-slate-200 mx-0.5" />
        <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();onRemove();}} className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
      </div>
      {/* Drag handle — shown on hover on the left */}
      {dragHandle && (
        <div
          {...dragHandle}
          className="absolute left-[-22px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical size={14}/>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

/* ─── Sortable wrapper for CanvasBlock ─── */
function SortableCanvasBlock(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    position: "relative",
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <CanvasBlock {...props} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

/* ─────────────────────────── Main Page ───────────────────────── */
export default function TemplatePage() {
  const { templateid } = useParams();
  const router = useRouter();

  const [template,      setTemplate]      = useState(null);
  const [templateName,  setTemplateName]  = useState("Untitled Template");
  const [blocks,        setBlocks]        = useState([]);
  const [activeId,      setActiveId]      = useState(null);
  const [cursor,        setCursor]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [showPresets,      setShowPresets]      = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [sidebarTab,    setSidebarTab]    = useState("elements");
  const [activeTheme,   setActiveTheme]   = useState(DEFAULT_THEME);
  const [fontStack,     setFontStack]     = useState(DEFAULT_FONT);
  const [exportOpen,    setExportOpen]    = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const exportRef = useRef(null);

  /* Google Fonts for signatures */
  useEffect(() => {
    const link     = document.createElement("link");
    link.rel       = "stylesheet";
    link.href      = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  /* Close export dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { fetchTemplate(); }, []);

  const fetchTemplate = async () => {
    try {
      const res = await axios.get(`/api/templates/${templateid}`);
      if (res.data.success) {
        const t = res.data.template;
        setTemplate(t);
        setTemplateName(t.templateName || "Untitled Template");
        const saved = t.fields || [];
        setBlocks(saved.map(f => ({ ...f, id:f.id||mkId() })));
        if (t.theme) {
          const found = THEMES.find(th => th.id === t.theme.id);
          setActiveTheme(found || t.theme || DEFAULT_THEME);
        }
        if (t.fontStack && typeof t.fontStack === "object") {
          const found = FONT_STACKS.find(f => f.id === t.fontStack.id);
          // FIX: guard against null/corrupt fontStack — always fall back to DEFAULT_FONT
          setFontStack(found || (t.fontStack.css ? t.fontStack : DEFAULT_FONT));
        }
        if (!saved.length) setShowPresets(true);
      }
    } catch { toast.error("Failed to load template"); }
    finally   { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/templates/${templateid}`, { templateName, fields:blocks, theme:activeTheme, fontStack });
      toast.success("Template saved!");
    } catch { toast.error("Failed to save template"); }
    finally   { setSaving(false); }
  };

  const applyPreset = (key) => {
    const preset = ALL_PRESETS[key];
    if (!preset) return;
    setBlocks(preset.blocks.map(b => {
      const block = { ...makeBlock(b.type), ...b, id:mkId() };
      if (b.type==="payslip") {
        block.earnings   = (b.earnings||[]).map(r=>({...r,id:mkId()}));
        block.deductions = (b.deductions||[]).map(r=>({...r,id:mkId()}));
      }
      return block;
    }));
    setTemplateName(p => (p==="Untitled Template"||!p) ? preset.name : p);
    setShowPresets(false);
    setPresetDialogOpen(false);
    toast.success(`${preset.name} loaded`);
  };

  const addBlock    = (type)     => { const b = makeBlock(type); setBlocks(p=>[...p,b]); setActiveId(b.id); };
  const updateBlock = (id, upd)  => setBlocks(p=>p.map(b=>b.id===id?{...b,...upd}:b));
  const removeBlock = (id)       => { setBlocks(p=>p.filter(b=>b.id!==id)); setActiveId(p=>p===id?null:p); };
  const moveBlock   = (id, dir)  => setBlocks(prev=>{
    const idx = prev.findIndex(b=>b.id===id);
    if ((dir<0&&idx===0)||(dir>0&&idx===prev.length-1)) return prev;
    const arr = [...prev]; [arr[idx],arr[idx+dir]] = [arr[idx+dir],arr[idx]]; return arr;
  });

  const [draggingId, setDraggingId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const handleDragStart = ({ active }) => setDraggingId(active.id);
  const handleDragEnd   = ({ active, over }) => {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIdx = prev.findIndex(b => b.id === active.id);
      const newIdx = prev.findIndex(b => b.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const insertShortcode = (code) => {
    if (!activeId) return;
    const snippet = `[${code}]`;
    setBlocks(prev=>prev.map(b=>{
      if (b.id!==activeId) return b;
      if (!["text","heading","date-line","callout"].includes(b.type)) return b;
      const text = b.content||"";
      const s = cursor?.start??text.length;
      const e = cursor?.end??s;
      const newContent = text.slice(0,s)+snippet+text.slice(e);
      setCursor({start:s+snippet.length,end:s+snippet.length});
      return {...b, content:newContent};
    }));
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportPPTX = async () => {
    setExporting(true);
    setExportOpen(false);
    try {
      await exportPPTX(blocks, templateName, template?.company, activeTheme, fontStack);
    } catch (err) {
      toast.error("PPTX export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const activeBlock = blocks.find(b=>b.id===activeId);
  const canInsert   = activeBlock && ["text","heading","date-line","callout"].includes(activeBlock.type);
  const shortcodes  = (template?.role==="Admin"||template?.role==="Contract") ? SHORTCODES.Admin : SHORTCODES.Employee;
  const logoSrc     = template?.company?.companylogo || template?.company?.companyLogo;
  const company     = template?.company;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f3f5]">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <>
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-canvas, #print-canvas * { visibility: visible !important; }
          #print-canvas { position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; box-shadow: none !important; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      <div className="min-h-screen bg-[#f1f3f5] flex flex-col">

        {/* ── Top bar ── */}
        <div className="h-[52px] bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-50 shadow-sm shrink-0">
          <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft size={17} />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <input
            value={templateName}
            onChange={e=>setTemplateName(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-transparent outline-none border-none min-w-0 w-56"
            placeholder="Template name…"
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={()=>setShowPresets(p=>!p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showPresets?"bg-violet-600 text-white border-violet-600":"bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700"}`}
            >
              <Wand2 size={13} /> Quick Start
            </button>

            {/* Export dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={()=>setExportOpen(p=>!p)}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-slate-600 border-slate-200 hover:border-slate-300 transition-colors"
              >
                {exporting ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={13} />}
                Export
                <ChevronDown size={11} className={`transition-transform ${exportOpen?"rotate-180":""}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg w-44 z-50 overflow-hidden">
                  <button
                    onClick={()=>{ setExportOpen(false); handlePrintPDF(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <FileDown size={13} className="text-red-500" /> Export / Print PDF
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={handleExportPPTX}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Layers size={13} className="text-orange-500" /> Export PPTX
                  </button>
                </div>
              )}
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full hidden sm:block ${(template?.role==="Admin"||template?.role==="Contract")?"bg-violet-100 text-violet-700":"bg-blue-100 text-blue-700"}`}>
              {(template?.role==="Admin"||template?.role==="Contract")?"Contract":"Employee Letter"}
            </span>

            <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
              {saving ? <><Loader2 size={13} className="animate-spin mr-1.5" />Saving…</> : <><Save size={13} className="mr-1.5" />Save</>}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Left sidebar ── */}
          <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
            {/* Sidebar tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
              {[
                { id:"elements", icon:Layers,      label:"Elements"  },
                { id:"design",   icon:Palette,     label:"Design"    },
                { id:"stamp",    icon:Fingerprint, label:"Stamp"     },
                { id:"vars",     icon:Tag,         label:"Variables" },
              ].map(tab=>(
                <button
                  key={tab.id}
                  onClick={()=>setSidebarTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-semibold transition-colors border-b-2 ${sidebarTab===tab.id?"border-blue-500 text-blue-600":"border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

              {/* ── Elements tab ── */}
              {sidebarTab==="elements" && (
                <div>
                  {/* Quick-start presets */}
                  {showPresets && (
                    <div className="px-3 pt-4 pb-3 bg-violet-50 border-b border-violet-200">
                      <p className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest mb-2">
                        {(template?.role==="Admin"||template?.role==="Contract")?"Contract Presets":"Letter Presets"}
                      </p>
                      <div className="space-y-1">
                        {Object.entries((template?.role==="Admin"||template?.role==="Contract")?CONTRACT_PRESETS:EMPLOYEE_PRESETS).map(([key,p])=>(
                          <button
                            key={key} onClick={()=>applyPreset(key)}
                            className="w-full text-left px-2.5 py-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 text-slate-700 text-xs font-semibold transition-colors"
                          >{p.name}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-3 pt-4 pb-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Add Element</p>
                    <div className="space-y-0.5">
                      {ELEMENT_TYPES.map(({ type, label, icon:Icon, desc })=>(
                        <button
                          key={type} onClick={()=>addBlock(type)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-left transition-colors group"
                        >
                          <Icon size={14} className="shrink-0 text-slate-400 group-hover:text-blue-500" />
                          <div>
                            <p className="text-xs font-semibold leading-tight">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Design tab ── */}
              {sidebarTab==="design" && (
                <div className="p-3 space-y-5">
                  {/* Themes */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Color Theme</p>
                    <div className="grid grid-cols-2 gap-2">
                      {THEMES.map(t=>(
                        <button
                          key={t.id}
                          onClick={()=>setActiveTheme(t)}
                          className={`rounded-xl overflow-hidden border-2 transition-all ${activeTheme.id===t.id?"border-blue-500 shadow-md scale-[1.02]":"border-transparent hover:border-slate-200"}`}
                        >
                          {/* Header preview */}
                          <div style={{ background:t.headerBg, height:28 }} className="relative overflow-hidden">
                            <div style={{ background:t.strip, height:4, width:"40%", opacity:0.6, position:"absolute", bottom:0, left:0 }} />
                          </div>
                          {/* Content preview */}
                          <div className="bg-white px-2 py-2">
                            <div className="flex gap-1 mb-1.5">
                              <div style={{ background:t.primary, height:3, width:"55%", borderRadius:2 }} />
                              <div style={{ background:t.accent, height:3, width:"25%", borderRadius:2 }} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="bg-slate-100 h-1.5 rounded" style={{ width:"90%" }} />
                              <div className="bg-slate-100 h-1.5 rounded" style={{ width:"70%" }} />
                            </div>
                            <p className="text-[9px] font-semibold mt-1.5 truncate" style={{ color:t.primary }}>{t.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Font Style</p>
                    <div className="space-y-1.5">
                      {FONT_STACKS.map(f=>(
                        <button
                          key={f.id}
                          onClick={()=>setFontStack(f)}
                          className={`w-full px-3 py-2.5 rounded-lg border text-left transition-all ${fontStack.id===f.id?"border-blue-400 bg-blue-50 shadow-sm":"border-slate-200 hover:border-blue-200 bg-white"}`}
                        >
                          <span style={{ fontFamily:f.css }} className="text-sm text-slate-800 font-medium">Aa — {f.name}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily:f.css }}>The quick brown fox</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Variables tab ── */}
              {/* ── Stamp tab ── */}
              {sidebarTab==="stamp" && (
                <StampPanel
                  company={company}
                  onInsert={(url, size) => {
                    const b = makeBlock("stamp");
                    b.stampSrc  = url;
                    b.stampSize = Math.min(size, 200);
                    setBlocks(p => [...p, b]);
                    setActiveId(b.id);
                    toast.success("Stamp added to letter!");
                  }}
                />
              )}

              {sidebarTab==="vars" && (
                <div className="px-3 pt-4 pb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag size={11} className="text-slate-400" />
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Variables</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3 leading-4">Click a variable to insert it at the cursor position in the selected block.</p>
                  {!canInsert ? (
                    <p className="text-[10px] text-slate-300 italic">Select a text, heading, callout, or date block first</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {shortcodes.map(code=>(
                        <button
                          key={code}
                          onMouseDown={e=>{e.preventDefault();insertShortcode(code);}}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >[{code}]</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ── Canvas ── */}
          <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-10">
            <div className="mx-auto max-w-[794px]">
              <div
                id="print-canvas"
                className="bg-white shadow-[0_4px_40px_rgba(0,0,0,0.10)] min-h-[1123px] rounded-sm overflow-hidden flex flex-col"
                style={{ fontFamily: fontStack.css }}
                onClick={e=>{ if (e.target===e.currentTarget) setActiveId(null); }}
              >
                {/* ── Theme color strip ── */}
                <div style={{ background: activeTheme.headerBg, height: 8 }} />

                {/* ── Company Header ── */}
                {company ? (
                  <div className="px-14 pt-8 pb-0">
                    <div className="flex items-start justify-between pb-4 mb-2" style={{ borderBottom:`2px solid ${activeTheme.divider}` }}>
                      <div className="flex items-start gap-3">
                        {logoSrc ? (
                          <img src={logoSrc} alt={company.name} className="h-12 object-contain shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-slate-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-extrabold text-slate-900 leading-tight" style={{ fontFamily:"sans-serif", color:activeTheme.primary }}>{company.name}</p>
                          {company.companyAddress && <p className="text-[11px] text-slate-500">{company.companyAddress}</p>}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 leading-5" style={{ fontFamily:"sans-serif" }}>
                        {company.companyPhoneNumber && <p>{company.companyPhoneNumber}</p>}
                        {(company.companyEmail||company.companyemail) && <p>{company.companyEmail||company.companyemail}</p>}
                        {company.companyWebsite && <p>{company.companyWebsite.replace(/^https?:\/\/(www\.)?/,"")}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-14 pt-8 pb-0">
                    <div className="pb-4 mb-2" style={{ borderBottom:`2px solid ${activeTheme.divider}` }}>
                      <p className="text-xs text-slate-300 italic" style={{ fontFamily:"sans-serif" }}>Company header will appear here</p>
                    </div>
                  </div>
                )}

                {/* ── Body blocks ── */}
                <div className="px-14 py-8 flex-1">
                  {blocks.length===0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4" onClick={e=>e.stopPropagation()}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:activeTheme.accent+"20" }}>
                        <Type size={22} style={{ color:activeTheme.accent }} />
                      </div>
                      <p className="text-sm font-medium text-slate-300">Canvas is empty</p>
                      <p className="text-xs text-slate-200">Use Quick Start to load a template, or add elements manually</p>
                      <button
                        onClick={()=>setPresetDialogOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-colors"
                        style={{ background:activeTheme.primary }}
                      >
                        <Wand2 size={13} /> Choose Template
                      </button>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={blocks.map(b=>b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-0.5">
                          {(() => {
                            const rows = [];
                            let i = 0;
                            while (i < blocks.length) {
                              if (blocks[i].type === "signature") {
                                const grp = [];
                                while (i < blocks.length && blocks[i].type === "signature") {
                                  grp.push({ block: blocks[i], idx: i }); i++;
                                }
                                rows.push({ kind: "sig", grp });
                              } else {
                                rows.push({ kind: "single", block: blocks[i], idx: i }); i++;
                              }
                            }
                            return rows.map((row, ri) => {
                              if (row.kind === "sig") {
                                return (
                                  <div key={ri} className={`flex gap-6 ${row.grp.length > 1 ? "justify-between" : ""}`}>
                                    {row.grp.map(({ block, idx }) => (
                                      <div key={block.id} className={row.grp.length > 1 ? "flex-1" : "w-full"}>
                                        <SortableCanvasBlock
                                          block={block}
                                          isActive={activeId===block.id}
                                          isFirst={idx===0}
                                          isLast={idx===blocks.length-1}
                                          theme={activeTheme}
                                          onActivate={()=>setActiveId(block.id)}
                                          onChange={upd=>updateBlock(block.id,upd)}
                                          onRemove={()=>removeBlock(block.id)}
                                          onMoveUp={()=>moveBlock(block.id,-1)}
                                          onMoveDown={()=>moveBlock(block.id,1)}
                                          onCursorChange={setCursor}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return (
                                <SortableCanvasBlock
                                  key={row.block.id}
                                  block={row.block}
                                  isActive={activeId===row.block.id}
                                  isFirst={row.idx===0}
                                  isLast={row.idx===blocks.length-1}
                                  theme={activeTheme}
                                  onActivate={()=>setActiveId(row.block.id)}
                                  onChange={upd=>updateBlock(row.block.id,upd)}
                                  onRemove={()=>removeBlock(row.block.id)}
                                  onMoveUp={()=>moveBlock(row.block.id,-1)}
                                  onMoveDown={()=>moveBlock(row.block.id,1)}
                                  onCursorChange={setCursor}
                                />
                              );
                            });
                          })()}
                        </div>
                      </SortableContext>
                      <DragOverlay>
                        {draggingId ? (
                          <div className="bg-white border-2 border-blue-400 rounded-lg px-3 py-2 shadow-xl opacity-90 text-xs font-semibold text-blue-600">
                            Moving block…
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </div>

                {/* ── Footer + Bottom strip — always at page bottom ── */}
                <div className="mt-auto">
                  {company && (
                    <div className="px-14 pb-8">
                      <div className="pt-4 text-center" style={{ borderTop:`1px solid ${activeTheme.divider}66`, fontFamily:"sans-serif" }}>
                        {company.companyAddress && (
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{company.companyAddress}</p>
                        )}
                        {company.companyWebsite && (
                          <p className="text-[10px] text-slate-400">{company.companyWebsite.replace(/^https?:\/\/(www\.)?/,"")}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div style={{ background: activeTheme.headerBg, height: 4 }} />
                </div>
              </div>

              {/* Quick add row */}
              <div className="flex justify-center mt-4 gap-2 flex-wrap">
                {ELEMENT_TYPES.map(({ type, label, icon:Icon })=>(
                  <button
                    key={type} onClick={()=>addBlock(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    <Icon size={12} />{label}
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* ── Preset Picker Dialog ── */}
      {presetDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={()=>setPresetDialogOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e=>e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-base font-extrabold text-slate-900">Choose a Template</p>
                <p className="text-xs text-slate-400 mt-0.5">Select a preset to load its default content</p>
              </div>
              <button
                onClick={()=>setPresetDialogOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto p-5">
              <p className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest mb-3">
                {(template?.role==="Admin"||template?.role==="Contract") ? "Contract Templates" : "Letter Templates"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries((template?.role==="Admin"||template?.role==="Contract") ? CONTRACT_PRESETS : EMPLOYEE_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={()=>applyPreset(key)}
                    className="group flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 transition-all text-left"
                  >
                    {/* Color strip preview */}
                    <div className="w-full h-1.5 rounded-full" style={{ background: activeTheme.primary }} />
                    <div className="w-3/4 h-1 rounded-full bg-slate-200" />
                    <div className="w-1/2 h-1 rounded-full bg-slate-200 mb-1" />
                    <p className="text-xs font-bold text-slate-700 group-hover:text-violet-700 leading-snug">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.blocks.length} elements</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
