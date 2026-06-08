/**
 * Tests for admin members routes:
 *   GET    /api/admin/members
 *   PATCH  /api/admin/members
 *   DELETE /api/admin/members
 */

const { createRequest } = require("../helpers/request");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

// Self-contained firebaseAdmin mock
jest.mock("@/lib/firebaseAdmin", () => {
  const authObj = {
    deleteUser: jest.fn(),
  };
  const docRefObj = {
    get:    jest.fn(),
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

const { adminDb: mockAdminDb, adminAuth: mockAdminAuth } = jest.requireMock("@/lib/firebaseAdmin");
const mockCollection = mockAdminDb.collection();
const mockDocRef     = mockCollection.doc();

function makeUserDoc(overrides = {}) {
  return {
    id:   "user-001",
    data: () => ({
      email:       "admin@example.com",
      name:        "Admin User",
      role:        "admin",
      permissions: ["employees"],
      ...overrides,
    }),
  };
}

function makeSnap(docs) {
  return { empty: docs.length === 0, docs };
}

function setupDefaults() {
  const { adminDb, adminAuth } = jest.requireMock("@/lib/firebaseAdmin");
  adminDb.collection.mockImplementation(() => mockCollection);
  mockCollection.where.mockReturnThis();
  mockCollection.limit.mockReturnThis();
  mockCollection.get.mockResolvedValue(makeSnap([]));
  mockCollection.doc.mockImplementation(() => mockDocRef);
  mockCollection.add.mockResolvedValue({ id: "notif-new" });

  mockDocRef.get.mockResolvedValue({
    id:   "user-001",
    data: () => ({ permissions: ["employees"] }),
  });
  mockDocRef.update.mockResolvedValue(undefined);
  mockDocRef.delete.mockResolvedValue(undefined);

  adminAuth.deleteUser.mockResolvedValue(undefined);
}

// ── GET /api/admin/members ────────────────────────────────────────────────

describe("GET /api/admin/members", () => {
  let getMembers;
  beforeAll(() => { getMembers = require("../../src/app/api/admin/members/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with members and invitations arrays", async () => {
    mockCollection.get
      .mockResolvedValueOnce(makeSnap([makeUserDoc(), makeUserDoc({ email: "admin2@example.com" })]))
      .mockResolvedValueOnce(makeSnap([]));

    const res  = await getMembers();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.members)).toBe(true);
    expect(Array.isArray(body.invitations)).toBe(true);
    expect(body.members).toHaveLength(2);
  });

  test("members have _type: member and invitations have _type: invitation", async () => {
    mockCollection.get
      .mockResolvedValueOnce(makeSnap([makeUserDoc()]))
      .mockResolvedValueOnce(makeSnap([makeUserDoc()]));

    const body = await (await getMembers()).json();
    expect(body.members[0]._type).toBe("member");
    expect(body.invitations[0]._type).toBe("invitation");
  });

  test("returns empty arrays when no members or invitations", async () => {
    mockCollection.get
      .mockResolvedValueOnce(makeSnap([]))
      .mockResolvedValueOnce(makeSnap([]));

    const body = await (await getMembers()).json();
    expect(body.members).toHaveLength(0);
    expect(body.invitations).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    mockCollection.get.mockRejectedValueOnce(new Error("DB error"));
    const res = await getMembers();
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/admin/members ──────────────────────────────────────────────

describe("PATCH /api/admin/members", () => {
  let updateMember;
  beforeAll(() => { updateMember = require("../../src/app/api/admin/members/route").PATCH; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful permissions update", async () => {
    const res  = await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees", "accounts"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls update with new permissions", async () => {
    await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees"] }));
    expect(mockDocRef.update).toHaveBeenCalledWith({ permissions: ["employees"] });
  });

  test("adds notification for newly added permissions", async () => {
    // Old perms: [], new perms: ["employees"] → added notification
    mockDocRef.get.mockResolvedValueOnce({ data: () => ({ permissions: [] }) });
    await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees"] }));
    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "permission_added" })
    );
  });

  test("adds notification for removed permissions", async () => {
    // Old perms: ["employees", "accounts"], new perms: ["employees"] → removed notification
    mockDocRef.get.mockResolvedValueOnce({ data: () => ({ permissions: ["employees", "accounts"] }) });
    await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees"] }));
    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "permission_removed" })
    );
  });

  test("adds generic notification when no perms changed", async () => {
    // Old perms: ["employees"], new perms: ["employees"] → update notification
    mockDocRef.get.mockResolvedValueOnce({ data: () => ({ permissions: ["employees"] }) });
    await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees"] }));
    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "permission_update" })
    );
  });

  test("returns 400 when id is missing", async () => {
    const res = await updateMember(createRequest("PATCH", { permissions: ["employees"] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when permissions is empty", async () => {
    const res = await updateMember(createRequest("PATCH", { id: "user-001", permissions: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    mockDocRef.update.mockRejectedValueOnce(new Error("error"));
    const res = await updateMember(createRequest("PATCH", { id: "user-001", permissions: ["employees"] }));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/admin/members ─────────────────────────────────────────────

describe("DELETE /api/admin/members", () => {
  let deleteMember;
  beforeAll(() => { deleteMember = require("../../src/app/api/admin/members/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful deletion", async () => {
    const res  = await deleteMember(createRequest("DELETE", { uid: "user-001" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("deletes Firestore user doc", async () => {
    await deleteMember(createRequest("DELETE", { uid: "user-001" }));
    expect(mockDocRef.delete).toHaveBeenCalledTimes(1);
  });

  test("calls adminAuth.deleteUser", async () => {
    await deleteMember(createRequest("DELETE", { uid: "user-001" }));
    expect(mockAdminAuth.deleteUser).toHaveBeenCalledWith("user-001");
  });

  test("still returns 200 when auth user not found (already removed)", async () => {
    mockAdminAuth.deleteUser.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { code: "auth/user-not-found" })
    );
    const res = await deleteMember(createRequest("DELETE", { uid: "user-001" }));
    expect(res.status).toBe(200);
  });

  test("returns 400 when uid is missing", async () => {
    const res = await deleteMember(createRequest("DELETE", {}));
    expect(res.status).toBe(400);
  });

  test("returns 500 on unexpected error", async () => {
    mockDocRef.delete.mockRejectedValueOnce(new Error("unexpected"));
    const res = await deleteMember(createRequest("DELETE", { uid: "user-001" }));
    expect(res.status).toBe(500);
  });
});
