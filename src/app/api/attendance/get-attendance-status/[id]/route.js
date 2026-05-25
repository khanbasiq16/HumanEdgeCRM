import { db } from "@/lib/firebase";
import {
  doc, getDoc,
  collection, getDocs, query, where,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Employee ID required" },
        { status: 400 }
      );
    }

    const docSnap = await getDoc(doc(db, "employees", id));
    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    const data       = docSnap.data();
    const attendance = data.Attendance || [];
    const lastRecord = attendance.length > 0
      ? attendance[attendance.length - 1]
      : null;

    /* ── 1. Actively checked in → return Working immediately ──────────
       This handles the midnight crossover for night shifts:
       employee checked in at 9 PM on May 24, it's now 3 AM on May 25 —
       isCheckedin flag is still true in Firestore, so we trust it.      */
    if (data.isCheckedin === true) {
      return NextResponse.json({
        success: true,
        employee: { id: docSnap.id, ...data, isCheckedin: true, isCheckedout: false },
      });
    }

    /* ── 2. Determine "shift date" using department check-in time ─────
       Night shift example: checkInTime = "9:00 PM"
         - Current time  9 PM  → new shift day  → shiftDate = today
         - Current time  7 AM  → still in yesterday's shift window
                                → shiftDate = yesterday
       This makes "Done" persist until the next shift starts.           */
    const now      = new Date();
    const todayStr = now.toLocaleDateString("en-GB");
    let   shiftDateStr = todayStr; // default fallback

    if (data.department) {
      try {
        const deptSnap = await getDocs(
          query(collection(db, "departments"),
                where("departmentName", "==", data.department))
        );
        if (!deptSnap.empty) {
          const dept = deptSnap.docs[0].data();
          const cit  = dept.checkInTime; // e.g. "9:00 PM" or "7:00 PM"
          if (cit) {
            let [tp, mer] = cit.trim().split(" ");
            let [hh, mm]  = tp.split(":").map(Number);
            if (mer?.toUpperCase() === "PM" && hh !== 12) hh += 12;
            if (mer?.toUpperCase() === "AM" && hh === 12) hh  = 0;

            const shiftStart = new Date(now);
            shiftStart.setHours(hh, mm, 0, 0);

            /* Current time is before today's shift start
               → we are still inside yesterday's shift window          */
            if (now < shiftStart) {
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              shiftDateStr = yesterday.toLocaleDateString("en-GB");
            }
          }
        }
      } catch (_) {
        /* dept lookup failed → shiftDateStr stays as todayStr          */
      }
    }

    /* ── 3. Compare last attendance record date with shift date ───── */
    const isShiftDay   = lastRecord?.date === shiftDateStr;
    const isCheckedin  = false;
    const isCheckedout = isShiftDay ? (data.isCheckedout || false) : false;

    return NextResponse.json({
      success: true,
      employee: { id: docSnap.id, ...data, isCheckedin, isCheckedout },
    });

  } catch (error) {
    console.error("Error fetching attendance status:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
