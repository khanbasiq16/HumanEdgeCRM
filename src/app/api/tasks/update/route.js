import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { taskId, title, description, priority, dueDate } = await req.json();
    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId required" }, { status: 400 });
    }
    const fields = { updatedAt: new Date().toISOString() };
    if (title       !== undefined) fields.title       = title;
    if (description !== undefined) fields.description = description;
    if (priority    !== undefined) fields.priority    = priority;
    if (dueDate     !== undefined) fields.dueDate     = dueDate || null;

    await updateDoc(doc(db, "tasks", taskId), fields);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
