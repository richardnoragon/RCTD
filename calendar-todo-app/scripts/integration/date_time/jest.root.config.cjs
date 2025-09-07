// Jest config to run integration tests located outside the UI project (under tests/integration/**)
// We reuse UI's Jest, ts-jest, and related deps via `--prefix ui` when invoking Jest.
//
// Invocation example:
//   npx --prefix ui jest --config scripts/integration/date_time/jest.root.config.cjs --runInBand --ci --verbose=false
//
// This configuration sets rootDir to the project root and targets tests in tests/integration/**

const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '../../..'),
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: path.resolve(__dirname, '../../../ui/tsconfig.json')
    }]
  },
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.spec.ts'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/integrationTestSetup.ts'
  ],
  // Use the ui directory's node_modules for dependency resolution
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../../../ui/node_modules')],
  // Keep coverage off here; use UI config for coverage if needed.
  collectCoverage: false,
  verbose: false,
  testTimeout: 10000
};