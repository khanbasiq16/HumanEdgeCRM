import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
  updateDoc, doc,
} from "firebase/firestore";

/* GET  /api/employee-notifications/[employeeId] */
export async function GET(req, { params }) {
  try {
    const { employeeId } = params;
    if (!employeeId) return NextResponse.json({ success: false, notifications: [] });

    // No orderBy — avoids requiring a composite index that may not exist.
    // Sort by createdAt descending in JS instead.
    const q = query(
      collection(db, "notifications"),
      where("employeeId", "==", employeeId)
    );
    const snap = await getDocs(q);

    const notifications = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.seconds ?? (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
        const tb = b.createdAt?.seconds ?? (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
        return tb - ta;
      });

    return NextResponse.json({ success: true, notifications });
  } catch (err) {
    console.error("notifications GET error:", err);
    return NextResponse.json({ success: false, notifications: [] });
  }
}

/* PATCH  /api/employee-notifications/[employeeId]  — mark all read */
export async function PATCH(req, { params }) {
  try {
    const { employeeId } = params;
    const q = query(
      collection(db, "notifications"),
      where("employeeId", "==", employeeId),
      where("isRead", "==", false)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => updateDoc(doc(db, "notifications", d.id), { isRead: true }))
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notifications PATCH error:", err);
    return NextResponse.json({ success: false });
  }
}
