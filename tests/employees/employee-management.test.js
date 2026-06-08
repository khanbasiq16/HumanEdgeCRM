/**
 * Tests for employee management routes:
 *   POST /api/update-employee/[id]
 *   POST /api/update-employee-status
 *   POST /api/bulk-update-status
 *   POST /api/delete-employee
 */

const { createRequest } = require("../helpers/request");
const { makeEmployee, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

// Self-contained mock: no external variable references (avoids jest.mock hoisting issues)
jest.mock("@/lib/firebaseAdmin", () => {
  const authObj = { updateUser: jest.fn().mockResolvedValue(undefined), deleteUser: jest.fn().mockResolvedValue(undefined) };
  const batchObj = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
  return {
    admin:    { auth: () => authObj, firestore: { FieldValue: { serverTimestamp: () => "server-ts" } } },
    adminDb:  { batch: () => batchObj, collection: jest.fn(() => ({ doc: jest.fn(() => "doc-ref") })) },
    adminAuth: authObj,
    fcmAdmin: {},
  };
});

// Get references to mock functions after mock is registered
const { admin: mockAdmin, adminDb: mockAdminDb, adminAuth: mockAdminAuth } = jest.requireMock("@/lib/firebaseAdmin");
const mockAdminAuthObj = mockAdmin.auth();
const mockBatch = mockAdminDb.batch();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDoc:     jest.fn(),
  getDocs:    jest.fn(),
  updateDoc:  jest.fn(),
  deleteDoc:  jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.updateDoc.mockResolvedValue(undefined);
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));

  // jest.resetAllMocks() (from jest.setup.js global beforeEach) wipes the factory
  // implementations off any jest.fn() in the mock module — restore them here.
  const { adminDb: mockAdminDbRef } = jest.requireMock("@/lib/firebaseAdmin");
  mockAdminDbRef.collection.mockImplementation(() => ({ doc: jest.fn(() => "doc-ref") }));
  mockBatch.commit.mockResolvedValue(undefined);
  mockAdminAuthObj.updateUser.mockResolvedValue(undefined);
  mockAdminAuthObj.deleteUser.mockResolvedValue(undefined);
  mockAdminAuth.updateUser.mockResolvedValue(undefined);
}

// ── POST /api/update-employee/[id] ────────────────────────────────────────

describe("POST /api/update-employee/[id]", () => {
  let updateEmployee;
  beforeAll(() => { updateEmployee = require("../../src/app/api/update-employee/[id]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"))
      .mockResolvedValueOnce(mockDoc(makeEmployee({ employeeName: "Jane" }), "emp-001"));
    const res  = await updateEmployee(createRequest("POST", { employeeName: "Jane" }), { params: { id: "emp-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with provided fields", async () => {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"))
      .mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"));
    await updateEmployee(createRequest("POST", { employeeName: "Jane", department: "HR" }), { params: { id: "emp-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.employeeName).toBe("Jane");
    expect(data.updatedAt).toBeDefined();
  });

  test("returns updated employee in response", async () => {
    const updated = makeEmployee({ employeeName: "Updated" });
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee(), "emp-001"))
      .mockResolvedValueOnce(mockDoc(updated, "emp-001"));
    const body = await (await updateEmployee(createRequest("POST", { employeeName: "Updated" }), { params: { id: "emp-001" } })).json();
    expect(body.employee).toBeDefined();
  });

  test("returns 404 when employee not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await updateEmployee(createRequest("POST", { employeeName: "X" }), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("db error"));
    const res = await updateEmployee(createRequest("POST", { employeeName: "X" }), { params: { id: "emp-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/update-employee-status ──────────────────────────────────────

describe("POST /api/update-employee-status", () => {
  let updateStatus;
  beforeAll(() => { updateStatus = require("../../src/app/api/update-employee-status/route").POST; });
  beforeEach(() => {
    setupDefaults();
    ff.getDocs.mockResolvedValue(mockQuerySnapshot([makeEmployee()]));
  });

  test("returns 200 and activates employee", async () => {
    const res  = await updateStatus(createRequest("POST", { employeeId: "emp-001", status: "active" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls admin.auth().updateUser with disabled: false for active", async () => {
    await updateStatus(createRequest("POST", { employeeId: "emp-001", status: "active" }));
    expect(mockAdminAuthObj.updateUser).toHaveBeenCalledWith("emp-001", { disabled: false });
  });

  test("calls admin.auth().updateUser with disabled: true for inactive", async () => {
    await updateStatus(createRequest("POST", { employeeId: "emp-001", status: "inactive" }));
    expect(mockAdminAuthObj.updateUser).toHaveBeenCalledWith("emp-001", { disabled: true });
  });

  test("calls updateDoc to persist status in Firestore", async () => {
    await updateStatus(createRequest("POST", { employeeId: "emp-001", status: "active" }));
    expect(ff.updateDoc).toHaveBeenCalledWith("doc-ref", { status: "active" });
  });

  test("returns employees array in response", async () => {
    const body = await (await updateStatus(createRequest("POST", { employeeId: "emp-001", status: "active" }))).json();
    expect(Array.isArray(body.employees)).toBe(true);
  });

  test("returns 400 when employeeId is missing", async () => {
    const res = await updateStatus(createRequest("POST", { status: "active" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when status is missing", async () => {
    const res = await updateStatus(createRequest("POST", { employeeId: "emp-001" }));
    expect(res.status).toBe(400);
  });
});

// ── POST /api/bulk-update-status ──────────────────────────────────────────

describe("POST /api/bulk-update-status", () => {
  let bulkUpdate;
  beforeAll(() => { bulkUpdate = require("../../src/app/api/bulk-update-status/route").POST; });
  beforeEach(() => {
    setupDefaults();
    ff.getDocs.mockResolvedValue(mockQuerySnapshot([makeEmployee(), makeEmployee({ employeeId: "emp-002" })]));
  });

  test("returns 200 on successful bulk deactivate", async () => {
    const res  = await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001", "emp-002"], status: "deactivate" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls adminAuth.updateUser disabled:true for deactivate", async () => {
    await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001"], status: "deactivate" }));
    expect(mockAdminAuthObj.updateUser).toHaveBeenCalledWith("emp-001", { disabled: true });
  });

  test("calls adminAuth.updateUser disabled:false for active", async () => {
    await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001"], status: "active" }));
    expect(mockAdminAuthObj.updateUser).toHaveBeenCalledWith("emp-001", { disabled: false });
  });

  test("calls batch.commit", async () => {
    await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001"], status: "active" }));
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  test("returns employees array in response", async () => {
    const body = await (await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001"], status: "active" }))).json();
    expect(Array.isArray(body.employees)).toBe(true);
  });

  test("returns 400 when employeeIds is empty", async () => {
    const res = await bulkUpdate(createRequest("POST", { employeeIds: [], status: "active" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when status is missing", async () => {
    const res = await bulkUpdate(createRequest("POST", { employeeIds: ["emp-001"] }));
    expect(res.status).toBe(400);
  });
});

// ── POST /api/delete-employee ──────────────────────────────────────────────

describe("POST /api/delete-employee", () => {
  let deleteEmployee;
  beforeAll(() => { deleteEmployee = require("../../src/app/api/delete-employee/route").POST; });
  beforeEach(() => {
    setupDefaults();
    ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
  });

  test("returns 200 on successful deletion", async () => {
    const res  = await deleteEmployee(createRequest("POST", { employeeIds: ["emp-001"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls admin.auth().deleteUser for each employee", async () => {
    await deleteEmployee(createRequest("POST", { employeeIds: ["emp-001", "emp-002"] }));
    expect(mockAdminAuthObj.deleteUser).toHaveBeenCalledTimes(2);
  });

  test("calls deleteDoc for each employee", async () => {
    await deleteEmployee(createRequest("POST", { employeeIds: ["emp-001", "emp-002"] }));
    expect(ff.deleteDoc).toHaveBeenCalledTimes(2);
  });

  test("returns updated employees list", async () => {
    ff.getDocs.mockResolvedValue(mockQuerySnapshot([makeEmployee()]));
    const body = await (await deleteEmployee(createRequest("POST", { employeeIds: ["emp-001"] }))).json();
    expect(Array.isArray(body.employees)).toBe(true);
  });

  test("returns 400 when employeeIds is empty array", async () => {
    const res = await deleteEmployee(createRequest("POST", { employeeIds: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when employeeIds is not an array", async () => {
    const res = await deleteEmployee(createRequest("POST", { employeeIds: "emp-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when employeeIds is missing", async () => {
    const res = await deleteEmployee(createRequest("POST", {}));
    expect(res.status).toBe(400);
  });
});
