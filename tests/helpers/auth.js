const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-e2e-tests";

/**
 * Generate a signed JWT for use in test requests.
 *
 * @param {"admin"|"superAdmin"|"employee"|"accounts"} role
 * @param {object} extra  Extra payload fields (e.g. slug for employees)
 */
function generateToken(role = "admin", extra = {}) {
  const payload = {
    id: "test-user-uid-" + role,
    email: `test-${role}@humanedge.com`,
    role,
    ...extra,
  };
  return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

/** Pre-built token getters for common roles */
const adminToken = () => generateToken("admin");
const superAdminToken = () => generateToken("superAdmin");
const employeeToken = (slug = "john-doe") => generateToken("employee", { slug });
const accountsToken = (slug = "accounts-user") => generateToken("accounts", { slug });

/**
 * Return cookie header string for authenticated requests.
 * Usage: createRequest("GET", null, { headers: authCookieHeader("admin") })
 */
function authCookieHeader(role = "admin", extra = {}) {
  const token = generateToken(role, extra);
  return { Cookie: `token=${token}` };
}

module.exports = {
  generateToken,
  adminToken,
  superAdminToken,
  employeeToken,
  accountsToken,
  authCookieHeader,
};
