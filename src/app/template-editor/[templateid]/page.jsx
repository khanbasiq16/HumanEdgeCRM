"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Heading1, AlignLeft, AlignCenter, AlignRight, Minus, PenLine,
  Calendar, Loader2, Building2, Tag, Type, Wand2, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ──────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────── */

const SHORTCODES = {
  Employee: [
    "Employee Name", "Employee ID", "Designation", "Department",
    "Join Date", "Salary", "Company Name", "Date",
    "From Date", "To Date", "Duration", "Month", "Year",
  ],
  Admin: [
    "Client Name", "Client Address", "Client Email", "Client Phone",
    "Company Name", "Contract Date", "Date",
  ],
};

const mkId = () => uuidv4();

const EMPLOYEE_PRESETS = {
  appreciation: {
    name: "Appreciation Letter",
    blocks: [
      { type: "heading", content: "Letter of Appreciation for Outstanding Performance", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "Dear [Employee Name],", align: "left" },
      { type: "text", content: "We are pleased to formally acknowledge and appreciate your exceptional performance and dedication towards your role at [Company Name]. Your consistent efforts, commitment to excellence, and ability to deliver results have significantly contributed to the growth and success of the organization.", align: "left" },
      { type: "text", content: "Your professionalism, work ethic, and positive attitude set a strong example for your peers and reflect the core values of our organization. The management recognizes your contributions and values the impact you have made within your department.", align: "left" },
      { type: "text", content: "We look forward to your continued success and contributions to [Company Name], and we are confident that you will achieve even greater milestones in the future.", align: "left" },
      { type: "text", content: "Once again, thank you for your dedication and excellent performance.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  offer: {
    name: "Offer Letter",
    blocks: [
      { type: "heading", content: "Letter of Appointment", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "Dear [Employee Name],", align: "left" },
      { type: "text", content: "We are pleased to offer you the position of [Designation] in the [Department] department at [Company Name]. This offer is contingent upon successful completion of our pre-employment requirements.", align: "left" },
      { type: "text", content: "Your joining date will be [Join Date] and your monthly compensation will be PKR [Salary].", align: "left" },
      { type: "text", content: "We look forward to welcoming you to our team and trust that you will prove to be a valuable asset to the organization.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  joining: {
    name: "Joining Letter",
    blocks: [
      { type: "heading", content: "Welcome Letter", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "Dear [Employee Name],", align: "left" },
      { type: "text", content: "On behalf of the entire team at [Company Name], we are delighted to welcome you as [Designation] in the [Department] department. Your joining date is [Join Date].", align: "left" },
      { type: "text", content: "We are confident that your skills and experience will be a valuable asset to our organization. Please feel free to reach out if you need any assistance during your onboarding.", align: "left" },
      { type: "text", content: "Welcome aboard!", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  experience: {
    name: "Experience Letter",
    blocks: [
      { type: "heading", content: "Experience Certificate", headingLevel: "h2", align: "center" },
      { type: "heading", content: "To Whom It May Concern", headingLevel: "h3", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "This is to certify that [Employee Name] (Employee ID: [Employee ID]) has worked with [Company Name] as [Designation] in the [Department] department from [From Date] to [To Date].", align: "left" },
      { type: "text", content: "During this period, [Employee Name] demonstrated professionalism, dedication, and excellent work performance. We wish them the best in their future endeavors.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  internship: {
    name: "Internship Certificate",
    blocks: [
      { type: "heading", content: "Internship Completion Certificate", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "This is to certify that [Employee Name] has successfully completed an internship at [Company Name] as [Designation] in the [Department] department for a duration of [Duration].", align: "left" },
      { type: "text", content: "During the internship period, [Employee Name] showed great enthusiasm, dedication, and a keen desire to learn. We commend their hard work and wish them continued success in their career.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  warning: {
    name: "Warning Letter",
    blocks: [
      { type: "heading", content: "Warning Letter", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "Dear [Employee Name],", align: "left" },
      { type: "text", content: "This letter serves as a formal warning regarding your recent conduct and performance. It has come to our attention that there have been issues that require immediate attention and improvement.", align: "left" },
      { type: "text", content: "We expect immediate improvement in the mentioned areas. Failure to improve may result in further disciplinary action, up to and including termination of employment.", align: "left" },
      { type: "text", content: "Please acknowledge receipt of this letter by signing below.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
      { type: "signature", label: "Employee Signature & Date" },
    ],
  },
  termination: {
    name: "Termination Letter",
    blocks: [
      { type: "heading", content: "Letter of Termination", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Date]" },
      { type: "text", content: "Dear [Employee Name],", align: "left" },
      { type: "text", content: "We regret to inform you that your employment with [Company Name] as [Designation] in the [Department] department is hereby terminated effective [Date].", align: "left" },
      { type: "text", content: "This decision has been made after careful consideration and is final. You are required to return all company property, including access cards, equipment, and confidential documents, on or before your last working day.", align: "left" },
      { type: "text", content: "Your final settlement, including any outstanding dues and entitlements, will be processed in accordance with company policy and applicable labor laws.", align: "left" },
      { type: "text", content: "We wish you the best in your future endeavors.", align: "left" },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
  payslip: {
    name: "Payslip / Salary Slip",
    blocks: [
      { type: "heading", content: "Salary Slip", headingLevel: "h2", align: "center" },
      {
        type: "payslip",
        period: "[Month] [Year]",
        earnings: [
          { id: "pe1", label: "Basic Salary",             amount: "[Salary]" },
          { id: "pe2", label: "House Rent Allowance",     amount: "" },
          { id: "pe3", label: "Medical Allowance",        amount: "" },
          { id: "pe4", label: "Transport Allowance",      amount: "" },
        ],
        deductions: [
          { id: "pd1", label: "Income Tax",               amount: "" },
          { id: "pd2", label: "EOBI",                     amount: "" },
          { id: "pd3", label: "Other Deductions",         amount: "" },
        ],
        netPay: "[Salary]",
      },
      { type: "signature", label: "Authorized Signatory" },
    ],
  },
};

const CONTRACT_PRESETS = {
  nda: {
    name: "Non-Disclosure Agreement",
    blocks: [
      { type: "heading", content: "Non-Disclosure Agreement", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Contract Date]" },
      { type: "text", content: "This Non-Disclosure Agreement (\"Agreement\") is entered into as of [Contract Date] between [Company Name] (\"Disclosing Party\") and [Client Name], located at [Client Address] (\"Receiving Party\").", align: "left" },
      { type: "text", content: "1. CONFIDENTIAL INFORMATION\nThe Receiving Party agrees to keep confidential all non-public, proprietary, or confidential information disclosed by the Disclosing Party, including but not limited to business plans, strategies, technical data, and trade secrets.", align: "left" },
      { type: "text", content: "2. OBLIGATIONS\nThe Receiving Party shall: (a) use the Confidential Information solely for evaluating a potential business relationship; (b) not disclose the Confidential Information to any third party; (c) protect the Confidential Information with the same degree of care used for its own confidential information.", align: "left" },
      { type: "text", content: "3. TERM\nThis Agreement shall remain in effect for a period of two (2) years from the date first written above.", align: "left" },
      { type: "text", content: "4. GOVERNING LAW\nThis Agreement shall be governed by and construed in accordance with applicable laws.", align: "left" },
      { type: "divider" },
      { type: "signature", label: "[Company Name] — Authorized Signatory" },
      { type: "signature", label: "[Client Name] — Representative" },
    ],
  },
  proposal: {
    name: "Business Proposal",
    blocks: [
      { type: "heading", content: "Business Proposal", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Contract Date]" },
      { type: "text", content: "Prepared for: [Client Name]\nAddress: [Client Address]\nEmail: [Client Email]", align: "left" },
      { type: "text", content: "Dear [Client Name],", align: "left" },
      { type: "text", content: "We are pleased to present this business proposal outlining the services and solutions that [Company Name] can offer to your organization. We believe our expertise and experience make us the ideal partner for your needs.", align: "left" },
      { type: "heading", content: "Scope of Work", headingLevel: "h3", align: "left" },
      { type: "text", content: "We propose to provide the following services as mutually agreed upon. All deliverables will be completed in accordance with the timeline and specifications agreed upon by both parties.", align: "left" },
      { type: "heading", content: "Investment & Timeline", headingLevel: "h3", align: "left" },
      { type: "text", content: "The total investment for the proposed services is subject to mutual agreement. The project is expected to commence upon signing and proceed as per the agreed milestones.", align: "left" },
      { type: "heading", content: "Why Choose Us", headingLevel: "h3", align: "left" },
      { type: "text", content: "We are committed to delivering quality, reliability, and value. Our team brings extensive experience and a client-first approach to every engagement.", align: "left" },
      { type: "text", content: "We look forward to the opportunity to work with [Client Name] and are confident this partnership will yield significant value for both parties.", align: "left" },
      { type: "divider" },
      { type: "signature", label: "[Company Name] — Authorized Signatory" },
    ],
  },
  service: {
    name: "Service Agreement",
    blocks: [
      { type: "heading", content: "Service Agreement", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Contract Date]" },
      { type: "text", content: "This Service Agreement is entered into as of [Contract Date] between [Company Name] (\"Service Provider\") and [Client Name], located at [Client Address] (\"Client\").", align: "left" },
      { type: "text", content: "1. SERVICES\nThe Service Provider agrees to provide services as mutually agreed upon by both parties. All services will be delivered professionally and in a timely manner.", align: "left" },
      { type: "text", content: "2. PAYMENT\nThe Client agrees to pay the Service Provider as per the agreed payment schedule. All payments are due within 30 days of invoice.", align: "left" },
      { type: "text", content: "3. TERM\nThis Agreement shall commence on [Contract Date] and shall continue until the services are completed, unless terminated by either party with 30 days written notice.", align: "left" },
      { type: "text", content: "4. CONFIDENTIALITY\nBoth parties agree to keep all business information exchanged during this agreement strictly confidential.", align: "left" },
      { type: "text", content: "5. LIMITATION OF LIABILITY\nThe Service Provider's liability under this Agreement shall be limited to the fees paid by the Client in the preceding 3 months.", align: "left" },
      { type: "divider" },
      { type: "signature", label: "[Company Name] — Authorized Signatory" },
      { type: "signature", label: "[Client Name] — Authorized Representative" },
    ],
  },
  consulting: {
    name: "Consulting Agreement",
    blocks: [
      { type: "heading", content: "Consulting Agreement", headingLevel: "h2", align: "center" },
      { type: "date-line", content: "Date: [Contract Date]" },
      { type: "text", content: "This Consulting Agreement is made as of [Contract Date] between [Company Name] (\"Consultant\") and [Client Name], located at [Client Address] (\"Client\").", align: "left" },
      { type: "text", content: "1. CONSULTING SERVICES\nThe Consultant shall provide professional consulting services as agreed upon. The scope, deliverables, and timeline will be defined in project briefs mutually agreed upon by both parties.", align: "left" },
      { type: "text", content: "2. COMPENSATION\nThe Client shall compensate the Consultant as per the agreed fee structure. Invoices will be issued on a monthly/per-project basis and are payable within 15 business days.", align: "left" },
      { type: "text", content: "3. INDEPENDENT CONTRACTOR\nThe Consultant is an independent contractor. Nothing in this Agreement shall be interpreted as creating an employment, partnership, or joint venture relationship.", align: "left" },
      { type: "text", content: "4. INTELLECTUAL PROPERTY\nAll work product created under this Agreement shall become the property of the Client upon full payment of fees.", align: "left" },
      { type: "text", content: "5. TERM AND TERMINATION\nThis Agreement shall begin on [Contract Date] and may be terminated by either party with 30 days written notice.", align: "left" },
      { type: "divider" },
      { type: "signature", label: "[Company Name] — Consultant" },
      { type: "signature", label: "[Client Name] — Client Representative" },
    ],
  },
};

const ALL_PRESETS = { ...EMPLOYEE_PRESETS, ...CONTRACT_PRESETS };

const SIG_FONTS = [
  { id: "dancing",  name: "Dancing Script", css: "'Dancing Script', cursive" },
  { id: "great",    name: "Great Vibes",    css: "'Great Vibes', cursive"    },
  { id: "pacifico", name: "Pacifico",       css: "'Pacifico', cursive"       },
  { id: "satisfy",  name: "Satisfy",        css: "'Satisfy', cursive"        },
  { id: "caveat",   name: "Caveat",         css: "'Caveat', cursive"         },
];

const ELEMENT_TYPES = [
  { type: "heading",   label: "Heading",    icon: Heading1,  desc: "Title / section header" },
  { type: "text",      label: "Paragraph",  icon: AlignLeft, desc: "Body text paragraph"    },
  { type: "date-line", label: "Date Line",  icon: Calendar,  desc: "Right-aligned date"     },
  { type: "divider",   label: "Divider",    icon: Minus,     desc: "Horizontal separator"   },
  { type: "signature", label: "Signature",  icon: PenLine,   desc: "Signature field"        },
  { type: "payslip",   label: "Payslip",    icon: Receipt,   desc: "Salary slip table"      },
];

const makeBlock = (type, overrides = {}) => {
  const base = {
    id:           mkId(),
    type,
    content:      type === "heading" ? "New Heading" : type === "date-line" ? "Date: [Date]" : "",
    label:        type === "signature" ? "Authorized Signatory" : "",
    headingLevel: "h2",
    align:        type === "heading" ? "center" : type === "date-line" ? "right" : "left",
  };
  if (type === "payslip") {
    Object.assign(base, {
      period: "[Month] [Year]",
      earnings: [
        { id: mkId(), label: "Basic Salary",        amount: "[Salary]" },
        { id: mkId(), label: "House Rent Allowance",amount: "" },
        { id: mkId(), label: "Medical Allowance",   amount: "" },
        { id: mkId(), label: "Transport Allowance", amount: "" },
      ],
      deductions: [
        { id: mkId(), label: "Income Tax",          amount: "" },
        { id: mkId(), label: "EOBI",                amount: "" },
      ],
      netPay: "[Salary]",
    });
  }
  return { ...base, ...overrides };
};

/* ──────────────────────────────────────────────────────────
   CanvasBlock
   ────────────────────────────────────────────────────────── */

const AlignBtn = ({ cur, val, icon: Icon, onClick }) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick(val); }}
    className={`p-0.5 rounded transition-colors ${cur === val ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100 text-slate-400"}`}
  >
    <Icon size={10} />
  </button>
);

const CanvasBlock = ({
  block, isActive, isFirst, isLast,
  onActivate, onChange, onRemove, onMoveUp, onMoveDown, onCursorChange,
}) => {
  const textareaRef = useRef(null);

  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, []);

  useEffect(() => { autoResize(); }, [block.content, autoResize]);

  const alignClass = {
    left:   "text-left",
    center: "text-center",
    right:  "text-right",
  }[block.align || "left"] || "text-left";

  const trackCursor = (e) =>
    onCursorChange({ start: e.target.selectionStart, end: e.target.selectionEnd });

  const renderContent = () => {
    switch (block.type) {

      case "heading": {
        const sz = block.headingLevel === "h1" ? "text-[26px]" : block.headingLevel === "h3" ? "text-base" : "text-xl";
        return (
          <div className="space-y-1.5">
            {isActive && (
              <div className="flex items-center gap-1 flex-wrap">
                {[["h1","H1 – Title"],["h2","H2 – Section"],["h3","H3 – Sub"]].map(([v,l]) => (
                  <button
                    key={v}
                    onMouseDown={e => { e.preventDefault(); onChange({ headingLevel: v }); }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${block.headingLevel === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"}`}
                  >{l}</button>
                ))}
                <div className="ml-2 flex gap-0.5">
                  <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v => onChange({ align: v })} />
                  <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v => onChange({ align: v })} />
                  <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v => onChange({ align: v })} />
                </div>
              </div>
            )}
            <input
              className={`w-full bg-transparent outline-none border-none font-bold text-slate-900 tracking-tight ${sz} ${alignClass}`}
              value={block.content}
              placeholder="Heading…"
              onChange={e => onChange({ content: e.target.value })}
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
                <AlignBtn cur={block.align} val="left"   icon={AlignLeft}   onClick={v => onChange({ align: v })} />
                <AlignBtn cur={block.align} val="center" icon={AlignCenter} onClick={v => onChange({ align: v })} />
                <AlignBtn cur={block.align} val="right"  icon={AlignRight}  onClick={v => onChange({ align: v })} />
              </div>
            )}
            <textarea
              ref={textareaRef}
              className={`w-full bg-transparent outline-none resize-none border-none text-[13px] text-slate-700 leading-[1.75] overflow-hidden ${alignClass}`}
              value={block.content}
              placeholder="Type content…"
              rows={1}
              onChange={e => { onChange({ content: e.target.value }); autoResize(); }}
              onFocus={onActivate}
              onSelect={trackCursor}
              onKeyUp={trackCursor}
              style={{ minHeight: "1.75rem" }}
            />
          </div>
        );

      case "date-line":
        return (
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent outline-none resize-none border-none text-[13px] text-slate-700 text-right overflow-hidden"
            value={block.content}
            placeholder="Date: [Date]"
            rows={1}
            onChange={e => { onChange({ content: e.target.value }); autoResize(); }}
            onFocus={onActivate}
            onSelect={trackCursor}
            onKeyUp={trackCursor}
            style={{ minHeight: "1.5rem" }}
          />
        );

      case "divider":
        return <hr className="border-t border-slate-300 my-1" />;

      case "signature": {
        const selectedFontId  = block.signatureFont || SIG_FONTS[0].id;
        const selectedFontCss = SIG_FONTS.find(f => f.id === selectedFontId)?.css || SIG_FONTS[0].css;
        const preview = block.signatureText || "Signature";
        return (
          <div className="py-2 space-y-2">
            {/* ── Signature visual ── */}
            <div>
              <div style={{ fontFamily: selectedFontCss, fontSize: "28px", color: "#1a2e4a", lineHeight: 1.1, minHeight: "34px" }}>
                {block.signatureText || ""}
              </div>
              <div className="w-44 border-b-2 border-slate-800 mt-1 mb-1" />
              <input
                className="bg-transparent outline-none border-none text-[12px] font-semibold text-slate-700"
                value={block.label}
                placeholder="Signature label…"
                onChange={e => onChange({ label: e.target.value })}
                onFocus={onActivate}
              />
            </div>

            {/* ── Type + style picker (always visible) ── */}
            <div
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 space-y-2"
              onClick={e => e.stopPropagation()}
            >
              {/* Name input row */}
              <div className="flex items-center gap-2">
                <PenLine size={12} className="text-slate-400 shrink-0" />
                <input
                  className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-blue-400 transition-colors placeholder:text-slate-300"
                  value={block.signatureText || ""}
                  placeholder="Type signature name here…"
                  onChange={e => onChange({ signatureText: e.target.value })}
                  onFocus={onActivate}
                />
              </div>

              {/* Font style cards */}
              <div className="grid grid-cols-3 gap-1">
                {SIG_FONTS.map(font => (
                  <button
                    key={font.id}
                    onMouseDown={e => { e.preventDefault(); onChange({ signatureFont: font.id }); }}
                    className={`px-1.5 py-1.5 rounded-md border text-left transition-all ${selectedFontId === font.id ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}
                  >
                    <div
                      style={{ fontFamily: font.css, fontSize: "15px", color: "#1a2e4a", lineHeight: 1.25, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                    >
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

      case "payslip": {
        const updateRow = (section, rowId, field, val) =>
          onChange({ [section]: block[section].map(r => r.id === rowId ? { ...r, [field]: val } : r) });
        const removeRow = (section, rowId) =>
          onChange({ [section]: block[section].filter(r => r.id !== rowId) });
        const addRow = (section) =>
          onChange({ [section]: [...(block[section] || []), { id: mkId(), label: "", amount: "" }] });

        const RowTable = ({ section, accentHead, accentBtn }) => (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider ${accentHead}`}>
                {section === "earnings" ? "Earnings" : "Deductions"}
              </p>
              {isActive && (
                <button
                  onMouseDown={e => { e.preventDefault(); addRow(section); }}
                  className={`text-[10px] font-semibold ${accentBtn}`}
                >+ Add Row</button>
              )}
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
                {(block[section] || []).map(row => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1 pr-2">
                      <input
                        className="bg-transparent outline-none w-full text-slate-700"
                        value={row.label}
                        onChange={e => updateRow(section, row.id, "label", e.target.value)}
                        onFocus={onActivate}
                        placeholder="Description…"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        className="bg-transparent outline-none text-right text-slate-700 w-full"
                        value={row.amount}
                        onChange={e => updateRow(section, row.id, "amount", e.target.value)}
                        onFocus={onActivate}
                        placeholder="0.00"
                      />
                    </td>
                    {isActive && (
                      <td className="py-1 text-center">
                        <button
                          onMouseDown={e => { e.preventDefault(); removeRow(section, row.id); }}
                          className="text-slate-300 hover:text-red-400"
                        ><Trash2 size={10} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        return (
          <div className="border border-slate-200 rounded-xl overflow-hidden" style={{ fontFamily: "sans-serif" }}>
            {/* Header bar */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest">Salary Slip</span>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Pay Period:</span>
                <input
                  className="bg-transparent outline-none text-white font-semibold border-b border-slate-600 placeholder-slate-500 w-28 text-xs"
                  value={block.period || ""}
                  onChange={e => onChange({ period: e.target.value })}
                  onFocus={onActivate}
                  placeholder="[Month] [Year]"
                />
              </div>
            </div>

            {/* Employee info */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {[
                  ["Employee",    "[Employee Name]"],
                  ["Employee ID", "[Employee ID]"  ],
                  ["Designation", "[Designation]"  ],
                  ["Department",  "[Department]"   ],
                  ["Join Date",   "[Join Date]"    ],
                  ["Company",     "[Company Name]" ],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2 text-[11px]">
                    <span className="text-slate-400 font-semibold w-20 shrink-0">{l}</span>
                    <span className="text-slate-500 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings */}
            <RowTable section="earnings"   accentHead="text-emerald-700" accentBtn="text-emerald-600 hover:text-emerald-800" />

            {/* Deductions */}
            <div className="border-t border-slate-100">
              <RowTable section="deductions" accentHead="text-red-600"     accentBtn="text-red-500 hover:text-red-700" />
            </div>

            {/* Net pay bar */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-t border-slate-700">
              <span className="text-[11px] font-extrabold uppercase tracking-widest">Net Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">PKR</span>
                <input
                  className="bg-transparent outline-none text-right text-base font-extrabold text-white w-32"
                  value={block.netPay || ""}
                  onChange={e => onChange({ netPay: e.target.value })}
                  onFocus={onActivate}
                  placeholder="[Salary]"
                />
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative group py-1.5 px-3 -mx-3 rounded-lg transition-all ${
        isActive ? "bg-blue-50/60 ring-1 ring-blue-300 ring-offset-1" : "hover:bg-slate-50/60"
      }`}
      onClick={onActivate}
    >
      {/* Floating toolbar */}
      <div className={`absolute -top-7 right-0 z-20 flex items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-sm px-1 py-0.5 transition-opacity ${isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"}`}>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-0.5">{block.type}</span>
        <div className="w-px h-3 bg-slate-200 mx-0.5" />
        <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onMoveUp(); }}   disabled={isFirst} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronUp size={11} /></button>
        <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onMoveDown(); }} disabled={isLast}  className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronDown size={11} /></button>
        <div className="w-px h-3 bg-slate-200 mx-0.5" />
        <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onRemove(); }} className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
      </div>

      {renderContent()}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────────────────── */

export default function TemplatePage() {
  const { templateid } = useParams();
  const router = useRouter();

  const [template,     setTemplate]     = useState(null);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [blocks,       setBlocks]       = useState([]);
  const [activeId,     setActiveId]     = useState(null);
  const [cursor,       setCursor]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showPresets,  setShowPresets]  = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
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
        setBlocks(saved.map(f => ({ ...f, id: f.id || mkId() })));
        if (saved.length === 0) setShowPresets(true);
      }
    } catch { toast.error("Failed to load template"); }
    finally   { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/templates/${templateid}`, { templateName, fields: blocks });
      toast.success("Template saved!");
    } catch { toast.error("Failed to save template"); }
    finally   { setSaving(false); }
  };

  const applyPreset = (presetKey) => {
    const preset = ALL_PRESETS[presetKey];
    if (!preset) return;
    setBlocks(preset.blocks.map(b => {
      const block = { ...makeBlock(b.type), ...b, id: mkId() };
      if (b.type === "payslip") {
        block.earnings   = (b.earnings   || []).map(r => ({ ...r, id: mkId() }));
        block.deductions = (b.deductions || []).map(r => ({ ...r, id: mkId() }));
      }
      return block;
    }));
    setTemplateName(prev => (prev === "Untitled Template" || !prev) ? preset.name : prev);
    setShowPresets(false);
    toast.success(`${preset.name} template loaded`);
  };

  const addBlock   = (type)      => { const b = makeBlock(type); setBlocks(p => [...p, b]); setActiveId(b.id); };
  const updateBlock = (id, upd)  => setBlocks(p => p.map(b => b.id === id ? { ...b, ...upd } : b));
  const removeBlock = (id)       => { setBlocks(p => p.filter(b => b.id !== id)); setActiveId(p => p === id ? null : p); };
  const moveBlock   = (id, dir)  => setBlocks(prev => {
    const idx = prev.findIndex(b => b.id === id);
    if ((dir < 0 && idx === 0) || (dir > 0 && idx === prev.length - 1)) return prev;
    const arr = [...prev]; [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]]; return arr;
  });

  const insertShortcode = (code) => {
    if (!activeId) return;
    const snippet = `[${code}]`;
    setBlocks(prev => prev.map(b => {
      if (b.id !== activeId) return b;
      if (!["text","heading","date-line"].includes(b.type)) return b;
      const text = b.content || "";
      const s = cursor?.start ?? text.length;
      const e = cursor?.end   ?? s;
      const newContent = text.slice(0, s) + snippet + text.slice(e);
      setCursor({ start: s + snippet.length, end: s + snippet.length });
      return { ...b, content: newContent };
    }));
  };

  const activeBlock = blocks.find(b => b.id === activeId);
  const canInsert   = activeBlock && ["text","heading","date-line"].includes(activeBlock.type);
  const shortcodes  = template?.role === "Admin" ? SHORTCODES.Admin : SHORTCODES.Employee;
  const logoSrc     = template?.company?.companylogo || template?.company?.companyLogo;
  const company     = template?.company;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f3f5]">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f3f5] flex flex-col">

      {/* ── Top bar ── */}
      <div className="h-[52px] bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-50 shadow-sm shrink-0">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={17} />
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <input
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          className="text-sm font-semibold text-slate-800 bg-transparent outline-none border-none min-w-0 w-60"
          placeholder="Template name…"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowPresets(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showPresets ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700"}`}
          >
            <Wand2 size={13} /> Quick Start
          </button>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full hidden sm:block ${template?.role === "Admin" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
            {template?.role === "Admin" ? "Contract" : "Employee Letter"}
          </span>
          <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
            {saving ? <><Loader2 size={13} className="animate-spin mr-1.5" />Saving…</> : <><Save size={13} className="mr-1.5" />Save</>}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside className="w-52 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden">

          {/* Quick-start presets */}
          {showPresets && (
            <div className="px-3 pt-4 pb-3 bg-violet-50 border-b border-violet-200">
              <p className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest mb-2">
                {template?.role === "Admin" ? "Contract Presets" : "Letter Presets"}
              </p>
              <div className="space-y-1">
                {Object.entries(template?.role === "Admin" ? CONTRACT_PRESETS : EMPLOYEE_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add elements */}
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Add Element</p>
            <div className="space-y-0.5">
              {ELEMENT_TYPES.map(({ type, label, icon: Icon, desc }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
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

          {/* Variables */}
          <div className="px-3 pt-3 pb-4 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={11} className="text-slate-400" />
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Variables</p>
            </div>
            {!canInsert ? (
              <p className="text-[10px] text-slate-300 italic">Select a text or heading block first</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {shortcodes.map(code => (
                  <button
                    key={code}
                    onMouseDown={e => { e.preventDefault(); insertShortcode(code); }}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    [{code}]
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-10">
          <div className="mx-auto max-w-[794px]">
            <div
              className="bg-white shadow-[0_4px_40px_rgba(0,0,0,0.10)] min-h-[1123px] rounded-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              onClick={e => { if (e.target === e.currentTarget) setActiveId(null); }}
            >
              {/* ── Company Header ── */}
              {company ? (
                <div className="px-14 pt-10 pb-0">
                  <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900 mb-2">
                    {/* Left: logo + name */}
                    <div className="flex items-start gap-3">
                      {logoSrc ? (
                        <img src={logoSrc} alt={company.name} className="h-12 object-contain shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-extrabold text-slate-900 leading-tight" style={{ fontFamily: "sans-serif" }}>{company.name}</p>
                        {company.companyAddress && <p className="text-[11px] text-slate-600">{company.companyAddress}</p>}
                      </div>
                    </div>
                    {/* Right: contact */}
                    <div className="text-right text-[11px] text-slate-600 leading-5" style={{ fontFamily: "sans-serif" }}>
                      {company.companyPhoneNumber && <p>{company.companyPhoneNumber}</p>}
                      {(company.companyEmail || company.companyemail) && <p>{company.companyEmail || company.companyemail}</p>}
                      {company.companyWebsite && <p>{company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-14 pt-10 pb-0">
                  <div className="pb-4 border-b-2 border-slate-900 mb-2">
                    <p className="text-xs text-slate-300 italic" style={{ fontFamily: "sans-serif" }}>Company header will appear here (add a company to the template)</p>
                  </div>
                </div>
              )}

              {/* ── Body blocks ── */}
              <div className="px-14 py-8">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[500px] gap-4" onClick={e => e.stopPropagation()}>
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Type size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Canvas is empty</p>
                    <p className="text-xs text-slate-200">Use Quick Start to load a letter template, or add elements manually</p>
                    <button
                      onClick={() => setShowPresets(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors"
                    >
                      <Wand2 size={13} /> Choose Letter Type
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {blocks.map((block, idx) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        isActive={activeId === block.id}
                        isFirst={idx === 0}
                        isLast={idx === blocks.length - 1}
                        onActivate={() => setActiveId(block.id)}
                        onChange={upd => updateBlock(block.id, upd)}
                        onRemove={() => removeBlock(block.id)}
                        onMoveUp={() => moveBlock(block.id, -1)}
                        onMoveDown={() => moveBlock(block.id, 1)}
                        onCursorChange={setCursor}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Company Footer ── */}
              {company && (
                <div className="px-14 pb-8 mt-auto">
                  <div className="pt-4 border-t border-slate-300 text-center" style={{ fontFamily: "sans-serif" }}>
                    {company.companyAddress && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{company.companyAddress}</p>
                    )}
                    {company.companyWebsite && (
                      <p className="text-[10px] text-slate-400">{company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick add buttons below canvas */}
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
              {ELEMENT_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
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
  );
}
