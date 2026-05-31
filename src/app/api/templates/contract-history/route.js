import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "templateId required" }, { status: 400 });
    }

    // Fetch from both collections in parallel
    const [contractsSnap, lettersSnap] = await Promise.all([
      getDocs(query(collection(db, "assigned_contracts"), where("templateId", "==", templateId))),
      getDocs(query(collection(db, "assigned_letters"),  where("templateId", "==", templateId))),
    ]);

    // Directly sent to client
    const sentToClient = contractsSnap.docs.map(d => {
      const data = d.data();
      return {
        id:           d.id,
        kind:         "client",
        name:         data.clientName   || "—",
        sub:          data.clientEmail  || "",
        contractDate: data.contractDate || "",
        emailSent:    data.emailSent    ?? false,
        assignedAt:   data.assignedAt?.toDate?.()?.toISOString?.() || data.assignedAt || null,
      };
    });

    // Assigned to sales employee
    const assignedToEmployee = lettersSnap.docs.map(d => {
      const data = d.data();
      return {
        id:           d.id,
        kind:         "employee",
        name:         data.employeeName || "—",
        sub:          data.assignedBy   ? `Assigned by ${data.assignedBy}` : "Assigned",
        emailSent:    false,
        assignedAt:   data.assignedAt   || null,
      };
    });

    const history = [...sentToClient, ...assignedToEmployee].sort(
      (a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)
    );

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
