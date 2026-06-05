import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ exists: false });

  try {
    const snap = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json({ exists: false });

    const doc  = snap.docs[0];
    const data = doc.data();
    return NextResponse.json({
      exists: true,
      user: {
        uid:         doc.id,
        name:        data.name || data.displayName || "",
        email:       data.email,
        role:        data.role || "",
        permissions: data.permissions || [],
      },
    });
  } catch (err) {
    console.error("❌ check-user error:", err);
    return NextResponse.json({ exists: false });
  }
}
