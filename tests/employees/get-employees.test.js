/**
 * E2E tests — GET /api/get-all-employees
 *
 * Covers: returns all employees, empty list, Firestore error.
 */

const { GET } = require("../../src/app/api/get-all-employees/route");
const { createRequest } = require("../helpers/request");
const { makeEmployee, mockQuerySnapshot } = require("../helpers/mockData");

// ── Mocks ──────────────────────────────────────────────────────────────
jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn().mockReturnValue("col-ref"),
  getDocs: jest.fn(),
}));

const { collection, getDocs } = require("firebase/firestore");

function setupDefaults() {
  collection.mockReturnValue("col-ref");
}

// ── Tests ──────────────────────────────────────────────────────────────
describe("GET /api/get-all-employees", () => {
  beforeEach(() => {
    setupDefaults();
  });

  test("returns 200 with employees array", async () => {
    const employees = [
      makeEmployee({ employeeId: "emp-001", employeeName: "John Doe" }),
      makeEmployee({ employeeId: "emp-002", employeeName: "Jane Smith" }),
    ];
    getDocs.mockResolvedValueOnce(mockQuerySnapshot(employees));

    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.employees)).toBe(true);
    expect(body.employees).toHaveLength(2);
  });

  test("returns correct employee fields", async () => {
    const emp = makeEmployee({ employeeName: "Alice Khan" });
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([emp]));

    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    const returnedEmp = body.employees[0];
    expect(returnedEmp.employeeName).toBe("Alice Khan");
    expect(returnedEmp.department).toBe(emp.department);
    expect(returnedEmp.status).toBe("active");
  });

  test("returns empty array when no employees exist", async () => {
    getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.employees).toEqual([]);
  });

  test("returns 500 when Firestore throws", async () => {
    getDocs.mockRejectedValueOnce(new Error("Firestore unavailable"));

    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
