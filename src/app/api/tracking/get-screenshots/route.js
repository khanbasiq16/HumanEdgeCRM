import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get("employeeId");
        const date = searchParams.get("date");
        const pageSize = parseInt(searchParams.get("pageSize") || "50");

        const ref = collection(db, "screenTracking");
        let constraints = [orderBy("createdAt", "desc"), limit(pageSize)];

        if (employeeId) constraints.unshift(where("employeeId", "==", employeeId));
        if (date) constraints.unshift(where("date", "==", date));

        const q = query(ref, ...constraints);
        const snapshot = await getDocs(q);

        const screenshots = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt || null,
        }));

        return NextResponse.json({ success: true, screenshots }, { status: 200 });
    } catch (error) {
        console.error("Error fetching screenshots:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
