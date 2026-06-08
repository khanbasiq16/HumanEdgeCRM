/**
 * E2E tests — POST /api/create-client
 *              GET  /api/get-all-clients/[slug]
 */

const { POST: createClient } = require("../../src/app/api/create-client/route");
const { createRequest } = require("../helpers/request");
const { makeClient, makeCompany, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

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
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
}));

jest.mock("@/lib/SendEmail", () => ({
  sendEmail: jest.fn(),
}));

const ff = require("firebase/firestore");
const { sendEmail } = require("@/lib/SendEmail");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.arrayUnion.mockImplementation((v) => v);
  sendEmail.mockResolvedValue({ success: true });
}

function validPayload(overrides = {}) {
  return {
    companyName: "techcorp",
    clientName: "Acme Corp",
    clientEmail: "contact@acme.com",
    clientPhone: "+923009876543",
    clientAddress: "Lahore",
    projectsDetails: "Web dev",
    packageDetails: "Basic",
    clientWebsite: "https://acme.com",
    ...overrides,
  };
}

function setupCreate(companyData = makeCompany(), existingClients = []) {
  ff.getDocs
    .mockResolvedValueOnce(mockQuerySnapshot([companyData]))
    .mockResolvedValueOnce(mockQuerySnapshot(existingClients))
    .mockResolvedValueOnce(mockQuerySnapshot([]));
}

describe("POST /api/create-client", () => {
  beforeEach(() => setupDefaults());

  test("returns 200 and creates client successfully", async () => {
    setupCreate();
    const res = await createClient(createRequest("POST", validPayload()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.allclients)).toBe(true);
  });

  test("calls setDoc to persist client document", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("client document contains correct fields", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload()));
    const saved = ff.setDoc.mock.calls[0][1];
    expect(saved.clientName).toBe("Acme Corp");
    expect(saved.clientEmail).toBe("contact@acme.com");
    expect(saved.companyId).toBe("company-001");
    expect(saved.companySlug).toBe("techcorp");
    expect(typeof saved.id).toBe("string");
    expect(saved.id).toHaveLength(36);
  });

  test("calls updateDoc to link client to company", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload()));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("sends welcome email to client", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload()));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailCall = sendEmail.mock.calls[0][0];
    expect(emailCall.to).toBe("contact@acme.com");
    expect(emailCall.subject).toMatch(/Welcome/i);
  });

  test("returns 404 when company not found", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await createClient(createRequest("POST", validPayload({ companyName: "nonexistent" })));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/Company not found/i);
  });

  test("returns 400 when client email already exists", async () => {
    setupCreate(makeCompany(), [makeClient({ clientEmail: "contact@acme.com" })]);
    const res = await createClient(createRequest("POST", validPayload()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Client already exists/i);
  });

  test("sets assignedEmployeeId to null when not provided", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload()));
    const saved = ff.setDoc.mock.calls[0][1];
    expect(saved.assignedEmployeeId).toBeNull();
    expect(saved.assignedEmployeeName).toBeNull();
  });

  test("saves assignedEmployee when provided", async () => {
    setupCreate();
    await createClient(createRequest("POST", validPayload({ assignedEmployeeId: "emp-001", assignedEmployeeName: "John" })));
    const saved = ff.setDoc.mock.calls[0][1];
    expect(saved.assignedEmployeeId).toBe("emp-001");
  });

  test("returns 500 on unexpected Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("Firestore down"));
    const res = await createClient(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/get-all-clients/[slug]", () => {
  let getAllClientsRoute;

  beforeAll(() => {
    getAllClientsRoute = require("../../src/app/api/get-all-clients/[slug]/route");
  });

  beforeEach(() => setupDefaults());

  test("returns 200 with clients for a company", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeClient(), makeClient({ id: "c-002", clientName: "Beta" })]));
    const req = createRequest("GET", null, { path: "/api/get-all-clients/techcorp" });
    const res = await getAllClientsRoute.GET(req, { params: { slug: "techcorp" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.clients).toHaveLength(2);
  });

  test("returns empty array when no clients", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const req = createRequest("GET", null, { path: "/api/get-all-clients/techcorp" });
    const res = await getAllClientsRoute.GET(req, { params: { slug: "techcorp" } });
    const body = await res.json();
    expect(body.clients).toEqual([]);
  });
});
