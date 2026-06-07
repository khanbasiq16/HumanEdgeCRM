/**
 * E2E tests — POST /api/check-in-sign-in (Employee Login)
 *
 * Covers: valid login, missing fields, disabled account, invalid credentials,
 *         employee not in Firestore, department fetch, company fetch.
 */

const { POST } = require("../../src/app/api/check-in-sign-in/route");
const { createRequest } = require("../helpers/request");
const { makeEmployee, makeDepartment, makeCompany, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

// ── Mocks ──────────────────────────────────────────────────────────────
jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn().mockReturnValue("emp-doc-ref"),
  getDoc: jest.fn(),
  collection: jest.fn().mockReturnValue("collection-ref"),
  query: jest.fn().mockReturnValue("query-ref"),
  where: jest.fn().mockReturnValue("where-ref"),
  getDocs: jest.fn(),
}));

jest.mock("@/lib/signToken", () => ({
  signToken: jest.fn().mockReturnValue("mock-employee-token"),
  signRefreshToken: jest.fn().mockReturnValue("mock-employee-refresh"),
}));

const { signInWithEmailAndPassword } = require("firebase/auth");
const { doc, collection, query, where, getDoc, getDocs } = require("firebase/firestore");
const { signToken, signRefreshToken } = require("@/lib/signToken");

function setupDefaults() {
  doc.mockReturnValue("emp-doc-ref");
  collection.mockReturnValue("collection-ref");
  query.mockReturnValue("query-ref");
  where.mockReturnValue("where-ref");
  signToken.mockReturnValue("mock-employee-token");
  signRefreshToken.mockReturnValue("mock-employee-refresh");
}

// ── Helpers ────────────────────────────────────────────────────────────
const fakeFirebaseUser = { uid: "emp-001", email: "john@example.com" };

function setupSuccessfulLogin(employeeOverrides = {}) {
  const employee = makeEmployee(employeeOverrides);
  const department = makeDepartment();
  const company = makeCompany();

  signInWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
  getDoc.mockResolvedValueOnce(mockDoc(employee, employee.employeeId));
  // getDocs: first call → department, second call → companies
  getDocs
    .mockResolvedValueOnce(mockQuerySnapshot([department]))
    .mockResolvedValueOnce(mockQuerySnapshot([company]));

  return { employee, department, company };
}

// ── Tests ──────────────────────────────────────────────────────────────
describe("POST /api/check-in-sign-in (Employee Login)", () => {
  beforeEach(() => {
    setupDefaults();
  });

  // ── Happy path ─────────────────────────────────────────────────────
  test("returns 200 with user data and tokens on valid credentials", async () => {
    const { employee } = setupSuccessfulLogin();

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBe("mock-employee-token");
    expect(body.user.role).toBe("employee");
    expect(body.user.employeeName).toBe(employee.employeeName);
  });

  test("returns user with department data when department exists", async () => {
    const { department } = setupSuccessfulLogin();

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.user.department).toBeTruthy();
    expect(body.user.department.departmentName).toBe(department.departmentName);
  });

  test("returns user with companies array when companies exist", async () => {
    const { company } = setupSuccessfulLogin();

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(Array.isArray(body.user.companies)).toBe(true);
    expect(body.user.companies.length).toBeGreaterThan(0);
  });

  test("returns empty companies array when employee has no companyIds", async () => {
    const employee = makeEmployee({ companyIds: [] });
    const department = makeDepartment();

    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDoc.mockResolvedValueOnce(mockDoc(employee));
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([department]));

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.user.companies).toEqual([]);
  });

  test("sets httpOnly cookies on successful login", async () => {
    setupSuccessfulLogin();

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const setCookie = res.headers.getSetCookie?.() || [];
    const cookieStr = setCookie.join("; ");

    expect(cookieStr).toContain("token=");
    expect(cookieStr).toContain("HttpOnly");
  });

  // ── Validation ─────────────────────────────────────────────────────
  test("returns 400 when email is missing", async () => {
    const req = createRequest("POST", { password: "John@123" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/required/i);
  });

  test("returns 400 when password is missing", async () => {
    const req = createRequest("POST", { email: "john@example.com" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  // ── Firebase auth errors ───────────────────────────────────────────
  test("returns 403 when account is disabled", async () => {
    const error = new Error("auth/user-disabled");
    error.code = "auth/user-disabled";
    signInWithEmailAndPassword.mockRejectedValueOnce(error);

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/deactive/i);
  });

  test("returns 401 on invalid credentials", async () => {
    const error = new Error("auth/invalid-credential");
    error.code = "auth/invalid-credential";
    signInWithEmailAndPassword.mockRejectedValueOnce(error);

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "WrongPass",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/Invalid email or password/i);
  });

  test("returns 401 on invalid-login-credentials error code", async () => {
    const error = new Error("auth/invalid-login-credentials");
    error.code = "auth/invalid-login-credentials";
    signInWithEmailAndPassword.mockRejectedValueOnce(error);

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "WrongPass",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── Firestore errors ───────────────────────────────────────────────
  test("returns 404 when employee document not found in Firestore", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });

    const req = createRequest("POST", {
      email: "ghost@example.com",
      password: "Ghost@123",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  // ── Server error ───────────────────────────────────────────────────
  test("returns 500 on unexpected server error", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDoc.mockRejectedValueOnce(new Error("Firestore down"));

    const req = createRequest("POST", {
      email: "john@example.com",
      password: "John@123",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
