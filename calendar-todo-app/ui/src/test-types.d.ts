// Global test utility types
declare global {
  interface Window {
    mockTauriInvoke: jest.MockedFunction<any>;
    setMockResponse: (command: string, response: any) => void;
    setMockError: (command: string, error: string) => void;
    resetMocks: () => void;
  }
}

declare var globalThis: {
  mockTauriInvoke: jest.MockedFunction<any>;
  setMockResponse: (command: string, response: any) => void;
  setMockError: (command: string, error: string) => void;
  resetMocks: () => void;
} & typeof globalThis;

export { };

