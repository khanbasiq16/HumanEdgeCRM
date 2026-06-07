/**
 * Mock data factories and Firestore document helpers.
 * Used across all test files to keep mocks consistent and DRY.
 */

// ── Firestore document / snapshot factories ─────────────────────────────

/**
 * Create a mock Firestore DocumentSnapshot.
 * @param {object|null} data  Document data. Pass null to simulate "not found".
 * @param {string} id  Document ID
 */
function mockDoc(data, id = "mock-doc-id") {
  return {
    exists: () => data !== null,
    data: () => data,
    id,
  };
}

/**
 * Create a mock Firestore QuerySnapshot.
 * @param {object[]} docs  Array of plain data objects
 */
function mockQuerySnapshot(docs = []) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d, i) => mockDoc(d, d.id || `mock-id-${i}`)),
  };
}

// ── Entity factories ────────────────────────────────────────────────────

function makeEmployee(overrides = {}) {
  return {
    employeeId: "emp-001",
    employeeName: "John Doe",
    employeeemail: "john@example.com",
    employeePhone: "+923001234567",
    employeeCNIC: "42201-1234567-1",
    employeeAddress: "Karachi, Pakistan",
    employeeSalary: "50000",
    department: "Engineering",
    designation: "Software Engineer",
    companyIds: ["company-001"],
    companyName: "TechCorp",
    totalWorkingHours: "9",
    dateOfJoining: "2024-01-01",
    bankName: "HBL",
    bankCode: "0001",
    bankAccountNumber: "01234567890",
    Attendance: [],
    isCheckedin: false,
    isCheckedout: true,
    status: "active",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCompany(overrides = {}) {
  return {
    id: "company-001",
    companyId: "company-001",
    name: "TechCorp",
    companyslug: "techcorp",
    companyAddress: "Karachi, Pakistan",
    companyPhoneNumber: "+9221000000",
    companyemail: "hr@techcorp.com",
    companyemailpassword: "secret",
    companysmtphost: "587",
    companyemailhost: "smtp.gmail.com",
    companyWebsite: "https://techcorp.com",
    timezone: "Asia/Karachi",
    status: "active",
    createdAt: new Date().toISOString(),
    assignedInvoices: [],
    AssignClient: [],
    ...overrides,
  };
}

function makeDepartment(overrides = {}) {
  return {
    departmentId: "dept-001",
    departmentName: "Engineering",
    description: "Engineering Department",
    checkInTime: "9:00 AM",
    checkOutTime: "6:00 PM",
    graceTime: "15",
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeClient(overrides = {}) {
  return {
    id: "client-001",
    clientName: "Acme Corp",
    clientEmail: "contact@acme.com",
    clientPhone: "+923009876543",
    clientAddress: "Lahore, Pakistan",
    companyId: "company-001",
    companyName: "TechCorp",
    companySlug: "techcorp",
    projectsDetails: "Web development",
    packageDetails: "Basic",
    clientWebsite: "https://acme.com",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInvoice(overrides = {}) {
  return {
    invoiceId: "inv-001",
    companySlug: "techcorp",
    companyName: "TechCorp",
    clientId: "client-001",
    invoiceNumber: "INV-001",
    invoiceDate: "2024-01-15",
    totalAmount: 50000,
    invoiceAmount: 50000,
    createdBy: "Admin",
    status: "pending",
    Description: "Web development services",
    invoiceLink: "http://localhost:3000/invoice/techcorp/details/inv-001",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProject(overrides = {}) {
  return {
    id: "proj-001",
    title: "E-commerce Platform",
    description: "Build a full e-commerce platform",
    priority: "high",
    status: "active",
    deadline: "2024-06-30",
    createdBy: "Admin",
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTask(overrides = {}) {
  return {
    id: "task-001",
    projectId: "proj-001",
    projectTitle: "E-commerce Platform",
    title: "Setup database schema",
    description: "Create Firestore collections",
    assignedTo: "emp-001",
    assignedToName: "John Doe",
    source: "admin",
    status: "pending",
    priority: "medium",
    dueDate: "2024-02-01",
    createdBy: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    adminRemark: "",
    ...overrides,
  };
}

function makeBank(overrides = {}) {
  return {
    bankid: "bank-001",
    accountHolderName: "TechCorp Ltd",
    banktitle: "HBL Business Account",
    accountType: "current",
    branchCode: "0001",
    iban: "PK36SCBL0000001123456702",
    balance: 500000,
    currency: { code: "PKR", symbol: "Rs.", rate: 279.5 },
    bankslug: "hbl-business-account",
    userid: "accountant-001",
    Transaction: [],
    Transferlogs: [],
    Loanlogs: [],
    banks: [],
    status: "active",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeAdminUser(overrides = {}) {
  return {
    uid: "admin-uid-001",
    email: "admin@humanedge.com",
    role: "admin",
    name: "HR Admin",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeAttendanceEntry(overrides = {}) {
  return {
    id: "att-001",
    date: "01/01/2024",
    checkin: {
      time: "9:00 AM",
      status: "On Time",
      note: "",
      ip: "192.168.1.100",
    },
    checkout: {},
    ...overrides,
  };
}

module.exports = {
  mockDoc,
  mockQuerySnapshot,
  makeEmployee,
  makeCompany,
  makeDepartment,
  makeClient,
  makeInvoice,
  makeProject,
  makeTask,
  makeBank,
  makeAdminUser,
  makeAttendanceEntry,
};
