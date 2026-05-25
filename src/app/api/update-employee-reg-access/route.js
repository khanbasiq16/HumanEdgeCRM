import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { employeeRegAccess } = await req.json();
    await setDoc(doc(db, "settings", "adminConfig"), { employeeRegAccess }, { merge: true });
    return NextResponse.json({ success: true, employeeRegAccess });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
