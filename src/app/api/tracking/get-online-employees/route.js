import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

// Fallback: if isOnline not explicitly false, check lastSeen within 2 minutes
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export async function GET() {
    try {
        const snapshot = await getDocs(collection(db, "employeeActivity"));
        const now = Date.now();

        const employees = snapshot.docs.map((doc) => {
            const data = doc.data();
            const lastSeenMs = data.lastSeenISO ? new Date(data.lastSeenISO).getTime() : 0;
            const withinThreshold = now - lastSeenMs <= ONLINE_THRESHOLD_MS;

            // If explicitly marked offline, trust it; otherwise use time threshold
            const isOnline = data.isOnline === false ? false : withinThreshold;

            return {
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                currentPage: data.currentPage,
                lastSeen: data.lastSeenISO || null,
                isOnline,
            };
        });

        return NextResponse.json({ success: true, employees }, { status: 200 });
    } catch (error) {
        console.error("Error fetching online employees:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
