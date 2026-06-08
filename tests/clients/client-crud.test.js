/**
 * Tests for client CRUD routes:
 *   DELETE /api/delete-client/[id]
 *   POST   /api/update-client/[id]
 *   GET    /api/get-client/[id]
 *   GET    /api/all-clients
 */

const { createRequest } = require("../helpers/request");
const { makeClient, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDoc:     jest.fn(),
  getDocs:    jest.fn(),
  deleteDoc:  jest.fn(),
  updateDoc:  jest.fn(),
  arrayRemove: jest.fn((v) => v),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── DELETE /api/delete-client/[id] ────────────────────────────────────────

describe("DELETE /api/delete-client/[id]", () => {
  let deleteClient;
  beforeAll(() => { deleteClient = require("../../src/app/api/delete-client/[id]/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient(), "client-001"));
    const res  = await deleteClient(createRequest("DELETE"), { params: { id: "client-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls deleteDoc", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient(), "client-001"));
    await deleteClient(createRequest("DELETE"), { params: { id: "client-001" } });
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("calls updateDoc to remove from company AssignClient", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient({ companyId: "co-001" }), "c-001"));
    await deleteClient(createRequest("DELETE"), { params: { id: "c-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 404 when client not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await deleteClient(createRequest("DELETE"), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found/i);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("firestore error"));
    const res = await deleteClient(createRequest("DELETE"), { params: { id: "c-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/update-client/[id] ─────────────────────────────────────────

describe("POST /api/update-client/[id]", () => {
  let updateClient;
  beforeAll(() => { updateClient = require("../../src/app/api/update-client/[id]/route").POST; });
  beforeEach(() => setupDefaults());

  const validPayload = (o = {}) => ({
    clientName:  "Acme Corp",
    clientEmail: "contact@acme.com",
    clientPhone: "+923001234567",
    ...o,
  });

  test("returns 200 on successful update", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient(), "c-001"));
    const res  = await updateClient(createRequest("POST", validPayload()), { params: { id: "c-001" } });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("calls updateDoc", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient(), "c-001"));
    await updateClient(createRequest("POST", validPayload()), { params: { id: "c-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("returns updated client in response", async () => {
    const updatedClient = makeClient({ clientName: "Updated Corp" });
    ff.getDoc.mockResolvedValueOnce(mockDoc(updatedClient, "c-001"));
    const body = await (await updateClient(createRequest("POST", validPayload({ clientName: "Updated Corp" })), { params: { id: "c-001" } })).json();
    expect(body.client).toBeDefined();
  });

  test("returns 400 when clientName is missing", async () => {
    const res = await updateClient(createRequest("POST", validPayload({ clientName: undefined })), { params: { id: "c-001" } });
    expect(res.status).toBe(400);
  });

  test("returns 400 when clientEmail is missing", async () => {
    const res = await updateClient(createRequest("POST", validPayload({ clientEmail: undefined })), { params: { id: "c-001" } });
    expect(res.status).toBe(400);
  });

  test("returns 400 when clientPhone is missing", async () => {
    const res = await updateClient(createRequest("POST", validPayload({ clientPhone: undefined })), { params: { id: "c-001" } });
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("db error"));
    const res = await updateClient(createRequest("POST", validPayload()), { params: { id: "c-001" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/get-client/[id] ──────────────────────────────────────────────

describe("GET /api/get-client/[id]", () => {
  let getClient;
  beforeAll(() => { getClient = require("../../src/app/api/get-client/[id]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with client data", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeClient(), "c-001"));
    const res  = await getClient(createRequest("GET"), { params: { id: "c-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.client).toBeDefined();
  });

  test("returns 404 when client not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await getClient(createRequest("GET"), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await getClient(createRequest("GET"), { params: { id: "c-001" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/all-clients ──────────────────────────────────────────────────

describe("GET /api/all-clients", () => {
  let allClients;
  beforeAll(() => { allClients = require("../../src/app/api/all-clients/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with clients array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeClient(), makeClient({ id: "c-002" })]));
    const res  = await allClients();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.clients)).toBe(true);
    expect(body.clients).toHaveLength(2);
  });

  test("returns empty array when no clients", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await allClients()).json();
    expect(body.clients).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await allClients();
    expect(res.status).toBe(500);
  });
});
