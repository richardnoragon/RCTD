/**
 * Integration Test Execution Environment Setup
 * 
 * This file sets up the test environment specifically for Integration Tests
 * with enhanced mock responses and utilities for comprehensive testing.
 */

// Enhanced mock setup for integration tests
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockTemporaryError: (command: string, error: string) => void;
  var resetMockResponses: () => void;
  var mockTauriInvoke: jest.Mock;
}

// Mock responses storage
let mockResponses: { [key: string]: any } = {};
let temporaryErrors: { [key: string]: string } = {};

// Enhanced mock implementation for integration tests
const mockInvoke = jest.fn().mockImplementation((cmd: string) => {
  // Check for temporary errors first
  if (temporaryErrors[cmd]) {
    const error = temporaryErrors[cmd];
    delete temporaryErrors[cmd]; // Clear after use
    return Promise.reject(new Error(error));
  }
  
  // Return mock response or null
  return Promise.resolve(mockResponses[cmd] || null);
});

global.mockTauriInvoke = mockInvoke;

// Global mock setup functions
global.setMockResponse = (command: string, response: any) => {
  mockResponses[command] = response;
};

global.setMockTemporaryError = (command: string, error: string) => {
  temporaryErrors[command] = error;
};

global.resetMockResponses = () => {
  mockResponses = {};
  temporaryErrors = {};
  mockInvoke.mockClear();
};

// Mock Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: global.mockTauriInvoke
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
  global.setMockResponse(command, response);
});

export { };
