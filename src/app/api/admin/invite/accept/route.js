import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, name, password } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required." }, { status: 400 });
    }

    // 1. Find invitation
    const snap = await adminDb
      .collection("invitations")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: false, error: "Invitation not found." }, { status: 404 });
    }

    const invDoc     = snap.docs[0];
    const invitation = invDoc.data();

    if (invitation.status === "accepted") {
      return NextResponse.json({ success: false, error: "Invitation already accepted." }, { status: 410 });
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "Invitation has expired." }, { status: 410 });
    }

    // 2. Check if user exists
    let uid        = null;
    let userExists = false;

    try {
      const existing = await adminAuth.getUserByEmail(invitation.email);
      uid        = existing.uid;
      userExists = true;
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    // 3. Create user if not exists
    if (!userExists) {
      if (!name || !password) {
        return NextResponse.json(
          { success: false, error: "Name and password are required for new accounts." },
          { status: 400 }
        );
      }
      const newUser = await adminAuth.createUser({
        email:       invitation.email,
        password,
        displayName: name,
      });
      uid = newUser.uid;
    }

    // 4. Write / update Firestore users doc
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.set(
      {
        uid,
        email:       invitation.email,
        name:        name || (await adminAuth.getUser(uid)).displayName || "",
        role:        "admin",
        permissions: invitation.permissions,
        status:      "active",
        invitedBy:   invitation.invitedBy,
        createdAt:   new Date().toISOString(),
      },
      { merge: true }
    );

    // 5. Mark invitation accepted
    await invDoc.ref.update({ status: "accepted", acceptedAt: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: userExists
        ? "Permissions applied to your account. You can now sign in."
        : "Account created successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("❌ Invite accept error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
