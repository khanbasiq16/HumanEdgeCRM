// ── Environment variables for tests ────────────────────────────────────
process.env.JWT_SECRET = "test-jwt-secret-for-e2e-tests";
process.env.NEXT_FIREBASE_PROJECT_ID = "test-project";
process.env.NEXT_FIREBASE_CLIENT_EMAIL = "test@test.iam.gserviceaccount.com";
process.env.NEXT_FIREBASE_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NODE_ENV = "test";
process.env.EMAIL_USER = "test@gmail.com";
process.env.EMAIL_PASS = "test-pass";

// ── Global before-each: reset mocks + suppress console noise ──────────
beforeEach(() => {
  // Reset ALL mock state (calls, instances, implementations, queued values)
  // so mock queue bleeding between tests is impossible.
  jest.resetAllMocks();

  // Re-suppress console noise after reset (spies are reset too)
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
