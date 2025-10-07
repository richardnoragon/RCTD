export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/suites/date-time/datetime_test_setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.datetime.json',
      useESM: true
    }]
  },
  // Disable coverage for integration tests to speed up execution
  collectCoverage: false,
  testMatch: [
    '<rootDir>/tests/integration/suites/date-time/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/components/',
    'src/services/',
    'tests/unit'
  ],
  verbose: false,
  testTimeout: 15000
};