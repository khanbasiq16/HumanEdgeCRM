/**
 * E2E tests — POST /api/projects/create
 *              POST /api/tasks/create
 */

const { POST: createProject } = require("../../src/app/api/projects/create/route");
const { POST: createTask } = require("../../src/app/api/tasks/create/route");
const { createRequest } = require("../helpers/request");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.doc.mockReturnValue("doc-ref");
  ff.collection.mockReturnValue("col-ref");
  ff.setDoc.mockResolvedValue(undefined);
}

describe("POST /api/projects/create", () => {
  beforeEach(() => setupDefaults());

  const validPayload = (overrides = {}) => ({
    title: "E-commerce Platform",
    description: "Build a full e-commerce platform",
    priority: "high",
    status: "active",
    deadline: "2024-06-30",
    createdBy: "Admin",
    ...overrides,
  });

  test("returns 200 on successful project creation", async () => {
    const body = await (await createProject(createRequest("POST", validPayload()))).json();
    expect(body.success).toBe(true);
    expect(body.project).toBeDefined();
  });

  test("project has correct title and fields", async () => {
    const body = await (await createProject(createRequest("POST", validPayload()))).json();
    expect(body.project.title).toBe("E-commerce Platform");
    expect(body.project.priority).toBe("high");
    expect(body.project.status).toBe("active");
    expect(body.project.members).toEqual([]);
  });

  test("project id is a UUID (36 chars)", async () => {
    const body = await (await createProject(createRequest("POST", validPayload()))).json();
    expect(body.project.id).toHaveLength(36);
  });

  test("calls setDoc to persist project", async () => {
    await createProject(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when title is missing", async () => {
    const res = await createProject(createRequest("POST", { description: "No title" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Title is required/i);
  });

  test("returns 400 when title is empty string", async () => {
    const res = await createProject(createRequest("POST", validPayload({ title: "   " })));
    expect(res.status).toBe(400);
  });

  test("trims whitespace from title", async () => {
    const body = await (await createProject(createRequest("POST", validPayload({ title: "  My Project  " })))).json();
    expect(body.project.title).toBe("My Project");
  });

  test("uses default priority 'medium' when not provided", async () => {
    const body = await (await createProject(createRequest("POST", { title: "Simple Project" }))).json();
    expect(body.project.priority).toBe("medium");
  });

  test("uses default status 'active' when not provided", async () => {
    const body = await (await createProject(createRequest("POST", { title: "Simple Project" }))).json();
    expect(body.project.status).toBe("active");
  });

  test("returns 500 on Firestore error", async () => {
    ff.setDoc.mockRejectedValueOnce(new Error("error"));
    const res = await createProject(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/tasks/create", () => {
  beforeEach(() => setupDefaults());

  const validPayload = (overrides = {}) => ({
    projectId: "proj-001",
    projectTitle: "E-commerce Platform",
    title: "Setup database",
    description: "Create Firestore collections",
    assignedTo: "emp-001",
    assignedToName: "John Doe",
    priority: "high",
    dueDate: "2024-02-01",
    taskDate: "2024-01-15",
    createdBy: "Admin",
    source: "admin",
    type: "project",
    ...overrides,
  });

  test("returns 200 on successful task creation", async () => {
    const body = await (await createTask(createRequest("POST", validPayload()))).json();
    expect(body.success).toBe(true);
    expect(body.task).toBeDefined();
  });

  test("task has correct fields", async () => {
    const body = await (await createTask(createRequest("POST", validPayload()))).json();
    expect(body.task.title).toBe("Setup database");
    expect(body.task.assignedTo).toBe("emp-001");
    expect(body.task.status).toBe("pending");
    expect(body.task.comments).toEqual([]);
    expect(body.task.adminRemark).toBe("");
  });

  test("task id is a UUID (36 chars)", async () => {
    const body = await (await createTask(createRequest("POST", validPayload()))).json();
    expect(body.task.id).toHaveLength(36);
  });

  test("calls setDoc to persist task", async () => {
    await createTask(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when title is missing", async () => {
    const res = await createTask(createRequest("POST", validPayload({ title: undefined })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Title and assignee are required/i);
  });

  test("returns 400 when assignedTo is missing", async () => {
    const res = await createTask(createRequest("POST", validPayload({ assignedTo: undefined })));
    expect(res.status).toBe(400);
  });

  test("task type defaults to 'self' for employee source", async () => {
    const body = await (await createTask(createRequest("POST", { title: "My task", assignedTo: "emp-001", source: "employee" }))).json();
    expect(body.task.type).toBe("self");
  });

  test("task type is 'project' for admin source", async () => {
    const body = await (await createTask(createRequest("POST", validPayload({ source: "admin", type: undefined })))).json();
    expect(body.task.type).toBe("project");
  });

  test("uses default priority 'medium' when not provided", async () => {
    const body = await (await createTask(createRequest("POST", { title: "Quick task", assignedTo: "emp-001" }))).json();
    expect(body.task.priority).toBe("medium");
  });

  test("returns 500 on Firestore error", async () => {
    ff.setDoc.mockRejectedValueOnce(new Error("error"));
    const res = await createTask(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });

  test("createdAt and updatedAt are both set", async () => {
    const body = await (await createTask(createRequest("POST", validPayload()))).json();
    expect(body.task.createdAt).toBeDefined();
    expect(body.task.updatedAt).toBeDefined();
    expect(body.task.createdAt).toBe(body.task.updatedAt);
  });
});
