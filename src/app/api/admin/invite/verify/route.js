import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("invitations")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: false, error: "Invitation not found." }, { status: 404 });
    }

    const doc        = snap.docs[0];
    const invitation = { id: doc.id, ...doc.data() };

    if (invitation.status === "accepted") {
      return NextResponse.json({ success: false, error: "This invitation has already been accepted." }, { status: 410 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "This invitation has expired." }, { status: 410 });
    }

    let userExists = false;
    try {
      await adminAuth.getUserByEmail(invitation.email);
      userExists = true;
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id:          invitation.id,
        email:       invitation.email,
        permissions: invitation.permissions,
        invitedBy:   invitation.invitedBy,
        note:        invitation.note,
      },
      userExists,
    });
  } catch (error) {
    console.error("❌ Invite verify error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
