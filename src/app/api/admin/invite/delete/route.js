import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await adminDb.collection("invitations").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
