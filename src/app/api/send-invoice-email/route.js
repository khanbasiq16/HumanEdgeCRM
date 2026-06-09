import { sendEmail } from "@/lib/SendEmail";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { admin, adminDb } from "@/lib/firebaseAdmin";
import {
  collection, doc, getDoc, getDocs,
  query, updateDoc, where,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const {
      to, invoiceLink, invoiceid, slug,
      invoiceNumber, totalAmount, description, clientName,
    } = await req.json();

    if (!to || !invoiceid || !slug) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get company SMTP settings
    const companySnap = await getDocs(
      query(collection(db, "companies"), where("companyslug", "==", slug))
    );

    if (companySnap.empty) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const companyData = { id: companySnap.docs[0].id, ...companySnap.docs[0].data() };


    const subject = `Invoice #${invoiceNumber} from ${companyData.name}`;
    const year    = new Date().getFullYear();
    const amount  = `$${Number(totalAmount || 0).toLocaleString()}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">

  <div style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:32px 36px;text-align:center;">
      ${companyData.companyLogo
        ? `<img src="${companyData.companyLogo}" alt="${companyData.name}" style="height:48px;object-fit:contain;margin-bottom:16px;" />`
        : `<p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 16px;">${companyData.name}</p>`
      }
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">Invoice</p>
      <p style="color:#ffffff;font-size:32px;font-weight:800;margin:6px 0 0;letter-spacing:-0.5px;">#${invoiceNumber}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">

      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Hi <strong>${clientName || "there"}</strong>,</p>
      <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 28px;">
        Please find your invoice from <strong>${companyData.name}</strong> below. Click the button to view and pay securely online.
      </p>

      <!-- Invoice summary box -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Invoice Number</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
              <span style="font-size:14px;font-weight:700;color:#1e293b;">#${invoiceNumber}</span>
            </td>
          </tr>
          ${description ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Description</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
              <span style="font-size:14px;color:#475569;">${description}</span>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:12px 0 0;">
              <span style="font-size:13px;color:#64748b;font-weight:700;">Total Amount Due</span>
            </td>
            <td style="padding:12px 0 0;text-align:right;">
              <span style="font-size:22px;font-weight:800;color:#4f46e5;">${amount}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${invoiceLink}"
          style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(79,70,229,0.3);">
          View &amp; Pay Invoice →
        </a>
      </div>

      <!-- Fallback link -->
      <p style="font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
        If the button doesn't work, copy this link into your browser:<br>
        <a href="${invoiceLink}" style="color:#4f46e5;word-break:break-all;">${invoiceLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center;">
      <p style="font-size:13px;font-weight:700;color:#334155;margin:0 0 4px;">${companyData.name}</p>
      <p style="font-size:12px;color:#94a3b8;margin:0;">${companyData.companyemail}</p>
      <p style="font-size:11px;color:#cbd5e1;margin:12px 0 0;">© ${year} ${companyData.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;

    const result = await sendEmail({
      to,
      subject,
      html,
      fromName: companyData.name,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update invoice status to Sent
    const invoiceRef  = doc(db, "invoices", invoiceid);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    await updateDoc(invoiceRef, { status: "Sent" });
    const updated = await getDoc(invoiceRef);
    const invoiceData = invoiceSnap.data();
    const sentBy = invoiceData.assignedEmployeeName || invoiceData.createdBy || "An employee";

    // Notify all admins
    try {
      const adminSnap = await adminDb
        .collection("users")
        .where("role", "in", ["admin", "superAdmin"])
        .get();

      await Promise.all(
        adminSnap.docs.map((adminDoc) =>
          adminDb.collection("adminNotifications").add({
            userId:        adminDoc.id,
            type:          "invoice_sent",
            title:         "Invoice Sent to Client",
            body:          `${sentBy} sent invoice #${invoiceNumber} ($${Number(totalAmount || 0).toLocaleString()}) to ${clientName || to} — ${companyData.name}`,
            isRead:        false,
            invoiceId:     invoiceid,
            invoiceNumber,
            companyName:   companyData.name,
            companySlug:   slug,
            clientName:    clientName || null,
            clientEmail:   to,
            sentBy,
            createdAt:     admin.firestore.FieldValue.serverTimestamp(),
          })
        )
      );
    } catch (notifErr) {
      console.error("Admin notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${to} successfully`,
      invoice: { id: updated.id, ...updated.data() },
    });

  } catch (error) {
    console.error("send-invoice-email error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
