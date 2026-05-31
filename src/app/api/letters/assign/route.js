import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const isContract = tmpl.role === "Admin" || tmpl.role === "Contract";
  return {
    id:           letterId,
    templateId:   tmpl.id,
    templateName: tmpl.templateName || "Untitled Letter",
    templateRole: isContract ? "Contract" : "Employee",
    isContract,
    canvasData:   isContract ? (tmpl.canvasData || null) : null,
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
    blocks:       isContract ? [] : filledBlocks,
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
        /* ── Duplicate prevention: check if already assigned ── */
        const dupSnap = await getDocs(
          query(
            collection(db, "assigned_letters"),
            where("templateId",  "==", templateId),
            where("employeeId",  "==", empId)
          )
        );
        if (!dupSnap.empty) {
          return { empId, success: false, error: "already_assigned" };
        }

        const empSnap = await getDoc(doc(db, "employees", empId));
        if (!empSnap.exists()) return { empId, success: false, error: "not_found" };
        const emp    = { id: empSnap.id, ...empSnap.data() };
        const letter = buildLetter(tmpl, company, emp, assignedBy);
        await setDoc(doc(collection(db, "assigned_letters"), letter.id), letter);
        return { empId, success: true, letter };
      })
    );

    const succeeded      = results.filter(r => r.success);
    const alreadyAssigned = results.filter(r => r.error === "already_assigned");
    const notFound        = results.filter(r => r.error === "not_found");

    /* If ALL were already assigned, return a meaningful error */
    if (succeeded.length === 0 && alreadyAssigned.length > 0) {
      return NextResponse.json({
        success: false,
        error: alreadyAssigned.length === 1
          ? "This template is already assigned to the selected employee."
          : `This template is already assigned to ${alreadyAssigned.length} of the selected employees.`,
        alreadyAssigned: alreadyAssigned.length,
      }, { status: 409 });
    }

    return NextResponse.json({
      success:         true,
      assigned:        succeeded.length,
      alreadyAssigned: alreadyAssigned.length,
      failed:          notFound.length,
      letters:         succeeded.map(r => r.letter),
      message: alreadyAssigned.length > 0
        ? `Assigned to ${succeeded.length}. ${alreadyAssigned.length} already had this template.`
        : undefined,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
