import 'jest-axe';

// Global test utility types
declare global {
  interface Window {
    mockTauriInvoke: jest.MockedFunction<any>;
    setMockResponse: (command: string, response: any) => void;
    setMockError: (command: string, error: string) => void;
    resetMocks: () => void;
    setMockTemporaryError?: (command: string, error: string) => void;
    resetMockResponses?: () => void;
    recordDateTimeTestResult?: (
      testName: string,
      category: 'timezone' | 'dst' | 'formatting' | 'validation',
      status: 'PASS' | 'FAIL' | 'ERROR',
      startTime: number,
      notes: string,
      errorDetails?: string,
      performanceMetrics?: any
    ) => void;
  }

  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

declare var globalThis: {
  mockTauriInvoke: jest.MockedFunction<any>;
  setMockResponse: (command: string, response: any) => void;
  setMockError: (command: string, error: string) => void;
  resetMocks: () => void;
  setMockTemporaryError?: (command: string, error: string) => void;
  resetMockResponses?: () => void;
  recordDateTimeTestResult?: (
    testName: string,
    category: 'timezone' | 'dst' | 'formatting' | 'validation',
    status: 'PASS' | 'FAIL' | 'ERROR',
    startTime: number,
    notes: string,
    errorDetails?: string,
    performanceMetrics?: any
  ) => void;
} & typeof globalThis;

declare const global: typeof globalThis & {
  mockTauriInvoke: jest.MockedFunction<any>;
  setMockResponse: (command: string, response: any) => void;
  setMockTemporaryError: (command: string, error: string) => void;
  resetMockResponses: () => void;
  recordDateTimeTestResult?: (
    testName: string,
    category: 'timezone' | 'dst' | 'formatting' | 'validation',
    status: 'PASS' | 'FAIL' | 'ERROR',
    startTime: number,
    notes: string,
    errorDetails?: string,
    performanceMetrics?: any
  ) => void;
};

export { };

