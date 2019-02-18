module.exports = {
  displayName: 'test',
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "/__tests__/.*\\.test\\.tsx?$",
  // https://kulshekhar.github.io/ts-jest/user/config/isolatedModules
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  testEnvironment: "node",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
}