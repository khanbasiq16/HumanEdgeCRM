// Global mock for uuid v13 (ESM-only) to keep Jest working in CJS mode.
// Uses a plain function (not jest.fn) so jest.resetAllMocks() cannot clear it.
// Returns RFC-4122-style UUIDs (36 chars) with an incrementing counter.

let _counter = 0;

function v4() {
  _counter += 1;
  return `00000000-0000-4000-${String(_counter).padStart(4, "0")}-${"0".repeat(12)}`;
}

module.exports = { v4, default: { v4 } };
