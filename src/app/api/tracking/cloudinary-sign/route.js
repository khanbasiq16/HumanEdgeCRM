import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get("employeeId") || "unknown";

        const timestamp = Math.round(Date.now() / 1000);
        const folder = `employee_tracking/${employeeId}`;

        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            process.env.CLOUDINARY_API_SECRET
        );

        return NextResponse.json({
            success: true,
            signature,
            timestamp,
            folder,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
        });
    } catch (error) {
        console.error("Cloudinary sign error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
