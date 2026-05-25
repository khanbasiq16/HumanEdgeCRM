import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/SendEmail";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

function substituteVars(text, varMap) {
  if (!text) return text || "";
  let result = text;
  Object.entries(varMap).forEach(([key, val]) => {
    result = result.split(key).join(val || "");
  });
  return result;
}

function blocksToHtml(blocks, company) {
  const logoSrc = company?.companylogo || company?.companyLogo || "";

  const header = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #1e293b;margin-bottom:8px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        ${logoSrc ? `<img src="${logoSrc}" style="height:52px;object-fit:contain;" />` : ""}
        <div>
          <div style="font-size:18px;font-weight:800;color:#0f172a;font-family:sans-serif;">${company?.name || ""}</div>
          ${company?.companyAddress ? `<div style="font-size:11px;color:#475569;font-family:sans-serif;">${company.companyAddress}</div>` : ""}
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#475569;line-height:1.7;font-family:sans-serif;">
        ${company?.companyPhoneNumber ? `<div>${company.companyPhoneNumber}</div>` : ""}
        ${(company?.companyEmail || company?.companyemail) ? `<div>${company?.companyEmail || company?.companyemail}</div>` : ""}
        ${company?.companyWebsite ? `<div>${company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</div>` : ""}
      </div>
    </div>
  `;

  const footer = `
    <div style="border-top:1px solid #cbd5e1;padding-top:14px;text-align:center;margin-top:40px;font-family:sans-serif;">
      ${company?.companyAddress ? `<div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${company.companyAddress}</div>` : ""}
      ${company?.companyWebsite ? `<div style="font-size:10px;color:#94a3b8;">${company.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}</div>` : ""}
    </div>
  `;

  const blockHtml = blocks.map(block => {
    switch (block.type) {
      case "heading": {
        const sz = block.headingLevel === "h1" ? "24px" : block.headingLevel === "h3" ? "15px" : "20px";
        return `<div style="text-align:${block.align || "center"};font-size:${sz};font-weight:700;color:#0f172a;margin:10px 0;">${block.content || ""}</div>`;
      }
      case "text":
        return `<p style="text-align:${block.align || "left"};font-size:13px;color:#334155;line-height:1.75;margin:6px 0 10px;">${(block.content || "").replace(/\n/g, "<br>")}</p>`;
      case "date-line":
        return `<p style="text-align:right;font-size:13px;color:#334155;margin:6px 0;">${block.content || ""}</p>`;
      case "divider":
        return `<hr style="border:none;border-top:1px solid #cbd5e1;margin:16px 0;" />`;
      case "signature":
        return `<div style="margin-top:28px;"><div style="width:192px;border-bottom:2px solid #1e293b;margin-bottom:8px;"></div><div style="font-size:12px;font-weight:600;color:#334155;">${block.label || ""}</div></div>`;
      default:
        return "";
    }
  }).join("");

  return `
    <div style="max-width:720px;margin:0 auto;background:#fff;padding:56px;box-shadow:0 4px 40px rgba(0,0,0,0.10);font-family:'Times New Roman',Times,serif;">
      ${header}
      <div style="padding:32px 0 16px;">
        ${blockHtml}
      </div>
      ${footer}
    </div>
  `;
}

export async function POST(req) {
  try {
    const {
      templateId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      contractDate,
      message,
    } = await req.json();

    if (!templateId || !clientEmail) {
      return NextResponse.json(
        { success: false, message: "templateId and clientEmail are required" },
        { status: 400 }
      );
    }

    const templateSnap = await getDoc(doc(db, "templates", templateId));
    if (!templateSnap.exists()) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
    }
    const templateData = { id: templateSnap.id, ...templateSnap.data() };

    let company = null;
    if (templateData.company) {
      const companySnap = await getDoc(doc(db, "companies", templateData.company));
      if (companySnap.exists()) {
        company = { id: companySnap.id, ...companySnap.data() };
      }
    }

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const varMap = {
      "[Client Name]":    clientName    || "",
      "[Client Address]": clientAddress || "",
      "[Client Email]":   clientEmail   || "",
      "[Client Phone]":   clientPhone   || "",
      "[Contract Date]":  contractDate  || today,
      "[Company Name]":   company?.name || "",
      "[Date]":           today,
    };

    const renderedBlocks = (templateData.fields || []).map(block => ({
      ...block,
      content: substituteVars(block.content, varMap),
      label:   substituteVars(block.label,   varMap),
    }));

    const letterHtml = blocksToHtml(renderedBlocks, company);

    const emailHtml = `
      <div style="font-family:'Segoe UI',sans-serif;background:#f1f3f5;padding:40px 0;">
        ${message ? `
          <div style="max-width:720px;margin:0 auto 24px;background:#fff;border-radius:12px;padding:24px 32px;border:1px solid #e5e8ec;">
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">${message}</p>
          </div>
        ` : ""}
        ${letterHtml}
        <div style="max-width:720px;margin:24px auto 0;text-align:center;font-size:12px;color:#94a3b8;">
          Sent by ${company?.name || "the company"} · ${today}
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to:         clientEmail,
      subject:    `${templateData.templateName || "Contract"} from ${company?.name || "us"}`,
      html:       emailHtml,
      EMAIL_HOST: company?.companyemailhost,
      EMAIL_PORT: company?.companysmtphost,
      EMAIL_USER: company?.companyemail,
      EMAIL_PASS: company?.companyemailpassword,
    });

    await addDoc(collection(db, "assigned_contracts"), {
      templateId,
      templateName:  templateData.templateName || "Untitled Contract",
      companyId:     templateData.company || null,
      companyName:   company?.name || "",
      clientName:    clientName    || "",
      clientEmail,
      clientPhone:   clientPhone   || "",
      clientAddress: clientAddress || "",
      contractDate:  contractDate  || today,
      renderedBlocks,
      emailSent:  emailResult.success,
      assignedAt: serverTimestamp(),
      status:     "sent",
    });

    return NextResponse.json({
      success:   true,
      emailSent: emailResult.success,
      message:   emailResult.success
        ? "Contract sent via email successfully"
        : "Contract saved but email delivery failed — check company SMTP settings",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
