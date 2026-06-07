/**
 * E2E tests — GET /api/get-all-companies
 *              GET /api/get-company/[id]  (finds company by slug via getDocs)
 */

const { GET: getAllCompanies } = require("../../src/app/api/get-all-companies/route");
const { createRequest } = require("../helpers/request");
const { makeCompany, mockQuerySnapshot, mockDoc } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
}

describe("GET /api/get-all-companies", () => {
  beforeEach(() => setupDefaults());

  test("returns 200 with companies array", async () => {
    const companies = [
      makeCompany({ companyId: "c-001", name: "TechCorp" }),
      makeCompany({ companyId: "c-002", name: "FinanceCo" }),
    ];
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot(companies));

    const res = await getAllCompanies(createRequest("GET"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.companies).toHaveLength(2);
  });

  test("returns company with correct slug field", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCompany({ companyslug: "techcorp" })]));
    const body = await (await getAllCompanies(createRequest("GET"))).json();
    expect(body.companies[0].companyslug).toBe("techcorp");
  });

  test("returns empty array when no companies", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAllCompanies(createRequest("GET"))).json();
    expect(body.companies).toEqual([]);
  });

  test("returns 500 when Firestore throws", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("Firestore offline"));
    const res = await getAllCompanies(createRequest("GET"));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/get-company/[id] ─────────────────────────────────────────
// The route finds company by slug (getDocs), then optionally fetches
// assigned employees/templates via getDoc, then fetches client count.
describe("GET /api/get-company/[id]", () => {
  let getCompanyRoute;

  beforeAll(() => {
    getCompanyRoute = require("../../src/app/api/get-company/[id]/route");
  });

  beforeEach(() => setupDefaults());

  test("returns 200 with company data when found", async () => {
    const company = makeCompany({ companyId: "c-001", name: "TechCorp", AssignEmployee: [], ContactTemplates: [] });
    // getDocs call 1: company lookup by slug → found
    // getDocs call 2: client count query
    ff.getDocs
      .mockResolvedValueOnce(mockQuerySnapshot([company]))
      .mockResolvedValueOnce(mockQuerySnapshot([])); // clients count

    const req = createRequest("GET", null, { path: "/api/get-company/techcorp" });
    const res = await getCompanyRoute.GET(req, { params: { id: "techcorp" } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.company.name).toBe("TechCorp");
    expect(body.company.liveClientCount).toBe(0);
  });

  test("returns 404 when company not found by slug", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    const req = createRequest("GET", null, { path: "/api/get-company/ghost" });
    const res = await getCompanyRoute.GET(req, { params: { id: "ghost" } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  test("returns 400 when id param is missing", async () => {
    const req = createRequest("GET", null, { path: "/api/get-company/" });
    const res = await getCompanyRoute.GET(req, { params: { id: undefined } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  test("includes resolvedEmployees array in response", async () => {
    const company = makeCompany({ AssignEmployee: ["emp-001"], ContactTemplates: [] });
    // getDocs for company, then getDoc for each employee, then getDocs for clients
    ff.getDocs
      .mockResolvedValueOnce(mockQuerySnapshot([company]))
      .mockResolvedValueOnce(mockQuerySnapshot([]));
    ff.getDoc.mockResolvedValueOnce(mockDoc({ employeeName: "John Doe" }, "emp-001"));

    const req = createRequest("GET", null, { path: "/api/get-company/techcorp" });
    const res = await getCompanyRoute.GET(req, { params: { id: "techcorp" } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.company.resolvedEmployees).toContain("John Doe");
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("Firestore error"));
    const req = createRequest("GET", null, { path: "/api/get-company/techcorp" });
    const res = await getCompanyRoute.GET(req, { params: { id: "techcorp" } });
    expect(res.status).toBe(500);
  });
});
