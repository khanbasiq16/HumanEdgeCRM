import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const { employeeId, type, title, body: msgBody, projectId, projectTitle } = body;

    if (!employeeId || !title) {
      return NextResponse.json({ success: false, error: "employeeId and title are required" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "notifications"), {
      employeeId,
      type:         type || "info",
      title,
      body:         msgBody || "",
      projectId:    projectId || null,
      projectTitle: projectTitle || null,
      status:       "pending",
      isRead:       false,
      createdAt:    serverTimestamp(),
    });

    return NextResponse.json({ success: true, notificationId: docRef.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
