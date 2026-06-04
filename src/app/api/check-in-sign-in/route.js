import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signToken, signRefreshToken } from "@/lib/signToken";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Firebase Auth error:", err.code);

     
      if (err.code === "auth/user-disabled") {
        return NextResponse.json(

          {
            success: false,
            error: "Your account is currently deactive. Contact admin.",
          },
          { status: 403 }
        );
      }

      // 🔹 Handle invalid credentials
      if (err.code === "auth/invalid-credential" || err.code === "auth/invalid-login-credentials") {
        return NextResponse.json(
          { success: false, error: "Invalid email or password." },
          { status: 401 }
        );
      }

      // 🔹 Any other Firebase error
      return NextResponse.json(
        { success: false, error: "Unable to sign in. Please try again later." },
        { status: 500 }
      );
    }

    const loggedInUser = userCredential.user;

    // 🔹 Get Firestore user data
    const userRef = doc(db, "employees", loggedInUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Account not found. Please try again." },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // 🔹 Fetch department info
    let departmentData = null;
    if (userData.department) {
      const deptRef = collection(db, "departments");
      const deptQuery = query(deptRef, where("departmentName", "==", userData.department));
      const deptSnapshot = await getDocs(deptQuery);

      if (!deptSnapshot.empty) {
        departmentData = {
          id: deptSnapshot.docs[0].id,
          ...deptSnapshot.docs[0].data(),
        };
      }
    }

    // 🔹 Fetch associated companies
    let companiesData = [];
    if (Array.isArray(userData.companyIds) && userData.companyIds.length > 0) {
      const companiesRef = collection(db, "companies");
      const companiesQuery = query(
        companiesRef,
        where("companyId", "in", userData.companyIds)
      );
      const companiesSnapshot = await getDocs(companiesQuery);

      companiesData = companiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // 🔹 Create slug
    const slug = userData?.employeeName?.trim()?.replace(/\s+/g, "-")?.toLowerCase();

    const tokenPayload = {
      id: loggedInUser.uid,
      email: loggedInUser.email,
      role: "employee",
      slug,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({
      message: "Login successfully",
      user: {
        role: "employee",
        ...userData,
        department: departmentData || null,
        companies: companiesData || [],
      },
      token,
      success: true,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json(
      { success: false, error: "Server error." },
      { status: 500 }
    );
  }
}
