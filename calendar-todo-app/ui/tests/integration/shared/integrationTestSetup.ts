/**
 * Integration Test Execution Environment Setup
 * 
 * This file sets up the test environment specifically for Integration Tests
 * with enhanced mock responses and utilities for comprehensive testing.
 */

export type IntegrationTestGlobals = typeof globalThis & {
  setMockResponse: (command: string, response: any) => void;
  setMockTemporaryError: (command: string, error: string) => void;
  resetMockResponses: () => void;
  mockTauriInvoke: jest.MockedFunction<any>;
};

const testGlobal = globalThis as IntegrationTestGlobals;

// Mock responses storage
let mockResponses: { [key: string]: any } = {};
let temporaryErrors: { [key: string]: string } = {};

// Enhanced mock implementation for integration tests
const mockInvoke: jest.MockedFunction<any> = jest
  .fn()
  .mockImplementation((cmd: string) => {
  // Check for temporary errors first
  if (temporaryErrors[cmd]) {
    const error = temporaryErrors[cmd];
    delete temporaryErrors[cmd]; // Clear after use
    return Promise.reject(new Error(error));
  }
  
  // Return mock response or null, preserving falsy values like false/0
  if (Object.hasOwn(mockResponses, cmd)) {
    return Promise.resolve(mockResponses[cmd]);
  }

  return Promise.resolve(null);
});

testGlobal.mockTauriInvoke = mockInvoke;

// Global mock setup functions
testGlobal.setMockResponse = (command: string, response: any) => {
  mockResponses[command] = response;
};

testGlobal.setMockTemporaryError = (command: string, error: string) => {
  temporaryErrors[command] = error;
};

testGlobal.resetMockResponses = () => {
  mockResponses = {};
  temporaryErrors = {};
  mockInvoke.mockClear();
};

// Mock Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: testGlobal.mockTauriInvoke
}));

// Initial mock responses for common event service commands
const defaultMockResponses = {
  get_events_in_range: [],
  create_event: 1,
  update_event: null,
  delete_event: null,
  get_categories: [],
  create_category: 1,
  get_recurring_rules: [],
  create_recurring_rule: 1
};

// Set up default responses
Object.entries(defaultMockResponses).forEach(([command, response]) => {
  testGlobal.setMockResponse(command, response);
});

export const getIntegrationTestGlobal = (): IntegrationTestGlobals => testGlobal;

export { };
