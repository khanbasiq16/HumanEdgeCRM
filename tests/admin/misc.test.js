/**
 * Tests for miscellaneous admin routes:
 *   POST /api/admin/signup
 *   POST /api/assign-companies
 *   PUT  /api/update-company-status/[id]
 *   POST /api/department/[id]           (update department)
 */

const { createRequest } = require("../helpers/request");
const { makeEmployee, makeCompany, makeDepartment, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));
jest.mock("firebase/firestore", () => ({
  collection:      jest.fn(),
  doc:             jest.fn(),
  setDoc:          jest.fn(),
  getDoc:          jest.fn(),
  getDocs:         jest.fn(),
  updateDoc:       jest.fn(),
  addDoc:          jest.fn(),
  serverTimestamp: jest.fn(() => "server-ts"),
}));

const ff  = require("firebase/firestore");
const fa  = require("firebase/auth");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
  ff.addDoc.mockResolvedValue({ id: "notif-001" });
}

// ── POST /api/admin/signup ────────────────────────────────────────────────

describe("POST /api/admin/signup", () => {
  let signup;
  beforeAll(() => { signup = require("../../src/app/api/admin/signup/route").POST; });
  beforeEach(() => {
    setupDefaults();
    fa.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "new-uid-001" },
    });
  });

  test("returns 200 on successful signup", async () => {
    const res  = await signup(createRequest("POST", { email: "admin@co.com", password: "pass123", name: "Admin" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.uid).toBe("new-uid-001");
  });

  test("calls createUserWithEmailAndPassword", async () => {
    await signup(createRequest("POST", { email: "admin@co.com", password: "pass123" }));
    expect(fa.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  });

  test("calls setDoc to save user record", async () => {
    await signup(createRequest("POST", { email: "admin@co.com", password: "pass123" }));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.setDoc.mock.calls[0];
    expect(data.role).toBe("superAdmin");
  });

  test("returns 400 when email is missing", async () => {
    const res = await signup(createRequest("POST", { password: "pass123" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when password is missing", async () => {
    const res = await signup(createRequest("POST", { email: "admin@co.com" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 when firebase auth throws", async () => {
    fa.createUserWithEmailAndPassword.mockRejectedValueOnce(new Error("auth error"));
    const res = await signup(createRequest("POST", { email: "admin@co.com", password: "pass123" }));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/assign-companies ────────────────────────────────────────────

describe("POST /api/assign-companies", () => {
  let assignCompanies;
  beforeAll(() => { assignCompanies = require("../../src/app/api/assign-companies/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful assignment", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"));
    const res  = await assignCompanies(createRequest("POST", {
      employeeId: "emp-001",
      companyIds: ["co-001", "co-002"],
      companyNames: ["TechCorp", "BizCo"],
    }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with new companyIds", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"));
    await assignCompanies(createRequest("POST", {
      employeeId:   "emp-001",
      companyIds:   ["co-001"],
      companyNames: ["TechCorp"],
    }));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.companyIds).toEqual(["co-001"]);
  });

  test("creates a notification for the employee", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"));
    await assignCompanies(createRequest("POST", {
      employeeId: "emp-001",
      companyIds: ["co-001"],
    }));
    expect(ff.addDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when employeeId is missing", async () => {
    const res = await assignCompanies(createRequest("POST", { companyIds: ["co-001"] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when companyIds is not an array", async () => {
    const res = await assignCompanies(createRequest("POST", { employeeId: "emp-001", companyIds: "co-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 404 when employee not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await assignCompanies(createRequest("POST", { employeeId: "ghost", companyIds: [] }));
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await assignCompanies(createRequest("POST", { employeeId: "emp-001", companyIds: [] }));
    expect(res.status).toBe(500);
  });
});

// ── PUT /api/update-company-status/[id] ───────────────────────────────────

describe("PUT /api/update-company-status/[id]", () => {
  let updateCompanyStatus;
  beforeAll(() => { updateCompanyStatus = require("../../src/app/api/update-company-status/[id]/route").PUT; });
  beforeEach(() => {
    setupDefaults();
    ff.getDocs.mockResolvedValue(mockQuerySnapshot([makeCompany()]));
  });

  test("returns 200 on successful status update", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCompany(), "co-001"));
    const res  = await updateCompanyStatus(createRequest("PUT", { status: "inactive" }), { params: { id: "co-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with new status", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCompany(), "co-001"));
    await updateCompanyStatus(createRequest("PUT", { status: "inactive" }), { params: { id: "co-001" } });
    expect(ff.updateDoc).toHaveBeenCalledWith("doc-ref", { status: "inactive" });
  });

  test("returns companies array in response", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCompany(), "co-001"));
    const body = await (await updateCompanyStatus(createRequest("PUT", { status: "active" }), { params: { id: "co-001" } })).json();
    expect(Array.isArray(body.companies)).toBe(true);
  });

  test("returns 404 when company not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await updateCompanyStatus(createRequest("PUT", { status: "active" }), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateCompanyStatus(createRequest("PUT", { status: "active" }), { params: { id: "co-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/department/[id] (update) ────────────────────────────────────

describe("POST /api/department/[id]", () => {
  let updateDepartment;
  beforeAll(() => { updateDepartment = require("../../src/app/api/department/[id]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeDepartment(), "dept-001"));
    const res  = await updateDepartment(
      createRequest("POST", { departmentName: "Updated Dept" }),
      { params: { id: "dept-001" } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with provided body", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeDepartment(), "dept-001"));
    await updateDepartment(
      createRequest("POST", { departmentName: "HR", checkInTime: "9:00 AM" }),
      { params: { id: "dept-001" } }
    );
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 404 when department not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await updateDepartment(
      createRequest("POST", { departmentName: "X" }),
      { params: { id: "ghost" } }
    );
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateDepartment(
      createRequest("POST", { departmentName: "X" }),
      { params: { id: "dept-001" } }
    );
    expect(res.status).toBe(500);
  });
});
