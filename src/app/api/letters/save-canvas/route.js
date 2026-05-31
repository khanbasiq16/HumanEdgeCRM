import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const { letterId, canvasData } = await req.json();

    if (!letterId || !canvasData) {
      return NextResponse.json({ success: false, error: "letterId and canvasData required" }, { status: 400 });
    }

    await updateDoc(doc(db, "assigned_letters", letterId), {
      canvasData,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
