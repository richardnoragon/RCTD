/**
 * Minimal ambient Jest declarations for integration tests outside the UI project.
 * We augment the global scope so TypeScript recognizes Jest globals.
 */

declare global {
  var describe: (name: string, fn: () => any) => void;
  var test: (name: string, fn: () => any | Promise<any>) => void;
  var beforeEach: (fn: () => any) => void;
  var afterAll: (fn: () => any) => void;
  var expect: any;
  var jest: any;
  // Provide a permissive global for mocked Tauri and test harness functions.
  var global: any;
}

// Keep this as a module to ensure the global augmentation is applied correctly.
export { };

