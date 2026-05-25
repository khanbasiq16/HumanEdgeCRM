import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { taskId, text, authorId, authorName, authorRole } = await req.json();
    if (!taskId || !text?.trim()) {
      return NextResponse.json({ success: false, error: "taskId and text required" }, { status: 400 });
    }
    const comment = {
      id: uuidv4(),
      text: text.trim(),
      authorId: authorId || "",
      authorName: authorName || "Unknown",
      authorRole: authorRole || "employee",
      createdAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, "tasks", taskId), {
      comments: arrayUnion(comment),
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
