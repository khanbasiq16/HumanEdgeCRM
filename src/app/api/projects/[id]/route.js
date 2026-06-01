import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const snap = await getDoc(doc(db, "projects", id));
    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project: { id: snap.id, ...snap.data() } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    await updateDoc(doc(db, "projects", id), { ...body, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Fetch and delete all tasks belonging to this project
    const tasksSnap = await getDocs(query(collection(db, "tasks"), where("projectId", "==", id)));

    const batch = writeBatch(db);
    tasksSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "projects", id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
