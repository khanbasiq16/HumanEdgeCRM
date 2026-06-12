import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Receives only the Cloudinary URL (upload already done from browser)
export async function POST(req) {
    try {
        const body = await req.json();
        const { employeeId, employeeName, screenshotUrl, publicId } = body;

        if (!employeeId || !screenshotUrl) {
            return NextResponse.json(
                { success: false, message: "employeeId and screenshotUrl are required" },
                { status: 400 }
            );
        }

        const now = new Date();
        const TZ = "Asia/Karachi";
        const date = now.toLocaleDateString("en-GB",  { timeZone: TZ });
        const time = now.toLocaleTimeString("en-US", {
            timeZone: TZ,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        await addDoc(collection(db, "screenTracking"), {
            employeeId,
            employeeName: employeeName || "Unknown",
            screenshotUrl,
            publicId: publicId || "",
            date,
            time,
            timestamp: serverTimestamp(),
            createdAt: now.toISOString(),
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error saving screenshot metadata:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
