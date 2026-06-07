/**
 * E2E tests — POST /api/create-department
 *              GET  /api/get-all-department
 */

const { POST: createDept } = require("../../src/app/api/create-department/route");
const { GET: getAllDepts } = require("../../src/app/api/get-all-department/route");
const { createRequest } = require("../helpers/request");
const { makeDepartment, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.setDoc.mockResolvedValue(undefined);
}

describe("POST /api/create-department", () => {
  beforeEach(() => setupDefaults());

  const validPayload = () => ({
    departmentName: "Engineering",
    description: "Software engineering department",
    checkInTime: "9:00 AM",
    checkOutTime: "6:00 PM",
    graceTime: "15",
  });

  test("returns 200 with success and departments array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeDepartment()]));
    const res = await createDept(createRequest("POST", validPayload()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/created successfully/i);
    expect(Array.isArray(body.departments)).toBe(true);
  });

  test("calls setDoc to persist the department", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createDept(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("saved document has correct fields", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createDept(createRequest("POST", validPayload()));
    const savedData = ff.setDoc.mock.calls[0][1];
    expect(savedData.departmentName).toBe("Engineering");
    expect(savedData.checkInTime).toBe("9:00 AM");
    expect(savedData.graceTime).toBe("15");
  });

  test("departmentId is a UUID (36 chars)", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createDept(createRequest("POST", validPayload()));
    const savedData = ff.setDoc.mock.calls[0][1];
    expect(typeof savedData.departmentId).toBe("string");
    expect(savedData.departmentId).toHaveLength(36);
  });

  test("returns 400 when departmentName is missing", async () => {
    const res = await createDept(createRequest("POST", { description: "No name" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Department name is required/i);
  });

  test("returns 400 when body is empty", async () => {
    const res = await createDept(createRequest("POST", {}));
    expect(res.status).toBe(400);
  });

  test("uses empty string defaults for optional fields", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createDept(createRequest("POST", { departmentName: "HR" }));
    const savedData = ff.setDoc.mock.calls[0][1];
    expect(savedData.description).toBe("");
    expect(savedData.checkInTime).toBe("");
    expect(savedData.checkOutTime).toBe("");
    expect(savedData.graceTime).toBe("");
  });

  test("returns 500 on Firestore error", async () => {
    ff.setDoc.mockRejectedValueOnce(new Error("Firestore down"));
    const res = await createDept(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/get-all-department", () => {
  beforeEach(() => setupDefaults());

  test("returns 200 with departments array", async () => {
    const depts = [makeDepartment({ departmentName: "Engineering" }), makeDepartment({ departmentName: "HR" })];
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot(depts));
    const body = await (await getAllDepts(createRequest("GET"))).json();
    expect(body.success).toBe(true);
    expect(body.departments).toHaveLength(2);
  });

  test("returns empty array when no departments", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAllDepts(createRequest("GET"))).json();
    expect(body.departments).toEqual([]);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getAllDepts(createRequest("GET"));
    expect(res.status).toBe(500);
  });
});
