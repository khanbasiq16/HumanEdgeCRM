import { adminDb } from "@/lib/firebaseAdmin";
import { sendpassowrdEmail } from "@/lib/SendpasswordEmail";
import { NextResponse } from "next/server";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists (users collection = admins, employees collection)
    const [usersSnap, empSnap] = await Promise.all([
      adminDb.collection("users").where("email", "==", email).limit(1).get(),
      adminDb.collection("employees").where("employeeemail", "==", email).limit(1).get(),
    ]);

    // Don't reveal if email exists or not — always return success
    if (!usersSnap.empty || !empSnap.empty) {
      const otp       = generateOTP();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Store OTP in Firestore
      await adminDb.collection("passwordResetOTPs").doc(email).set({
        email,
        otp,
        expiresAt,
        createdAt: Date.now(),
        used: false,
        verified: false,
      });

      // Send OTP email
      const html = otpEmailTemplate(otp, email);
      await sendpassowrdEmail({
        to: email,
        subject: "Your Password Reset OTP — HumanEdge",
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If this email is registered, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}

function otpEmailTemplate(otp, email) {
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) => `
      <td style="padding:0 6px;">
        <div style="
          width:48px; height:56px;
          background:#f0f5ff;
          border:2px solid #2563eb;
          border-radius:12px;
          font-size:28px;
          font-weight:800;
          color:#1e3a8a;
          text-align:center;
          line-height:56px;
          font-family:'Segoe UI',Arial,sans-serif;
          letter-spacing:0;
        ">${d}</div>
      </td>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="
            background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);
            border-radius:16px 16px 0 0;
            padding:32px 40px 28px;
            text-align:center;
          ">
            <div style="
              display:inline-flex;
              align-items:center;
              gap:10px;
              margin-bottom:16px;
            ">
              <div style="
                width:36px;height:36px;
                background:rgba(255,255,255,0.2);
                border-radius:10px;
                display:inline-block;
                line-height:36px;
                text-align:center;
                font-size:20px;
              ">🔐</div>
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">HumanEdge</span>
            </div>
            <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.5px;">
              Password Reset Request
            </h1>
            <p style="color:#bfdbfe;font-size:13px;margin:8px 0 0;">
              Your one-time password (OTP) is below
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Hi, we received a request to reset the password for your HumanEdge account
              associated with <strong style="color:#1e293b;">${email}</strong>.
            </p>

            <!-- OTP Boxes -->
            <div style="text-align:center;margin:28px 0;">
              <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">
                Your One-Time Password
              </p>
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>${digitBoxes}</tr>
              </table>
            </div>

            <!-- Expiry notice -->
            <div style="
              background:#fef9c3;
              border:1px solid #fde68a;
              border-radius:10px;
              padding:12px 16px;
              margin:24px 0;
              text-align:center;
            ">
              <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">
                ⏱ This OTP expires in <strong>15 minutes</strong>
              </p>
            </div>

            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will remain unchanged.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="
            background:#f8fafc;
            border-top:1px solid #e2e8f0;
            border-radius:0 0 16px 16px;
            padding:20px 40px;
            text-align:center;
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
