/**
 * Root-level Integration Test Setup
 * 
 * This setup is specifically for tests under tests/integration/date_time/*
 * It provides basic mock infrastructure without relying on external packages.
 */

/// <reference types="jest" />

// Enhanced mock setup for integration tests
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockTemporaryError: (command: string, error: string) => void;
  var resetMockResponses: () => void;
  var mockTauriInvoke: jest.Mock;
  var recordDateTimeTestResult: (
    testName: string,
    category: 'timezone' | 'dst' | 'formatting' | 'validation',
    status: 'PASS' | 'FAIL' | 'ERROR',
    startTime: number,
    notes: string,
    errorDetails?: string,
    performanceMetrics?: any
  ) => void;
}

// Mock responses storage
let mockResponses: { [key: string]: any } = {};
let temporaryErrors: { [key: string]: string } = {};
let dateTimeTestResults: any[] = [];

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

// Helper function to record date/time test results
global.recordDateTimeTestResult = (
  testName: string, 
  category: 'timezone' | 'dst' | 'formatting' | 'validation',
  status: 'PASS' | 'FAIL' | 'ERROR', 
  startTime: number, 
  notes: string, 
  errorDetails?: string,
  performanceMetrics?: any
) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const executionTime = new Date().toISOString();
  
  dateTimeTestResults.push({
    testName,
    category,
    status,
    executionTime,
    duration,
    notes,
    errorDetails,
    performanceMetrics
  });
};

// Manual Tauri API mock (no external dependency)
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: global.mockTauriInvoke
}), { virtual: true });

// Initial mock responses for common event service commands
const defaultMockResponses = {
  get_events_in_range: [],
  create_event: 1,
  update_event: null,
  delete_event: null,
  get_categories: [],
  create_category: 1,
  get_recurring_rules: [],
  create_recurring_rule: 1,
  generate_recurrences: {
    success: true,
    occurrences: []
  }
};

// Set up default responses
Object.entries(defaultMockResponses).forEach(([command, response]) => {
  global.setMockResponse(command, response);
});

export { };
