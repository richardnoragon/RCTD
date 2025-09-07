export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/datetime/datetime_test_setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // Disable coverage for integration tests to speed up execution
  collectCoverage: false,
  testMatch: [
    '<rootDir>/src/tests/integration/datetime/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/components/',
    'src/services/',
    'src/tests/unit'
  ],
  verbose: false,
  testTimeout: 15000,
  // Override environment variable setup
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020'
        }
      }
    }
  }
};