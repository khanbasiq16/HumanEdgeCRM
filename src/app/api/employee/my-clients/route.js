import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "employeeId required" }, { status: 400 });
    }

    const snap = await getDocs(
      query(collection(db, "clients"), where("userid", "==", employeeId))
    );

    const clients = snap.docs.map(d => ({
      id:      d.id,
      name:    d.data().clientName    || d.data().name    || "",
      email:   d.data().clientEmail   || d.data().email   || "",
      phone:   d.data().clientPhone   || d.data().phone   || "",
      address: d.data().clientAddress || d.data().address || "",
    }));

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
