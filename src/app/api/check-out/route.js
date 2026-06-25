import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { NextResponse } from "next/server";

const getKarachiNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));

const fmt12srv = (d) => {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      employeeId,
      ip,
      note,
      stopwatchTime,
    } = body;

    // Server-authoritative Karachi time — never trust client clock
    const karachiNow = getKarachiNow();
    const time       = fmt12srv(karachiNow);


    // 1️⃣ Validate Employee ID
    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }


    const docRef = doc(db, "ipWhitelist", "global");
    const whitelistSnap = await getDoc(docRef);

    if (!whitelistSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Whitelist not found." },
        { status: 500 }
      );
    }

    const whitelist = whitelistSnap.data()?.whitelist || [];

    if (whitelist.length > 0) {
      const hasUniversal = whitelist.some((item) => item.ip === "0.0.0.0/0");

      if (!hasUniversal) {
        const partialIp = ip.split(".").slice(0, 3).join(".");

        const isAllowed = whitelist.some((item) => {
          const partialWhitelistIp = item.ip.split(".").slice(0, 3).join(".");
          return partialIp === partialWhitelistIp;
        });

        if (!isAllowed) {
          console.log("❌ Blocked IP:", ip);

          return NextResponse.json(
            {
              success: false,
              error:
                "Checkout Failed: Please connect to the authorized office network.",
            },
            { status: 403 }
          );
        }
      }
    }



    const userRef = doc(db, "employees", employeeId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    /* ── Duplicate check-out guard ───────────────────────────────────
       1. Not checked in → cannot check out
       2. Already checked out this shift → block                       */

    if (!userData.isCheckedin) {
      return NextResponse.json(
        { success: false, error: "You are not checked in." },
        { status: 400 }
      );
    }

    if (userData.isCheckedout === true) {
      return NextResponse.json(
        { success: false, error: "You have already checked out for this shift." },
        { status: 400 }
      );
    }

    const attendanceArray = userData.Attendance || [];

    const index = attendanceArray.findIndex(
      (item) => item.id === userData?.attendanceid
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found" },
        { status: 404 }
      );
    }

    let departmentData = null;
    if (userData.department) {
      const deptRef = collection(db, "departments");
      const deptQuery = query(
        deptRef,
        where("departmentName", "==", userData.department)
      );
      const deptSnapshot = await getDocs(deptQuery);

      if (!deptSnapshot.empty) {
        departmentData = {
          id: deptSnapshot.docs[0].id,
          ...deptSnapshot.docs[0].data(),
        };
      }
    }

    if (!departmentData) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 }
      );
    }


    // Status based on actual elapsed time vs employee's required working hours
    const checkInStart = userData.startTime;
    const workingHours = parseFloat(userData.totalWorkingHours) || 9;
    const graceMs      = parseInt(departmentData.graceTime || 0) * 60 * 1000;
    const workingMs    = workingHours * 3600 * 1000;

    if (!checkInStart) {
      return NextResponse.json(
        { success: false, error: "Check-in time not found. Please contact admin." },
        { status: 400 }
      );
    }

    const elapsedMs   = Date.now() - new Date(checkInStart).getTime();
    const elapsedSecs = Math.max(0, Math.floor(elapsedMs / 1000));

    let status = "";
    if (elapsedMs < workingMs - graceMs) {
      status = "Early Check Out";
    } else if (elapsedMs > workingMs + graceMs) {
      status = "Late Check Out";
    } else {
      status = "On Time Check Out";
    }

    // 7️⃣ Update Firestore
    attendanceArray[index].checkout = {
      ip,
      note,
      time,
      stopwatchTime,
      status,
    };

    await updateDoc(userRef, {
      Attendance: attendanceArray,
      isCheckedin: false,
      isCheckedout: true,
      startTime: null,
      checkoutTime: new Date().toISOString(),
      checkoutDuration: elapsedSecs,
      attendanceid: "",
    });

    // ✅ Success Response
    return NextResponse.json({
      success: true,
      message: "Checkout data updated successfully",
      isCheckedin: false,
      isCheckedout: true,
      data: attendanceArray[index],
    });
  } catch (error) {
    console.error("❌ Error in checkout:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
