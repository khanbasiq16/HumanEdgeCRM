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

    // Query 1: clients the employee created themselves (userid field)
    const [createdSnap, assignedSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, "clients"),
          where("companyId", "==", companyId),
          where("userid", "==", employeeid)
        )
      ),
      // Query 2: clients admin assigned to this employee (assignedEmployeeId field)
      getDocs(
        query(
          collection(db, "clients"),
          where("companyId", "==", companyId),
          where("assignedEmployeeId", "==", employeeid)
        )
      ),
    ]);

    // Merge and deduplicate by document ID
    const seen = new Set();
    const clients = [];

    for (const snap of [createdSnap, assignedSnap]) {
      for (const doc of snap.docs) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          clients.push({ id: doc.id, ...doc.data() });
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
