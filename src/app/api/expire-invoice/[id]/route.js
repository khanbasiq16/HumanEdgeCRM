import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;

    const invoiceRef = doc(db, "invoices", id);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    await updateDoc(invoiceRef, {
      status: "Expired",
      expiredAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Invoice marked as expired" });
  } catch (error) {
    console.error("Error expiring invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
