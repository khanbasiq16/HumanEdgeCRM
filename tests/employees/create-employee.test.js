/**
 * E2E tests — POST /api/create-employee
 *
 * Covers: successful creation, validation, Firebase auth errors,
 *         Firestore write, email (non-blocking), all employees returned.
 */

const { POST } = require("../../src/app/api/create-employee/route");
const { createRequest } = require("../helpers/request");
const { makeEmployee, mockQuerySnapshot } = require("../helpers/mockData");

// ── Mocks ──────────────────────────────────────────────────────────────
jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn().mockReturnValue("col-ref"),
  doc: jest.fn().mockReturnValue("doc-ref"),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn(),
}));

jest.mock("@/lib/SendpasswordEmail", () => ({
  sendpassowrdEmail: jest.fn().mockResolvedValue(undefined),
}));

const { createUserWithEmailAndPassword } = require("firebase/auth");
const { collection, doc, getDocs, setDoc } = require("firebase/firestore");
const { sendpassowrdEmail } = require("@/lib/SendpasswordEmail");

// Re-establish mocks after global resetAllMocks() — sendpassowrdEmail().catch() throws if undefined
function setupDefaults() {
  collection.mockReturnValue("col-ref");
  doc.mockReturnValue("doc-ref");
  setDoc.mockResolvedValue(undefined);
  sendpassowrdEmail.mockResolvedValue(undefined);
}

// ── Payload factory ────────────────────────────────────────────────────
function validPayload(overrides = {}) {
  return {
    companyIds: ["company-001"],
    companyName: "techcorp",
    employeeName: "John Doe",
    employeeAddress: "Karachi, Pakistan",
    employeeemail: "john@example.com",
    employeepassword: "John@123",
    employeePhone: "+923001234567",
    employeeCNIC: "42201-1234567-1",
    employeeSalary: "50000",
    department: "Engineering",
    designation: "Software Engineer",
    totalWorkingHours: "9",
    dateOfJoining: "2024-01-01",
    salesTarget: "",
    bankName: "HBL",
    bankCode: "0001",
    bankAccountNumber: "0123456789",
    ...overrides,
  };
}

const fakeFirebaseUser = { uid: "new-emp-uid-001" };

// ── Tests ──────────────────────────────────────────────────────────────
describe("POST /api/create-employee", () => {
  beforeEach(() => {
    setupDefaults();
  });

  // ── Happy path ─────────────────────────────────────────────────────
  test("returns 200 with success and all employees on valid payload", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });

    const employees = [makeEmployee()];
    getDocs.mockResolvedValueOnce(mockQuerySnapshot(employees));

    const req = createRequest("POST", validPayload());
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/created successfully/i);
    expect(Array.isArray(body.employees)).toBe(true);
  });

  test("calls Firestore setDoc to save the new employee", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployee()]));

    const req = createRequest("POST", validPayload());
    await POST(req);

    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  test("calls createUserWithEmailAndPassword with correct email and password", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    const payload = validPayload();
    const req = createRequest("POST", payload);
    await POST(req);

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      payload.employeeemail,
      payload.employeepassword
    );
  });

  test("sends welcome email non-blocking (does not reject on email failure)", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    sendpassowrdEmail.mockRejectedValueOnce(new Error("SMTP error"));

    const req = createRequest("POST", validPayload());
    const res = await POST(req);
    const body = await res.json();

    // Despite email failure, employee creation should still succeed
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("new employee has correct initial state (Attendance[], isCheckedin: false)", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    const req = createRequest("POST", validPayload());
    await POST(req);

    const setDocCall = setDoc.mock.calls[0][1];
    expect(setDocCall.Attendance).toEqual([]);
    expect(setDocCall.isCheckedin).toBe(false);
    expect(setDocCall.isCheckedout).toBe(true);
    expect(setDocCall.status).toBe("active");
  });

  // ── Validation ─────────────────────────────────────────────────────
  test("returns 400 when companyIds is empty", async () => {
    const req = createRequest("POST", validPayload({ companyIds: [] }));
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/company/i);
  });

  test("returns 400 when companyIds is not an array", async () => {
    const req = createRequest("POST", validPayload({ companyIds: "company-001" }));
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  // ── Firebase auth errors ───────────────────────────────────────────
  test("returns 500 when Firebase Auth rejects (e.g. email already in use)", async () => {
    const error = new Error("Firebase: Email already in use");
    error.code = "auth/email-already-in-use";
    createUserWithEmailAndPassword.mockRejectedValueOnce(error);

    const req = createRequest("POST", validPayload());
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  // ── Multiple companies ─────────────────────────────────────────────
  test("accepts multiple companyIds", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeFirebaseUser });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    const req = createRequest("POST", validPayload({
      companyIds: ["company-001", "company-002", "company-003"],
    }));

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);

    const savedData = setDoc.mock.calls[0][1];
    expect(savedData.companyIds).toEqual(["company-001", "company-002", "company-003"]);
  });
});
