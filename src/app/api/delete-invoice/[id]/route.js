import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc, updateDoc, arrayRemove, collection, query, where, getDocs } from "firebase/firestore";

export async function DELETE(req, { params }) {
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

    const invoiceData = invoiceSnap.data();

    // Remove invoice from company's assignedInvoices array
    if (invoiceData.companySlug) {
      const companyQuery = query(
        collection(db, "companies"),
        where("companyslug", "==", invoiceData.companySlug)
      );
      const companySnap = await getDocs(companyQuery);
      if (!companySnap.empty) {
        const companyRef = doc(db, "companies", companySnap.docs[0].id);
        await updateDoc(companyRef, {
          assignedInvoices: arrayRemove(id),
        });
      }
    }

    await deleteDoc(invoiceRef);

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
