import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

const capitalizeWords = (str) => {
  return str
    .replace(/-/g, " ") 
    .replace(/\b\w/g, (l) => l.toUpperCase()); 
};

export async function GET(req, { params }) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Company slug is required" },
        { status: 400 }
      );
    }
    
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("companySlug", "==", slug));
    const snapshot = await getDocs(q);

    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, clients }, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clients", error: error.message },
      { status: 500 }
    );
  }
}
