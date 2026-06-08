/**
 * Tests for holiday management routes:
 *   POST /api/admin/add-holiday
 *   GET  /api/admin/get-holidays
 *   POST /api/admin/delete-holiday/[id]
 *   POST /api/admin/update-holiday/[id]
 */

const { createRequest } = require("../helpers/request");
const { mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection:      jest.fn(),
  doc:             jest.fn(),
  setDoc:          jest.fn(),
  getDoc:          jest.fn(),
  getDocs:         jest.fn(),
  deleteDoc:       jest.fn(),
  updateDoc:       jest.fn(),
  query:           jest.fn(),
  orderBy:         jest.fn(),
  serverTimestamp: jest.fn(() => "server-ts"),
}));

const ff = require("firebase/firestore");

function makeHoliday(overrides = {}) {
  return { id: "hol-001", name: "Eid", date: "2024-04-10", ...overrides };
}

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.orderBy.mockReturnValue("order-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── POST /api/admin/add-holiday ───────────────────────────────────────────

describe("POST /api/admin/add-holiday", () => {
  let addHoliday;
  beforeAll(() => { addHoliday = require("../../src/app/api/admin/add-holiday/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful creation", async () => {
    const res  = await addHoliday(createRequest("POST", { name: "Eid", date: "2024-04-10" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();
  });

  test("calls setDoc to persist holiday", async () => {
    await addHoliday(createRequest("POST", { name: "Eid", date: "2024-04-10" }));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("saved document contains name and date", async () => {
    await addHoliday(createRequest("POST", { name: "Christmas", date: "2024-12-25" }));
    const [, data] = ff.setDoc.mock.calls[0];
    expect(data.name).toBe("Christmas");
    expect(data.date).toBe("2024-12-25");
  });

  test("generated id is a UUID (36 chars)", async () => {
    const body = await (await addHoliday(createRequest("POST", { name: "Eid", date: "2024-04-10" }))).json();
    expect(body.id).toHaveLength(36);
  });

  test("returns 400 when name is missing", async () => {
    const res = await addHoliday(createRequest("POST", { date: "2024-04-10" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when date is missing", async () => {
    const res = await addHoliday(createRequest("POST", { name: "Eid" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.setDoc.mockRejectedValueOnce(new Error("error"));
    const res = await addHoliday(createRequest("POST", { name: "Eid", date: "2024-04-10" }));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/get-holidays ───────────────────────────────────────────

describe("GET /api/admin/get-holidays", () => {
  let getHolidays;
  beforeAll(() => { getHolidays = require("../../src/app/api/admin/get-holidays/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with holidays array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeHoliday(), makeHoliday({ id: "hol-002", name: "Christmas" })]));
    const res  = await getHolidays();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.holidays)).toBe(true);
    expect(body.holidays).toHaveLength(2);
  });

  test("returns empty array when no holidays", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getHolidays()).json();
    expect(body.holidays).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getHolidays();
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/delete-holiday/[id] ───────────────────────────────────

describe("POST /api/admin/delete-holiday/[id]", () => {
  let deleteHoliday;
  beforeAll(() => { deleteHoliday = require("../../src/app/api/admin/delete-holiday/[id]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    const res  = await deleteHoliday(createRequest("POST"), { params: { id: "hol-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toMatch(/deleted/i);
  });

  test("calls deleteDoc", async () => {
    await deleteHoliday(createRequest("POST"), { params: { id: "hol-001" } });
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 500 on Firestore error", async () => {
    ff.deleteDoc.mockRejectedValueOnce(new Error("error"));
    const res = await deleteHoliday(createRequest("POST"), { params: { id: "hol-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/update-holiday/[id] ───────────────────────────────────

describe("POST /api/admin/update-holiday/[id]", () => {
  let updateHoliday;
  beforeAll(() => { updateHoliday = require("../../src/app/api/admin/update-holiday/[id]/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeHoliday(), "hol-001"));
    const res  = await updateHoliday(createRequest("POST", { name: "Updated Eid" }), { params: { id: "hol-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toMatch(/updated/i);
  });

  test("calls updateDoc with new name", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeHoliday(), "hol-001"));
    await updateHoliday(createRequest("POST", { name: "New Name" }), { params: { id: "hol-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.name).toBe("New Name");
  });

  test("returns 400 when name is missing", async () => {
    const res = await updateHoliday(createRequest("POST", {}), { params: { id: "hol-001" } });
    expect(res.status).toBe(400);
  });

  test("returns 404 when holiday not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await updateHoliday(createRequest("POST", { name: "X" }), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateHoliday(createRequest("POST", { name: "X" }), { params: { id: "hol-001" } });
    expect(res.status).toBe(500);
  });
});
