/**
 * E2E tests — src/middleware.js
 *
 * Covers: unauthenticated redirect, valid token passes through,
 *         expired token → refresh flow, role-based access control,
 *         public path handling, cookie renewal.
 */

// ── Mock jose (ESM-only v6 — cannot be required directly in Jest CJS mode) ──
const jwt = require("jsonwebtoken");
const SECRET = "test-jwt-secret-for-e2e-tests";

jest.mock("jose", () => {
  const jwt = require("jsonwebtoken");
  const SECRET = "test-jwt-secret-for-e2e-tests";

  return {
    jwtVerify: jest.fn(async (token) => {
      const payload = jwt.verify(token, SECRET);
      return { payload };
    }),
    SignJWT: jest.fn().mockImplementation((payload) => {
      let _p = { ...payload };
      return {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn(async () => jwt.sign(_p, SECRET, { expiresIn: "1d" })),
      };
    }),
  };
});

// ── Mock next/server ───────────────────────────────────────────────────
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    NextResponse: {
      next: jest.fn(() => ({
        cookies: { set: jest.fn() },
        headers: new Map(),
      })),
      redirect: jest.fn((url) => ({
        url: url.toString(),
        cookies: { set: jest.fn(), delete: jest.fn() },
        headers: new Map(),
        isRedirect: true,
      })),
      json: actual.NextResponse.json,
    },
  };
});

const { middleware } = require("../../src/middleware");
const { NextResponse } = require("next/server");
const { jwtVerify, SignJWT } = require("jose");

// ── Helpers ────────────────────────────────────────────────────────────
function makeToken(payload, expiresIn = "1d") {
  return jwt.sign(payload, SECRET, { expiresIn });
}

function makeExpiredToken(payload) {
  // Set exp in the past so the token is immediately expired
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ ...payload, iat: now - 120, exp: now - 60 }, SECRET);
}

function makeRequest(pathname, cookies = {}, referer = null) {
  const cookieMap = new Map(Object.entries(cookies));
  return {
    cookies: {
      get: (name) => {
        const val = cookieMap.get(name);
        return val ? { value: val } : undefined;
      },
    },
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    headers: {
      get: (name) => (name === "referer" ? referer : null),
    },
  };
}

function setupNextResponseMocks() {
  // Re-establish jose mocks after global resetAllMocks() clears their implementations
  jwtVerify.mockImplementation(async (token) => {
    const payload = jwt.verify(token, SECRET);
    return { payload };
  });
  SignJWT.mockImplementation((payload) => {
    let _p = { ...payload };
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn(async () => jwt.sign(_p, SECRET, { expiresIn: "1d" })),
    };
  });

  NextResponse.next.mockReturnValue({
    cookies: { set: jest.fn() },
    headers: new Map(),
  });
  NextResponse.redirect.mockImplementation((url) => ({
    url: url.toString(),
    cookies: { set: jest.fn(), delete: jest.fn() },
    headers: new Map(),
    isRedirect: true,
  }));
}

// ── Tests ──────────────────────────────────────────────────────────────
describe("middleware", () => {
  beforeEach(() => {
    setupNextResponseMocks();
  });

  // ── No token ────────────────────────────────────────────────────────
  test("redirects to / when no token and accessing protected route", async () => {
    const req = makeRequest("/admin/employees");
    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectArg).toContain("/");
  });

  test("allows access to public path / without any token", async () => {
    const req = makeRequest("/");
    await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  // ── Valid access token ─────────────────────────────────────────────
  test("passes through when admin token is valid and accessing /admin", async () => {
    const token = makeToken({ id: "uid-001", email: "admin@test.com", role: "admin" });
    const req = makeRequest("/admin", { token });

    await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  test("passes through when employee token is valid and accessing /employee/john-doe", async () => {
    const token = makeToken({ id: "uid-001", email: "emp@test.com", role: "employee", slug: "john-doe" });
    const req = makeRequest("/employee/john-doe", { token });

    await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
  });

  test("passes through when accounts token is valid and accessing /accounts/finance-user", async () => {
    const token = makeToken({ id: "uid-001", email: "acc@test.com", role: "accounts", slug: "finance-user" });
    const req = makeRequest("/accounts/finance-user", { token });

    await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
  });

  // ── Authenticated redirect from public paths ──────────────────────
  test("redirects admin away from / to /admin when already logged in", async () => {
    const token = makeToken({ id: "uid-001", email: "admin@test.com", role: "admin" });
    const req = makeRequest("/", { token });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectUrl = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectUrl).toContain("/admin");
  });

  test("redirects employee away from / to /employee/slug when already logged in", async () => {
    const token = makeToken({ id: "uid-001", email: "emp@test.com", role: "employee", slug: "john-doe" });
    const req = makeRequest("/", { token });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectUrl = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectUrl).toContain("/employee/john-doe");
  });

  // ── Role-based access control ──────────────────────────────────────
  test("redirects employee trying to access /admin", async () => {
    const token = makeToken({ id: "uid-001", email: "emp@test.com", role: "employee", slug: "john-doe" });
    const req = makeRequest("/admin/employees", { token });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectUrl = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectUrl).toContain("/employee/john-doe");
  });

  test("redirects admin trying to access /employee route", async () => {
    const token = makeToken({ id: "uid-001", email: "admin@test.com", role: "admin" });
    const req = makeRequest("/employee/john-doe/attendance", { token });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectUrl = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectUrl).toContain("/admin");
  });

  test("redirects employee trying to access /accounts route", async () => {
    const token = makeToken({ id: "uid-001", email: "emp@test.com", role: "employee", slug: "john-doe" });
    const req = makeRequest("/accounts/finance-user/banks", { token });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
  });

  // ── Refresh token flow ─────────────────────────────────────────────
  test("renews access token when access token expired but refresh token valid", async () => {
    const expiredToken = makeExpiredToken({ id: "uid-001", email: "admin@test.com", role: "admin" });
    const refreshToken = makeToken({ id: "uid-001", email: "admin@test.com", role: "admin" }, "30d");
    const req = makeRequest("/admin", { token: expiredToken, refresh_token: refreshToken });

    const response = await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.next.mock.results[0].value.cookies.set).toHaveBeenCalledWith(
      "token",
      expect.any(String),
      expect.any(Object)
    );
  });

  test("redirects to / and clears cookies when both tokens are expired", async () => {
    const expiredAccess = makeExpiredToken({ id: "uid-001", email: "admin@test.com", role: "admin" });
    const expiredRefresh = makeExpiredToken({ id: "uid-001", email: "admin@test.com", role: "admin" });

    const req = makeRequest("/admin", { token: expiredAccess, refresh_token: expiredRefresh });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectArg).toContain("/");
  });

  test("redirects to / when access token is invalid (tampered)", async () => {
    const tamperedToken = "invalid.token.payload";
    const req = makeRequest("/admin", { token: tamperedToken });

    await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
  });

  // ── superAdmin access ──────────────────────────────────────────────
  test("allows superAdmin to access /admin routes", async () => {
    const token = makeToken({ id: "uid-001", email: "super@test.com", role: "superAdmin" });
    const req = makeRequest("/admin/settings", { token });

    await middleware(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  test("redirects superAdmin from / to /admin", async () => {
    const token = makeToken({ id: "uid-001", email: "super@test.com", role: "superAdmin" });
    const req = makeRequest("/", { token });

    await middleware(req);

    const redirectUrl = NextResponse.redirect.mock.calls[0][0].toString();
    expect(redirectUrl).toContain("/admin");
  });
});
