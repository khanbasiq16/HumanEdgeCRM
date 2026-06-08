import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

const ALLOWED_STATUSES = ["Approved", "Rejected"];

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();
    const status = body.status;
    const adminNote = body.adminNote || "";

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status must be Approved or Rejected" },
        { status: 400 }
      );
    }

    if (status === "Rejected" && !adminNote.trim()) {
      return NextResponse.json(
        { success: false, message: "Reject reason is required" },
        { status: 400 }
      );
    }

    const leaveRef = doc(db, "LeaveApplications", id);
    const leaveSnap = await getDoc(leaveRef);

    if (!leaveSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Leave application not found" },
        { status: 404 }
      );
    }

    const leaveData = leaveSnap.data();
    const dateLabel = leaveData.leaveType === "one-day" || leaveData.fromDate === leaveData.toDate
      ? `on ${leaveData.fromDate}`
      : `from ${leaveData.fromDate} to ${leaveData.toDate}`;

    await updateDoc(leaveRef, {
      status,
      adminNote: adminNote.trim(),
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      employeeId: leaveData.employeeId,
      type: status === "Approved" ? "leave_approved" : "leave_rejected",
      title: status === "Approved" ? "Leave approved" : "Leave rejected",
      body: status === "Approved"
        ? `Your leave request ${dateLabel} has been approved.`
        : `Your leave request ${dateLabel} was rejected. Reason: ${adminNote.trim()}`,
      leaveId: id,
      status,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Leave application ${status.toLowerCase()} successfully`,
        leave: { id, ...leaveData, status, adminNote: adminNote.trim() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update leave error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update leave application", error: error.message },
      { status: 500 }
    );
  }
}
