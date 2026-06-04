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

export async function POST(req) {
    try {

        const body = await req.json();
        const { employeeId, note, time, ip } = body;

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
                                "Check In Failed. Please Connect With the Office Network Use Local Internet 5G",
                        },
                        { status: 403 }
                    );
                }
            }
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
            date: new Date().toLocaleDateString("en-GB"),
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
        });


        const allemployeeRef = collection(db, "employees");

        const allemployeesnapshot = await getDocs(allemployeeRef);

        const allemployeesdata = allemployeesnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));


        return NextResponse.json(
            {
                success: true,
                message: "Check in saved successfully",
                employees: allemployeesdata,
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
