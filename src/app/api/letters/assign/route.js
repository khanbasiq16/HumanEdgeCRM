import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const subVars = (text, map) => {
  if (!text) return text;
  return Object.entries(map).reduce((s, [k, v]) => s.split(k).join(v || k), text);
};

const buildLetter = (tmpl, company, emp, assignedBy) => {
  const today    = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const deptName = typeof emp.department === "object"
    ? emp.department?.departmentName || ""
    : emp.department || "";

  const varMap = {
    "[Employee Name]": emp.employeeName   || "",
    "[Employee ID]":   emp.employeeId     || emp.id || "",
    "[Designation]":   emp.designation    || emp.role || "",
    "[Department]":    deptName,
    "[Join Date]":     emp.joinDate       || "",
    "[Salary]":        emp.salary         ? `PKR ${emp.salary}` : "",
    "[Company Name]":  company?.name      || "",
    "[Date]":          today,
    "[Contract Date]": today,
    "[Month]":         new Date().toLocaleDateString("en-US", { month: "long" }),
    "[Year]":          new Date().getFullYear().toString(),
    "[From Date]":     "[From Date]",
    "[To Date]":       "[To Date]",
    "[Duration]":      "[Duration]",
  };

  const filledBlocks = (tmpl.fields || []).map(block => {
    if (block.type === "payslip") {
      return {
        ...block,
        period:       subVars(block.period  || "", varMap),
        netPay:       subVars(block.netPay  || "", varMap),
        earnings:     (block.earnings   || []).map(r => ({ ...r, amount: subVars(r.amount || "", varMap) })),
        deductions:   (block.deductions || []).map(r => ({ ...r, amount: subVars(r.amount || "", varMap) })),
        employeeName: emp.employeeName || "",
        employeeId:   emp.employeeId   || emp.id || "",
        designation:  emp.designation  || emp.role || "",
        department:   deptName,
        joinDate:     emp.joinDate     || "",
      };
    }
    return {
      ...block,
      content: subVars(block.content, varMap),
      label:   subVars(block.label,   varMap),
    };
  });

  const letterId = uuidv4();
  return {
    id:           letterId,
    templateId:   tmpl.id,
    templateName: tmpl.templateName || "Untitled Letter",
    company:      company ? {
      name:               company.name,
      companyAddress:     company.companyAddress,
      companyEmail:       company.companyEmail || company.companyemail,
      companyPhoneNumber: company.companyPhoneNumber,
      companyWebsite:     company.companyWebsite,
      companylogo:        company.companylogo || company.companyLogo,
    } : null,
    employeeId:   emp.id,
    employeeName: emp.employeeName || "",
    assignedBy:   assignedBy || "Admin",
    assignedAt:   new Date().toISOString(),
    isRead:       false,
    blocks:       filledBlocks,
  };
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { templateId, assignedBy } = body;

    /* support single employeeId OR array employeeIds */
    const employeeIds = body.employeeIds
      ? body.employeeIds
      : body.employeeId
      ? [body.employeeId]
      : [];

    if (!templateId || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "templateId and at least one employeeId required" },
        { status: 400 }
      );
    }

    const tmplSnap = await getDoc(doc(db, "templates", templateId));
    if (!tmplSnap.exists()) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    const tmpl = { id: tmplSnap.id, ...tmplSnap.data() };

    let company = null;
    if (tmpl.company) {
      const compSnap = await getDoc(doc(db, "companies", tmpl.company));
      if (compSnap.exists()) company = { id: compSnap.id, ...compSnap.data() };
    }

    const results = await Promise.all(
      employeeIds.map(async (empId) => {
        const empSnap = await getDoc(doc(db, "employees", empId));
        if (!empSnap.exists()) return { empId, success: false, error: "Not found" };
        const emp    = { id: empSnap.id, ...empSnap.data() };
        const letter = buildLetter(tmpl, company, emp, assignedBy);
        await setDoc(doc(collection(db, "assigned_letters"), letter.id), letter);
        return { empId, success: true, letter };
      })
    );

    const failed = results.filter(r => !r.success);
    return NextResponse.json({
      success: true,
      assigned: results.filter(r => r.success).length,
      failed:   failed.length,
      letters:  results.filter(r => r.success).map(r => r.letter),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
