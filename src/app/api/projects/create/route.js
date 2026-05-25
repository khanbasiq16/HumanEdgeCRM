import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { title, description, priority, status, deadline, createdBy } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const id = uuidv4();
    const project = {
      id,
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      status: status || "active",
      deadline: deadline || null,
      createdBy: createdBy || "Admin",
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(collection(db, "projects"), id), project);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
