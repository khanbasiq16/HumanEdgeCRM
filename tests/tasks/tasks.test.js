/**
 * Tests for task routes:
 *   GET    /api/tasks/get-all
 *   GET    /api/tasks/get-by-project/[projectId]
 *   GET    /api/tasks/employee/[employeeId]
 *   POST   /api/tasks/update
 *   POST   /api/tasks/update-status
 *   DELETE /api/tasks/delete
 *   POST   /api/tasks/add-comment
 *   POST   /api/tasks/add-remark
 */

const { createRequest } = require("../helpers/request");
const { makeTask, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
jest.mock("firebase/firestore", () => ({
  collection:  jest.fn(),
  doc:         jest.fn(),
  getDoc:      jest.fn(),
  getDocs:     jest.fn(),
  updateDoc:   jest.fn(),
  deleteDoc:   jest.fn(),
  query:       jest.fn(),
  where:       jest.fn(),
  arrayUnion:  jest.fn((v) => v),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.query.mockReturnValue("q-ref");
  ff.where.mockReturnValue("w-ref");
  ff.updateDoc.mockResolvedValue(undefined);
  ff.deleteDoc.mockResolvedValue(undefined);
  ff.getDocs.mockResolvedValue(mockQuerySnapshot([]));
}

// ── GET /api/tasks/get-all ────────────────────────────────────────────────

describe("GET /api/tasks/get-all", () => {
  let getAll;
  beforeAll(() => { getAll = require("../../src/app/api/tasks/get-all/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with tasks array", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeTask(), makeTask({ id: "task-002" })]));
    const res  = await getAll();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.tasks)).toBe(true);
    expect(body.tasks).toHaveLength(2);
  });

  test("returns empty array when no tasks", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAll()).json();
    expect(body.tasks).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getAll();
    expect(res.status).toBe(500);
  });
});

// ── GET /api/tasks/get-by-project/[projectId] ─────────────────────────────

describe("GET /api/tasks/get-by-project/[projectId]", () => {
  let getByProject;
  beforeAll(() => { getByProject = require("../../src/app/api/tasks/get-by-project/[projectId]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with tasks for project", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeTask({ projectId: "proj-001" })]));
    const res  = await getByProject(createRequest("GET"), { params: { projectId: "proj-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tasks).toHaveLength(1);
  });

  test("returns empty array when no tasks for project", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getByProject(createRequest("GET"), { params: { projectId: "proj-empty" } })).json();
    expect(body.tasks).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getByProject(createRequest("GET"), { params: { projectId: "proj-001" } });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/tasks/employee/[employeeId] ──────────────────────────────────

describe("GET /api/tasks/employee/[employeeId]", () => {
  let getByEmployee;
  beforeAll(() => { getByEmployee = require("../../src/app/api/tasks/employee/[employeeId]/route").GET; });
  beforeEach(() => setupDefaults());

  test("returns 200 with tasks for employee", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeTask({ assignedTo: "emp-001" })]));
    const res  = await getByEmployee(createRequest("GET"), { params: { employeeId: "emp-001" } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tasks).toHaveLength(1);
  });

  test("returns empty array when employee has no tasks", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getByEmployee(createRequest("GET"), { params: { employeeId: "emp-none" } })).json();
    expect(body.tasks).toHaveLength(0);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getByEmployee(createRequest("GET"), { params: { employeeId: "emp-001" } });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/tasks/update ────────────────────────────────────────────────

describe("POST /api/tasks/update", () => {
  let updateTask;
  beforeAll(() => { updateTask = require("../../src/app/api/tasks/update/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful update", async () => {
    const res  = await updateTask(createRequest("POST", { taskId: "task-001", title: "New Title" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with provided fields", async () => {
    await updateTask(createRequest("POST", { taskId: "task-001", title: "Updated", priority: "high" }));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.title).toBe("Updated");
    expect(data.priority).toBe("high");
    expect(data.updatedAt).toBeDefined();
  });

  test("only includes provided optional fields", async () => {
    await updateTask(createRequest("POST", { taskId: "task-001", title: "T" }));
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.description).toBeUndefined();
    expect(data.priority).toBeUndefined();
  });

  test("returns 400 when taskId is missing", async () => {
    const res = await updateTask(createRequest("POST", { title: "X" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateTask(createRequest("POST", { taskId: "task-001" }));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/tasks/update-status ─────────────────────────────────────────

describe("POST /api/tasks/update-status", () => {
  let updateStatus;
  beforeAll(() => { updateStatus = require("../../src/app/api/tasks/update-status/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on success", async () => {
    const res  = await updateStatus(createRequest("POST", { taskId: "task-001", status: "in-progress" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with status and updatedAt", async () => {
    await updateStatus(createRequest("POST", { taskId: "task-001", status: "done" }));
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.status).toBe("done");
    expect(data.updatedAt).toBeDefined();
  });

  test("returns 400 when taskId is missing", async () => {
    const res = await updateStatus(createRequest("POST", { status: "done" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when status is missing", async () => {
    const res = await updateStatus(createRequest("POST", { taskId: "task-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("error"));
    const res = await updateStatus(createRequest("POST", { taskId: "task-001", status: "done" }));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/tasks/delete ──────────────────────────────────────────────

describe("DELETE /api/tasks/delete", () => {
  let deleteTask;
  beforeAll(() => { deleteTask = require("../../src/app/api/tasks/delete/route").DELETE; });
  beforeEach(() => setupDefaults());

  test("returns 200 on successful delete", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeTask(), source: "employee", assignedTo: "emp-001" }, "task-001")
    );
    const res  = await deleteTask(createRequest("DELETE", { taskId: "task-001", employeeId: "emp-001" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls deleteDoc", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeTask(), source: "employee", assignedTo: "emp-001" }, "task-001")
    );
    await deleteTask(createRequest("DELETE", { taskId: "task-001", employeeId: "emp-001" }));
    expect(ff.deleteDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 403 when task belongs to different employee", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeTask(), source: "employee", assignedTo: "emp-999" }, "task-001")
    );
    const res = await deleteTask(createRequest("DELETE", { taskId: "task-001", employeeId: "emp-001" }));
    expect(res.status).toBe(403);
  });

  test("returns 403 when task source is admin (not employee)", async () => {
    ff.getDoc.mockResolvedValueOnce(
      mockDoc({ ...makeTask(), source: "admin", assignedTo: "emp-001" }, "task-001")
    );
    const res = await deleteTask(createRequest("DELETE", { taskId: "task-001", employeeId: "emp-001" }));
    expect(res.status).toBe(403);
  });

  test("returns 404 when task not found", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(null));
    const res = await deleteTask(createRequest("DELETE", { taskId: "ghost", employeeId: "emp-001" }));
    expect(res.status).toBe(404);
  });

  test("returns 400 when taskId is missing", async () => {
    const res = await deleteTask(createRequest("DELETE", { employeeId: "emp-001" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when employeeId is missing", async () => {
    const res = await deleteTask(createRequest("DELETE", { taskId: "task-001" }));
    expect(res.status).toBe(400);
  });
});

// ── POST /api/tasks/add-comment ───────────────────────────────────────────

describe("POST /api/tasks/add-comment", () => {
  let addComment;
  beforeAll(() => { addComment = require("../../src/app/api/tasks/add-comment/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 with comment object", async () => {
    const res  = await addComment(createRequest("POST", { taskId: "task-001", text: "Great progress!", authorId: "emp-001", authorName: "John" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.comment).toBeDefined();
  });

  test("comment has required fields", async () => {
    const body = await (await addComment(createRequest("POST", { taskId: "task-001", text: "LGTM", authorName: "Alice" }))).json();
    const c = body.comment;
    expect(c.id).toBeDefined();
    expect(c.text).toBe("LGTM");
    expect(c.authorName).toBe("Alice");
    expect(c.createdAt).toBeDefined();
  });

  test("calls updateDoc with arrayUnion comment", async () => {
    await addComment(createRequest("POST", { taskId: "task-001", text: "Nice!" }));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("defaults authorName to Unknown when not provided", async () => {
    const body = await (await addComment(createRequest("POST", { taskId: "task-001", text: "Hey" }))).json();
    expect(body.comment.authorName).toBe("Unknown");
  });

  test("returns 400 when taskId is missing", async () => {
    const res = await addComment(createRequest("POST", { text: "Hello" }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when text is empty", async () => {
    const res = await addComment(createRequest("POST", { taskId: "task-001", text: "   " }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("error"));
    const res = await addComment(createRequest("POST", { taskId: "task-001", text: "Hey" }));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/tasks/add-remark ────────────────────────────────────────────

describe("POST /api/tasks/add-remark", () => {
  let addRemark;
  beforeAll(() => { addRemark = require("../../src/app/api/tasks/add-remark/route").POST; });
  beforeEach(() => setupDefaults());

  test("returns 200 on success", async () => {
    const res  = await addRemark(createRequest("POST", { taskId: "task-001", remark: "Looks good" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("calls updateDoc with adminRemark", async () => {
    await addRemark(createRequest("POST", { taskId: "task-001", remark: "Fix this" }));
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.adminRemark).toBe("Fix this");
  });

  test("sets adminRemark to empty string when remark is omitted", async () => {
    await addRemark(createRequest("POST", { taskId: "task-001" }));
    const [, data] = ff.updateDoc.mock.calls[0];
    expect(data.adminRemark).toBe("");
  });

  test("returns 400 when taskId is missing", async () => {
    const res = await addRemark(createRequest("POST", { remark: "test" }));
    expect(res.status).toBe(400);
  });

  test("returns 500 on Firestore error", async () => {
    ff.updateDoc.mockRejectedValueOnce(new Error("error"));
    const res = await addRemark(createRequest("POST", { taskId: "task-001" }));
    expect(res.status).toBe(500);
  });
});
