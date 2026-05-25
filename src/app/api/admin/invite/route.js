import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { sendpassowrdEmail } from "@/lib/SendpasswordEmail";
import { v4 as uuidv4 } from "uuid";

const MODULE_LABELS = {
  employees:  "Manage Employees",
  companies:  "Manage Companies",
  attendance: "Attendance Tracking",
  accounts:   "Accounts & Finance",
  templates:  "Letter Templates",
  settings:   "System Settings",
};

export async function POST(req) {
  try {
    const { email, permissions, invitedBy, note } = await req.json();

    if (!email || !permissions?.length) {
      return NextResponse.json(
        { success: false, error: "Email and at least one permission are required." },
        { status: 400 }
      );
    }

    const token     = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await addDoc(collection(db, "invitations"), {
      email,
      permissions,
      invitedBy: invitedBy || "Admin",
      token,
      status: "pending",
      createdAt,
      expiresAt,
      note: note || "",
    });

    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptLink = `${appUrl}/accept-invite/${token}`;

    const permList = permissions
      .map((p) => `<li style="margin:4px 0;color:#374151;">${MODULE_LABELS[p] || p}</li>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:36px 40px;">
      <div style="width:48px;height:48px;background:#2563eb;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="color:#fff;font-size:22px;">🏢</span>
      </div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">You've been invited to join</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">HR Management Platform</p>
    </div>

    <div style="padding:36px 40px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        <strong>${invitedBy || "Admin"}</strong> has invited you to join as an <strong>Admin Member</strong>.
        ${note ? `<br><br><em style="color:#6b7280;">"${note}"</em>` : ""}
      </p>

      <div style="background:#f1f5f9;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Access Permissions</p>
        <ul style="margin:0;padding-left:20px;">
          ${permList}
        </ul>
      </div>

      <a href="${acceptLink}"
         style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:12px;margin-bottom:20px;">
        Accept Invitation →
      </a>

      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
        This invitation expires in 7 days.<br>
        If you didn't expect this email, you can safely ignore it.
      </p>
    </div>

    <div style="border-top:1px solid #f1f5f9;padding:20px 40px;background:#fafafa;">
      <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
        Or copy this link: <span style="color:#2563eb;font-family:monospace;">${acceptLink}</span>
      </p>
    </div>
  </div>
</body>
</html>`;

    const emailResult = await sendpassowrdEmail({
      to: email,
      subject: `You've been invited to join the HR Platform`,
      html,
    });

    console.log("📧 Email result:", emailResult);

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success === true,
      emailError: emailResult.success ? null : emailResult.error,
      token,
      acceptLink,
    });
  } catch (error) {
    console.error("❌ Invite error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
