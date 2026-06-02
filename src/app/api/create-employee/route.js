import { auth, db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";
import { sendpassowrdEmail } from "@/lib/SendpasswordEmail";

export async function POST(req) {
  try {
    

    const body =  await req.json();
    const {
      companyIds,
      companyName,
      employeeName,
      employeeAddress,
      employeeemail,
      employeepassword,
      employeePhone,
      employeeCNIC,
      employeeSalary,
      department,
      designation,
      totalWorkingHours,
      dateOfJoining,
      salesTarget,
      bankName,
      bankCode,
      bankAccountNumber,
    } = body





  
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one company must be selected" },
        { status: 400 }
      );
    }

    
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      employeeemail,
      employeepassword
    );

    const user = userCredential.user;
    const employeeId = user.uid;

   
    await setDoc(doc(collection(db, "employees"), employeeId), {
      employeeId,
      companyIds,
      companyName: companyName || "",
      employeeName,
      employeeAddress,
      employeeemail,
      employeePhone,
      employeeCNIC,
      employeeSalary,
      department,
      designation:      designation || "",
      totalWorkingHours,
      dateOfJoining,
      Attendance: [],
      isCheckedin:false,
      isCheckedout:true,
      salesTarget: salesTarget || "",
      bankName:          bankName          || "",
      bankCode:          bankCode          || "",
      bankAccountNumber: bankAccountNumber || "",
      status: "active",
      createdAt: new Date().toISOString(),
    });

    
    const employeesCollection = collection(db, "employees");
    const snapshot = await getDocs(employeesCollection);

    const employees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    
    /* ── Welcome email ── */
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 40px 32px;text-align:center;">
                  <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;">✨</div>
                  <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">Welcome to HR Portal!</h1>
                  <p style="color:#c7d2fe;font-size:14px;margin:0;">Your employee account has been created successfully.</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#1e1b4b;">${employeeName}</strong>,</p>
                  <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
                    Your account has been successfully registered on the HR Portal. You can now sign in and access your workspace to manage attendance, view your payslips, receive official letters, and more.
                  </p>

                  <!-- Credentials Box -->
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 14px;">Your Login Credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:5px 0;width:100px;">📧 Email</td>
                        <td style="font-size:13px;color:#1e293b;font-weight:600;padding:5px 0;">${employeeemail}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:5px 0;">🏢 Department</td>
                        <td style="font-size:13px;color:#1e293b;font-weight:600;padding:5px 0;">${department}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:5px 0;">📅 Joining Date</td>
                        <td style="font-size:13px;color:#1e293b;font-weight:600;padding:5px 0;">${dateOfJoining}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hrportal.com"}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 36px;border-radius:10px;">
                      Sign In to Your Account →
                    </a>
                  </div>

                  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
                    If you did not register for this account, please contact your HR administrator immediately.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} HR Portal · All rights reserved</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    sendpassowrdEmail({
      to:      employeeemail,
      subject: `Welcome to HR Portal, ${employeeName}! 🎉`,
      html:    welcomeHtml,
    }).catch(() => {}); /* non-blocking — don't fail registration if email fails */

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        employees,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
