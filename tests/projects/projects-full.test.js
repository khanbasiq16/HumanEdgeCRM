/**
 * Tests for project routes:
 *   GET    /api/projects/get-all
 *   GET    /api/projects/[id]
 *   PATCH  /api/projects/[id]
 *   DELETE /api/projects/[id]
 *   GET    /api/projects/employee/[employeeId]
 *   POST   /api/projects/accept-invite
 */

const { createRequest } = require("../helpers/request");
const { makeProject, makeTask, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

const mockWriteBatch = {
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock("firebase/firestore", () => ({
  collection:  jest.fn(),
  doc:         jest.fn(),
  getDoc:      jest.fn(),
  getDocs:     jest.fn(),
  updateDoc:   jest.fn(),
  deleteDoc:   jest.fn(),
  query:       jest.fn(),
  where:       jest.fn(),
  writeBatch:  jest.fn(() => mockWriteBatch),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue({ ref: "doc-ref" });
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.updateDoc.mockResolvedValue(undefined);
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
  // Restore jest.fn() factory impls wiped by jest.resetAllMocks() in jest.setup.js
  ff.writeBatch.mockImplementation(() => mockWriteBatch);
  mockWriteBatch.commit.mockResolvedValue(undefined);
}

// ── GET /api/projects/get-all ──────────────────────────────────────────────

describe("GET /api/projects/get-all", () => {
  let getAll;
  beforeAll(() => { getAll = require("../../src/app/api/projects/get-all/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with projects array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeProject(), makeProject({ id: "proj-002" })]));
    const res  = await getAll();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.projects)).toBe(true);
    expect(body.projects).toHaveLength(2);
  });

  test("returns empty array when no projects", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAll()).json();
    expect(body.projects).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getAll();
    expect(res.status).toBe(500);
  });
});

// ── GET /api/projects/[id] ─────────────────────────────────────────────────

describe("GET /api/projects/[id]", () => {
  let getProject;
  beforeAll(() => { getProject = require("../../src/app/api/projects/[id]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with project data", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(makeProject(), "proj-001"));
    const res  = await getProject(createRequest("GET"), { params: { id: "proj-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.project).toBeDefined();
  });

  test("returns 404 when project not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await getProject(createRequest("GET"), { params: { id: "ghost" } });
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await getProject(createRequest("GET"), { params: { id: "proj-001" } });
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/projects/[id] ───────────────────────────────────────────────

describe("PATCH /api/projects/[id]", () => {
  let patchProject;
  beforeAll(() => { patchProject = require("../../src/app/api/projects/[id]/route").PATCH; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    const res  = await patchProject(createRequest("PATCH", { title: "Updated Project" }), { params: { id: "proj-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with body and updatedAt", async () => {
    await patchProject(createRequest("PATCH", { status: "completed" }), { params: { id: "proj-001" } });
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.status).toBe("completed");
    expect(data.updatedAt).toBeDefined();
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("error"));
    const res = await patchProject(createRequest("PATCH", { title: "X" }), { params: { id: "proj-001" } });
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/projects/[id] ──────────────────────────────────────────────

describe("DELETE /api/projects/[id]", () => {
  let deleteProject;
  beforeAll(() => { deleteProject = require("../../src/app/api/projects/[id]/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeTask(), makeTask({ id: "task-002" })]));
    const res  = await deleteProject(createRequest("DELETE"), { params: { id: "proj-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("deletes all associated tasks via batch", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeTask(), makeTask({ id: "task-002" })]));
    await deleteProject(createRequest("DELETE"), { params: { id: "proj-001" } });
    expect(mockWriteBatch.commit).toHaveBeenCalledTimes(1);
  });

  test("returns 200 even when project has no tasks", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const res = await deleteProject(createRequest("DELETE"), { params: { id: "proj-001" } });
    expect(res.status).toBe(200);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await deleteProject(createRequest("DELETE"), { params: { id: "proj-001" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/projects/employee/[employeeId] ────────────────────────────────

describe("GET /api/projects/employee/[employeeId]", () => {
  let getEmployeeProjects;
  beforeAll(() => { getEmployeeProjects = require("../../src/app/api/projects/employee/[employeeId]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with projects where employee is accepted member", async () => {
    const project = makeProject({
      members: [{ id: "emp-001", status: "accepted" }, { id: "emp-002", status: "pending" }],
    });
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([project]));
    const res  = await getEmployeeProjects(createRequest("GET"), { params: { employeeId: "emp-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.projects).toHaveLength(1);
  });

  test("excludes projects where employee has pending status", async () => {
    const project = makeProject({
      members: [{ id: "emp-001", status: "pending" }],
    });
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([project]));
    const body = await (await getEmployeeProjects(createRequest("GET"), { params: { employeeId: "emp-001" } })).json();
    expect(body.projects).toHaveLength(0);
  });

  test("returns empty array when employee is not a member of any project", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeProject({ members: [] })]));
    const body = await (await getEmployeeProjects(createRequest("GET"), { params: { employeeId: "emp-999" } })).json();
    expect(body.projects).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getEmployeeProjects(createRequest("GET"), { params: { employeeId: "emp-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/projects/accept-invite ──────────────────────────────────────

describe("POST /api/projects/accept-invite", () => {
  let acceptInvite;
  beforeAll(() => { acceptInvite = require("../../src/app/api/projects/accept-invite/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful acceptance", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeProject(), members: [{ id: "emp-001", status: "pending" }] }, "proj-001")
    );
    const res  = await acceptInvite(createRequest("POST", { projectId: "proj-001", employeeId: "emp-001" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("updates member status to accepted", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeProject(), members: [{ id: "emp-001", status: "pending" }] }, "proj-001")
    );
    await acceptInvite(createRequest("POST", { projectId: "proj-001", employeeId: "emp-001" }));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    const accepted = data.members.find((m) => m.id === "emp-001");
    expect(accepted.status).toBe("accepted");
  });

  test("also marks notification as read when notificationId provided", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeProject(), members: [{ id: "emp-001", status: "pending" }] }, "proj-001")
    );
    await acceptInvite(createRequest("POST", { projectId: "proj-001", employeeId: "emp-001", notificationId: "notif-001" }));
    expect(ff.updateDoc).toHaveBeenCalledTimes(2);
  });

  test("returns 400 when projectId is missing", async () => {
    const res = await acceptInvite(createRequest("POST", { employeeId: "emp-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when employeeId is missing", async () => {
    const res = await acceptInvite(createRequest("POST", { projectId: "proj-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 404 when project not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await acceptInvite(createRequest("POST", { projectId: "ghost", employeeId: "emp-001" }));
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("error"));
    const res = await acceptInvite(createRequest("POST", { projectId: "proj-001", employeeId: "emp-001" }));
    expect(res.status).toBe(500);
  });
});
