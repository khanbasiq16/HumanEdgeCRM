import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "projects"));
    const projects = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
