import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const clientRef = doc(db, "clients", id);
    const clientSnap = await getDoc(clientRef);

    if (!clientSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    const clientData = clientSnap.data();

    // Remove client from company's AssignClient array
    if (clientData.companyId) {
      const companyRef = doc(db, "companies", clientData.companyId);
      await updateDoc(companyRef, {
        AssignClient: arrayRemove(id),
      });
    }

    await deleteDoc(clientRef);

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
