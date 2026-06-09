import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

async function getServerIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.error("⚠️ Failed to fetch server IP:", err);
    return "Unknown";
  }
}

function getKarachiDate() {
  const options = { timeZone: "Asia/Karachi" };
  return new Date(new Date().toLocaleString("en-US", options));
}

function to12HourFormat(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const modifier = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${modifier}`;
}

export async function GET() {
  try {
    const serverIp = await getServerIp(); 
    const employeesSnap = await getDocs(collection(db, "employees"));

    const holidaysSnap = await getDocs(collection(db, "Holidays"));
    const holidays = holidaysSnap.docs.map((doc) => doc.data());

    
    const today = getKarachiDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yesterdayDay = yesterday.getDay();
    if (yesterdayDay === 6 || yesterdayDay === 0) {
      console.log("🛑 Yesterday was weekend — No attendance marking needed.");
      return NextResponse.json({
        success: false,
        message: "Yesterday was weekend — skipping marking",
      });
    }

    const yesterdayDateStr = yesterday.toLocaleDateString("en-GB", {
      timeZone: "Asia/Karachi",
    });

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayISO = `${year}-${month}-${day}`;


    const isHoliday = holidays.some(h => h.date === yesterdayISO);
    if (isHoliday) {
      const holidayName = holidays.find(h => h.date === yesterdayISO)?.name || "Public Holiday";
      console.log(`🛑 Yesterday was a Holiday: ${holidayName} — skipping.`);
      return NextResponse.json({
        success: false,
        message: `Yesterday was a holiday (${holidayName}) — skipping marking`,
      });
    }

    // Approved leave wale employees fetch karo
    const leavesSnap = await getDocs(
      query(collection(db, "LeaveApplications"), where("status", "==", "Approved"))
    );
    const onLeaveEmployees = new Set();
    leavesSnap.docs.forEach((leaveDoc) => {
      const leave = leaveDoc.data();
      if (leave.fromDate <= yesterdayISO && yesterdayISO <= leave.toDate) {
        onLeaveEmployees.add(leave.employeeId);
      }
    });

    const autoCheckouts = [];

    for (const empDoc of employeesSnap.docs) {
      const empData = empDoc.data();
      const empId = empDoc.id;

      if (empData.status === "deactivate") {
        continue;
      }

      if (onLeaveEmployees.has(empId)) {
        console.log(`📅 Employee ${empId} is on approved leave for ${yesterdayISO} — skipping`);
        continue;
      }

      let attendance = empData.Attendance || [];

      const index = attendance.findIndex((a) => a.date === yesterdayDateStr);

      let totalWorkedTime = "00:00:00";
      if (empData.startTime) {
        const start = new Date(empData.startTime).getTime();
        const now = Date.now();
        const diffInSeconds = Math.floor((now - start) / 1000);

        const formatElapsedTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = seconds % 60;
          return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        };

        totalWorkedTime = formatElapsedTime(diffInSeconds);
      }

      const karachiNow = getKarachiDate();
      const formattedTime = to12HourFormat(karachiNow);

      if (index !== -1) {
        const entry = attendance[index];

        if (
          entry.checkin &&
          Object.keys(entry.checkin).length > 0 &&
          (!entry.checkout || Object.keys(entry.checkout).length === 0)
        ) {
          entry.checkout = {
            ip: serverIp,
            time: formattedTime,
            status: "Late Check Out",
            note: "Auto-marked as Late Checkout",
            stopwatchTime: totalWorkedTime,
          };
          autoCheckouts.push({ employeeId: empId, date: yesterdayDateStr });
        }
      } else {
        attendance.push({
          id: uuidv4(),
          date: yesterdayDateStr,
          checkin: {
            ip: serverIp,
            time: formattedTime,
            status: "Absent",
            note: "Auto-marked Absent",
          },
          checkout: {
            ip: serverIp,
            time: formattedTime,
            stopwatchTime: "00:00:00",
            status: "Absent",
            note: "Auto-marked Absent",
          },
        });
      }

      const empRef = doc(db, "employees", empId);
      await updateDoc(empRef, {
        Attendance: attendance,
        isCheckedin: false,
        isCheckedout: true,
        startTime: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `✅ Daily attendance check done for ${yesterdayDateStr} (Karachi Time)`,
      serverIp,
      autoCheckouts,
    });
  } catch (err) {
    console.error("🔥 Error in daily check:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
