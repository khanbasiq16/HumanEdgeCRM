import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const { id, permissions } = await req.json();
    if (!id || !permissions?.length) {
      return NextResponse.json({ success: false, error: "ID and permissions required" }, { status: 400 });
    }
    await adminDb.collection("invitations").doc(id).update({ permissions });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
