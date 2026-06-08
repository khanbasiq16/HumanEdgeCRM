/**
 * Tests for announcement routes:
 *   GET    /api/announcements
 *   POST   /api/announcements
 *   DELETE /api/announcements/[id]
 */

const { createRequest } = require("../helpers/request");
const { makeEmployee, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection:      jest.fn(),
  doc:             jest.fn(),
  getDocs:         jest.fn(),
  addDoc:          jest.fn(),
  deleteDoc:       jest.fn(),
  query:           jest.fn(),
  where:           jest.fn(),
  orderBy:         jest.fn(),
  serverTimestamp: jest.fn(() => "server-ts"),
}));

const ff = require("firebase/firestore");

function makeAnnouncement(overrides = {}) {
  return {
    id:        "ann-001",
    title:     "Company Update",
    body:      "Important announcement",
    createdBy: "Admin",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.orderBy.mockReturnValue("order-ref");
  ff.addDoc.mockResolvedValue({ id: "ann-new" });
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── GET /api/announcements ─────────────────────────────────────────────────

describe("GET /api/announcements", () => {
  let getAnnouncements;
  beforeAll(() => { getAnnouncements = require("../../src/app/api/announcements/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with announcements array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeAnnouncement(), makeAnnouncement({ id: "ann-002" })]));
    const res  = await getAnnouncements();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.announcements)).toBe(true);
    expect(body.announcements).toHaveLength(2);
  });

  test("returns empty array when no announcements", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAnnouncements()).json();
    expect(body.announcements).toHaveLength(0);
  });

  test("returns success: false on Firestore error (graceful)", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const body = await (await getAnnouncements()).json();
    expect(body.success).toBe(false);
    expect(body.announcements).toHaveLength(0);
  });
});

// ── POST /api/announcements ────────────────────────────────────────────────

describe("POST /api/announcements", () => {
  let createAnnouncement;
  beforeAll(() => { createAnnouncement = require("../../src/app/api/announcements/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 with announcementId", async () => {
    // First getDocs: employees list; notification addDocs happen per employee
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployee()]));
    const res  = await createAnnouncement(createRequest("POST", { title: "Big News", body: "Details here", createdBy: "Admin" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.announcementId).toBe("ann-new");
  });

  test("creates notification for each employee", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeEmployee(), makeEmployee({ employeeId: "emp-002" })]));
    const body = await (await createAnnouncement(createRequest("POST", { title: "News", body: "text" }))).json();
    expect(body.notified).toBe(2);
  });

  test("calls addDoc for the announcement", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createAnnouncement(createRequest("POST", { title: "Test" }));
    expect(ff.addDoc).toHaveBeenCalledWith("col-ref", expect.objectContaining({ title: "Test" }));
  });

  test("uses Admin as default createdBy", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await createAnnouncement(createRequest("POST", { title: "Test" }));
    const [, data] = ff.addDoc.mock.calls[0];
    expect(data.createdBy).toBe("Admin");
  });

  test("returns 400 when title is missing", async () => {
    const res = await createAnnouncement(createRequest("POST", { body: "No title" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when title is blank", async () => {
    const res = await createAnnouncement(createRequest("POST", { title: "   " }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.addDoc.mockRejectedValueOnce(new Error("error"));
    const res = await createAnnouncement(createRequest("POST", { title: "News" }));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/announcements/[id] ────────────────────────────────────────

describe("DELETE /api/announcements/[id]", () => {
  let deleteAnnouncement;
  beforeAll(() => { deleteAnnouncement = require("../../src/app/api/announcements/[id]/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res  = await deleteAnnouncement(createRequest("DELETE"), { params: { id: "ann-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("deletes the announcement doc", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    await deleteAnnouncement(createRequest("DELETE"), { params: { id: "ann-001" } });
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("also deletes linked notifications", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([
      makeAnnouncement({ id: "notif-1" }),
      makeAnnouncement({ id: "notif-2" }),
    ]));
    await deleteAnnouncement(createRequest("DELETE"), { params: { id: "ann-001" } });
    // 1 announcement + 2 notifications = 3 deleteDoc calls
    expect(ff.deleteDoc).toHaveBeenCalledTimes(3);
  });

  test("returns 500 on Firestore error", async () => {
    ff.deleteDoc.mockRejectedValueOnce(new Error("error"));
    const res = await deleteAnnouncement(createRequest("DELETE"), { params: { id: "ann-001" } });
    expect(res.status).toBe(500);
  });
});
