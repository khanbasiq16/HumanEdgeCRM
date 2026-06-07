/**
 * E2E tests — POST /api/check-out
 */

const { POST } = require("../../src/app/api/check-out/route");
const { createRequest } = require("../helpers/request");
const { makeEmployee, makeDepartment, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.updateDoc.mockResolvedValue(undefined);
}

const universalWhitelistDoc = mockDoc({ whitelist: [{ ip: "0.0.0.0/0" }] });
const officeWhitelistDoc = mockDoc({ whitelist: [{ ip: "192.168.1.0/24" }] });

// Checkout route reads: whitelist (getDoc#1), employee (getDoc#2), department (getDocs#1)
function makeCheckedInEmployee(overrides = {}) {
  const attendanceid = "att-open-001";
  const startTime = new Date(Date.now() - 9 * 3600 * 1000).toISOString();
  return makeEmployee({
    isCheckedin: true,
    isCheckedout: false,
    attendanceid,
    startTime,
    totalWorkingHours: "9",
    Attendance: [{
      id: attendanceid,
      date: "01/01/2024",
      checkin: { time: "9:00 AM", status: "On Time", note: "", ip: "1.2.3.4" },
      checkout: {},
    }],
    ...overrides,
  });
}

function setupCheckout({ employeeOverrides = {} } = {}) {
  setupDefaults();
  const employee = makeCheckedInEmployee(employeeOverrides);
  const department = makeDepartment({ graceTime: "15" });
  ff.getDoc
    .mockResolvedValueOnce(universalWhitelistDoc)
    .mockResolvedValueOnce(mockDoc(employee, employee.employeeId));
  ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([department]));
  return { employee, department };
}

describe("POST /api/check-out", () => {
  beforeEach(() => {
    setupDefaults();
  });

  test("returns 400 when employeeId is missing", async () => {
    const req = createRequest("POST", { ip: "1.2.3.4", note: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/Employee ID is required/i);
  });

  test("blocks checkout when IP not in whitelist", async () => {
    setupDefaults();
    ff.getDoc.mockResolvedValueOnce(officeWhitelistDoc);
    const req = createRequest("POST", { employeeId: "emp-001", ip: "10.0.0.1", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/authorized office network/i);
  });

  test("returns 404 when employee not found", async () => {
    setupDefaults();
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce({ exists: () => false, data: () => null });
    const req = createRequest("POST", { employeeId: "ghost", ip: "0.0.0.0", note: "" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test("returns 400 when employee is not checked in", async () => {
    setupDefaults();
    const employee = makeEmployee({ isCheckedin: false, isCheckedout: true });
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce(mockDoc(employee));
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/not checked in/i);
  });

  test("returns 400 when employee already checked out (isCheckedin:true, isCheckedout:true)", async () => {
    setupDefaults();
    // Route checks !isCheckedin first, then isCheckedout.
    // With isCheckedin:true, isCheckedout:true → hits "already checked out" branch
    const employee = makeEmployee({ isCheckedin: true, isCheckedout: true, attendanceid: "att-1",
      startTime: new Date().toISOString(), Attendance: [{ id: "att-1", date: "x", checkin: {}, checkout: {} }] });
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce(mockDoc(employee));
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already checked out/i);
  });

  test("returns 404 when attendance record id does not match", async () => {
    setupDefaults();
    const employee = makeCheckedInEmployee({
      attendanceid: "non-existent-id",
      Attendance: [{ id: "different-id", date: "01/01/2024", checkin: {}, checkout: {} }],
    });
    const department = makeDepartment();
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce(mockDoc(employee));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([department]));
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect((await res.json()).message).toMatch(/Attendance record not found/i);
  });

  test("returns 404 when department not found", async () => {
    setupDefaults();
    const employee = makeCheckedInEmployee();
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce(mockDoc(employee));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect((await res.json()).message).toMatch(/Department not found/i);
  });

  test("returns 400 when startTime is missing", async () => {
    setupDefaults();
    const employee = makeCheckedInEmployee({ startTime: undefined });
    const department = makeDepartment();
    ff.getDoc
      .mockResolvedValueOnce(universalWhitelistDoc)
      .mockResolvedValueOnce(mockDoc(employee));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([department]));
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Check-in time not found/i);
  });

  test("returns 200 on successful checkout", async () => {
    setupCheckout();
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "Done", stopwatchTime: "09:00:00" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isCheckedin).toBe(false);
    expect(body.isCheckedout).toBe(true);
  });

  test("updateDoc called with isCheckedin:false, isCheckedout:true, startTime:null", async () => {
    setupCheckout();
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    await POST(req);
    const updateArg = ff.updateDoc.mock.calls[0][1];
    expect(updateArg.isCheckedin).toBe(false);
    expect(updateArg.isCheckedout).toBe(true);
    expect(updateArg.startTime).toBeNull();
    expect(updateArg.attendanceid).toBe("");
  });

  test("checkout entry has note, ip, stopwatchTime from request", async () => {
    setupCheckout();
    const req = createRequest("POST", { employeeId: "emp-001", ip: "192.168.1.55", note: "Great day", stopwatchTime: "08:55:00" });
    const body = await (await POST(req)).json();
    expect(body.data.checkout.note).toBe("Great day");
    expect(body.data.checkout.ip).toBe("192.168.1.55");
    expect(body.data.checkout.stopwatchTime).toBe("08:55:00");
  });

  test("checkout status is a valid value", async () => {
    setupCheckout();
    const req = createRequest("POST", { employeeId: "emp-001", ip: "0.0.0.0", note: "", stopwatchTime: "09:00:00" });
    const body = await (await POST(req)).json();
    expect(["On Time Check Out", "Late Check Out", "Early Check Out"]).toContain(body.data?.checkout?.status);
  });
});
