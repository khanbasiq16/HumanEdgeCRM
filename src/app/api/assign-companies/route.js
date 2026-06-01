import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc, updateDoc, getDoc,
  collection, addDoc, serverTimestamp, getDocs, query, where,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const { employeeId, companyIds, companyNames } = await req.json();

    if (!employeeId || !Array.isArray(companyIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 }
      );
    }

    const empRef  = doc(db, "employees", employeeId);
    const empSnap = await getDoc(empRef);

    if (!empSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    /* Update employee's assigned companies */
    await updateDoc(empRef, { companyIds });

    /* Create an in-app notification for the employee */
    const names = companyNames?.join(", ") || `${companyIds.length} company(s)`;
    await addDoc(collection(db, "notifications"), {
      employeeId,
      title:     "Company Assigned",
      body:      `You have been assigned to: ${names}`,
      type:      "company_assigned",
      isRead:    false,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Companies assigned successfully",
    });
  } catch (error) {
    console.error("assign-companies error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
