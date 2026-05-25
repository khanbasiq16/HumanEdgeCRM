import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!q || q.length < 1) return NextResponse.json({ employees: [], companies: [], templates: [] });

  try {
    const [empSnap, compSnap, tmplSnap] = await Promise.all([
      getDocs(query(collection(db, "employees"), limit(200))),
      getDocs(query(collection(db, "companies"), limit(100))),
      getDocs(query(collection(db, "templates"), limit(100))),
    ]);

    const employees = empSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e =>
        e.employeeName?.toLowerCase().includes(q) ||
        e.employeeemail?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.department?.toLowerCase?.()?.includes(q) ||
        e.department?.departmentName?.toLowerCase?.()?.includes(q)
      )
      .slice(0, 5)
      .map(e => ({
        type:  "employee",
        id:    e.id,
        label: e.employeeName || "Employee",
        sub:   e.designation || e.employeeemail || "",
        href:  `/admin/employees/${e.id}/viewdetails`,
      }));

    const companies = compSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.companyAddress?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map(c => ({
        type:  "company",
        id:    c.id,
        label: c.name || "Company",
        sub:   c.companyAddress || "",
        href:  `/admin/company/${c.companyslug || c.id}`,
      }));

    const templates = tmplSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.templateName?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(t => ({
        type:  "template",
        id:    t.id,
        label: t.templateName || "Template",
        sub:   t.role || "",
        href:  `/admin/templates`,
      }));

    return NextResponse.json({ employees, companies, templates });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
