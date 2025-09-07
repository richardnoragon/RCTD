# Week 3 Testing Infrastructure Guide

**Document Version:** 1.0  
**Created:** 2025-09-06  
**Purpose:** Comprehensive reference for Week 3 test implementation using established patterns

## Overview

This guide provides **copy-paste ready patterns** and infrastructure documentation for implementing Week 3 testing objectives. All patterns are **production-tested** and follow established quality standards from Weeks 1-2.

## 🎯 Quick Reference

### Week 3 Implementation Targets

- **10 Service Test Suites:** 6 Frontend + 4 Backend
- **3 Component Test Suites:** Critical calendar and notes components
- **250+ New Tests:** Following established patterns
- **85%+ Coverage:** Consistent with current standards

---

## 🛠️ Frontend Testing Infrastructure

### Core Setup Files (Already Configured)

#### [`setupTests.ts`](../../ui/src/setupTests.ts)

Production-ready Tauri API mock infrastructure with:

- ✅ Global mock functions available in all tests
- ✅ Automatic cleanup between tests
- ✅ Dynamic response configuration
- ✅ Error simulation capabilities

#### [`test-types.d.ts`](../../ui/src/test-types.d.ts)

TypeScript declarations for global test utilities:

```typescript
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}
```

### 📝 Frontend Service Testing Pattern

#### Standard Service Test Template

```typescript
import { serviceName } from './serviceName';

// Use established global mock infrastructure
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('ServiceName', () => {
  beforeEach(() => {
    global.resetMocks(); // Automatic cleanup
  });

  describe('CRUD Operations', () => {
    describe('getItems', () => {
      it('should fetch items successfully', async () => {
        const mockData = [/* test data */];
        global.setMockResponse('get_command', mockData);

        const result = await serviceName.getItems();
        expect(result).toEqual(mockData);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('get_command');
      });

      it('should handle empty results', async () => {
        global.setMockResponse('get_command', []);
        
        const result = await serviceName.getItems();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle network errors', async () => {
        global.setMockError('get_command', 'Network error');
        
        await expect(serviceName.getItems()).rejects.toThrow('Network error');
      });
    });

    describe('createItem', () => {
      it('should create item successfully', async () => {
        const newItem = { /* test item */ };
        const mockId = 1;
        
        global.setMockResponse('create_command', mockId);
        
        const result = await serviceName.createItem(newItem);
        expect(result).toBe(mockId);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_command', { item: newItem });
      });

      it('should handle creation errors', async () => {
        const newItem = { /* invalid item */ };
        global.setMockError('create_command', 'Validation error');
        
        await expect(serviceName.createItem(newItem)).rejects.toThrow('Validation error');
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle special characters', async () => {
      const specialItem = { name: 'Test & Special 🎯' };
      global.setMockResponse('create_command', 1);
      
      const result = await serviceName.createItem(specialItem);
      expect(result).toBe(1);
    });

    it('should handle large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      global.setMockResponse('get_command', largeDataset);
      
      const result = await serviceName.getItems();
      expect(result).toHaveLength(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      global.setMockError('get_command', 'Database connection failed');
      
      await expect(serviceName.getItems()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      global.setMockError('create_command', 'Request timeout');
      
      const item = { /* test item */ };
      await expect(serviceName.createItem(item)).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid successive API calls', async () => {
      global.setMockResponse('get_command', []);
      
      const promises = Array.from({ length: 10 }, () => serviceName.getItems());
      const results = await Promise.all(promises);
      
      results.forEach(result => expect(result).toEqual([]));
      expect(global.mockTauriInvoke).toHaveBeenCalledTimes(10);
    });
  });
});
```

### 🎛️ Component Testing Pattern

#### React Component Test Template

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from './ComponentName';

// Mock any required context providers
const MockContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

describe('ComponentName', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MockContextProvider>
        <ComponentName {...props} />
      </MockContextProvider>
    );
  };

  describe('Rendering', () => {
    it('should render successfully', () => {
      renderComponent();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display expected content', () => {
      const props = { title: 'Test Component' };
      renderComponent(props);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', async () => {
      renderComponent();
      
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Button clicked')).toBeInTheDocument();
      });
    });

    it('should handle form input', async () => {
      renderComponent();
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test input' } });
      
      expect(input).toHaveValue('test input');
    });
  });

  describe('State Management', () => {
    it('should handle state updates', async () => {
      renderComponent();
      
      const button = screen.getByRole('button', { name: /update state/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('State updated')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      renderComponent();
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(screen.getByText('Button activated')).toBeInTheDocument();
    });
  });
});
```

---

## 🦀 Backend Testing Infrastructure

### Core Test Utilities (Already Available)

#### [`test_utilities.rs`](../../src/tests/test_utilities.rs)

Comprehensive Rust testing infrastructure with:

- ✅ Data factories for all models
- ✅ TestScenario builder for complex setups
- ✅ Performance testing utilities
- ✅ Assertion helpers with descriptive messages

### 📝 Backend Service Testing Pattern

#### Standard Rust Service Test Template

```rust
use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use serial_test::serial;

#[cfg(test)]
mod service_name_tests {
    use super::*;

    #[tokio::test]
    #[serial]
    async fn test_create_item_success() {
        let scenario = TestScenario::new();
        let test_item = ItemFactory::create_default();
        
        let result = create_item(scenario.get_db(), &test_item).await;
        
        assert!(result.is_ok(), "Should create item successfully");
        let item_id = result.unwrap();
        assert!(item_id > 0, "Should return valid item ID");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_items_success() {
        let mut scenario = TestScenario::new();
        scenario.add_item("test1", ItemFactory::create_default());
        scenario.add_item("test2", ItemFactory::create_with_name("Test Item 2"));
        
        let result = get_items(scenario.get_db()).await;
        
        assert!(result.is_ok(), "Should retrieve items successfully");
        let items = result.unwrap();
        assert_eq!(items.len(), 2, "Should return correct number of items");
        TestAssertions::assert_contains_item(&items, "Default Item");
        TestAssertions::assert_contains_item(&items, "Test Item 2");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_item_success() {
        let mut scenario = TestScenario::new();
        scenario.add_item("original", ItemFactory::create_default());
        let item_id = scenario.get_item_id("original").unwrap();
        
        let mut updated_item = ItemFactory::create_default();
        updated_item.id = Some(item_id);
        updated_item.name = "Updated Name".to_string();
        
        let result = update_item(scenario.get_db(), &updated_item).await;
        
        assert!(result.is_ok(), "Should update item successfully");
        
        // Verify update
        let retrieved = get_item_by_id(scenario.get_db(), item_id).await.unwrap();
        assert_eq!(retrieved.name, "Updated Name", "Should have updated name");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_item_success() {
        let mut scenario = TestScenario::new();
        scenario.add_item("to_delete", ItemFactory::create_default());
        let item_id = scenario.get_item_id("to_delete").unwrap();
        
        let result = delete_item(scenario.get_db(), item_id).await;
        
        assert!(result.is_ok(), "Should delete item successfully");
        
        // Verify deletion
        let retrieved = get_item_by_id(scenario.get_db(), item_id).await;
        assert!(retrieved.is_err(), "Item should no longer exist");
    }

    #[tokio::test]
    #[serial]
    async fn test_error_handling_invalid_id() {
        let scenario = TestScenario::new();
        let invalid_id = 99999;
        
        let result = get_item_by_id(scenario.get_db(), invalid_id).await;
        
        assert!(result.is_err(), "Should handle invalid ID gracefully");
        assert!(result.unwrap_err().to_string().contains("not found"));
    }

    #[tokio::test]
    #[serial]
    async fn test_validation_empty_name() {
        let scenario = TestScenario::new();
        let mut invalid_item = ItemFactory::create_default();
        invalid_item.name = "".to_string();
        
        let result = create_item(scenario.get_db(), &invalid_item).await;
        
        assert!(result.is_err(), "Should reject empty name");
        assert!(result.unwrap_err().to_string().contains("name cannot be empty"));
    }

    #[tokio::test]
    #[serial]
    async fn test_bulk_operations_performance() {
        let scenario = TestScenario::new();
        let test_items = ItemFactory::create_batch(100);
        
        let (_, duration) = PerformanceTester::measure_execution_time(|| {
            // Bulk operation implementation
            for item in &test_items {
                let _ = create_item(scenario.get_db(), item);
            }
        });
        
        PerformanceTester::assert_performance_within_threshold(duration, 1000); // 1 second max
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple items concurrently
        let futures: Vec<_> = (0..10)
            .map(|i| {
                let item = ItemFactory::create_with_name(&format!("Concurrent Item {}", i));
                create_item(scenario.get_db(), &item)
            })
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        // All operations should succeed
        for result in results {
            assert!(result.is_ok(), "Concurrent operations should succeed");
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_database_constraints() {
        let mut scenario = TestScenario::new();
        scenario.add_item("original", ItemFactory::create_with_name("Unique Name"));
        
        // Try to create item with duplicate name (if constraint exists)
        let duplicate_item = ItemFactory::create_with_name("Unique Name");
        let result = create_item(scenario.get_db(), &duplicate_item).await;
        
        // Should handle constraint violation gracefully
        assert!(result.is_err(), "Should reject duplicate names");
    }
}
```

### 🏭 Data Factory Usage Examples

#### Using Established Factories

```rust
// Category testing
let work_category = CategoryFactory::create_work();
let personal_category = CategoryFactory::create_personal();
let batch_categories = CategoryFactory::create_batch(50);

// Event testing
let meeting_event = EventFactory::create_meeting();
let all_day_event = EventFactory::create_all_day();
let categorized_event = EventFactory::create_with_category(category_id);

// Task testing
let urgent_task = TaskFactory::create_urgent();
let completed_task = TaskFactory::create_completed();
let in_progress_task = TaskFactory::create_in_progress();

// Recurring rule testing
let daily_rule = RecurringRuleFactory::create_daily();
let weekly_rule = RecurringRuleFactory::create_weekly();
let monthly_rule = RecurringRuleFactory::create_monthly();
```

#### Creating Complex Test Scenarios

```rust
#[tokio::test]
#[serial]
async fn test_complex_workflow() {
    let mut scenario = TestScenario::create_work_scenario();
    
    // Scenario automatically includes:
    // - Work and Personal categories
    // - Team meeting event
    // - Urgent and personal tasks
    
    let work_category_id = scenario.get_category_id("work").unwrap();
    let urgent_task_id = scenario.get_task_id("urgent").unwrap();
    
    // Add more test data as needed
    scenario.add_event("follow_up", EventFactory::create_with_category(work_category_id));
    
    // Execute test operations...
}
```

---

## 📊 Quality Standards & Coverage

### Coverage Thresholds (Established)

```javascript
// Jest configuration (already set)
coverageThreshold: {
  global: {
    branches: 80,      // 80% branch coverage minimum
    functions: 85,     // 85% function coverage minimum  
    lines: 85,         // 85% line coverage minimum
    statements: 85     // 85% statement coverage minimum
  }
}
```

### Performance Benchmarks

- **Database Operations:** < 1 second for 100 operations
- **Service Layer:** < 2 seconds for bulk operations  
- **Frontend Components:** < 100ms initial render
- **API Calls:** < 500ms response time simulation

### Required Test Categories

#### For Each Service

1. **CRUD Operations** (4-6 tests)
2. **Data Validation** (3-5 tests)
3. **Error Handling** (4-6 tests)
4. **Performance & Edge Cases** (2-4 tests)
5. **Type Safety & Interface Compliance** (2-3 tests)

#### For Each Component

1. **Rendering** (2-3 tests)
2. **User Interactions** (3-5 tests)
3. **State Management** (2-4 tests)
4. **Accessibility** (2-3 tests)
5. **Integration** (2-3 tests)

---

## 🎯 Week 3 Implementation Checklist

### Pre-Implementation Setup

- [ ] Review service interface and identify all methods
- [ ] Examine backend service for command names and error types
- [ ] Plan test data structures and edge cases
- [ ] Identify any special dependencies or setup requirements

### Implementation Steps

1. **Create Test File** - Follow naming convention: `serviceName.test.ts` or `service_tests.rs`
2. **Add Mock Commands** - Update `setupTests.ts` with new command mocks if needed
3. **Implement CRUD Tests** - Start with basic operations
4. **Add Validation Tests** - Cover data validation and constraints
5. **Implement Error Scenarios** - Network, database, and validation errors
6. **Add Performance Tests** - Bulk operations and edge cases
7. **Verify Coverage** - Run coverage report and ensure 85%+ target

### Post-Implementation Validation

- [ ] All tests pass consistently
- [ ] Coverage meets 85% threshold
- [ ] Performance benchmarks within limits
- [ ] Error scenarios properly handled
- [ ] Documentation updated

---

## 🚀 Quick Start Commands

### Run Frontend Tests

```bash
cd ui
npm test                           # Run all tests
npm test -- --coverage           # Run with coverage
npm test serviceName.test.ts     # Run specific test file
```

### Run Backend Tests

```bash
cd calendar-todo-app
cargo test                        # Run all tests
cargo test service_name_tests     # Run specific module
cargo test --test service_tests   # Run specific test file
```

### Coverage Analysis

```bash
# Frontend coverage report
cd ui && npm test -- --coverage --watchAll=false

# Backend coverage (if configured)
cd calendar-todo-app && cargo tarpaulin --out Html
```

---

**This infrastructure guide provides everything needed for rapid, consistent Week 3 test implementation following established quality standards.**
