import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snap = await getDoc(doc(db, "settings", "adminConfig"));
    if (!snap.exists()) return NextResponse.json({ employeeRegAccess: false });
    return NextResponse.json({ employeeRegAccess: snap.data().employeeRegAccess ?? false });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
