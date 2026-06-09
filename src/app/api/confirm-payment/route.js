import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { admin, adminDb } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/SendEmail";

export async function POST(req) {
  try {
    const { invoiceId, status } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "invoiceId is required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch & update invoice ──────────────────────────────────────
    const invoiceRef  = doc(db, "invoices", invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() };

    await updateDoc(invoiceRef, {
      status:  status || "Paid",
      paidAt:  new Date().toISOString(),
    });

    const amount      = Number(invoice.totalAmount || 0).toLocaleString();
    const companyName = invoice.companyName  || "Company";
    const invNumber   = invoice.invoiceNumber || invoiceId;
    const year        = new Date().getFullYear();
    const paidDate    = new Date().toLocaleDateString("en-US", {
      day: "numeric", month: "long", year: "numeric",
    });

    // ── 2. Fetch client ────────────────────────────────────────────────
    let clientEmail = null;
    let clientName  = null;
    if (invoice.clientId) {
      const clientSnap = await getDoc(doc(db, "clients", invoice.clientId));
      if (clientSnap.exists()) {
        clientEmail = clientSnap.data().clientEmail;
        clientName  = clientSnap.data().clientName;
      }
    }

    // ── 3. Fetch company (SMTP) ────────────────────────────────────────
    let companyData = null;
    if (invoice.companySlug) {
      const compSnap = await getDocs(
        query(collection(db, "companies"), where("companyslug", "==", invoice.companySlug))
      );
      if (!compSnap.empty) {
        companyData = { id: compSnap.docs[0].id, ...compSnap.docs[0].data() };
      }
    }

    // ── 4. Send payment receipt email to client ────────────────────────
    if (
      clientEmail && companyData &&
      companyData.companyemail && companyData.companyemailpassword &&
      companyData.companyemailhost && companyData.companysmtphost
    ) {
      const receiptHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 36px;text-align:center;">
      ${companyData.companyLogo
        ? `<img src="${companyData.companyLogo}" alt="${companyName}" style="height:44px;object-fit:contain;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />`
        : `<p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 16px;">${companyName}</p>`
      }
      <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
        <span style="color:#fff;font-size:28px;">✓</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Payment Received!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:6px 0 0;">Your payment has been confirmed</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 36px;">
      <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${clientName || "there"}</strong>,</p>
      <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 24px;">
        We've successfully received your payment for invoice <strong>#${invNumber}</strong>. Thank you for your prompt payment!
      </p>

      <!-- Receipt box -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Payment Receipt</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:7px 0;border-bottom:1px solid #dcfce7;font-size:13px;color:#64748b;">Invoice No.</td>
            <td style="padding:7px 0;border-bottom:1px solid #dcfce7;font-size:13px;font-weight:700;color:#1e293b;text-align:right;">#${invNumber}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;border-bottom:1px solid #dcfce7;font-size:13px;color:#64748b;">Date</td>
            <td style="padding:7px 0;border-bottom:1px solid #dcfce7;font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${paidDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;font-size:13px;color:#64748b;font-weight:600;">Amount Paid</td>
            <td style="padding:10px 0 0;font-size:22px;font-weight:800;color:#16a34a;text-align:right;">$${amount}</td>
          </tr>
        </table>
      </div>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">

      <p style="font-size:14px;color:#64748b;margin:0 0 4px;">Thank you,</p>
      <p style="font-size:15px;color:#1e293b;font-weight:700;margin:0;">${companyName}</p>
      ${companyData.companyemail ? `<p style="font-size:12px;color:#94a3b8;margin:3px 0 0;">${companyData.companyemail}</p>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;text-align:center;">
      <p style="font-size:11px;color:#cbd5e1;margin:0;">© ${year} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      await sendEmail({
        to:          clientEmail,
        subject:     `Payment Confirmed – Invoice #${invNumber} | ${companyName}`,
        html:        receiptHtml,
        EMAIL_HOST:  companyData.companyemailhost,
        EMAIL_PORT:  companyData.companysmtphost,
        EMAIL_USER:  companyData.companyemail,
        EMAIL_PASS:  companyData.companyemailpassword,
      }).catch((e) => console.error("Receipt email error:", e));
    }

    // ── 5. Notify all super admins (adminNotifications) ───────────────
    try {
      const adminsSnap = await adminDb
        .collection("users")
        .where("role", "in", ["admin", "superAdmin"])
        .get();
      const batch      = adminDb.batch();

      adminsSnap.forEach((adminDoc) => {
        const ref = adminDb.collection("adminNotifications").doc();
        batch.set(ref, {
          userId:    adminDoc.id,
          type:      "invoice_paid",
          title:     "Invoice Paid",
          body:      `Invoice #${invNumber} (${companyName}) — $${amount} has been paid${clientName ? ` by ${clientName}` : ""}.`,
          isRead:    false,
          invoiceId,
          invoiceNumber: invNumber,
          companyName,
          amount:    invoice.totalAmount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (e) {
      console.error("Admin notification error:", e);
    }

    // ── 6. Notify assigned employee ───────────────────────────────────
    if (invoice.assignedEmployeeId) {
      try {
        await adminDb.collection("notifications").add({
          employeeId:    invoice.assignedEmployeeId,
          type:          "invoice_paid",
          title:         "Invoice Paid",
          body:          `Invoice #${invNumber} (${companyName}) — $${amount} has been paid successfully.`,
          isRead:        false,
          invoiceId,
          invoiceNumber: invNumber,
          companyName,
          createdAt:     admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error("Employee notification error:", e);
      }
    }

    // ── 7. Notify creator employee ────────────────────────────────────
    if (invoice.user_id && invoice.user_id !== invoice.assignedEmployeeId) {
      try {
        const creatorSnap = await adminDb.collection("employees").doc(invoice.user_id).get();
        if (creatorSnap.exists) {
          await adminDb.collection("notifications").add({
            employeeId:    invoice.user_id,
            type:          "invoice_paid",
            title:         "Invoice Paid",
            body:          `Invoice #${invNumber} (${companyName}) — $${amount} has been paid successfully.`,
            isRead:        false,
            invoiceId,
            invoiceNumber: invNumber,
            companyName,
            createdAt:     admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Creator employee notification error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmed. Invoice marked as Paid.",
    });

  } catch (error) {
    console.error("confirm-payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
