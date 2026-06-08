/**
 * Tests for admin export-salary route:
 *   POST /api/admin/export-salary
 */

const { createRequest } = require("../helpers/request");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs:    jest.fn(),
}));

jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet:    jest.fn(() => ({})),
    book_new:         jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

const ff   = require("firebase/firestore");
const XLSX = require("xlsx");

function makeEmployeeDoc(overrides = {}) {
  const now   = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year  = now.getFullYear();
  return {
    id:   "emp-001",
    data: () => ({
      employeeName:      "John Doe",
      department:        "Engineering",
      employeeSalary:    "60000",
      otherAllowances:   "5000",
      advanceLoan:       "0",
      performanceBonus:  "2000",
      salesCommission:   "0",
      dateOfJoining:     "2024-01-01",
      Attendance: [
        { date: `01/${month}/${year}`, checkin: { status: "Present" } },
        { date: `02/${month}/${year}`, checkin: { status: "Late" } },
        { date: `03/${month}/${year}`, checkin: { status: "Absent" } },
      ],
      ...overrides,
    }),
  };
}

function mockQuerySnapshot(docs) {
  return { docs };
}

function setupDefaults() {
  ff.collection.mockReturnValue("col-ref");
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
  XLSX.utils.json_to_sheet.mockReturnValue({});
  XLSX.utils.book_new.mockReturnValue({});
  XLSX.utils.book_append_sheet.mockImplementation(() => {});
  XLSX.write.mockReturnValue(new Uint8Array([1, 2, 3]));
}

describe("POST /api/admin/export-salary", () => {
  let exportSalary;
  beforeAll(() => { exportSalary = require("../../src/app/api/admin/export-salary/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 with Excel content-type header", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployeeDoc()]));
    const res = await exportSalary();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  test("includes Content-Disposition attachment header", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployeeDoc()]));
    const res = await exportSalary();
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain("Salary_Report");
  });

  test("calls getDocs to fetch employees", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await exportSalary();
    expect(ff.getDocs).toHaveBeenCalledTimes(1);
  });

  test("calls XLSX.utils.json_to_sheet with salary rows", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployeeDoc()]));
    await exportSalary();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    const [rows] = XLSX.utils.json_to_sheet.mock.calls[0];
    expect(rows).toHaveLength(1);
    expect(rows[0]["Name"]).toBe("John Doe");
  });

  test("calculates salary row with correct fields", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployeeDoc()]));
    await exportSalary();
    const [rows] = XLSX.utils.json_to_sheet.mock.calls[0];
    const row = rows[0];
    expect(row["Name"]).toBeDefined();
    expect(row["Basic Salary"]).toBeDefined();
    expect(row["Tax"]).toBeDefined();
    expect(row["Net Payable"]).toBeDefined();
  });

  test("handles employees with no attendance data", async () => {
    ff.getDocs.mockResolvedValueOnce(
      mockQuerySnapshot([makeEmployeeDoc({ Attendance: undefined })])
    );
    const res = await exportSalary();
    expect(res.status).toBe(200);
    const [rows] = XLSX.utils.json_to_sheet.mock.calls[0];
    expect(rows[0]["Total Absents"]).toBe(0);
  });

  test("returns 200 for empty employees list", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await exportSalary();
    expect(res.status).toBe(200);
    const [rows] = XLSX.utils.json_to_sheet.mock.calls[0];
    expect(rows).toHaveLength(0);
  });

  test("applies tax slab correctly for salary in zero-tax bracket", async () => {
    ff.getDocs.mockResolvedValueOnce(
      mockQuerySnapshot([makeEmployeeDoc({ employeeSalary: "40000", Attendance: [] })])
    );
    await exportSalary();
    const [rows] = XLSX.utils.json_to_sheet.mock.calls[0];
    // Annual = 40000 * 12 = 480000 ≤ 600000 → tax = 0
    expect(rows[0]["Tax"]).toBe(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("DB error"));
    const res = await exportSalary();
    expect(res.status).toBe(500);
  });
});
