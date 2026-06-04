import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const otpRef  = adminDb.collection("passwordResetOTPs").doc(email);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json({ error: "OTP not found. Please request a new one." }, { status: 404 });
    }

    const { otp: storedOTP, expiresAt, used } = otpSnap.data();

    if (used) {
      return NextResponse.json({ error: "This OTP has already been used." }, { status: 400 });
    }

    if (Date.now() > expiresAt) {
      await otpRef.delete();
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (storedOTP !== otp.trim()) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    // Mark as verified
    await otpRef.update({ verified: true });

    return NextResponse.json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
