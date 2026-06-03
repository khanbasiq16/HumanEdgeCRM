import { NextResponse } from "next/server";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();

    const employeeRef = doc(db, "employees", id);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    await updateDoc(employeeRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(employeeRef);
    const updatedData = updatedSnap.data();

    // Fetch full department object (same as login API)
    let departmentData = null;
    if (updatedData.department) {
      const deptQuery = query(
        collection(db, "departments"),
        where("departmentName", "==", updatedData.department)
      );
      const deptSnapshot = await getDocs(deptQuery);
      if (!deptSnapshot.empty) {
        departmentData = { id: deptSnapshot.docs[0].id, ...deptSnapshot.docs[0].data() };
      }
    }

    const updatedEmployee = {
      id: updatedSnap.id,
      ...updatedData,
      department: departmentData || updatedData.department || null,
    };

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { success: false, error: "Error updating employee" },
      { status: 500 }
    );
  }
}
