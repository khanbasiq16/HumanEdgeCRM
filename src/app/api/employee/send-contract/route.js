import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { sendEmail } from "@/lib/SendEmail";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { letterId, clientId, clientName, clientEmail, clientPhone, clientAddress, message } = await req.json();

    if (!letterId || !clientEmail) {
      return NextResponse.json({ success: false, error: "letterId and clientEmail required" }, { status: 400 });
    }

    // Fetch the assigned letter (has canvasData + company info)
    const letterSnap = await getDoc(doc(db, "assigned_letters", letterId));
    if (!letterSnap.exists()) {
      return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });
    }
    const letter = { id: letterSnap.id, ...letterSnap.data() };
    const company = letter.company;

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    const emailHtml = `
      <div style="font-family:'Segoe UI',sans-serif;background:#f1f3f5;padding:40px 0;">
        ${company ? `
        <div style="max-width:720px;margin:0 auto 0;background:#fff;padding:40px 48px 0;border-radius:12px 12px 0 0;border:1px solid #e5e8ec;border-bottom:none;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:16px;border-bottom:2.5px solid #1e293b;margin-bottom:24px;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
              ${company.companylogo ? `<img src="${company.companylogo}" style="height:48px;object-fit:contain;"/>` : ""}
              <div>
                <div style="font-size:18px;font-weight:800;color:#0f172a;">${company.name || ""}</div>
                ${company.companyAddress ? `<div style="font-size:11px;color:#64748b;">${company.companyAddress}</div>` : ""}
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.7;">
              ${company.companyPhoneNumber ? `<div>${company.companyPhoneNumber}</div>` : ""}
              ${company.companyEmail      ? `<div>${company.companyEmail}</div>`       : ""}
            </div>
          </div>
        </div>
        ` : ""}
        <div style="max-width:720px;margin:0 auto;background:#fff;padding:0 48px 32px;border:1px solid #e5e8ec;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin:24px 0 8px;">${letter.templateName || "Contract"}</h2>
          <p style="font-size:13px;color:#475569;">Dear ${clientName || "Client"},</p>
          ${message ? `<p style="font-size:13px;color:#374151;line-height:1.7;margin:12px 0;">${message}</p>` : ""}
          <p style="font-size:13px;color:#374151;line-height:1.7;">Please find your contract attached for review. If you have any questions, please don't hesitate to contact us.</p>
          <div style="margin:24px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin:0 0 8px;">Contract Details</p>
            <p style="font-size:13px;color:#334155;margin:2px 0;"><strong>Contract:</strong> ${letter.templateName || "—"}</p>
            <p style="font-size:13px;color:#334155;margin:2px 0;"><strong>Date:</strong> ${today}</p>
            ${clientName    ? `<p style="font-size:13px;color:#334155;margin:2px 0;"><strong>Client:</strong> ${clientName}</p>` : ""}
            ${clientAddress ? `<p style="font-size:13px;color:#334155;margin:2px 0;"><strong>Address:</strong> ${clientAddress}</p>` : ""}
          </div>
          <p style="font-size:12px;color:#94a3b8;margin-top:32px;padding-top:16px;border-top:1px solid #f1f5f9;">
            Sent by ${company?.name || "the company"} · ${today}
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to:         clientEmail,
      subject:    `${letter.templateName || "Contract"} from ${company?.name || "us"}`,
      html:       emailHtml,
      EMAIL_HOST: company?.companyemailhost,
      EMAIL_PORT: company?.companysmtphost,
      EMAIL_USER: company?.companyemail,
      EMAIL_PASS: company?.companyemailpassword,
    });

    // Save to assigned_contracts for history
    await addDoc(collection(db, "assigned_contracts"), {
      templateId:    letter.templateId,
      templateName:  letter.templateName || "Untitled Contract",
      letterId:      letterId,
      assignedBy:    letter.employeeName || "Sales",
      companyName:   company?.name || "",
      clientName:    clientName    || "",
      clientEmail,
      clientPhone:   clientPhone   || "",
      clientAddress: clientAddress || "",
      contractDate:  today,
      emailSent:     emailResult.success,
      assignedAt:    serverTimestamp(),
      status:        "sent",
    });

    return NextResponse.json({
      success:   true,
      emailSent: emailResult.success,
      message:   emailResult.success ? "Contract sent!" : "Saved but email failed — check SMTP settings",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
