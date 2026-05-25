import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const body = await req.json();
    const { role, company } = body;

    if (!role) {
      return NextResponse.json({ success: false, message: "Role is required" });
    }

    if (role === "Admin" && !company) {
      return NextResponse.json({ success: false, message: "Company is required for Contract templates" });
    }

    const templateId = uuidv4();

    let companyStoredId = null;

    if (company) {
      const companyRef  = doc(db, "companies", company);
      const companySnap = await getDoc(companyRef);

      if (!companySnap.exists()) {
        return NextResponse.json({ success: false, message: `Company does not exist` });
      }

      const companydata = companySnap.data();
      companyStoredId   = companydata?.companyId || company;

      if (role === "Admin") {
        await updateDoc(companyRef, { ContactTemplates: arrayUnion(templateId) });
      }
    }

    // Create template
    const templateRef = doc(db, "templates", templateId);
    await setDoc(templateRef, {
      templateId,
      role,
      company: companyStoredId,
      fields:  [],
      createdAt: new Date(),
    });



    const templateaRef = collection(db, "templates");
    const templatesnapshot = await getDocs(templateaRef);

    const rawTemplates = templatesnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Har template ke liye company ka data fetch karein
    const enrichedTemplates = await Promise.all(
      rawTemplates.map(async (template) => {
        // Maan lete hain template.company mein sirf ID pari hai
        const companyId = template.company;

        if (companyId) {
          // Companies collection se is ID ka document nikalein
          const companyRef = doc(db, "companies", companyId);
          const companySnap = await getDoc(companyRef);

          if (companySnap.exists()) {
            // Agar company mil jaye to template ke company field mein pura data assign kar dein
            return {
              ...template,
              company: {
                id: companySnap.id,
                ...companySnap.data()
              }
            };
          }
        }
        return template;
      })
    );


    return NextResponse.json({
      success: true,
      message: "Template created successfully",
      templateId,
      templates: enrichedTemplates,
    });

  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
