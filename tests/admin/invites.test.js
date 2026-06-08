/**
 * Tests for admin invite routes:
 *   POST   /api/admin/invite
 *   POST   /api/admin/invite/accept
 *   DELETE /api/admin/invite/delete
 *   PATCH  /api/admin/invite/edit
 *   GET    /api/admin/invite/verify
 */

const { createRequest } = require("../helpers/request");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

// Self-contained firebaseAdmin mock — all objects created inside factory
jest.mock("@/lib/firebaseAdmin", () => {
  const authObj = {
    getUserByEmail: jest.fn(),
    createUser:     jest.fn(),
    getUser:        jest.fn(),
    deleteUser:     jest.fn(),
  };
  const docRefObj = {
    get:    jest.fn(),
    set:    jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const collectionObj = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get:   jest.fn(),
    doc:   jest.fn(() => docRefObj),
    add:   jest.fn().mockResolvedValue({ id: "notif-new" }),
  };
  return {
    admin:     { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
    adminDb:   { collection: jest.fn(() => collectionObj) },
    adminAuth: authObj,
    fcmAdmin:  {},
  };
});

// Stable references obtained before any test runs (factory still active here)
const { adminDb: mockAdminDb, adminAuth: mockAdminAuth } = jest.requireMock("@/lib/firebaseAdmin");
const mockCollection = mockAdminDb.collection();
const mockDocRef     = mockCollection.doc();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc:     jest.fn(),
}));

jest.mock("@/lib/SendpasswordEmail", () => ({
  sendpassowrdEmail: jest.fn(),
}));

const ff                   = require("firebase/firestore");
const { sendpassowrdEmail } = require("@/lib/SendpasswordEmail");

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST_DATE   = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function makeInvData(overrides = {}) {
  return {
    email:       "new@example.com",
    token:       "test-token-123",
    status:      "pending",
    expiresAt:   FUTURE_DATE,
    permissions: ["employees"],
    invitedBy:   "Admin",
    note:        "",
    ...overrides,
  };
}

function makeInvDoc(data) {
  return {
    id:   "inv-001",
    data: () => data,
    ref:  { update: jest.fn().mockResolvedValue(undefined) },
  };
}

function makeSnap(docs) {
  return { empty: docs.length === 0, docs };
}

function setupDefaults() {
  // Restore factory impls wiped by jest.setup.js resetAllMocks()
  const { adminDb, adminAuth } = jest.requireMock("@/lib/firebaseAdmin");
  adminDb.collection.mockImplementation(() => mockCollection);
  mockCollection.where.mockReturnThis();
  mockCollection.limit.mockReturnThis();
  mockCollection.get.mockResolvedValue(makeSnap([]));
  mockCollection.doc.mockImplementation(() => mockDocRef);
  mockCollection.add.mockResolvedValue({ id: "notif-new" });

  mockDocRef.get.mockResolvedValue({ data: () => ({ permissions: [] }) });
  mockDocRef.set.mockResolvedValue(undefined);
  mockDocRef.update.mockResolvedValue(undefined);
  mockDocRef.delete.mockResolvedValue(undefined);

  adminAuth.getUserByEmail.mockRejectedValue(
    Object.assign(new Error("user-not-found"), { code: "auth/user-not-found" })
  );
  adminAuth.createUser.mockResolvedValue({ uid: "new-uid-123" });
  adminAuth.getUser.mockResolvedValue({ displayName: "Test User" });
  adminAuth.deleteUser.mockResolvedValue(undefined);

  ff.collection.mockReturnValue("col-ref");
  ff.addDoc.mockResolvedValue({ id: "inv-new" });
  sendpassowrdEmail.mockResolvedValue({ success: true });
}

// ── POST /api/admin/invite ─────────────────────────────────────────────────

describe("POST /api/admin/invite", () => {
  let sendInvite;
  beforeAll(() => { sendInvite = require("../../src/app/api/admin/invite/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 with token and acceptLink", async () => {
    const res  = await sendInvite(createRequest("POST", { email: "new@example.com", permissions: ["employees"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.acceptLink).toContain(body.token);
  });

  test("calls addDoc to save invitation", async () => {
    await sendInvite(createRequest("POST", { email: "new@example.com", permissions: ["employees"] }));
    expect(ff.addDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.addDoc.mock.calls[0];
    expect(data.email).toBe("new@example.com");
    expect(data.status).toBe("pending");
    expect(data.token).toBeDefined();
  });

  test("calls sendpassowrdEmail with the accept link", async () => {
    await sendInvite(createRequest("POST", { email: "new@example.com", permissions: ["employees"] }));
    expect(sendpassowrdEmail).toHaveBeenCalledTimes(1);
    const [{ to, html }] = sendpassowrdEmail.mock.calls[0];
    expect(to).toBe("new@example.com");
    expect(html).toContain("accept-invite");
  });

  test("emailSent is true when sendpassowrdEmail succeeds", async () => {
    sendpassowrdEmail.mockResolvedValueOnce({ success: true });
    const body = await (await sendInvite(createRequest("POST", { email: "x@x.com", permissions: ["employees"] }))).json();
    expect(body.emailSent).toBe(true);
    expect(body.emailError).toBeNull();
  });

  test("emailSent is false when email fails, still returns 200", async () => {
    sendpassowrdEmail.mockResolvedValueOnce({ success: false, error: "SMTP error" });
    const res  = await sendInvite(createRequest("POST", { email: "x@x.com", permissions: ["employees"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.emailSent).toBe(false);
    expect(body.emailError).toBe("SMTP error");
  });

  test("uses Admin as default invitedBy", async () => {
    await sendInvite(createRequest("POST", { email: "x@x.com", permissions: ["employees"] }));
    const [, data] = ff.addDoc.mock.calls[0];
    expect(data.invitedBy).toBe("Admin");
  });

  test("returns 400 when email is missing", async () => {
    const res = await sendInvite(createRequest("POST", { permissions: ["employees"] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when permissions is empty", async () => {
    const res = await sendInvite(createRequest("POST", { email: "x@x.com", permissions: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.addDoc.mockRejectedValueOnce(new Error("DB error"));
    const res = await sendInvite(createRequest("POST", { email: "x@x.com", permissions: ["employees"] }));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/invite/accept ─────────────────────────────────────────

describe("POST /api/admin/invite/accept", () => {
  let acceptInvite;
  beforeAll(() => { acceptInvite = require("../../src/app/api/admin/invite/accept/route").POST; });
  beforeEach(() => setupDefaults());

  test("creates a new user and returns 200 (new account flow)", async () => {
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    mockAdminAuth.createUser.mockResolvedValue({ uid: "new-uid-123" });

    const res  = await acceptInvite(createRequest("POST", { token: "test-token-123", name: "New User", password: "pass123" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("created");
  });

  test("calls adminAuth.createUser with email+password+name", async () => {
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));

    await acceptInvite(createRequest("POST", { token: "test-token-123", name: "New User", password: "pass123" }));
    expect(mockAdminAuth.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com", password: "pass123", displayName: "New User" })
    );
  });

  test("applies permissions to existing user and returns 200 (existing account flow)", async () => {
    mockAdminAuth.getUserByEmail.mockResolvedValueOnce({ uid: "existing-uid" });
    mockAdminAuth.getUser.mockResolvedValueOnce({ displayName: "Existing User" });
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));

    const res  = await acceptInvite(createRequest("POST", { token: "test-token-123" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain("sign in");
  });

  test("writes user doc with role admin and permissions", async () => {
    const invDoc = makeInvDoc(makeInvData({ permissions: ["employees", "companies"] }));
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));

    await acceptInvite(createRequest("POST", { token: "test-token-123", name: "User", password: "pass" }));
    expect(mockDocRef.set).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin", permissions: ["employees", "companies"] }),
      { merge: true }
    );
  });

  test("marks invitation as accepted", async () => {
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));

    await acceptInvite(createRequest("POST", { token: "test-token-123", name: "User", password: "pass" }));
    expect(invDoc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" })
    );
  });

  test("returns 400 when token is missing", async () => {
    const res = await acceptInvite(createRequest("POST", { name: "User", password: "pass" }));
    expect(res.status).toBe(400);
  });

  test("returns 404 when invitation not found", async () => {
    mockCollection.get.mockResolvedValueOnce(makeSnap([]));
    const res = await acceptInvite(createRequest("POST", { token: "ghost-token" }));
    expect(res.status).toBe(404);
  });

  test("returns 410 when invitation already accepted", async () => {
    const invDoc = makeInvDoc(makeInvData({ status: "accepted" }));
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    const res = await acceptInvite(createRequest("POST", { token: "test-token-123" }));
    expect(res.status).toBe(410);
  });

  test("returns 410 when invitation is expired", async () => {
    const invDoc = makeInvDoc(makeInvData({ expiresAt: PAST_DATE }));
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    const res = await acceptInvite(createRequest("POST", { token: "test-token-123" }));
    expect(res.status).toBe(410);
  });

  test("returns 400 when new user but name/password missing", async () => {
    // getUserByEmail throws auth/user-not-found (default mock)
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    const res = await acceptInvite(createRequest("POST", { token: "test-token-123" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firebase error", async () => {
    mockCollection.get.mockRejectedValueOnce(new Error("DB error"));
    const res = await acceptInvite(createRequest("POST", { token: "test-token-123" }));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/admin/invite/delete ───────────────────────────────────────

describe("DELETE /api/admin/invite/delete", () => {
  let deleteInvite;
  beforeAll(() => { deleteInvite = require("../../src/app/api/admin/invite/delete/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    const res  = await deleteInvite(createRequest("DELETE", { id: "inv-001" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls adminDb.collection('invitations').doc(id).delete()", async () => {
    await deleteInvite(createRequest("DELETE", { id: "inv-001" }));
    expect(mockDocRef.delete).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when id is missing", async () => {
    const res = await deleteInvite(createRequest("DELETE", {}));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    mockDocRef.delete.mockRejectedValueOnce(new Error("error"));
    const res = await deleteInvite(createRequest("DELETE", { id: "inv-001" }));
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/admin/invite/edit ──────────────────────────────────────────

describe("PATCH /api/admin/invite/edit", () => {
  let editInvite;
  beforeAll(() => { editInvite = require("../../src/app/api/admin/invite/edit/route").PATCH; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    const res  = await editInvite(createRequest("PATCH", { id: "inv-001", permissions: ["employees"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls update with new permissions", async () => {
    await editInvite(createRequest("PATCH", { id: "inv-001", permissions: ["employees", "accounts"] }));
    expect(mockDocRef.update).toHaveBeenCalledWith({ permissions: ["employees", "accounts"] });
  });

  test("returns 400 when id is missing", async () => {
    const res = await editInvite(createRequest("PATCH", { permissions: ["employees"] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when permissions is empty", async () => {
    const res = await editInvite(createRequest("PATCH", { id: "inv-001", permissions: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    mockDocRef.update.mockRejectedValueOnce(new Error("error"));
    const res = await editInvite(createRequest("PATCH", { id: "inv-001", permissions: ["employees"] }));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/invite/verify ──────────────────────────────────────────

describe("GET /api/admin/invite/verify", () => {
  let verifyInvite;
  beforeAll(() => { verifyInvite = require("../../src/app/api/admin/invite/verify/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with invitation data when token is valid", async () => {
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    mockAdminAuth.getUserByEmail.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { code: "auth/user-not-found" })
    );

    const res  = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=test-token-123" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.invitation).toBeDefined();
    expect(body.invitation.email).toBe("new@example.com");
    expect(body.userExists).toBe(false);
  });

  test("userExists is true when email already in Auth", async () => {
    const invDoc = makeInvDoc(makeInvData());
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    mockAdminAuth.getUserByEmail.mockResolvedValueOnce({ uid: "existing-uid" });

    const body = await (await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=test-token-123" }))).json();
    expect(body.userExists).toBe(true);
  });

  test("returns 400 when token is missing from query", async () => {
    const res = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify" }));
    expect(res.status).toBe(400);
  });

  test("returns 404 when invitation not found", async () => {
    mockCollection.get.mockResolvedValueOnce(makeSnap([]));
    const res = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=ghost" }));
    expect(res.status).toBe(404);
  });

  test("returns 410 when invitation already accepted", async () => {
    const invDoc = makeInvDoc(makeInvData({ status: "accepted" }));
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    const res = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=test-token-123" }));
    expect(res.status).toBe(410);
  });

  test("returns 410 when invitation has expired", async () => {
    const invDoc = makeInvDoc(makeInvData({ expiresAt: PAST_DATE }));
    mockCollection.get.mockResolvedValueOnce(makeSnap([invDoc]));
    const res = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=test-token-123" }));
    expect(res.status).toBe(410);
  });

  test("returns 500 on Firestore error", async () => {
    mockCollection.get.mockRejectedValueOnce(new Error("error"));
    const res = await verifyInvite(createRequest("GET", null, { path: "/api/admin/invite/verify?token=test-token-123" }));
    expect(res.status).toBe(500);
  });
});
