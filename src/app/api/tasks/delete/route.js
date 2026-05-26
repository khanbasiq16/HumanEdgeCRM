import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function DELETE(req) {
  try {
    const { taskId, employeeId } = await req.json();

    if (!taskId || !employeeId) {
      return NextResponse.json(
        { success: false, error: "taskId and employeeId are required" },
        { status: 400 }
      );
    }

    const taskRef  = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const task = taskSnap.data();

    // Only allow deleting self-created tasks
    if (task.source !== "employee" || task.assignedTo !== employeeId) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own tasks." },
        { status: 403 }
      );
    }

    await deleteDoc(taskRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
