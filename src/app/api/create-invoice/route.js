import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  Timestamp,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { admin, adminDb } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      companySlug,
      clientId,
      invoiceNumber,
      invoiceDate,
      totalAmount,
      createdBy,
      status,
      user_id,
      invoiceAmount,
      Description,
      type,
      assignedEmployeeId,
      assignedEmployeeName,
    } = body;

    if (!clientId || !invoiceNumber || !companySlug) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyQuery = query(
      collection(db, "companies"),
      where("companyslug", "==", companySlug)
    );
    const querySnapshot = await getDocs(companyQuery);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Company not found with this slug" },
        { status: 404 }
      );
    }

    const companyDoc = querySnapshot.docs[0];
    const companyData = companyDoc.data();
    const companyDocId = companyDoc.id;
    const companyName = companyData.name;

    const invoiceId = uuidv4();
    const invoiceLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${companySlug}/details/${invoiceId}`;

    await setDoc(doc(db, "invoices", invoiceId), {
      invoiceId,
      companySlug,
      companyName,
      clientId,
      invoiceNumber,
      invoiceDate,
      totalAmount: Number(totalAmount),
      createdBy,
      status,
      Description,
      user_id,
      invoiceAmount: Number(invoiceAmount) || 0,
      invoiceLink,
      assignedEmployeeId: assignedEmployeeId || null,
      assignedEmployeeName: assignedEmployeeName || null,
      createdAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "companies", companyDocId), {
      assignedInvoices: arrayUnion(invoiceId),
    });

    // Notify assigned employee
    if (assignedEmployeeId) {
      try {
        await adminDb.collection("notifications").add({
          employeeId:  assignedEmployeeId,
          type:        "invoice_assigned",
          title:       "New Invoice Assigned",
          body:        `Invoice ${invoiceNumber} (${companyName}) has been assigned to you`,
          isRead:      false,
          invoiceId,
          invoiceNumber,
          companyName,
          createdAt:   admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (notifErr) {
        console.error("Invoice notification error:", notifErr);
      }
    }

    const assignedIds = [
      ...((companyData.assignedInvoices || [])),
      invoiceId,
    ];

    let assignedInvoicesData = [];
    if (assignedIds.length > 0) {
      const invoicesQuery = query(
        collection(db, "invoices"),
        where("invoiceId", "in", assignedIds)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);

      assignedInvoicesData = invoicesSnapshot.docs.map((doc) => doc.data());
    }

    return NextResponse.json({
      success: true,
      message: "Invoice created and assigned to company",
      invoiceId,
      invoiceLink,
      assignedInvoices: assignedInvoicesData, 
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}