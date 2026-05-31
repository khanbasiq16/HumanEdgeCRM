import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "employeeId required" }, { status: 400 });
    }

    const snap = await getDocs(
      query(collection(db, "assigned_letters"), where("employeeId", "==", employeeId))
    );
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /* Known contracts (new assignments with role info) */
    const knownContracts = all.filter(l => l.isContract === true || l.templateRole === "Admin");

    /* Old records without role info — check template */
    const unknown = all.filter(l => !l.templateRole && l.isContract === undefined);
    const templateCache = {};
    const resolvedContracts = [];

    for (const letter of unknown) {
      if (!letter.templateId) continue;
      if (!templateCache[letter.templateId]) {
        try {
          const tmplSnap = await getDoc(doc(db, "templates", letter.templateId));
          templateCache[letter.templateId] = tmplSnap.exists() ? tmplSnap.data() : null;
        } catch { templateCache[letter.templateId] = null; }
      }
      const tmpl = templateCache[letter.templateId];
      if (tmpl?.role === "Admin" || tmpl?.role === "Contract") {
        resolvedContracts.push({
          ...letter,
          isContract: true,
          templateRole: "Admin",
          canvasData: letter.canvasData || tmpl.canvasData || null,
        });
      }
    }

    const contracts = [...knownContracts, ...resolvedContracts]
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
