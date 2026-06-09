import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id, employeeid } = params;

    // Single-field queries — no composite index required
    // Then filter by companySlug in JS to avoid Firestore index issues
    const [createdSnap, assignedSnap] = await Promise.all([
      getDocs(query(collection(db, "invoices"), where("user_id", "==", employeeid))),
      getDocs(query(collection(db, "invoices"), where("assignedEmployeeId", "==", employeeid))),
    ]);

    const seen = new Set();
    const employeeInvoices = [];
    for (const snap of [createdSnap, assignedSnap]) {
      for (const d of snap.docs) {
        const data = d.data();
        if (data.companySlug === id && !seen.has(d.id)) {
          seen.add(d.id);
          employeeInvoices.push({ id: d.id, ...data });
        }
      }
    }

    return NextResponse.json({ success: true, invoices: employeeInvoices }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoices", error: error.message },
      { status: 500 }
    );
  }
}
