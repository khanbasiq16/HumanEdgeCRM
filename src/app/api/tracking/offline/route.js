import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        let body;
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else {
            // sendBeacon sends text/plain
            const text = await req.text();
            try { body = JSON.parse(text); } catch { body = {}; }
        }

        const { employeeId, employeeName } = body;
        if (!employeeId) return new Response(null, { status: 204 });

        await setDoc(
            doc(db, "employeeActivity", employeeId),
            {
                employeeId,
                employeeName: employeeName || "Unknown",
                isOnline: false,
                lastSeenISO: new Date().toISOString(),
            },
            { merge: true }
        );

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error marking offline:", error);
        return new Response(null, { status: 500 });
    }
}
