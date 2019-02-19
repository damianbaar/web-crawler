const baseConfig = require('../../jest.test')
module.exports = {
  ...baseConfig,
  testRegex: "/__tests__/.*\\.(test|integration)\\.tsx?$"
}