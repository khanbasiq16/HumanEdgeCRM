const { NextRequest } = require("next/server");

/**
 * Create a mock NextRequest for testing App Router route handlers.
 *
 * @param {string} method  HTTP method
 * @param {object|null} body  Request body (JSON-serialised automatically)
 * @param {object} options  Extra options: path, headers, params
 */
function createRequest(method, body = null, options = {}) {
  const path = options.path || "/api/test";
  const url = `http://localhost:3000${path}`;

  const init = {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (body !== null && body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/** Shorthand helpers */
const GET = (options = {}) => createRequest("GET", null, options);
const POST = (body, options = {}) => createRequest("POST", body, options);
const PUT = (body, options = {}) => createRequest("PUT", body, options);
const DELETE = (options = {}) => createRequest("DELETE", null, options);

module.exports = { createRequest, GET, POST, PUT, DELETE };
