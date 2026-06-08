import { db } from "@/lib/firebase";
import { admin, adminDb } from "@/lib/firebaseAdmin";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    const constraints = [];
    if (employeeId) {
      constraints.push(where("employeeId", "==", employeeId));
    }

    const leavesQuery = query(collection(db, "LeaveApplications"), ...constraints);
    const snapshot = await getDocs(leavesQuery);
    const leaves = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    return NextResponse.json({ success: true, leaves }, { status: 200 });
  } catch (error) {
    console.error("Get leaves error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave applications", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      employeeId,
      employeeName,
      department,
      leaveType = "multiple-days",
      fromDate,
      toDate,
      reason,
    } = body;
    const normalizedLeaveType = leaveType === "one-day" ? "one-day" : "multiple-days";
    const finalToDate = normalizedLeaveType === "one-day" ? fromDate : toDate;

    if (!employeeId || !fromDate || !finalToDate || !reason?.trim()) {
      return NextResponse.json(
        { success: false, message: "Employee, leave date, and reason are required" },
        { status: 400 }
      );
    }

    if (new Date(fromDate) > new Date(finalToDate)) {
      return NextResponse.json(
        { success: false, message: "From date cannot be after to date" },
        { status: 400 }
      );
    }

    const dateLabel = normalizedLeaveType === "one-day"
      ? `on ${fromDate}`
      : `from ${fromDate} to ${finalToDate}`;

    const id = uuidv4();
    const leaveRef = doc(db, "LeaveApplications", id);
    const leave = {
      id,
      employeeId,
      employeeName: employeeName || "",
      department: department || "",
      leaveType: normalizedLeaveType,
      fromDate,
      toDate: finalToDate,
      reason: reason.trim(),
      status: "Pending",
      adminNote: "",
      reviewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(leaveRef, leave);

    try {
      const [adminsSnap, superAdminsSnap] = await Promise.all([
        adminDb.collection("users").where("role", "==", "admin").get(),
        adminDb.collection("users").where("role", "==", "superAdmin").get(),
      ]);
      const notified = new Set();
      const batch = adminDb.batch();

      [...adminsSnap.docs, ...superAdminsSnap.docs].forEach((adminDoc) => {
        if (notified.has(adminDoc.id)) return;
        notified.add(adminDoc.id);
        const ref = adminDb.collection("adminNotifications").doc();
        batch.set(ref, {
          userId: adminDoc.id,
          type: "leave_application",
          title: "New leave application",
          body: `${employeeName || "Employee"} applied for leave ${dateLabel}.`,
          leaveId: id,
          employeeId,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      if (notified.size > 0) await batch.commit();
    } catch (notificationError) {
      console.error("Leave admin notification error:", notificationError);
    }

    return NextResponse.json(
      { success: true, message: "Leave application submitted successfully", leave: { ...leave, createdAt: null, updatedAt: null } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create leave error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit leave application", error: error.message },
      { status: 500 }
    );
  }
}
