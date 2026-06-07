/**
 * E2E tests — GET /api/logout
 *
 * Covers: successful logout, cookie clearing.
 */

const { GET } = require("../../src/app/api/logout/route");
const { createRequest } = require("../helpers/request");

describe("GET /api/logout", () => {
  test("returns 200 with success message", async () => {
    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/Logged out/i);
  });

  test("clears token and refresh_token cookies", async () => {
    const req = createRequest("GET");
    const res = await GET(req);
    const setCookie = res.headers.getSetCookie?.() || [];
    const cookieStr = setCookie.join("; ");

    // Both cookies should be cleared (empty value or past expiry)
    expect(cookieStr).toContain("token=");
    expect(cookieStr).toContain("refresh_token=");
    // Cleared cookies use epoch expiry
    expect(cookieStr).toContain("Expires=Thu, 01 Jan 1970");
  });

  test("response body has correct shape", async () => {
    const req = createRequest("GET");
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty("success");
    expect(body).toHaveProperty("message");
  });
});
