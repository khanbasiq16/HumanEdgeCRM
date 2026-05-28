import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params; // Template Document ID

    // 1. Template ka direct reference lein
    const templateRef = doc(db, "templates", id);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
    }

    const templateData = { id: templateSnap.id, ...templateSnap.data() };

    const companyId = templateData.company;

    if (companyId) {
      const companyRef = doc(db, "companies", companyId);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        templateData.company = { id: companySnap.id, ...companySnap.data() };
      }
    }

    return NextResponse.json({ success: true, template: templateData }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "templates", id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { templateName, fields, theme, fontStack, canvasData, bgColor } = await req.json();
    const updates = { updatedAt: new Date().toISOString() };
    if (templateName !== undefined) updates.templateName = templateName;
    if (fields       !== undefined) updates.fields       = fields;
    if (theme        !== undefined) updates.theme        = theme;
    if (fontStack    !== undefined) updates.fontStack    = fontStack;
    if (canvasData   != null)       updates.canvasData   = canvasData; // != null excludes both null and undefined
    if (bgColor      !== undefined) updates.bgColor      = bgColor;
    await updateDoc(doc(db, "templates", id), updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}