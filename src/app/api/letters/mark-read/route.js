import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { letterId } = await req.json();
    if (!letterId) return NextResponse.json({ success: false, error: "letterId required" }, { status: 400 });
    await updateDoc(doc(db, "assigned_letters", letterId), { isRead: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
