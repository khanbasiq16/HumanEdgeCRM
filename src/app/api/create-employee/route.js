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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to HumanEdge</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:48px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 40px rgba(0,0,0,0.09);max-width:580px;">

        <!-- ── Dark Header ── -->
        <tr>
          <td style="background:#0f172a;padding:36px 40px 28px;text-align:center;">
            <!-- Brand pill -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 18px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;">
                        <div style="width:34px;height:34px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:9px;font-size:17px;font-weight:900;color:#ffffff;text-align:center;line-height:34px;letter-spacing:-0.5px;">H</div>
                      </td>
                      <td style="vertical-align:middle;text-align:left;">
                        <div style="color:#f8fafc;font-size:16px;font-weight:800;letter-spacing:-0.4px;line-height:1.1;">HumanEdge</div>
                        <div style="color:#64748b;font-size:10px;font-weight:500;letter-spacing:0.05em;margin-top:2px;">HR Management Platform</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Icon -->
            <div style="width:60px;height:60px;background:linear-gradient(135deg,#2563eb,#1e40af);border-radius:18px;margin:0 auto 18px;font-size:28px;text-align:center;line-height:60px;">🎉</div>
            <h1 style="color:#f8fafc;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.4px;">Account Created Successfully</h1>
            <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">You have been registered on the HumanEdge HR Platform</p>
          </td>
        </tr>

        <!-- ── Blue Welcome Banner ── -->
        <tr>
          <td style="background:#2563eb;padding:14px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <p style="color:#bfdbfe;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 2px;">Welcome aboard</p>
                  <p style="color:#ffffff;font-size:17px;font-weight:800;margin:0;letter-spacing:-0.2px;">${employeeName}</p>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:5px 14px;display:inline-block;">
                    <span style="color:#eff6ff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${department}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 28px;">
              Hi <strong style="color:#0f172a;">${employeeName}</strong>,<br><br>
              Your employee account on <strong style="color:#2563eb;">HumanEdge</strong> has been set up and is ready to use. Sign in to access your HR workspace — mark attendance, view payslips, manage tasks, track projects, and receive official HR letters.
            </p>

            <!-- Account Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:28px;">
              <tr>
                <td colspan="2" style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 20px;">
                  <span style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Account Details</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;width:38%;vertical-align:middle;">
                  <span style="font-size:12px;color:#94a3b8;font-weight:500;">Login Email</span>
                </td>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                  <span style="font-size:13px;color:#1e293b;font-weight:700;">${employeeemail}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                  <span style="font-size:12px;color:#94a3b8;font-weight:500;">Department</span>
                </td>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                  <span style="font-size:13px;color:#1e293b;font-weight:600;">${department}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                  <span style="font-size:12px;color:#94a3b8;font-weight:500;">Designation</span>
                </td>
                <td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                  <span style="font-size:13px;color:#1e293b;font-weight:600;">${designation || "—"}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;vertical-align:middle;">
                  <span style="font-size:12px;color:#94a3b8;font-weight:500;">Date of Joining</span>
                </td>
                <td style="padding:12px 20px;vertical-align:middle;">
                  <span style="font-size:13px;color:#1e293b;font-weight:600;">${dateOfJoining || "—"}</span>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 44px;border-radius:10px;letter-spacing:0.01em;">
                    Sign In to HumanEdge &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Security Warning -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #fde68a;">
              <tr>
                <td style="background:#fffbeb;padding:14px 18px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:10px;font-size:15px;line-height:1;">&#9888;</td>
                      <td>
                        <p style="color:#92400e;font-size:12px;font-weight:700;margin:0 0 3px;">Keep your credentials secure</p>
                        <p style="color:#a16207;font-size:12px;margin:0;line-height:1.55;">Never share your login email or password. If you did not request this account, contact your HR administrator immediately.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
              <tr>
                <td style="vertical-align:middle;padding-right:8px;">
                  <div style="width:26px;height:26px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:7px;font-size:13px;font-weight:900;color:#fff;text-align:center;line-height:26px;">H</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="color:#e2e8f0;font-size:14px;font-weight:700;letter-spacing:-0.2px;">HumanEdge</span>
                  <span style="color:#334155;font-size:12px;margin-left:6px;">HR Management Platform</span>
                </td>
              </tr>
            </table>
            <p style="color:#475569;font-size:11px;margin:0 0 4px;">&copy; ${new Date().getFullYear()} HumanEdge. All rights reserved.</p>
            <p style="color:#334155;font-size:11px;margin:0;">This is an automated message &mdash; please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    sendpassowrdEmail({
      to:      employeeemail,
      subject: `Welcome to HumanEdge, ${employeeName}!`,
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
