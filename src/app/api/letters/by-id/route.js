import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const letterId = searchParams.get("letterId");

    if (!letterId) {
      return NextResponse.json({ success: false, error: "letterId required" }, { status: 400 });
    }

    const snap = await getDoc(doc(db, "assigned_letters", letterId));
    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Letter not found" }, { status: 404 });
    }

    const data = snap.data();
    return NextResponse.json({
      success: true,
      letter: {
        id:           snap.id,
        templateId:   data.templateId   || "",
        templateName: data.templateName || "Untitled",
        templateRole: data.templateRole || "Employee",
        isContract:   data.isContract   || false,
        canvasData:   data.canvasData   || null,
        company:      data.company      || null,
        employeeId:   data.employeeId   || "",
        employeeName: data.employeeName || "",
        assignedBy:   data.assignedBy   || "",
        assignedAt:   data.assignedAt   || null,
        isRead:       data.isRead       || false,
        blocks:       data.blocks       || [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
