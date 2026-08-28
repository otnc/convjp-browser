module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["**/test/**/*.test.js", "**/__tests__/**/*.js"],
  setupFiles: ["<rootDir>/test/jest.setup.js"],
  verbose: true,
};
