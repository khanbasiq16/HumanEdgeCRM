/**
 * E2E tests — POST /api/create-invoice
 *              GET  /api/get-invoice/[id]
 */

const { POST: createInvoice } = require("../../src/app/api/create-invoice/route");
const { createRequest } = require("../helpers/request");
const { makeInvoice, makeCompany, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("@/lib/firebaseAdmin", () => ({
  admin: { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
  adminDb: { collection: jest.fn(() => ({ add: jest.fn().mockResolvedValue({}) })) },
  adminAuth: {},
  fcmAdmin: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  Timestamp: { now: jest.fn(() => new Date()) },
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.arrayUnion.mockImplementation((v) => v);
}

function validPayload(overrides = {}) {
  return {
    companySlug: "techcorp",
    clientId: "client-001",
    invoiceNumber: "INV-001",
    invoiceDate: "2024-01-15",
    totalAmount: 50000,
    invoiceAmount: 50000,
    createdBy: "Admin",
    status: "pending",
    Description: "Web development services",
    user_id: "admin-uid-001",
    ...overrides,
  };
}

function setupCreate(companyData = makeCompany(), invoicesAfter = []) {
  ff.getDocs
    .mockResolvedValueOnce(mockQuerySnapshot([companyData]))
    .mockResolvedValueOnce(mockQuerySnapshot(invoicesAfter));
}

describe("POST /api/create-invoice", () => {
  beforeEach(() => setupDefaults());

  test("returns 200 on successful invoice creation", async () => {
    setupCreate();
    const res = await createInvoice(createRequest("POST", validPayload()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.invoiceId).toBeDefined();
    expect(body.invoiceLink).toBeDefined();
  });

  test("invoice link contains companySlug and invoiceId", async () => {
    setupCreate();
    const body = await (await createInvoice(createRequest("POST", validPayload()))).json();
    expect(body.invoiceLink).toContain("techcorp");
    expect(body.invoiceLink).toContain(body.invoiceId);
    expect(body.invoiceLink).toMatch(/\/invoice\//);
  });

  test("invoiceId is a UUID (36 chars)", async () => {
    setupCreate();
    const body = await (await createInvoice(createRequest("POST", validPayload()))).json();
    expect(body.invoiceId).toHaveLength(36);
  });

  test("calls setDoc to persist invoice", async () => {
    setupCreate();
    await createInvoice(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("calls updateDoc to add invoiceId to company", async () => {
    setupCreate();
    await createInvoice(createRequest("POST", validPayload()));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("saved invoice has correct totalAmount as number", async () => {
    setupCreate();
    await createInvoice(createRequest("POST", validPayload({ totalAmount: "75000" })));
    const saved = ff.setDoc.mock.calls[0][1];
    expect(typeof saved.totalAmount).toBe("number");
    expect(saved.totalAmount).toBe(75000);
  });

  test("saved invoice has assignedEmployeeId as null when not provided", async () => {
    setupCreate();
    await createInvoice(createRequest("POST", validPayload()));
    const saved = ff.setDoc.mock.calls[0][1];
    expect(saved.assignedEmployeeId).toBeNull();
  });

  test("saves assignedEmployee when provided", async () => {
    setupCreate();
    await createInvoice(createRequest("POST", validPayload({ assignedEmployeeId: "emp-001", assignedEmployeeName: "John" })));
    expect(ff.setDoc.mock.calls[0][1].assignedEmployeeId).toBe("emp-001");
  });

  test("returns 400 when clientId is missing", async () => {
    const res = await createInvoice(createRequest("POST", validPayload({ clientId: undefined })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Missing required fields/i);
  });

  test("returns 400 when invoiceNumber is missing", async () => {
    const res = await createInvoice(createRequest("POST", validPayload({ invoiceNumber: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 400 when companySlug is missing", async () => {
    const res = await createInvoice(createRequest("POST", validPayload({ companySlug: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 404 when company not found by slug", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await createInvoice(createRequest("POST", validPayload({ companySlug: "nonexistent" })));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/Company not found/i);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await createInvoice(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/get-invoice/[id]", () => {
  let getInvoiceRoute;

  beforeAll(() => {
    getInvoiceRoute = require("../../src/app/api/get-invoice/[id]/route");
  });

  beforeEach(() => setupDefaults());

  test("returns 200 with invoice data when found", async () => {
    const invoice = makeInvoice({ invoiceId: "inv-001" });
    ff.getDoc.mockResolvedValueOnce(mockDoc(invoice, "inv-001"));
    const req = createRequest("GET", null, { path: "/api/get-invoice/inv-001" });
    const res = await getInvoiceRoute.GET(req, { params: { id: "inv-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("returns 404 when invoice not found", async () => {
    ff.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
    const req = createRequest("GET", null, { path: "/api/get-invoice/ghost" });
    const res = await getInvoiceRoute.GET(req, { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });
});
