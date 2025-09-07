// Simplified Jest config for root level integration tests
// This config reuses the UI jest setup but targets root-level tests

const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: path.resolve(__dirname, '../../..'),
  testMatch: [
    '<rootDir>/tests/integration/date_time/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/date_time/rootIntegrationTestSetup.ts'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  // Add module directories to resolve dependencies
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/ui/node_modules'],
  collectCoverage: false,
  verbose: false,
  testTimeout: 10000,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // TypeScript configuration for better import resolution
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};