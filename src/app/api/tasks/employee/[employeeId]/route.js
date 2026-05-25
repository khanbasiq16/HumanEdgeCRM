import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { employeeId } = params;
    const snap = await getDocs(
      query(collection(db, "tasks"), where("assignedTo", "==", employeeId))
    );
    const tasks = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
