import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { taskId, status } = await req.json();
    if (!taskId || !status) {
      return NextResponse.json({ success: false, error: "taskId and status required" }, { status: 400 });
    }
    await updateDoc(doc(db, "tasks", taskId), {
      status,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
