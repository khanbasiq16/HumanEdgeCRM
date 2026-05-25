import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [membersSnap, invitesSnap] = await Promise.all([
      adminDb.collection("users").where("role", "==", "admin").get(),
      adminDb.collection("invitations").where("status", "==", "pending").get(),
    ]);

    const members = membersSnap.docs.map((d) => ({
      _type: "member",
      uid: d.id,
      ...d.data(),
    }));

    const invitations = invitesSnap.docs.map((d) => ({
      _type: "invitation",
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ success: true, members, invitations });
  } catch (error) {
    console.error("❌ Get members error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, permissions } = await req.json();
    if (!id || !permissions?.length) {
      return NextResponse.json({ success: false, error: "ID and permissions required" }, { status: 400 });
    }
    await adminDb.collection("users").doc(id).update({ permissions });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ success: false, error: "UID required" }, { status: 400 });
    await adminDb.collection("users").doc(uid).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
