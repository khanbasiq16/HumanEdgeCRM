import { NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { admin, adminDb, fcmAdmin } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/SendEmail";

export async function POST(req) {
  try {
    const body = await req.json();

    const companySlug = body.companyName;
    const clientEmail = body.clientEmail;

    const q1 = query(
      collection(db, "companies"),
      where("companyslug", "==", companySlug)
    );
    const querySnapshot = await getDocs(q1);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const companyDoc = querySnapshot.docs[0];
    const companyData = { id: companyDoc.id, ...companyDoc.data() };

    if (
      !companyData.companyemail ||
      !companyData.companyemailpassword ||
      !companyData.companyemailhost ||
      !companyData.companysmtphost
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Company email not configured. Please add SMTP details first and then create client.",
        },
        { status: 400 }
      );
    }

    const q2 = query(
      collection(db, "clients"),
      where("clientEmail", "==", clientEmail)
    );
    const existingClientSnapshot = await getDocs(q2);

    if (!existingClientSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Client already exists with this email" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();

    // Build the welcome email template first (no DB writes yet)
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:’Segoe UI’,Roboto,Arial,sans-serif;">

  <div style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:36px;text-align:center;">
      ${companyData.companyLogo
        ? `<img src="${companyData.companyLogo}" alt="${companyData.name}" style="height:52px;object-fit:contain;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;" />`
        : `<p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 20px;">${companyData.name}</p>`
      }
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Welcome</p>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
        You’re now a client of ${companyData.name}!
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Hi <strong>${body.clientName}</strong>,</p>
      <p style="font-size:14px;color:#64748b;line-height:1.75;margin:0 0 24px;">
        We’re thrilled to welcome you to <strong>${companyData.name}</strong>! Our team is committed to helping your business grow through seamless collaboration and transparent communication.
      </p>

      <!-- Welcome card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <p style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Your Account Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Name</td>
            <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#1e293b;text-align:right;">${body.clientName}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#64748b;">Company</td>
            <td style="padding:7px 0;font-size:13px;font-weight:700;color:#4f46e5;text-align:right;">${companyData.name}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      ${companyData.companyWebsite ? `
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${companyData.companyWebsite}"
          style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(79,70,229,0.3);">
          Visit Our Website →
        </a>
      </div>` : ""}

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

      <p style="font-size:14px;color:#64748b;margin:0 0 4px;">Warm regards,</p>
      <p style="font-size:15px;color:#1e293b;font-weight:700;margin:0;">${companyData.name}</p>
      ${companyData.companyemail ? `<p style="font-size:13px;color:#94a3b8;margin:4px 0 0;">${companyData.companyemail}</p>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
      <p style="font-size:11px;color:#cbd5e1;margin:0;">© ${year} ${companyData.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;

    // Send email BEFORE creating client — if it fails, abort with error
    const emailResult = await sendEmail({
      to: clientEmail,
      subject: `Welcome to ${companyData.name}!`,
      html: htmlTemplate,
      EMAIL_HOST: companyData.companyemailhost,
      EMAIL_PORT: companyData.companysmtphost,
      EMAIL_USER: companyData.companyemail,
      EMAIL_PASS: companyData.companyemailpassword,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to send welcome email. Please check company SMTP settings. (${emailResult.error})`,
        },
        { status: 502 }
      );
    }

    // Email sent — now create the client in Firestore
    const clientId = uuidv4();
    const clientData = {
      id: clientId,
      companyId: companyData.id,
      companyName: companyData.name,
      companySlug: companyData.companyslug,
      clientName: body.clientName,
      clientEmail,
      clientAddress: body.clientAddress,
      clientPhone: body.clientPhone,
      projectsDetails: body.projectsDetails,
      packageDetails: body.packageDetails,
      clientWebsite: body.clientWebsite,
      assignedEmployeeId:   body.assignedEmployeeId   || null,
      assignedEmployeeName: body.assignedEmployeeName || null,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "clients", clientId), clientData);

    await updateDoc(doc(db, "companies", companyData.id), {
      AssignClient: arrayUnion(clientId),
    });

    const allClientsQuery = query(
      collection(db, "clients"),
      where("companyId", "==", companyData.id)
    );
    const snapshot = await getDocs(allClientsQuery);

    const allclients = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Store in-app notification + send FCM push to assigned employee
    if (body.assignedEmployeeId) {
      try {
        // 1 — Write Firestore notification (shows in bell panel)
        await adminDb.collection("notifications").add({
          employeeId: body.assignedEmployeeId,
          type:       "client_assigned",
          title:      "New Client Assigned",
          body:       `${body.clientName} has been assigned to you by ${companyData.name}`,
          isRead:     false,
          clientId:   clientId,
          clientName: body.clientName,
          companyName: companyData.name,
          createdAt:  admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2 — FCM push notification (optional, silent fail)
        if (body.assignedEmployeeEmail) {
          const userSnap = await adminDb
            .collection("users")
            .where("email", "==", body.assignedEmployeeEmail)
            .limit(1)
            .get();

          if (!userSnap.empty) {
            const token = userSnap.docs[0].data().fcmToken;
            if (token) {
              await fcmAdmin.send({
                notification: {
                  title: "New Client Assigned",
                  body:  `${body.clientName} has been assigned to you`,
                },
                token,
              });
            }
          }
        }
      } catch (notifErr) {
        console.error("Employee notification error:", notifErr);
      }
    }

    return NextResponse.json({ success: true, allclients });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
