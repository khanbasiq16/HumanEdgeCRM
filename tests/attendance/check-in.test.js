/**
 * E2E tests — POST /api/check-in
 */

const { POST } = require("../../src/app/api/check-in/route");
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
  arrayUnion: jest.fn(),
}));

const ff = require("firebase/firestore");

// ── Default mock implementations (re-set after global resetAllMocks) ──
function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.updateDoc.mockResolvedValue(undefined);
  ff.arrayUnion.mockImplementation((v) => v);
}

const universalWhitelistDoc = mockDoc({ whitelist: [{ ip: "0.0.0.0/0" }] });
const officeWhitelistDoc = mockDoc({ whitelist: [{ ip: "192.168.1.0/24" }] });
const noWhitelistDoc = { exists: () => false, data: () => null };

function setupCheckIn({ employeeOverrides = {}, departmentOverrides = {}, whitelist = universalWhitelistDoc } = {}) {
  setupDefaults();
  const employee = makeEmployee(employeeOverrides);
  const department = makeDepartment(departmentOverrides);
  ff.getDoc
    .mockResolvedValueOnce(mockDoc(employee, employee.employeeId))
    .mockResolvedValueOnce(whitelist);
  ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([department]));
  return { employee, department };
}

describe("POST /api/check-in", () => {
  beforeEach(() => {
    setupDefaults();
  });

  test("returns 400 when employeeId is missing", async () => {
    const req = createRequest("POST", { note: "", ip: "192.168.1.1" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.message).toMatch(/Employee ID is required/i);
  });

  test("returns 404 when employee not found", async () => {
    ff.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
    const req = createRequest("POST", { employeeId: "ghost", note: "", ip: "1.2.3.4" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test("returns 404 when department not found", async () => {
    setupDefaults();
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee()))
      .mockResolvedValueOnce(universalWhitelistDoc);
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "1.2.3.4" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test("allows check-in with universal whitelist (0.0.0.0/0)", async () => {
    setupCheckIn();
    const req = createRequest("POST", { employeeId: "emp-001", note: "Morning", ip: "10.0.0.5" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("blocks check-in when IP not in whitelist subnet", async () => {
    setupDefaults();
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee()))
      .mockResolvedValueOnce(officeWhitelistDoc);
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeDepartment()]));
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "10.0.0.1" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/authorized office network/i);
  });

  test("allows check-in when IP matches office subnet", async () => {
    setupDefaults();
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee()))
      .mockResolvedValueOnce(officeWhitelistDoc);
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeDepartment()]));
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "192.168.1.55" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  test("returns 500 when whitelist document does not exist", async () => {
    setupDefaults();
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeEmployee()))
      .mockResolvedValueOnce(noWhitelistDoc);
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeDepartment()]));
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "1.2.3.4" });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/Whitelist not found/i);
  });

  test("returns 400 when employee is already checked in", async () => {
    setupCheckIn({ employeeOverrides: { isCheckedin: true } });
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "0.0.0.0" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already checked in/i);
  });

  test("returns 200 on successful check-in and calls updateDoc", async () => {
    setupCheckIn();
    const req = createRequest("POST", { employeeId: "emp-001", note: "On time", ip: "0.0.0.0" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isCheckedin).toBe(true);
    expect(body.isCheckedout).toBe(false);
    expect(body.attendance).toBeDefined();
    expect(typeof body.attendanceid).toBe("string");
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("updateDoc called with isCheckedin: true, isCheckedout: false", async () => {
    setupCheckIn();
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "0.0.0.0" });
    await POST(req);
    const updateArg = ff.updateDoc.mock.calls[0][1];
    expect(updateArg.isCheckedin).toBe(true);
    expect(updateArg.isCheckedout).toBe(false);
    expect(updateArg.startTime).toBeDefined();
  });

  test("attendance entry contains note and ip from request", async () => {
    setupCheckIn();
    const req = createRequest("POST", { employeeId: "emp-001", note: "Great day", ip: "192.168.1.200" });
    const body = await (await POST(req)).json();
    expect(body.attendance.checkin.note).toBe("Great day");
    expect(body.attendance.checkin.ip).toBe("192.168.1.200");
  });

  test("returns 400 if shift already has a check-in record for today", async () => {
    setupDefaults();
    const today = new Date().toLocaleDateString("en-GB");
    const employee = makeEmployee({
      isCheckedin: false,
      Attendance: [{ id: "att-1", date: today, checkin: { time: "9:00 AM", status: "On Time", note: "", ip: "x" }, checkout: {} }],
    });
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(employee))
      .mockResolvedValueOnce(universalWhitelistDoc);
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeDepartment({ checkInTime: "9:00 AM" })]));
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "0.0.0.0" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Attendance already recorded/i);
  });

  test("check-in status is one of the valid values", async () => {
    setupCheckIn({ departmentOverrides: { checkInTime: "9:00 AM", graceTime: "30" } });
    const req = createRequest("POST", { employeeId: "emp-001", note: "", ip: "0.0.0.0" });
    const body = await (await POST(req)).json();
    expect(["On Time", "Late", "Short Day", "Half Day"]).toContain(body.attendance?.checkin?.status);
  });
});
