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

    /* If the letter has no canvasData but has a templateId, fetch it from the template */
    let canvasData = data.canvasData || null;
    if (!canvasData && data.templateId) {
      try {
        const { doc: docFn, getDoc: getDocFn } = await import("firebase/firestore");
        const tmplSnap = await getDocFn(docFn(db, "templates", data.templateId));
        if (tmplSnap.exists()) canvasData = tmplSnap.data().canvasData || null;
      } catch { /* template fetch failed — canvas will be empty */ }
    }

    return NextResponse.json({
      success: true,
      letter: {
        id:           snap.id,
        templateId:   data.templateId   || "",
        templateName: data.templateName || "Untitled",
        templateRole: data.templateRole || "Employee",
        isContract:   data.isContract   || false,
        canvasData,
        company:      data.company      || null,
        employeeId:   data.employeeId   || "",
        employeeName: data.employeeName || "",
        designation:  data.designation  || "",
        department:   data.department   || "",
        joinDate:     data.joinDate     || "",
        salary:       data.salary       || "",
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
