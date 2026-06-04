import { NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signToken } from "@/lib/signToken";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    let userData = null;

    userData = userDoc.data();

    if (!userData) {
      return NextResponse.json(
        { error: "Invalid User" },
        { status: 404 }
      );
    }

    const allowedRoles = ["admin", "superAdmin"];
    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: "Access denied. You are not authorized to access the admin panel." },
        { status: 403 }
      );
    }

    const token = signToken({
      id: user.uid,
      email: user.email,
      role: userData.role,

    });

    const response = NextResponse.json({
      message: `Login successfully (Admin)`,
      user: { ...userData, uid: user.uid },
      token,
      success: true,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
