import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { projectId, employeeId, notificationId } = await req.json();

    if (!projectId || !employeeId) {
      return NextResponse.json({ success: false, error: "projectId and employeeId are required" }, { status: 400 });
    }

    // Update member status from pending → accepted in the project
    const projRef  = doc(db, "projects", projectId);
    const projSnap = await getDoc(projRef);

    if (!projSnap.exists()) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const members     = projSnap.data().members || [];
    const updatedMembers = members.map((m) =>
      m.id === employeeId ? { ...m, status: "accepted" } : m
    );

    await updateDoc(projRef, { members: updatedMembers, updatedAt: new Date().toISOString() });

    // Mark notification as read + accepted
    if (notificationId) {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
        status: "accepted",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
