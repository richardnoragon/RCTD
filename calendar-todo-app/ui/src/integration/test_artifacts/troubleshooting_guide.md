# Calendar Event CRUD Integration Test Troubleshooting Guide

## Common Issues and Solutions

### 1. Mock API Response Issues

**Problem**: Tests failing due to mock API response format mismatches
**Symptoms**: 
- AssertionError: expected undefined to equal null
- Type errors in event data validation

**Solution**:
```typescript
// Ensure consistent null handling in mocks
mockTauriCommand.mockImplementation((cmd, args) => {
  if (cmd === 'create_event') {
    return Promise.resolve({
      id: mockEventId++,
      ...args.event,
      // Explicitly handle null vs undefined
      description: args.event.description || null,
      location: args.event.location || null,
      category_id: args.event.category_id || null
    });
  }
});
```

### 2. Async Test Timing Issues

**Problem**: Tests intermittently failing due to async operation timing
**Symptoms**: 
- Tests pass individually but fail in suite
- Race conditions in event operations

**Solution**:
```typescript
// Use proper async/await patterns
beforeEach(async () => {
  jest.clearAllMocks();
  mockEventId = 1;
  await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
});

// Add timeout for complex operations
it('should handle bulk operations', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### 3. Test Data Isolation

**Problem**: Tests affecting each other due to shared state
**Symptoms**: 
- Tests fail when run together but pass individually
- Unexpected data in test assertions

**Solution**:
```typescript
// Reset all state in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
  mockEventId = 1;
  // Clear any cached data
  eventService.clearCache?.();
});
```

### 4. Mock Configuration Issues

**Problem**: Tauri API mocks not working correctly
**Symptoms**: 
- "invoke" is not a function errors
- API calls returning undefined

**Solution**:
```typescript
// Proper Tauri mock setup
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn()
}));

// Ensure mock is configured before imports
const mockInvoke = require('@tauri-apps/api/tauri').invoke as jest.MockedFunction<typeof invoke>;
```

### 5. Database State Issues

**Problem**: Tests failing due to database state inconsistencies
**Symptoms**: 
- Events not found after creation
- Duplicate key errors
- Foreign key constraint violations

**Solution**:
```typescript
// Mock database reset between tests
beforeEach(async () => {
  // Reset mock database state
  mockInvoke.mockImplementation((cmd) => {
    if (cmd === 'reset_test_database') {
      return Promise.resolve({ success: true });
    }
    // ... other mocks
  });
  
  await invoke('reset_test_database');
});
```

## Performance Troubleshooting

### Slow Test Execution

**Problem**: Tests taking too long to execute
**Optimization strategies**:
1. Reduce test timeout values where appropriate
2. Use `jest.useFakeTimers()` for time-dependent tests
3. Minimize mock response delays
4. Run tests in parallel with `--maxWorkers`

### Memory Leaks in Tests

**Problem**: Test suite consuming excessive memory
**Detection**: Run with `--detectOpenHandles --forceExit`
**Solutions**:
1. Properly clean up event listeners
2. Clear all mocks and timers
3. Close database connections in afterEach

## Error Debugging Steps

### 1. Enable Verbose Logging
```bash
npm test -- --verbose
```

### 2. Run Single Test
```bash
npm test -- --testNamePattern="should create event successfully"
```

### 3. Debug Mode
```bash
npm test -- --runInBand --detectOpenHandles
```

### 4. Coverage Analysis
```bash
npm test -- --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"
```

## Environment-Specific Issues

### Windows PowerShell
- Use forward slashes in file paths for Jest
- Ensure proper escaping in npm scripts
- Watch for path length limitations

### VS Code Integration
- Configure Jest extension for proper test discovery
- Set up debug configurations for test debugging
- Use breakpoints in test files for step-through debugging

## Test Data Validation

### Schema Validation
```typescript
// Add schema validation to catch data issues early
const eventSchema = {
  id: 'number',
  title: 'string',
  description: 'string|null',
  start_time: 'string|null',
  end_time: 'string|null',
  is_all_day: 'boolean',
  location: 'string|null',
  priority: 'number|null',
  category_id: 'number|null'
};

function validateEvent(event: any): boolean {
  // Validation logic
}
```

## Maintenance Checklist

- [ ] Review test execution times weekly
- [ ] Update mock data to match schema changes
- [ ] Validate test coverage remains above 80%
- [ ] Check for deprecated Jest features
- [ ] Update test documentation
- [ ] Review and update troubleshooting guide

## Contact and Support

For additional support:
1. Review test execution logs
2. Check Jest documentation for updates
3. Consult Tauri testing best practices
4. Review calendar-todo-app test patterns

---
*Last updated: 2025-01-07*
*Version: 1.0*