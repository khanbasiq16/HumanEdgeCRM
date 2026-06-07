const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/app/api/**/*.js",
    "!src/app/api/**/_*.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Transform firebase ESM packages so Jest can load them
  transformIgnorePatterns: [
    "/node_modules/(?!(firebase|@firebase|jose|uuid|public-ip)/)",
  ],
  testTimeout: 15000,
  verbose: true,
};

module.exports = createJestConfig(customConfig);
