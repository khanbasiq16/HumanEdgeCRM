import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Returns all projects where the employee is an accepted member
export async function GET(req, { params }) {
  try {
    const { employeeId } = params;
    if (!employeeId) {
      return NextResponse.json({ success: false, projects: [] });
    }

    const snap     = await getDocs(collection(db, "projects"));
    const projects = [];

    snap.docs.forEach((d) => {
      const data    = d.data();
      const members = data.members || [];
      const isMember = members.some(
        (m) => m.id === employeeId && m.status === "accepted"
      );
      if (isMember) {
        projects.push({ id: d.id, ...data });
      }
    });

    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
