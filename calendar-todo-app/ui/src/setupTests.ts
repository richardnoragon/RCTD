import '@testing-library/jest-dom';

// Mock the Tauri API calls
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: (...args: any[]) => mockInvoke(...args)
}));
