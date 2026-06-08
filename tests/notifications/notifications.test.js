/**
 * Tests for notification routes:
 *   GET   /api/employee-notifications/[employeeId]
 *   PATCH /api/employee-notifications/[employeeId]
 *   POST  /api/employee-notifications/create
 *   GET   /api/admin/notifications/[userId]
 *   PATCH /api/admin/notifications/[userId]
 */

const { createRequest } = require("../helpers/request");
const { mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

// Admin notifications use firebaseAdmin (adminDb with chaining)
const mockAdminBatch = {
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};
const mockAdminChain = {
  where:  jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
  get:    jest.fn(),
};
jest.mock("@/lib/firebaseAdmin", () => ({
  admin:    { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
  adminDb:  {
    collection: jest.fn(() => mockAdminChain),
    batch:      jest.fn(() => mockAdminBatch),
  },
  adminAuth: {},
  fcmAdmin:  {},
}));

jest.mock("firebase/firestore", () => ({
  collection:      jest.fn(),
  doc:             jest.fn(),
  getDocs:         jest.fn(),
  updateDoc:       jest.fn(),
  addDoc:          jest.fn(),
  query:           jest.fn(),
  where:           jest.fn(),
  serverTimestamp: jest.fn(() => "server-ts"),
}));

const ff = require("firebase/firestore");

function makeNotification(overrides = {}) {
  return {
    id:         "notif-001",
    employeeId: "emp-001",
    type:       "announcement",
    title:      "Test Notification",
    body:       "Hello",
    isRead:     false,
    createdAt:  new Date().toISOString(),
    ...overrides,
  };
}

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.updateDoc.mockResolvedValue(undefined);
  ff.addDoc.mockResolvedValue({ id: "notif-new" });
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
  // Restore jest.fn() factory impls wiped by jest.resetAllMocks() in jest.setup.js
  const { adminDb } = jest.requireMock("@/lib/firebaseAdmin");
  adminDb.collection.mockImplementation(() => mockAdminChain);
  adminDb.batch.mockImplementation(() => mockAdminBatch);
  mockAdminChain.where.mockReturnThis();
  mockAdminChain.limit.mockReturnThis();
  mockAdminBatch.commit.mockResolvedValue(undefined);
}

// ── GET /api/employee-notifications/[employeeId] ──────────────────────────

describe("GET /api/employee-notifications/[employeeId]", () => {
  let getNotifications;
  beforeAll(() => { getNotifications = require("../../src/app/api/employee-notifications/[employeeId]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with notifications array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeNotification(), makeNotification({ id: "notif-002" })]));
    const res  = await getNotifications(createRequest("GET"), { params: { employeeId: "emp-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.notifications)).toBe(true);
    expect(body.notifications).toHaveLength(2);
  });

  test("returns empty array when no notifications", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getNotifications(createRequest("GET"), { params: { employeeId: "emp-001" } })).json();
    expect(body.notifications).toHaveLength(0);
  });

  test("returns success: false with empty array when employeeId is missing", async () => {
    const res  = await getNotifications(createRequest("GET"), { params: { employeeId: "" } });
    const body = await res.json();
    expect(body.notifications).toHaveLength(0);
  });
});

// ── PATCH /api/employee-notifications/[employeeId] ────────────────────────

describe("PATCH /api/employee-notifications/[employeeId]", () => {
  let markAllRead;
  beforeAll(() => { markAllRead = require("../../src/app/api/employee-notifications/[employeeId]/route").PATCH; });
  beforeEach(() => setupDefaults());

  test("returns 200 on success", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeNotification(), makeNotification({ id: "notif-002" })]));
    const res  = await markAllRead(createRequest("PATCH"), { params: { employeeId: "emp-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc for each unread notification", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeNotification(), makeNotification({ id: "notif-002" })]));
    await markAllRead(createRequest("PATCH"), { params: { employeeId: "emp-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(2);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.isRead).toBe(true);
  });

  test("returns 200 even when no unread notifications", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await markAllRead(createRequest("PATCH"), { params: { employeeId: "emp-001" } });
    expect(res.status).toBe(200);
  });
});

// ── POST /api/employee-notifications/create ───────────────────────────────

describe("POST /api/employee-notifications/create", () => {
  let createNotification;
  beforeAll(() => { createNotification = require("../../src/app/api/employee-notifications/create/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 with notificationId", async () => {
    const res  = await createNotification(createRequest("POST", { employeeId: "emp-001", title: "New Task" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notificationId).toBe("notif-new");
  });

  test("calls addDoc with correct fields", async () => {
    await createNotification(createRequest("POST", {
      employeeId:   "emp-001",
      title:        "Project Invite",
      type:         "project_invite",
      body:         "You have been invited",
      projectId:    "proj-001",
      projectTitle: "E-commerce",
    }));
    expect(ff.addDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.addDoc.mock.calls[0];
    expect(data.employeeId).toBe("emp-001");
    expect(data.title).toBe("Project Invite");
    expect(data.type).toBe("project_invite");
    expect(data.isRead).toBe(false);
  });

  test("defaults type to info when not provided", async () => {
    await createNotification(createRequest("POST", { employeeId: "emp-001", title: "Hello" }));
    const [, data] = ff.addDoc.mock.calls[0];
    expect(data.type).toBe("info");
  });

  test("returns 400 when employeeId is missing", async () => {
    const res = await createNotification(createRequest("POST", { title: "Hello" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when title is missing", async () => {
    const res = await createNotification(createRequest("POST", { employeeId: "emp-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.addDoc.mockRejectedValueOnce(new Error("error"));
    const res = await createNotification(createRequest("POST", { employeeId: "emp-001", title: "X" }));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/notifications/[userId] ─────────────────────────────────

describe("GET /api/admin/notifications/[userId]", () => {
  let getAdminNotifications;
  beforeAll(() => { getAdminNotifications = require("../../src/app/api/admin/notifications/[userId]/route").GET; });
  beforeEach(() => {
    setupDefaults();
    mockAdminChain.get.mockResolvedValue({
      docs: [],
      size: 0,
      empty: true,
    });
  });

  test("returns 200 with notifications array", async () => {
    mockAdminChain.get.mockResolvedValueOnce({
      docs: [
        { id: "notif-001", data: () => ({ userId: "user-001", isRead: false, createdAt: { toDate: () => new Date() } }) },
      ],
      size: 1,
    });
    const res  = await getAdminNotifications(createRequest("GET"), { params: { userId: "user-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.notifications)).toBe(true);
  });

  test("returns empty array when no notifications", async () => {
    mockAdminChain.get.mockResolvedValueOnce({ docs: [], size: 0 });
    const body = await (await getAdminNotifications(createRequest("GET"), { params: { userId: "user-001" } })).json();
    expect(body.notifications).toHaveLength(0);
  });

  test("returns 500 on error", async () => {
    mockAdminChain.get.mockRejectedValueOnce(new Error("error"));
    const res = await getAdminNotifications(createRequest("GET"), { params: { userId: "user-001" } });
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/admin/notifications/[userId] ───────────────────────────────

describe("PATCH /api/admin/notifications/[userId]", () => {
  let markAdminRead;
  beforeAll(() => { markAdminRead = require("../../src/app/api/admin/notifications/[userId]/route").PATCH; });
  beforeEach(() => {
    setupDefaults();
    mockAdminChain.get.mockResolvedValue({ docs: [], size: 0 });
  });

  test("returns 200 with updated count", async () => {
    mockAdminChain.get.mockResolvedValueOnce({
      docs: [
        { ref: "ref-001" },
        { ref: "ref-002" },
      ],
      size: 2,
    });
    const res  = await markAdminRead(createRequest("PATCH"), { params: { userId: "user-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.updated).toBe(2);
  });

  test("calls batch.commit", async () => {
    mockAdminChain.get.mockResolvedValueOnce({ docs: [{ ref: "ref-001" }], size: 1 });
    await markAdminRead(createRequest("PATCH"), { params: { userId: "user-001" } });
    expect(mockAdminBatch.commit).toHaveBeenCalledTimes(1);
  });

  test("returns 200 with updated: 0 when no unread", async () => {
    mockAdminChain.get.mockResolvedValueOnce({ docs: [], size: 0 });
    const body = await (await markAdminRead(createRequest("PATCH"), { params: { userId: "user-001" } })).json();
    expect(body.updated).toBe(0);
  });

  test("returns 500 on error", async () => {
    mockAdminChain.get.mockRejectedValueOnce(new Error("error"));
    const res = await markAdminRead(createRequest("PATCH"), { params: { userId: "user-001" } });
    expect(res.status).toBe(500);
  });
});
