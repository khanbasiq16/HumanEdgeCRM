import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const {
      projectId, projectTitle, title, description,
      assignedTo, assignedToName, priority, dueDate, taskDate,
      createdBy, source, type,
    } = await req.json();

    if (!title?.trim() || !assignedTo) {
      return NextResponse.json(
        { success: false, error: "Title and assignee are required" },
        { status: 400 }
      );
    }

    const id  = uuidv4();
    const now = new Date().toISOString();
    const task = {
      id,
      // "self" = employee personal task, "project" = admin-assigned project task
      type:           type || (source === "employee" ? "self" : "project"),
      projectId:      projectId    || null,
      projectTitle:   projectTitle || "",
      title:          title.trim(),
      description:    description  || "",
      assignedTo,
      assignedToName: assignedToName || "",
      source:         source || "admin",
      status:         "pending",
      priority:       priority || "medium",
      taskDate:       taskDate || null,
      dueDate:        dueDate  || null,
      createdBy:      createdBy || "Admin",
      createdAt:      now,
      updatedAt:      now,
      comments:       [],
      adminRemark:    "",
    };

    await setDoc(doc(collection(db, "tasks"), id), task);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
