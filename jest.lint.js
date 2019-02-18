module.exports = {
  displayName: 'lint',
  runner: 'jest-runner-tslint',
  moduleFileExtensions: ["ts", "tsx"],
  testPathIgnorePatterns: [".d.ts", "node_modules"],
  testMatch: ["**/*.ts", "**/*.tsx"],
}