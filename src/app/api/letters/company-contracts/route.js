import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId  = searchParams.get("employeeId");
    const companySlug = searchParams.get("companyId"); // URL [id] = companyslug

    if (!employeeId || !companySlug) {
      return NextResponse.json(
        { success: false, error: "employeeId and companyId required" },
        { status: 400 }
      );
    }

    /* Resolve company name from its slug field */
    const compSnap = await getDocs(
      query(collection(db, "companies"), where("companyslug", "==", companySlug))
    );

    if (compSnap.empty) {
      return NextResponse.json({ success: true, contracts: [] });
    }

    const companyName = (compSnap.docs[0].data().name || "").toLowerCase();

    /* All assigned letters for this employee */
    const snap = await getDocs(
      query(collection(db, "assigned_letters"), where("employeeId", "==", employeeId))
    );
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /* Keep only contracts that belong to this company */
    const contracts = all.filter(l => {
      const isContract =
        l.isContract === true ||
        l.templateRole === "Admin" ||
        l.templateRole === "Contract";
      const matchesCompany =
        (l.company?.name || "").toLowerCase() === companyName;
      return isContract && matchesCompany;
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
