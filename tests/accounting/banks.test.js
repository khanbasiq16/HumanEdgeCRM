/**
 * E2E tests — POST /api/acounts/banks/create
 *              POST /api/acounts/banks/add-balance
 *              POST /api/acounts/banks/transfer
 *              GET  /api/acounts/banks/get-all-banks
 */

const { POST: createBank } = require("../../src/app/api/acounts/banks/create/route");
const { POST: addBalance } = require("../../src/app/api/acounts/banks/add-balance/route");
const { POST: transferFunds } = require("../../src/app/api/acounts/banks/transfer/route");
const { GET: getAllBanks } = require("../../src/app/api/acounts/banks/get-all-banks/route");
const { createRequest } = require("../helpers/request");
const { makeBank, mockDoc, mockQuerySnapshot } = require("../helpers/mockData");

jest.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
}));

const ff = require("firebase/firestore");

function setupDefaults() {
  ff.collection.mockReturnValue("col-ref");
  ff.doc.mockReturnValue("doc-ref");
  ff.setDoc.mockResolvedValue(undefined);
  ff.updateDoc.mockResolvedValue(undefined);
  ff.arrayUnion.mockImplementation((v) => v);
}

const mockAccountant = {
  userid: "accountant-001",
  accountuserName: "Finance Manager",
  accountuseremail: "finance@humanedge.com",
  banks: [],
  status: "active",
};

// ── POST /api/acounts/banks/create ────────────────────────────────────
describe("POST /api/acounts/banks/create", () => {
  beforeEach(() => setupDefaults());

  const validPayload = (overrides = {}) => ({
    userid: "accountant-001",
    accountHolderName: "TechCorp Ltd",
    bankTitle: "HBL Business Account",
    accountType: "current",
    branchCode: "0001",
    iban: "PK36SCBL0000001123456702",
    balance: 500000,
    currency: { code: "PKR", symbol: "Rs.", rate: 279.5 },
    notes: "Main operating account",
    ...overrides,
  });

  test("returns 200 on successful bank creation", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant, "accountant-001"));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([makeBank()]));

    const res = await createBank(createRequest("POST", validPayload()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.banks)).toBe(true);
  });

  test("calls setDoc to persist bank document", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    await createBank(createRequest("POST", validPayload()));
    expect(ff.setDoc).toHaveBeenCalledTimes(1);
  });

  test("bank slug is generated from bankTitle", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    await createBank(createRequest("POST", validPayload({ bankTitle: "HBL Business Account" })));
    const savedBank = ff.setDoc.mock.calls[0][1];
    expect(savedBank.bankslug).toBe("hbl-business-account");
  });

  test("bank has correct initial arrays and status", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    await createBank(createRequest("POST", validPayload()));
    const savedBank = ff.setDoc.mock.calls[0][1];
    expect(savedBank.Transaction).toEqual([]);
    expect(savedBank.Transferlogs).toEqual([]);
    expect(savedBank.Loanlogs).toEqual([]);
    expect(savedBank.status).toBe("active");
  });

  test("bank id is a UUID (36 chars)", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    await createBank(createRequest("POST", validPayload()));
    const savedBank = ff.setDoc.mock.calls[0][1];
    expect(savedBank.bankid).toHaveLength(36);
  });

  test("calls updateDoc to link bank to accountant", async () => {
    ff.getDoc.mockResolvedValueOnce(mockDoc(mockAccountant));
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));

    await createBank(createRequest("POST", validPayload()));
    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
  });

  test("returns 404 when accountant not found", async () => {
    ff.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });

    const res = await createBank(createRequest("POST", validPayload()));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/Accountants User not found/i);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("Firestore down"));

    const res = await createBank(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/acounts/banks/add-balance ───────────────────────────────
// Route: { amount, bankId, userid, ip }
// getDoc#1 = bank, getDoc#2 = accountant user, getDoc#3 = re-fetch bank after updateDoc
describe("POST /api/acounts/banks/add-balance", () => {
  beforeEach(() => setupDefaults());

  const validPayload = (overrides = {}) => ({
    bankId: "bank-001",
    userid: "accountant-001",
    amount: 50000,
    ip: "192.168.1.1",
    ...overrides,
  });

  function setupSuccess(bankData = makeBank({ balance: 100000 })) {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(bankData, "bank-001"))      // #1: bank exists
      .mockResolvedValueOnce(mockDoc(mockAccountant, "accountant-001"))  // #2: accountant user
      .mockResolvedValueOnce(mockDoc(bankData, "bank-001"));     // #3: re-fetch after update
  }

  test("returns 200 on successful balance addition", async () => {
    setupSuccess();
    const res = await addBalance(createRequest("POST", validPayload()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/Balance updated/i);
    expect(body.bank).toBeDefined();
  });

  test("calls updateDoc with increased balance", async () => {
    setupSuccess(makeBank({ balance: 100000 }));
    await addBalance(createRequest("POST", validPayload({ amount: 50000 })));

    expect(ff.updateDoc).toHaveBeenCalledTimes(1);
    const updateArg = ff.updateDoc.mock.calls[0][1];
    expect(updateArg.balance).toBe(150000); // 100000 + 50000
  });

  test("log entry contains correct status and amount", async () => {
    setupSuccess();
    await addBalance(createRequest("POST", validPayload({ amount: 25000, ip: "10.0.0.1" })));

    const updateArg = ff.updateDoc.mock.calls[0][1];
    expect(updateArg.Logs.status).toBe("Credit");
    expect(updateArg.Logs.amount).toBe(25000);
    expect(updateArg.Logs.ip).toBe("10.0.0.1");
  });

  test("returns 404 when bank not found", async () => {
    ff.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });

    const res = await addBalance(createRequest("POST", validPayload()));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/Bank not found/i);
  });

  test("returns 404 when accountant user not found", async () => {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(makeBank(), "bank-001"))        // bank exists
      .mockResolvedValueOnce({ exists: () => false, data: () => null }); // user missing

    const res = await addBalance(createRequest("POST", validPayload()));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/User not found/i);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("Firestore error"));

    const res = await addBalance(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/acounts/banks/transfer ─────────────────────────────────
// Route: { fromBank, toBank, amount, userId, ip }
// getDoc#1 = fromBank, #2 = toBank, #3 = accountant user, #4 = re-fetch fromBank
// Returns 400 if currency.code or currency.rate is missing
describe("POST /api/acounts/banks/transfer", () => {
  beforeEach(() => setupDefaults());

  const validPayload = (overrides = {}) => ({
    fromBank: "bank-from",
    toBank: "bank-to",
    amount: 50000,
    userId: "accountant-001",
    ip: "192.168.1.1",
    ...overrides,
  });

  const fromBankData = makeBank({ bankid: "bank-from", banktitle: "From Bank", balance: 200000, currency: { code: "PKR", symbol: "Rs.", rate: 279.5 } });
  const toBankData   = makeBank({ bankid: "bank-to",   banktitle: "To Bank",   balance: 50000,  currency: { code: "USD", symbol: "$", rate: 1 } });

  function setupSuccess() {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(fromBankData, "bank-from"))        // #1: fromBank
      .mockResolvedValueOnce(mockDoc(toBankData, "bank-to"))            // #2: toBank
      .mockResolvedValueOnce(mockDoc(mockAccountant, "accountant-001")) // #3: accountant
      .mockResolvedValueOnce(mockDoc(fromBankData, "bank-from"));       // #4: re-fetch fromBank
  }

  test("returns 200 on successful transfer", async () => {
    setupSuccess();
    const res = await transferFunds(createRequest("POST", validPayload()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.convertedAmount).toBeDefined();
    expect(body.bank).toBeDefined();
  });

  test("response message contains bank names", async () => {
    setupSuccess();
    const body = await (await transferFunds(createRequest("POST", validPayload()))).json();
    expect(body.message).toContain("From Bank");
    expect(body.message).toContain("To Bank");
  });

  test("calls updateDoc twice — one for each bank", async () => {
    setupSuccess();
    await transferFunds(createRequest("POST", validPayload()));
    expect(ff.updateDoc).toHaveBeenCalledTimes(2);
  });

  test("performs currency conversion correctly", async () => {
    // PKR → USD: amount / fromRate * toRate = 50000 / 279.5 * 1 ≈ 178.89
    setupSuccess();
    const body = await (await transferFunds(createRequest("POST", validPayload({ amount: 50000 })))).json();
    expect(typeof body.convertedAmount).toBe("number");
    expect(body.convertedAmount).toBeCloseTo(178.89, 0);
  });

  test("returns 400 when currency.code is missing in fromBank", async () => {
    const noCurrencyBank = makeBank({ bankid: "bank-from", currency: { symbol: "Rs.", rate: 279.5 } }); // no code
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(noCurrencyBank, "bank-from"))
      .mockResolvedValueOnce(mockDoc(toBankData, "bank-to"));

    const res = await transferFunds(createRequest("POST", validPayload()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Currency code or rate missing/i);
  });

  test("returns 400 when currency.rate is missing in toBank", async () => {
    const noRateBank = makeBank({ bankid: "bank-to", currency: { code: "USD", symbol: "$" } }); // no rate
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(fromBankData, "bank-from"))
      .mockResolvedValueOnce(mockDoc(noRateBank, "bank-to"));

    const res = await transferFunds(createRequest("POST", validPayload()));
    expect(res.status).toBe(400);
  });

  test("returns 404 when fromBank not found", async () => {
    ff.getDoc
      .mockResolvedValueOnce({ exists: () => false, data: () => null })
      .mockResolvedValueOnce(mockDoc(toBankData, "bank-to"));

    const res = await transferFunds(createRequest("POST", validPayload()));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/Bank not found/i);
  });

  test("returns 404 when toBank not found", async () => {
    ff.getDoc
      .mockResolvedValueOnce(mockDoc(fromBankData, "bank-from"))
      .mockResolvedValueOnce({ exists: () => false, data: () => null });

    const res = await transferFunds(createRequest("POST", validPayload()));
    expect(res.status).toBe(404);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDoc.mockRejectedValueOnce(new Error("Firestore down"));

    const res = await transferFunds(createRequest("POST", validPayload()));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/acounts/banks/get-all-banks ─────────────────────────────
describe("GET /api/acounts/banks/get-all-banks", () => {
  beforeEach(() => setupDefaults());

  test("returns 200 with all banks", async () => {
    const banks = [makeBank({ bankid: "b-001" }), makeBank({ bankid: "b-002", banktitle: "Allied Bank" })];
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot(banks));

    const res = await getAllBanks(createRequest("GET"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.banks).toHaveLength(2);
  });

  test("returns empty array when no banks", async () => {
    ff.getDocs.mockResolvedValueOnce(mockQuerySnapshot([]));
    const body = await (await getAllBanks(createRequest("GET"))).json();
    expect(body.banks).toEqual([]);
  });

  test("returns 500 on Firestore error", async () => {
    ff.getDocs.mockRejectedValueOnce(new Error("error"));
    const res = await getAllBanks(createRequest("GET"));
    expect(res.status).toBe(500);
  });
});
