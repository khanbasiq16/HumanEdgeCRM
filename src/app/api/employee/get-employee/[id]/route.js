import { NextResponse } from "next/server";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const employeeRef = doc(db, "employees", id);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    const employeeData = employeeSnap.data();

    // Fetch full department object
    let departmentData = null;
    if (employeeData.department) {
      const deptQuery = query(
        collection(db, "departments"),
        where("departmentName", "==", employeeData.department)
      );
      const deptSnapshot = await getDocs(deptQuery);
      if (!deptSnapshot.empty) {
        departmentData = { id: deptSnapshot.docs[0].id, ...deptSnapshot.docs[0].data() };
      }
    }

    const employee = {
      id: employeeSnap.id,
      ...employeeData,
      department: departmentData || employeeData.department || null,
    };

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching employee" },
      { status: 500 }
    );
  }
}
