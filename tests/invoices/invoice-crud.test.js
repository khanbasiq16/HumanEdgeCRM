/**
 * Tests for invoice CRUD routes:
 *   DELETE /api/delete-invoice/[id]
 *   PATCH  /api/expire-invoice/[id]
 *   GET    /api/get-all-invoice/[id]   (by companySlug)
 *   GET    /api/all-invoices
 */

const { createRequest } = require("../helpers/request");
const { makeInvoice, makeCompany, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDoc:     jest.fn(),
  getDocs:    jest.fn(),
  deleteDoc:  jest.fn(),
  updateDoc:  jest.fn(),
  query:      jest.fn(),
  where:      jest.fn(),
  arrayRemove: jest.fn((v) => v),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── DELETE /api/delete-invoice/[id] ───────────────────────────────────────

describe("DELETE /api/delete-invoice/[id]", () => {
  let deleteInvoice;
  beforeAll(() => { deleteInvoice = require("../../src/app/api/delete-invoice/[id]/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCompany()]));
    const res  = await deleteInvoice(createRequest("DELETE"), { params: { id: "inv-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls deleteDoc", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCompany()]));
    await deleteInvoice(createRequest("DELETE"), { params: { id: "inv-001" } });
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("calls updateDoc to remove invoiceId from company", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCompany()]));
    await deleteInvoice(createRequest("DELETE"), { params: { id: "inv-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 404 when invoice not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await deleteInvoice(createRequest("DELETE"), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("still deletes even when company not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await deleteInvoice(createRequest("DELETE"), { params: { id: "inv-001" } });
    expect(res.status).toBe(200);
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("db error"));
    const res = await deleteInvoice(createRequest("DELETE"), { params: { id: "inv-001" } });
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/expire-invoice/[id] ────────────────────────────────────────

describe("PATCH /api/expire-invoice/[id]", () => {
  let expireInvoice;
  beforeAll(() => { expireInvoice = require("../../src/app/api/expire-invoice/[id]/route").PATCH; });
  beforeEach(() => setupDefaults());

  test("returns 200 on success", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    const res  = await expireInvoice(createRequest("PATCH"), { params: { id: "inv-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with status Expired", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeInvoice(), "inv-001"));
    await expireInvoice(createRequest("PATCH"), { params: { id: "inv-001" } });
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.status).toBe("Expired");
    expect(data.expiredAt).toBeDefined();
  });

  test("returns 404 when invoice not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await expireInvoice(createRequest("PATCH"), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await expireInvoice(createRequest("PATCH"), { params: { id: "inv-001" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/get-all-invoice/[id] ─────────────────────────────────────────

describe("GET /api/get-all-invoice/[id]", () => {
  let getAllInvoice;
  beforeAll(() => { getAllInvoice = require("../../src/app/api/get-all-invoice/[id]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with invoices array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeInvoice(), makeInvoice({ invoiceId: "inv-002" })]));
    const res  = await getAllInvoice(createRequest("GET"), { params: { id: "techcorp" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.invoices)).toBe(true);
    expect(body.invoices).toHaveLength(2);
  });

  test("returns empty array when no invoices found", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res  = await getAllInvoice(createRequest("GET"), { params: { id: "empty-co" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invoices).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getAllInvoice(createRequest("GET"), { params: { id: "techcorp" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/all-invoices ─────────────────────────────────────────────────

describe("GET /api/all-invoices", () => {
  let allInvoices;
  beforeAll(() => { allInvoices = require("../../src/app/api/all-invoices/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with invoices array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeInvoice(), makeInvoice({ invoiceId: "inv-002" })]));
    const res  = await allInvoices();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.invoices).toHaveLength(2);
  });

  test("returns empty array when no invoices", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    expect((await (await allInvoices()).json()).invoices).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await allInvoices();
    expect(res.status).toBe(500);
  });
});
