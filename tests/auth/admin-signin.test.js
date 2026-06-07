/**
 * E2E tests — POST /api/admin/signin
 *
 * Covers: valid login, missing fields, wrong password,
 *         non-existent user, non-admin role, Firebase error.
 */

const { POST } = require("../../src/app/api/admin/signin/route");
const { createRequest } = require("../helpers/request");
const { makeAdminUser } = require("../helpers/mockData");

// ── Mocks ──────────────────────────────────────────────────────────────
jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn().mockReturnValue("user-doc-ref"),
  getDoc: jest.fn(),
}));

jest.mock("@/lib/signToken", () => ({
  signToken: jest.fn().mockReturnValue("mock-access-token"),
  signRefreshToken: jest.fn().mockReturnValue("mock-refresh-token"),
}));

const { signInWithEmailAndPassword } = require("firebase/auth");
const { doc, getDoc } = require("firebase/firestore");
const { signToken, signRefreshToken } = require("@/lib/signToken");

// Re-establish mock defaults after global jest.resetAllMocks() clears them
function setupDefaults() {
  doc.mockReturnValue("user-doc-ref");
  signToken.mockReturnValue("mock-access-token");
  signRefreshToken.mockReturnValue("mock-refresh-token");
}

// ── Helpers ────────────────────────────────────────────────────────────
const makeFirebaseUser = (uid = "admin-uid-001") => ({
  user: { uid, email: "admin@humanedge.com" },
});

const makeUserDoc = (data) => ({
  exists: () => true,
  data: () => data,
});

const makeEmptyDoc = () => ({
  exists: () => false,
  data: () => null,
});

// ── Tests ──────────────────────────────────────────────────────────────
describe("POST /api/admin/signin", () => {
  beforeEach(() => {
    setupDefaults();
  });

  // ── Happy path ─────────────────────────────────────────────────────
  test("returns 200 and tokens on valid admin credentials", async () => {
    const adminData = makeAdminUser({ role: "admin" });

    signInWithEmailAndPassword.mockResolvedValueOnce(
      makeFirebaseUser(adminData.uid)
    );
    getDoc.mockResolvedValueOnce(makeUserDoc(adminData));

    const req = createRequest("POST", {
      email: "admin@humanedge.com",
      password: "Admin@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBe("mock-access-token");
    expect(body.message).toMatch(/Login successfully/i);
    expect(body.user.role).toBe("admin");
  });

  test("returns 200 and tokens on valid superAdmin credentials", async () => {
    const superAdminData = makeAdminUser({ role: "superAdmin" });

    signInWithEmailAndPassword.mockResolvedValueOnce(
      makeFirebaseUser(superAdminData.uid)
    );
    getDoc.mockResolvedValueOnce(makeUserDoc(superAdminData));

    const req = createRequest("POST", {
      email: "superadmin@humanedge.com",
      password: "Super@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("superAdmin");
  });

  test("response sets httpOnly token cookies", async () => {
    const adminData = makeAdminUser({ role: "admin" });
    signInWithEmailAndPassword.mockResolvedValueOnce(makeFirebaseUser());
    getDoc.mockResolvedValueOnce(makeUserDoc(adminData));

    const req = createRequest("POST", {
      email: "admin@humanedge.com",
      password: "Admin@123",
    });

    const res = await POST(req);
    const setCookie = res.headers.getSetCookie?.() || [];

    // Verify that cookie headers are set
    expect(setCookie.length).toBeGreaterThan(0);
    const cookieStr = setCookie.join("; ");
    expect(cookieStr).toContain("token=");
    expect(cookieStr).toContain("HttpOnly");
  });

  // ── Validation ─────────────────────────────────────────────────────
  test("returns 400 when email is missing", async () => {
    const req = createRequest("POST", { password: "Admin@123" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/required/i);
  });

  test("returns 400 when password is missing", async () => {
    const req = createRequest("POST", { email: "admin@humanedge.com" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/required/i);
  });

  test("returns 400 when both email and password are missing", async () => {
    const req = createRequest("POST", {});
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  // ── Auth errors ────────────────────────────────────────────────────
  test("returns 401 on wrong password", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(
      new Error("auth/wrong-password")
    );

    const req = createRequest("POST", {
      email: "admin@humanedge.com",
      password: "WrongPass",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/Invalid email or password/i);
  });

  test("returns 404 when user document does not exist in Firestore", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce(makeFirebaseUser());
    getDoc.mockResolvedValueOnce(makeEmptyDoc());

    const req = createRequest("POST", {
      email: "ghost@humanedge.com",
      password: "Admin@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/Invalid User/i);
  });

  test("returns 403 when user role is employee (not admin/superAdmin)", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce(makeFirebaseUser());
    getDoc.mockResolvedValueOnce(makeUserDoc({ role: "employee", email: "emp@humanedge.com" }));

    const req = createRequest("POST", {
      email: "emp@humanedge.com",
      password: "Emp@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/Access denied/i);
  });

  // ── Server error ───────────────────────────────────────────────────
  test("returns 500 when Firestore throws unexpectedly", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce(makeFirebaseUser());
    getDoc.mockRejectedValueOnce(new Error("Firestore connection failed"));

    const req = createRequest("POST", {
      email: "admin@humanedge.com",
      password: "Admin@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Something went wrong/i);
  });
});
