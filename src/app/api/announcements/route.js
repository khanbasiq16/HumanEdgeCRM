import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, serverTimestamp, orderBy, query,
} from "firebase/firestore";

/* GET /api/announcements — fetch all (admin view) */
export async function GET() {
  try {
    const q    = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, announcements });
  } catch {
    return NextResponse.json({ success: false, announcements: [] });
  }
}

/* POST /api/announcements — create + notify all employees */
export async function POST(req) {
  try {
    const { title, body, createdBy } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    /* 1. Save announcement doc */
    const annRef = await addDoc(collection(db, "announcements"), {
      title:     title.trim(),
      body:      body?.trim() || "",
      createdBy: createdBy || "Admin",
      createdAt: serverTimestamp(),
    });

    /* 2. Get all employees */
    const empSnap = await getDocs(collection(db, "employees"));
    const employees = empSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    /* 3. Create a notification for every employee */
    await Promise.all(
      employees.map((emp) =>
        addDoc(collection(db, "notifications"), {
          employeeId:     emp.employeeId || emp.id,
          type:           "announcement",
          title:          title.trim(),
          body:           body?.trim() || "",
          announcementId: annRef.id,
          isRead:         false,
          createdAt:      serverTimestamp(),
        })
      )
    );

    return NextResponse.json({
      success: true,
      announcementId: annRef.id,
      notified: employees.length,
    });
  } catch (err) {
    console.error("announcement POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
