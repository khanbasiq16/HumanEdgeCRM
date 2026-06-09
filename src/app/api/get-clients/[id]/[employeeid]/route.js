import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id, employeeid } = params;

    // Resolve company document ID from slug
    const companySnapshot = await getDocs(
      query(collection(db, "companies"), where("companyslug", "==", id))
    );

    if (companySnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "No company found with this slug" },
        { status: 404 }
      );
    }

    // Use the Firestore document ID (not a field called companyId)
    const companyId = companySnapshot.docs[0].id;

    // Single-field queries — no composite index required
    // Filter by companyId in JS to avoid Firestore index issues
    const [createdSnap, assignedSnap] = await Promise.all([
      getDocs(query(collection(db, "clients"), where("userid", "==", employeeid))),
      getDocs(query(collection(db, "clients"), where("assignedEmployeeId", "==", employeeid))),
    ]);

    // Merge, filter by company, and deduplicate
    const seen = new Set();
    const clients = [];

    for (const snap of [createdSnap, assignedSnap]) {
      for (const d of snap.docs) {
        const data = d.data();
        if (data.companyId === companyId && !seen.has(d.id)) {
          seen.add(d.id);
          clients.push({ id: d.id, ...data });
        }
      }
    }

    return NextResponse.json({ success: true, clients }, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clients", error: error.message },
      { status: 500 }
    );
  }
}
