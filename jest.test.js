module.exports = {
  displayName: 'test',
  transform: {
    "^.+\\.tsx?$": "babel-jest"
  },
  testRegex: "/__tests__/.*\\.test\\.tsx?$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
}