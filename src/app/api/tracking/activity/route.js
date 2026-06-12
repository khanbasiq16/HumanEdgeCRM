import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { employeeId, employeeName, currentPage } = body;

        if (!employeeId) {
            return NextResponse.json(
                { success: false, message: "employeeId is required" },
                { status: 400 }
            );
        }

        await setDoc(
            doc(db, "employeeActivity", employeeId),
            {
                employeeId,
                employeeName: employeeName || "Unknown",
                currentPage: currentPage || "/",
                lastSeen: serverTimestamp(),
                lastSeenISO: new Date().toISOString(),
                isOnline: true,
            },
            { merge: true }
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error updating activity:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
