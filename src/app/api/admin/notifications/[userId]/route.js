import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { userId } = await params;
    const snap = await adminDb
      .collection("adminNotifications")
      .where("userId", "==", userId)
      .limit(30)
      .get();

    const notifications = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      }))
      .sort((a, b) => (b.createdAt || "") > (a.createdAt || "") ? 1 : -1);

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { userId } = await params;
    const snap = await adminDb
      .collection("adminNotifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
    await batch.commit();

    return NextResponse.json({ success: true, updated: snap.size });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
