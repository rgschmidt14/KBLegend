module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/basic-interactions\\.spec\\.js"
  ],
};
