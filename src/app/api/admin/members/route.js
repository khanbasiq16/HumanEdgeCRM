import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [membersSnap, invitesSnap] = await Promise.all([
      adminDb.collection("users").where("role", "==", "admin").get(),
      adminDb.collection("invitations").where("status", "==", "pending").get(),
    ]);

    const members = membersSnap.docs.map((d) => ({
      _type: "member",
      uid: d.id,
      ...d.data(),
    }));

    const invitations = invitesSnap.docs.map((d) => ({
      _type: "invitation",
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ success: true, members, invitations });
  } catch (error) {
    console.error("❌ Get members error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

const MODULE_NAMES = {
  employees:     "Employees & Departments",
  companies:     "Companies",
  attendance:    "Attendance",
  accounts:      "Accounts & Finance",
  invoice:       "Invoices",
  tasks:         "Tasks & Projects",
  announcements: "Announcements",
  members:       "Admin Members",
  templates:     "Templates",
  settings:      "Settings",
};

export async function PATCH(req) {
  try {
    const { id, permissions } = await req.json();
    if (!id || !permissions?.length) {
      return NextResponse.json({ success: false, error: "ID and permissions required" }, { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(id).get();
    const oldPerms = userDoc.data()?.permissions || [];

    await adminDb.collection("users").doc(id).update({ permissions });

    const added   = permissions.filter((p) => !oldPerms.includes(p));
    const removed = oldPerms.filter((p) => !permissions.includes(p));

    const notifs = [];
    if (added.length > 0) {
      notifs.push({
        userId:    id,
        type:      "permission_added",
        title:     "New permissions granted",
        body:      `You have been given access to: ${added.map((p) => MODULE_NAMES[p] || p).join(", ")}`,
        isRead:    false,
        createdAt: new Date(),
      });
    }
    if (removed.length > 0) {
      notifs.push({
        userId:    id,
        type:      "permission_removed",
        title:     "Permissions removed",
        body:      `Your access has been removed for: ${removed.map((p) => MODULE_NAMES[p] || p).join(", ")}`,
        isRead:    false,
        createdAt: new Date(),
      });
    }
    if (notifs.length === 0) {
      notifs.push({
        userId:    id,
        type:      "permission_update",
        title:     "Your permissions have been updated",
        body:      `Active permissions: ${permissions.map((p) => MODULE_NAMES[p] || p).join(", ")}`,
        isRead:    false,
        createdAt: new Date(),
      });
    }

    await Promise.all(notifs.map((n) => adminDb.collection("adminNotifications").add(n)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ success: false, error: "UID required" }, { status: 400 });

    await Promise.all([
      adminDb.collection("users").doc(uid).delete(),
      adminAuth.deleteUser(uid).catch((err) => {
        // user-not-found means they were already removed from Auth — not a fatal error
        if (err.code !== "auth/user-not-found") throw err;
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
