/**
 * Tests for currency management routes:
 *   POST /api/admin/curency          (create)
 *   GET  /api/admin/get-curency
 *   POST /api/admin/delete-curency/[deletecurencyid]
 *   POST /api/admin/update-curency/[editcurencyid]
 */

const { createRequest } = require("../helpers/request");
const { mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  setDoc:     jest.fn(),
  getDoc:     jest.fn(),
  getDocs:    jest.fn(),
  deleteDoc:  jest.fn(),
  updateDoc:  jest.fn(),
}));

const ff = require("firebase/firestore");

function makeCurrency(overrides = {}) {
  return {
    curencyid:      "cur-001",
    currenyName:    "Pakistani Rupee",
    currencyCode:   "PKR",
    currencySymbol: "Rs.",
    Curencyrate:    279.5,
    ...overrides,
  };
}

function validPayload(o = {}) {
  return {
    currenyName:    "Pakistani Rupee",
    currencyCode:   "PKR",
    currencySymbol: "Rs.",
    Curencyrate:    279.5,
    ...o,
  };
}

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── POST /api/admin/curency (create) ──────────────────────────────────────

describe("POST /api/admin/curency", () => {
  let createCurrency;
  beforeAll(() => { createCurrency = require("../../src/app/api/admin/curency/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful creation", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCurrency()]));
    const res  = await createCurrency(createRequest("POST", validPayload()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls setDoc to persist currency", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createCurrency(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("returns currencies array in response", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCurrency()]));
    const body = await (await createCurrency(createRequest("POST", validPayload()))).json();
    expect(Array.isArray(body.currencies)).toBe(true);
  });

  test("returns 400 when currenyName is missing", async () => {
    const res = await createCurrency(createRequest("POST", validPayload({ currenyName: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 400 when currencyCode is missing", async () => {
    const res = await createCurrency(createRequest("POST", validPayload({ currencyCode: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 400 when currencySymbol is missing", async () => {
    const res = await createCurrency(createRequest("POST", validPayload({ currencySymbol: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 400 when Curencyrate is missing", async () => {
    const res = await createCurrency(createRequest("POST", validPayload({ Curencyrate: undefined })));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.setDoc.mockRejectedValueOnce(new Error("error"));
    const res = await createCurrency(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/get-curency ─────────────────────────────────────────────

describe("GET /api/admin/get-curency", () => {
  let getCurrency;
  beforeAll(() => { getCurrency = require("../../src/app/api/admin/get-curency/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with currencies array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCurrency(), makeCurrency({ curencyid: "cur-002" })]));
    const res  = await getCurrency();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.currencies)).toBe(true);
    expect(body.currencies).toHaveLength(2);
  });

  test("returns empty array when no currencies", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getCurrency()).json();
    expect(body.currencies).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getCurrency();
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/delete-curency/[deletecurencyid] ──────────────────────

describe("POST /api/admin/delete-curency/[deletecurencyid]", () => {
  let deleteCurrency;
  beforeAll(() => { deleteCurrency = require("../../src/app/api/admin/delete-curency/[deletecurencyid]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCurrency(), "cur-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res  = await deleteCurrency(createRequest("POST"), { params: { deletecurencyid: "cur-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls deleteDoc", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCurrency(), "cur-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await deleteCurrency(createRequest("POST"), { params: { deletecurencyid: "cur-001" } });
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("returns updated currencies list", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCurrency(), "cur-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCurrency({ curencyid: "cur-002" })]));
    const body = await (await deleteCurrency(createRequest("POST"), { params: { deletecurencyid: "cur-001" } })).json();
    expect(Array.isArray(body.currencies)).toBe(true);
  });

  test("returns 404 when currency not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await deleteCurrency(createRequest("POST"), { params: { deletecurencyid: "ghost" } });
    expect(res.status).toBe(404);
  });
});

// ── POST /api/admin/update-curency/[editcurencyid] ────────────────────────

describe("POST /api/admin/update-curency/[editcurencyid]", () => {
  let updateCurrency;
  beforeAll(() => { updateCurrency = require("../../src/app/api/admin/update-curency/[editcurencyid]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCurrency(), "cur-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeCurrency()]));
    const res  = await updateCurrency(createRequest("POST", validPayload({ Curencyrate: 300 })), { params: { editcurencyid: "cur-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with parsed Curencyrate", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeCurrency(), "cur-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await updateCurrency(createRequest("POST", validPayload({ Curencyrate: "300.5" })), { params: { editcurencyid: "cur-001" } });
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.Curencyrate).toBe(300.5);
  });

  test("returns 400 when required fields are missing", async () => {
    const res = await updateCurrency(createRequest("POST", {}), { params: { editcurencyid: "cur-001" } });
    expect(res.status).toBe(400);
  });

  test("returns 404 when currency not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await updateCurrency(createRequest("POST", validPayload()), { params: { editcurencyid: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateCurrency(createRequest("POST", validPayload()), { params: { editcurencyid: "cur-001" } });
    expect(res.status).toBe(500);
  });
});
