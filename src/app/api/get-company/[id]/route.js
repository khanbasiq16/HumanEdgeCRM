import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
  doc, getDoc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Company slug required" }, { status: 400 });
    }

    /* Fetch company by slug */
    const snap = await getDocs(
      query(collection(db, "companies"), where("companyslug", "==", id))
    );
    if (snap.empty) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const docSnap    = snap.docs[0];
    const companyData = { id: docSnap.id, ...docSnap.data() };

    /* ── Resolve AssignEmployee IDs → names ── */
    const empIds = Array.isArray(companyData.AssignEmployee) ? companyData.AssignEmployee : [];
    const employeeNames = [];
    for (const eid of empIds) {
      try {
        const eSnap = await getDoc(doc(db, "employees", eid));
        if (eSnap.exists()) {
          const d = eSnap.data();
          employeeNames.push(d.employeeName || d.name || eid);
        }
      } catch { employeeNames.push(eid); }
    }

    /* ── Resolve ContactTemplates IDs → names ── */
    const tmplIds = Array.isArray(companyData.ContactTemplates) ? companyData.ContactTemplates : [];
    const templateNames = [];
    for (const tid of tmplIds) {
      try {
        const tSnap = await getDoc(doc(db, "templates", tid));
        if (tSnap.exists()) {
          const d = tSnap.data();
          templateNames.push(d.templateName || d.name || tid);
        }
      } catch { templateNames.push(tid); }
    }

    /* ── Live client count from clients collection ── */
    let clientCount = 0;
    try {
      const cSnap = await getDocs(
        query(collection(db, "clients"), where("companyName", "==", id))
      );
      clientCount = cSnap.size;
    } catch {}

    return NextResponse.json({
      success: true,
      company: {
        ...companyData,
        resolvedEmployees:  employeeNames,
        resolvedTemplates:  templateNames,
        liveClientCount:    clientCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
