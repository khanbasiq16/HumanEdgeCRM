import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "templateId required" }, { status: 400 });
    }

    const q    = query(collection(db, "assigned_letters"), where("templateId", "==", templateId));
    const snap = await getDocs(q);
    const letters = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

    return NextResponse.json({ success: true, letters });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
