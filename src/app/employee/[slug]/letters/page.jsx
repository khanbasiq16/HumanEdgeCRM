"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import {
  FileText, Loader2, Building2, Calendar, Download, Eye, Mail, MailOpen,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SIG_FONT_CSS = {
  dancing:  "'Dancing Script', cursive",
  great:    "'Great Vibes', cursive",
  pacifico: "'Pacifico', cursive",
  satisfy:  "'Satisfy', cursive",
  caveat:   "'Caveat', cursive",
};

/* ─── Render a letter block to HTML ─────────────────────── */
const renderBlockHTML = (block) => {
  const alignStyle = {
    center: "text-align:center;",
    right:  "text-align:right;",
    left:   "text-align:left;",
  }[block.align || "left"] || "";

  switch (block.type) {
    case "heading": {
      const sz = block.headingLevel === "h1" ? "24px" : block.headingLevel === "h3" ? "15px" : "18px";
      return `<p style="font-size:${sz};font-weight:700;color:#0f172a;margin:14px 0 8px;${alignStyle}">${block.content || ""}</p>`;
    }
    case "text":
      return `<p style="font-size:13px;color:#374151;line-height:1.75;margin:0 0 10px;${alignStyle}">${(block.content || "").replace(/\n/g, "<br/>")}</p>`;
    case "date-line":
      return `<p style="font-size:13px;color:#374151;text-align:right;margin:0 0 16px;">${block.content || ""}</p>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid #cbd5e1;margin:12px 0;"/>`;
    case "signature": {
      const fontCss = SIG_FONT_CSS[block.signatureFont] || SIG_FONT_CSS.dancing;
      return `<div style="margin:20px 0 8px;">
        ${block.signatureText ? `<div style="font-family:${fontCss};font-size:30px;color:#1a2e4a;line-height:1.1;margin-bottom:4px;">${block.signatureText}</div>` : ""}
        <div style="width:180px;border-bottom:2px solid #0f172a;margin-bottom:6px;"></div>
        <p style="font-size:12px;font-weight:600;color:#374151;margin:0;">${block.label || "Authorized Signatory"}</p>
      </div>`;
    }
    case "payslip": {
      const mkRows = (arr) => (arr || []).map(r =>
        `<tr>
          <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#374151;">${r.label || ""}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#374151;text-align:right;font-weight:600;">${r.amount || "—"}</td>
        </tr>`
      ).join("");
      const infoRows = [
        ["Employee",    block.employeeName || ""],
        ["Employee ID", block.employeeId   || ""],
        ["Designation", block.designation  || ""],
        ["Department",  block.department   || ""],
        ["Join Date",   block.joinDate     || ""],
      ];
      return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;font-family:sans-serif;">
          <div style="background:#1e293b;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">Salary Slip</span>
            <span style="font-size:11px;color:#94a3b8;">${block.period || ""}</span>
          </div>
          <div style="padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <table style="width:100%;border-collapse:collapse;">
              ${infoRows.filter(([,v]) => v).map(([l,v]) =>
                `<tr><td style="font-size:11px;color:#94a3b8;font-weight:600;width:120px;padding:2px 0;">${l}</td><td style="font-size:11px;color:#334155;padding:2px 0;">${v}</td></tr>`
              ).join("")}
            </table>
          </div>
          <div style="padding:12px 16px;">
            <p style="font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Earnings</p>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr>
                <th style="text-align:left;font-size:11px;color:#94a3b8;font-weight:600;padding:0 8px 5px;border-bottom:1px solid #e2e8f0;">Description</th>
                <th style="text-align:right;font-size:11px;color:#94a3b8;font-weight:600;padding:0 8px 5px;border-bottom:1px solid #e2e8f0;">Amount (PKR)</th>
              </tr></thead>
              <tbody>${mkRows(block.earnings)}</tbody>
            </table>
          </div>
          <div style="padding:0 16px 12px;border-top:1px solid #f1f5f9;">
            <p style="font-size:10px;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em;margin:10px 0 8px;">Deductions</p>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr>
                <th style="text-align:left;font-size:11px;color:#94a3b8;font-weight:600;padding:0 8px 5px;border-bottom:1px solid #e2e8f0;">Description</th>
                <th style="text-align:right;font-size:11px;color:#94a3b8;font-weight:600;padding:0 8px 5px;border-bottom:1px solid #e2e8f0;">Amount (PKR)</th>
              </tr></thead>
              <tbody>${mkRows(block.deductions)}</tbody>
            </table>
          </div>
          <div style="background:#1e293b;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">Net Pay</span>
            <span style="font-size:18px;font-weight:800;">PKR ${block.netPay || "—"}</span>
          </div>
        </div>
      `;
    }
    default:
      return "";
  }
};

/* ─── Build full letter HTML for printing ─────────────── */
const buildLetterHTML = (letter) => {
  const c = letter.company;
  const logoSrc = c?.companylogo;

  const headerHTML = c ? `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:16px;border-bottom:2.5px solid #0f172a;margin-bottom:4px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        ${logoSrc ? `<img src="${logoSrc}" alt="" style="height:48px;object-fit:contain;"/>` : ""}
        <div>
          <p style="font-size:18px;font-weight:800;color:#0f172a;margin:0;font-family:sans-serif;">${c.name || ""}</p>
          ${c.companyAddress ? `<p style="font-size:11px;color:#64748b;margin:2px 0 0;font-family:sans-serif;">${c.companyAddress}</p>` : ""}
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#475569;line-height:1.6;font-family:sans-serif;">
        ${c.companyPhoneNumber ? `<p style="margin:0;">${c.companyPhoneNumber}</p>` : ""}
        ${c.companyEmail ? `<p style="margin:0;">${c.companyEmail}</p>` : ""}
        ${c.companyWebsite ? `<p style="margin:0;">${c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>` : ""}
      </div>
    </div>
  ` : "";

  const footerHTML = c ? `
    <div style="position:fixed;bottom:32px;left:72px;right:72px;text-align:center;border-top:1px solid #cbd5e1;padding-top:10px;font-family:sans-serif;">
      ${c.companyAddress ? `<p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin:0;">${c.companyAddress}</p>` : ""}
      ${c.companyWebsite ? `<p style="font-size:10px;color:#94a3b8;margin:2px 0 0;">${c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>` : ""}
    </div>
  ` : "";

  const bodyHTML = (letter.blocks || []).map(renderBlockHTML).join("");

  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <title>${letter.templateName || "Letter"}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&display=swap');
      @media print { body { margin: 0; } .no-print { display: none !important; } }
      body { font-family: 'Times New Roman', Times, serif; background: white; margin: 0; padding: 0; }
    </style>
  </head><body>
    <div style="max-width:794px;margin:0 auto;padding:56px 72px 100px;min-height:1000px;position:relative;">
      ${headerHTML}
      <div style="padding-top:20px;">${bodyHTML}</div>
      ${footerHTML}
    </div>
  </body></html>`;
};

/* ─── Letter preview card — employee letters only ─────── */
const LetterCard = ({ letter, onView }) => {
  const date = letter.assignedAt
    ? new Date(letter.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div
      onClick={() => onView(letter)}
      className={`bg-white rounded-xl border cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all px-5 py-4 flex items-center gap-4 ${
        !letter.isRead ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
      }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        !letter.isRead ? "bg-blue-100" : "bg-slate-100"
      }`}>
        {letter.isRead
          ? <MailOpen size={18} className="text-slate-400"/>
          : <Mail size={18} className="text-blue-600"/>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm truncate ${!letter.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
            {letter.templateName || "Letter"}
          </p>
          {!letter.isRead && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">New</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {letter.company?.name && (
            <span className="flex items-center gap-1"><Building2 size={10}/>{letter.company.name}</span>
          )}
          <span className="flex items-center gap-1"><Calendar size={10}/>{date}</span>
        </div>
      </div>

      <Eye size={16} className="text-slate-300 shrink-0"/>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────── */
const LettersPage = () => {
  const { user } = useSelector((s) => s.User);
  const { slug }  = useParams();
  const router    = useRouter();
  const [letters,  setLetters]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [viewLetter, setViewLetter] = useState(null);
  const [printing,   setPrinting]  = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Caveat:wght@700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (user?.employeeId || user?.id) fetchLetters();
  }, [user]);

  const fetchLetters = async () => {
    const eid = user?.employeeId || user?.id;
    try {
      const res = await axios.get(`/api/letters/employee?employeeId=${eid}`);
      // Extra frontend filter — ensure contracts never appear here
      const onlyLetters = (res.data.letters || []).filter(
        l => !l.isContract && l.templateRole !== "Admin" && l.templateRole !== "Contract"
      );
      setLetters(onlyLetters);
    } catch { toast.error("Failed to load letters"); }
    finally   { setLoading(false); }
  };

  const handleView = async (letter) => {
    setViewLetter(letter);
    if (!letter.isRead) {
      try {
        await axios.post("/api/letters/mark-read", { letterId: letter.id });
        setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, isRead: true } : l));
      } catch { /* silent */ }
    }
  };

  const handleOpenContract = async (letter) => {
    if (!letter.isRead) {
      try { await axios.post("/api/letters/mark-read", { letterId: letter.id }); } catch { /* silent */ }
      setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, isRead: true } : l));
    }
    router.push(`/employee/${slug}/contracts/${letter.id}`);
  };

  const handleDownload = async () => {
    if (!viewLetter) return;
    setPrinting(true);
    try {
      const { pdf, Document, Page, Text, View, StyleSheet, Image } =
        await import("@react-pdf/renderer");

      const c   = viewLetter.company;

      /* load image via proxy (bypasses Cloudinary CORS), draw on canvas → PNG base64 */
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
      const S   = StyleSheet.create({
        page:       { padding: "14mm 16mm", fontFamily: "Times-Roman", fontSize: 11 },
        header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5pt solid #0f172a", paddingBottom: 12, marginBottom: 4 },
        logoRow:    { flexDirection: "row", alignItems: "flex-start", gap: 8 },
        logo:       { height: 40, width: 40, objectFit: "contain" },
        coName:     { fontSize: 15, fontFamily: "Times-Bold", color: "#0f172a" },
        coAddr:     { fontSize: 9, color: "#64748b", marginTop: 2 },
        contact:    { textAlign: "right", fontSize: 9, color: "#475569", lineHeight: 1.6 },
        body:       { paddingTop: 14 },
        h1:         { fontSize: 18, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h2:         { fontSize: 14, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 8, marginTop: 12 },
        h3:         { fontSize: 12, fontFamily: "Times-Bold", color: "#0f172a", marginBottom: 6, marginTop: 10 },
        para:       { fontSize: 11, color: "#374151", lineHeight: 1.7, marginBottom: 8 },
        dateLine:   { fontSize: 11, color: "#374151", textAlign: "right", marginBottom: 12 },
        divider:    { borderTop: "1pt solid #cbd5e1", marginVertical: 10 },
        sigBlock:   { marginTop: 20, marginBottom: 8 },
        sigLine:    { borderBottom: "2pt solid #0f172a", width: 140, marginBottom: 5 },
        sigLabel:   { fontSize: 10, color: "#374151" },
        footer:     { borderTop: "1pt solid #cbd5e1", paddingTop: 8, textAlign: "center", marginTop: 36 },
        footerTxt:  { fontSize: 8, color: "#94a3b8", marginTop: 1 },
      });

      const renderPdfBlock = (block, idx) => {
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
          case "payslip":
            return (
              <View key={idx} style={{ border: "1pt solid #e2e8f0", borderRadius: 6, marginVertical: 10, overflow: "hidden" }}>
                <View style={{ backgroundColor: "#1e293b", padding: "10pt 12pt", flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "white", fontSize: 10, fontFamily: "Times-Bold" }}>SALARY SLIP</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 9 }}>{block.period || ""}</Text>
                </View>
                <View style={{ padding: "8pt 12pt", backgroundColor: "#f8fafc", borderBottom: "1pt solid #e2e8f0" }}>
                  {[["Employee", block.employeeName], ["Employee ID", block.employeeId], ["Designation", block.designation], ["Department", block.department], ["Join Date", block.joinDate]]
                    .filter(([, v]) => v)
                    .map(([l, v]) => (
                      <View key={l} style={{ flexDirection: "row", marginBottom: 2 }}>
                        <Text style={{ fontSize: 9, color: "#94a3b8", width: 75 }}>{l}</Text>
                        <Text style={{ fontSize: 9, color: "#334155" }}>{v}</Text>
                      </View>
                    ))}
                </View>
                <View style={{ padding: "8pt 12pt" }}>
                  <Text style={{ fontSize: 8, color: "#059669", fontFamily: "Times-Bold", marginBottom: 5 }}>EARNINGS</Text>
                  {(block.earnings || []).map((r, ri) => (
                    <View key={ri} style={{ flexDirection: "row", borderBottom: "1pt solid #f1f5f9", paddingVertical: 3 }}>
                      <Text style={{ flex: 1, fontSize: 10, color: "#374151" }}>{r.label || ""}</Text>
                      <Text style={{ fontSize: 10, color: "#374151", fontFamily: "Times-Bold" }}>{r.amount || "—"}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ padding: "6pt 12pt 8pt", borderTop: "1pt solid #f1f5f9" }}>
                  <Text style={{ fontSize: 8, color: "#dc2626", fontFamily: "Times-Bold", marginBottom: 5 }}>DEDUCTIONS</Text>
                  {(block.deductions || []).map((r, ri) => (
                    <View key={ri} style={{ flexDirection: "row", borderBottom: "1pt solid #f1f5f9", paddingVertical: 3 }}>
                      <Text style={{ flex: 1, fontSize: 10, color: "#374151" }}>{r.label || ""}</Text>
                      <Text style={{ fontSize: 10, color: "#374151", fontFamily: "Times-Bold" }}>{r.amount || "—"}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#1e293b", padding: "10pt 12pt", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "white", fontSize: 10, fontFamily: "Times-Bold" }}>NET PAY</Text>
                  <Text style={{ color: "white", fontSize: 15, fontFamily: "Times-Bold" }}>PKR {block.netPay || "—"}</Text>
                </View>
              </View>
            );
          default:
            return null;
        }
      };

      const MyDoc = (
        <Document>
          <Page size="A4" style={S.page}>
            {/* Watermark — rendered first so it sits behind all content */}
            {logoBase64 && (
              <Image
                src={logoBase64}
                style={{ position: "absolute", top: 130, left: 102, width: 300, height: 300, opacity: 0.07 }}
              />
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
                  {c.companyEmail      && <Text style={S.contact}>{c.companyEmail}</Text>}
                  {c.companyWebsite    && <Text style={S.contact}>{c.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</Text>}
                </View>
              </View>
            )}
            <View style={S.body}>
              {(viewLetter.blocks || []).map(renderPdfBlock)}
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
      a.download = `${viewLetter.templateName || "Letter"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setPrinting(false);
    }
  };

  const unread = letters.filter(l => !l.isRead).length;

  return (
    <Employeelayout>
      <div className="w-full max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Letters</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {letters.length} letter{letters.length !== 1 ? "s" : ""}
              {unread > 0 && ` · ${unread} unread`}
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : letters.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileText size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No letters yet</p>
              <p className="text-xs text-slate-400 mt-1">Letters assigned to you will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {letters.map(l => (
              <LetterCard key={l.id} letter={l} onView={handleView}/>
            ))}
          </div>
        )}
      </div>

      {/* View Letter Dialog */}
      {viewLetter && (
        <Dialog open={!!viewLetter} onOpenChange={() => setViewLetter(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">

            {/* Dialog toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{viewLetter.templateName || "Letter"}</p>
                <p className="text-xs text-slate-400 truncate">
                  {viewLetter.assignedAt && new Date(viewLetter.assignedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  {viewLetter.assignedBy && ` · From ${viewLetter.assignedBy}`}
                </p>
              </div>
              <Button
                onClick={handleDownload}
                disabled={printing}
                size="sm"
                className="h-8 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0"
              >
                {printing
                  ? <><Loader2 size={13} className="animate-spin mr-1" />Generating…</>
                  : <><Download size={13} className="mr-1" /><span className="hidden sm:inline">Download </span>PDF</>}
              </Button>
            </div>

            {/* Letter preview */}
            <div className="overflow-y-auto flex-1 bg-[#f1f3f5] p-3 sm:p-6">
              <div
                className="bg-white mx-auto shadow-md rounded-sm w-full"
                style={{ maxWidth: "600px", padding: "clamp(20px,5vw,48px) clamp(14px,5vw,56px) clamp(28px,6vw,72px)", fontFamily: "'Times New Roman', Times, serif", position: "relative" }}
              >
                {/* Watermark */}
                {viewLetter.company?.companylogo && (
                  <img
                    src={viewLetter.company.companylogo}
                    alt=""
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "280px", height: "280px", objectFit: "contain", opacity: 0.07, pointerEvents: "none", zIndex: 0 }}
                  />
                )}
                {/* Company header */}
                {viewLetter.company && (
                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "2.5px solid #0f172a", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      {viewLetter.company.companylogo ? (
                        <img src={viewLetter.company.companylogo} alt="" style={{ height: "44px", objectFit: "contain", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "32px", height: "32px", background: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building2 size={14} className="text-slate-300" />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "clamp(14px,3vw,18px)", fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "sans-serif" }}>{viewLetter.company.name}</p>
                        {viewLetter.company.companyAddress && (
                          <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0", fontFamily: "sans-serif", wordBreak: "break-word" }}>{viewLetter.company.companyAddress}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "10px", color: "#475569", lineHeight: "1.6", fontFamily: "sans-serif", flexShrink: 0 }}>
                      {viewLetter.company.companyPhoneNumber && <p style={{ margin: 0 }}>{viewLetter.company.companyPhoneNumber}</p>}
                      {viewLetter.company.companyEmail && <p style={{ margin: 0, wordBreak: "break-all" }}>{viewLetter.company.companyEmail}</p>}
                      {viewLetter.company.companyWebsite && <p style={{ margin: 0 }}>{viewLetter.company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                <div style={{ position: "relative", zIndex: 1, paddingTop: "20px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                  {(viewLetter.blocks || []).map((block, i) => {
                    const alignStyle = { center: "center", right: "right", left: "left" }[block.align || "left"];
                    switch (block.type) {
                      case "heading": {
                        const sz = block.headingLevel === "h1" ? "clamp(18px,4vw,24px)" : block.headingLevel === "h3" ? "14px" : "clamp(15px,3.5vw,18px)";
                        return <p key={i} style={{ fontSize: sz, fontWeight: 700, color: "#0f172a", margin: "14px 0 8px", textAlign: alignStyle }}>{block.content}</p>;
                      }
                      case "text":
                        return <p key={i} style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "#374151", lineHeight: "1.75", margin: "0 0 10px", textAlign: alignStyle }}>{block.content}</p>;
                      case "date-line":
                        return <p key={i} style={{ fontSize: "13px", color: "#374151", textAlign: "right", margin: "0 0 16px" }}>{block.content}</p>;
                      case "divider":
                        return <hr key={i} style={{ border: "none", borderTop: "1px solid #cbd5e1", margin: "12px 0" }} />;
                      case "signature": {
                        const fontCss = SIG_FONT_CSS[block.signatureFont] || SIG_FONT_CSS.dancing;
                        return (
                          <div key={i} style={{ margin: "20px 0 8px" }}>
                            {block.signatureText && (
                              <div style={{ fontFamily: fontCss, fontSize: "30px", color: "#1a2e4a", lineHeight: 1.1, marginBottom: "4px" }}>
                                {block.signatureText}
                              </div>
                            )}
                            <div style={{ width: "160px", borderBottom: "2px solid #0f172a", marginBottom: "6px" }} />
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", margin: 0 }}>{block.label}</p>
                          </div>
                        );
                      }
                      case "payslip": {
                        const mkTRows = (arr) => (arr || []).map((r, ri) => (
                          <tr key={ri}>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#374151" }}>{r.label}</td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#374151", textAlign: "right", fontWeight: 600 }}>{r.amount || "—"}</td>
                          </tr>
                        ));
                        return (
                          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", margin: "16px 0", fontFamily: "sans-serif" }}>
                            <div style={{ background: "#1e293b", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Salary Slip</span>
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>{block.period || ""}</span>
                            </div>
                            {/* Employee info */}
                            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                  {[["Employee", block.employeeName], ["Employee ID", block.employeeId], ["Designation", block.designation], ["Department", block.department], ["Join Date", block.joinDate]].filter(([,v]) => v).map(([l, v]) => (
                                    <tr key={l}>
                                      <td style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, width: "120px", padding: "2px 0" }}>{l}</td>
                                      <td style={{ fontSize: "11px", color: "#334155", padding: "2px 0" }}>{v}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {/* Earnings */}
                            <div style={{ padding: "12px 16px" }}>
                              <p style={{ fontSize: "10px", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Earnings</p>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>
                                  <th style={{ textAlign: "left", fontSize: "11px", color: "#94a3b8", fontWeight: 600, padding: "0 8px 5px", borderBottom: "1px solid #e2e8f0" }}>Description</th>
                                  <th style={{ textAlign: "right", fontSize: "11px", color: "#94a3b8", fontWeight: 600, padding: "0 8px 5px", borderBottom: "1px solid #e2e8f0" }}>Amount (PKR)</th>
                                </tr></thead>
                                <tbody>{mkTRows(block.earnings)}</tbody>
                              </table>
                            </div>
                            {/* Deductions */}
                            <div style={{ padding: "0 16px 12px", borderTop: "1px solid #f1f5f9" }}>
                              <p style={{ fontSize: "10px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 8px" }}>Deductions</p>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>
                                  <th style={{ textAlign: "left", fontSize: "11px", color: "#94a3b8", fontWeight: 600, padding: "0 8px 5px", borderBottom: "1px solid #e2e8f0" }}>Description</th>
                                  <th style={{ textAlign: "right", fontSize: "11px", color: "#94a3b8", fontWeight: 600, padding: "0 8px 5px", borderBottom: "1px solid #e2e8f0" }}>Amount (PKR)</th>
                                </tr></thead>
                                <tbody>{mkTRows(block.deductions)}</tbody>
                              </table>
                            </div>
                            {/* Net Pay */}
                            <div style={{ background: "#1e293b", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Net Pay</span>
                              <span style={{ fontSize: "18px", fontWeight: 800 }}>PKR {block.netPay || "—"}</span>
                            </div>
                          </div>
                        );
                      }
                      default: return null;
                    }
                  })}
                </div>

                {/* Footer */}
                {viewLetter.company?.companyAddress && (
                  <div style={{ position: "relative", zIndex: 1, marginTop: "40px", paddingTop: "12px", borderTop: "1px solid #cbd5e1", textAlign: "center", fontFamily: "sans-serif" }}>
                    <p style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{viewLetter.company.companyAddress}</p>
                    {viewLetter.company.companyWebsite && <p style={{ fontSize: "10px", color: "#94a3b8", margin: "2px 0 0" }}>{viewLetter.company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</p>}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Employeelayout>
  );
};

export default LettersPage;
