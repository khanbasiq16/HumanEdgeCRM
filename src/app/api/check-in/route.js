import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const getKarachiNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));

const fmt12 = (d) => {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

export async function POST(req) {
  try {

    const body = await req.json();
    const { employeeId, note, ip } = body;


    if (!employeeId) {
      console.log("❌ Employee ID Missing");
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "employees", employeeId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found in Firestore." },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

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
                "Check-in Failed: Please connect to the authorized office network.",
            },
            { status: 403 }
          );
        }
      }
    }




    /* ── Duplicate check-in guard ────────────────────────────────────
       Block if employee is active OR any record already exists for
       this shift cycle. Uses checkInTime as shift boundary so night
       shifts (e.g. 9 PM–6 AM) work correctly across midnight.        */

    // Fast path: actively checked in right now
    if (userData.isCheckedin === true) {
      return NextResponse.json(
        { success: false, error: "You are already checked in. Please check out first." },
        { status: 400 }
      );
    }

    // Server-authoritative Karachi time — never trust client clock
    const now  = getKarachiNow();
    const time = fmt12(now);

    // Calculate shift date (handles night shift crossing midnight)
    let shiftDateStr = now.toLocaleDateString("en-GB");

    const cit = departmentData?.checkInTime;
    if (cit) {
      let [tp, mer] = cit.trim().split(" ");
      let [hh, mm]  = tp.split(":").map(Number);
      if (mer?.toUpperCase() === "PM" && hh !== 12) hh += 12;
      if (mer?.toUpperCase() === "AM" && hh === 12) hh  = 0;

      const shiftStart = new Date(now);
      shiftStart.setHours(hh, mm, 0, 0);

      // Before today's shift start → still inside yesterday's shift window
      if (now < shiftStart) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        shiftDateStr = yesterday.toLocaleDateString("en-GB");
      }
    }

    // Block if any attendance record already exists for this shift date
    const lastRecord = (userData.Attendance || []).slice(-1)[0];
    if (lastRecord?.date === shiftDateStr && Object.keys(lastRecord.checkin || {}).length > 0) {
      return NextResponse.json(
        { success: false, error: "Attendance already recorded for today's shift. See you next shift!" },
        { status: 400 }
      );
    }

    const convertToMinutes = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const getAttendanceStatus = (checkInTime, graceTime, currentTimeStr) => {
      const checkInMinutes = convertToMinutes(checkInTime);
      const currentMinutes = convertToMinutes(currentTimeStr);


      const adjustedCurrent =
        currentMinutes < 720 ? currentMinutes + 1440 : currentMinutes;
      const adjustedCheckIn =
        checkInMinutes < 720 ? checkInMinutes + 1440 : checkInMinutes;

      const graceLimit = adjustedCheckIn + parseInt(graceTime);
      const shortDayLimit = adjustedCheckIn + 90;
      const halfDayLimit = adjustedCheckIn + 170;
      const absentLimit = convertToMinutes("2:00 AM") + 1440;

      let status = "";

      if (adjustedCurrent >= absentLimit) {
        status = "Late";
      }
      else if (adjustedCurrent <= graceLimit) {
        status = "On Time";
      } else if (
        adjustedCurrent > graceLimit &&
        adjustedCurrent <= shortDayLimit
      ) {
        status = "Late";
      } else if (
        adjustedCurrent > shortDayLimit &&
        adjustedCurrent <= halfDayLimit
      ) {
        status = "Short Day";
      } else if (adjustedCurrent > halfDayLimit) {
        status = "Half Day";
      } else {
        status = "On Time";
      }

      return status;
    };

    let status = getAttendanceStatus(
      departmentData.checkInTime,
      departmentData.graceTime,
      time
    );



    let attendanceid = uuidv4()
    const attendanceEntry = {
      id: attendanceid,
      date: shiftDateStr,
      checkin: {
        note,
        time,
        status,
        ip
      },
      checkout: {},
    };


    let letstaketime = new Date().toISOString()

    await updateDoc(userRef, {
      Attendance: arrayUnion(attendanceEntry),
      isCheckedin: true,
      attendanceid: attendanceid,
      isCheckedout: false,
      startTime: letstaketime,
      checkoutDuration: null,
      checkoutTime: null,
    });







    return NextResponse.json(
      {
        success: true,
        message: "Check in saved successfully",
        attendance: attendanceEntry,
        attendanceid,
        isCheckedin: true,
        attendanceid: attendanceid,
        isCheckedout: false,
        startTime: letstaketime
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error in /api/checkin:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
