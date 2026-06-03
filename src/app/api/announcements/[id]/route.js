import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

/* DELETE /api/announcements/[id] */
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    /* Delete the announcement doc */
    await deleteDoc(doc(db, "announcements", id));

    /* Delete all linked notifications */
    const q    = query(collection(db, "notifications"), where("announcementId", "==", id));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "notifications", d.id))));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("announcement DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
