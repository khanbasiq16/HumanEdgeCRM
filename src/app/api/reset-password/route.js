import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { sendpassowrdEmail } from "@/lib/SendpasswordEmail";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Verify OTP session is valid
    const otpRef  = adminDb.collection("passwordResetOTPs").doc(email);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json({ error: "Session expired. Please request a new OTP." }, { status: 400 });
    }

    const { verified, expiresAt } = otpSnap.data();

    if (!verified) {
      return NextResponse.json({ error: "OTP not verified. Please verify your OTP first." }, { status: 400 });
    }

    if (Date.now() > expiresAt) {
      await otpRef.delete();
      return NextResponse.json({ error: "Session expired. Please request a new OTP." }, { status: 400 });
    }

    // Update password via Firebase Admin
    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(userRecord.uid, { password: newPassword });

    // Delete used OTP
    await otpRef.delete();

    // Send confirmation email
    const html = confirmationEmailTemplate(email);
    await sendpassowrdEmail({
      to: email,
      subject: "Password Changed Successfully — HumanEdge",
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }
    if (error.code === "auth/weak-password") {
      return NextResponse.json({ error: "Password is too weak. Use at least 6 characters." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}

function confirmationEmailTemplate(email) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr>
          <td style="
            background:linear-gradient(135deg,#059669 0%,#10b981 100%);
            border-radius:16px 16px 0 0;
            padding:32px 40px 28px;
            text-align:center;
          ">
            <div style="font-size:40px;margin-bottom:12px;">✅</div>
            <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">
              Password Changed Successfully
            </h1>
            <p style="color:#d1fae5;font-size:13px;margin:8px 0 0;">
              Your account is now secured with your new password.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:36px 40px;">
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Hi, the password for your HumanEdge account
              (<strong style="color:#1e293b;">${email}</strong>) has been changed successfully.
            </p>
            <div style="
              background:#fef2f2;border:1px solid #fecaca;
              border-radius:10px;padding:14px 18px;margin:20px 0;
            ">
              <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600;">
                🚨 If you did not make this change, please contact support immediately.
              </p>
            </div>
            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              You can now sign in with your new password. Keep it safe and never share it with anyone.
            </p>
          </td>
        </tr>

        <tr>
          <td style="
            background:#f8fafc;border-top:1px solid #e2e8f0;
            border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;
          ">
            <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
              © ${new Date().getFullYear()} HumanEdge HR Platform. All rights reserved.<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
