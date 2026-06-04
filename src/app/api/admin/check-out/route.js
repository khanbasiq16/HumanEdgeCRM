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

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            employeeId,
            ip,
            time,
            note,
        } = body;



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
                                "Check In Failed. Please Connect With the Office Network Use Local Internet 5G",
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

        const startISO = userData?.startTime;
        let formattedElapsed = "00:00:00";

        if (startISO) {
            const startTime = new Date(startISO).getTime();
            const now = Date.now(); 
            const elapsedSeconds = Math.floor((now - startTime) / 1000);

            const h = Math.floor(elapsedSeconds / 3600);
            const m = Math.floor((elapsedSeconds % 3600) / 60);
            const s = elapsedSeconds % 60;

            formattedElapsed =
                `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

            console.log("Raw startTime:", startISO);
            console.log("Elapsed Timer (HH:mm:ss):", formattedElapsed);
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


        function parseTime12Hour(timeStr) {
            const [timePart, modifier] = timeStr.trim().split(" ");
            let [hours, minutes] = timePart.split(":").map(Number);

            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        }

        const deptCheckIn = parseTime12Hour(departmentData.checkInTime || "9:00 PM");
        const deptCheckOut = parseTime12Hour(departmentData.checkOutTime || "6:00 AM");
        const empCheckout = parseTime12Hour(time);

        
        if (deptCheckOut < deptCheckIn) {
            // Department checkout occurs next day
            deptCheckOut.setDate(deptCheckOut.getDate() + 1);
            if (empCheckout < deptCheckIn) {
                empCheckout.setDate(empCheckout.getDate() + 1);
            }
        }

        // ⏰ Grace Time
        const graceTime = departmentData.graceTime || 0; // in minutes
        const graceMillis = graceTime * 60 * 1000;
        const lateThreshold = new Date(deptCheckOut.getTime() + graceMillis);

        // 🟩 Determine Status
        let status = "";
        if (empCheckout < deptCheckOut) {
            status = "Early Check Out";
        } else if (empCheckout > lateThreshold) {
            status = "Late Check Out";
        } else {
            status = "On Time Check Out";
        }

        // 7️⃣ Update Firestore
        attendanceArray[index].checkout = {
            ip,
            note,
            time,
            stopwatchTime: formattedElapsed,
            status,
        };

        await updateDoc(userRef, {
            Attendance: attendanceArray,
            isCheckedin: false,
            isCheckedout: true,
            startTime: null,
            attendanceid: "",
        });



        const allemployeeRef = collection(db, "employees");

        const allemployeesnapshot = await getDocs(allemployeeRef);

        const allemployeesdata = allemployeesnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));



        return NextResponse.json({
            success: true,
            message: "Checkout data updated successfully",
            employees: allemployeesdata,

        });
    } catch (error) {
        console.error("❌ Error in checkout:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
