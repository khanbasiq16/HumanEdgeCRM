import { NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/SendEmail";

export async function POST(req) {
  try {
    const body = await req.json();

    const companySlug = body.companyName;
    const clientEmail = body.clientEmail;

    const q1 = query(
      collection(db, "companies"),
      where("companyslug", "==", companySlug)
    );
    const querySnapshot = await getDocs(q1);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const companyDoc = querySnapshot.docs[0];
    const companyData = { id: companyDoc.id, ...companyDoc.data() };

    const q2 = query(
      collection(db, "clients"),
      where("clientEmail", "==", clientEmail)
    );
    const existingClientSnapshot = await getDocs(q2);

    if (!existingClientSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Client already exists with this email" },
        { status: 400 }
      );
    }

    // Create new client
    const clientId = uuidv4();
    const clientData = {
      id: clientId,
      companyId: companyData.id,
      companyName: companyData.name,
      companySlug: companyData.companyslug,
      clientName: body.clientName,
      clientEmail,
      clientAddress: body.clientAddress,
      clientPhone: body.clientPhone,
      projectsDetails: body.projectsDetails,
      packageDetails: body.packageDetails,
      clientWebsite: body.clientWebsite,
      assignedEmployeeId:   body.assignedEmployeeId   || null,
      assignedEmployeeName: body.assignedEmployeeName || null,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "clients", clientId), clientData);

    await updateDoc(doc(db, "companies", companyData.id), {
      AssignClient: arrayUnion(clientId),
    });

   
    const allClientsQuery = query(
      collection(db, "clients"),
      where("companyId", "==", companyData.id)
    );
    const snapshot = await getDocs(allClientsQuery);

    const allclients = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    
    const htmlTemplate = `
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.08);border:1px solid #e6e6e6;">
    
    <div style="background-color:#007bff;padding:25px 20px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:0.5px;">
        Welcome to ${companyData.name} 🎉
      </h1>
    </div>
    
    <div style="padding:25px 30px;">
      <p style="font-size:16px;color:#333;margin-bottom:10px;">
        Hi <strong>${body.clientName}</strong>,
      </p>
      <p style="font-size:15px;color:#555;line-height:1.6;margin-bottom:15px;">
        We’re thrilled to have you join the <strong>${companyData.name}</strong> family!  
        Our mission is to help your business thrive with seamless collaboration and transparent communication.
      </p>
      <p style="font-size:15px;color:#555;line-height:1.6;margin-bottom:25px;">
        View updates, and stay connected with our team.
      </p>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="${companyData.companyWebsite || '#'}" 
           style="background-color:#007bff;color:white;padding:14px 35px;border-radius:6px;
                  text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Visit Our Website
        </a>
      </div>
      
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      
      <p style="font-size:14px;color:#666;margin-bottom:5px;">
        Warm regards,
      </p>
      <p style="font-size:15px;color:#333;margin:0;font-weight:bold;">
        ${companyData.name}
      </p>
      <p style="font-size:14px;color:#888;margin-top:3px;">
        ${companyData.companyemail || ""}
      </p>
    </div>
    
    <div style="background-color:#f9f9f9;padding:15px;text-align:center;border-top:1px solid #eee;">
      <p style="font-size:12px;color:#999;margin:0;">
        © ${new Date().getFullYear()} ${companyData.name}. All rights reserved.
      </p>
    </div>
    `;

    await sendEmail({
      to: clientEmail,
      subject: `Welcome to ${companyData.name}!`,
      html: htmlTemplate,
      EMAIL_HOST: companyData.companyemailhost,
      EMAIL_PORT: companyData.companysmtphost ,
      EMAIL_USER: companyData.companyemail,
      EMAIL_PASS: companyData.companyemailpassword,
    });

    return NextResponse.json({ success: true, allclients });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
