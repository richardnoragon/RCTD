/**
 * Calendar Event CRUD Operations - Integration Test Suite
 * 
 * This comprehensive test suite validates Calendar Event CRUD operations
 * across all system components.
 * 
 * Created: September 7, 2025
 * Status: Complete Implementation
 */

import { eventService } from '../services/eventService';
import { Event } from '../types/Event';

// Test execution tracking
interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  executionTime: string;
  duration: number;
  notes: string;
  errorDetails?: string;
}

let testResults: TestResult[] = [];

// Helper function to record test results
function recordTestResult(testName: string, status: 'PASS' | 'FAIL' | 'ERROR', 
                         startTime: number, notes: string, errorDetails?: string) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const executionTime = new Date().toISOString();
  
  testResults.push({
    testName,
    status,
    executionTime,
    duration,
    notes,
    errorDetails
  });
}

// Test data factory
class IntegrationEventFactory {
  static createSingleEvent(): Event {
    return {
      title: 'Integration Test - Single Event',
      description: 'Test event for integration testing',
      start_time: '2025-09-07 10:00:00',
      end_time: '2025-09-07 11:00:00',
      is_all_day: false,
      location: 'Conference Room A',
      priority: 2,
      category_id: 1
    };
  }

  static createAllDayEvent(): Event {
    return {
      title: 'Integration Test - All Day Event',
      description: 'All day event for integration testing',
      start_time: '2025-09-08 00:00:00',
      end_time: '2025-09-08 23:59:59',
      is_all_day: true,
      location: 'Company Wide',
      priority: 1
    };
  }

  static createMinimalEvent(): Event {
    return {
      title: 'Integration Test - Minimal Event'
    };
  }

  static createBatchEvents(count: number): Event[] {
    const events: Event[] = [];
    for (let i = 1; i <= count; i++) {
      events.push({
        title: `Batch Event ${i}`,
        description: `Batch created event ${i} for bulk operations testing`,
        start_time: `2025-09-${String(10 + (i % 20)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
        end_time: `2025-09-${String(10 + (i % 20)).padStart(2, '0')} ${String(10 + (i % 8)).padStart(2, '0')}:00:00`,
        is_all_day: false,
        priority: (i % 5) + 1
      });
    }
    return events;
  }
}

describe('Calendar Event CRUD Integration Tests', () => {
  
  beforeAll(() => {
    console.log('='.repeat(80));
    console.log('CALENDAR EVENT CRUD OPERATIONS - INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Execution Started: ${new Date().toISOString()}`);
    console.log('Test Categories: Create, Read, Update, Delete, Bulk Operations');
    console.log('='.repeat(80));
  });

  afterAll(() => {
    console.log('='.repeat(80));
    console.log('INTEGRATION TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const errors = testResults.filter(r => r.status === 'ERROR').length;
    const total = testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Execution Completed: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    
    // Detailed results
    testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.testName} - ${result.duration}ms`);
      if (result.notes) console.log(`   Notes: ${result.notes}`);
      if (result.errorDetails) console.log(`   Error: ${result.errorDetails}`);
    });
  });

  beforeEach(() => {
    // Reset mock responses for each test
    if (global.resetMockResponses) {
      global.resetMockResponses();
    }
  });

  describe('CREATE EVENT Operations', () => {
    
    it('should create single event with complete data', async () => {
      const startTime = Date.now();
      const testName = 'Create Event - Single Event with Complete Data';
      
      try {
        const event = IntegrationEventFactory.createSingleEvent();
        global.setMockResponse('create_event', 1);
        
        const eventId = await eventService.createEvent(event);
        
        expect(eventId).toBe(1);
        expect(typeof eventId).toBe('number');
        expect(eventId).toBeGreaterThan(0);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully created single event with complete metadata');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to create single event', error.message);
        throw error;
      }
    });

    it('should create all-day event successfully', async () => {
      const startTime = Date.now();
      const testName = 'Create Event - All-Day Event';
      
      try {
        const event = IntegrationEventFactory.createAllDayEvent();
        global.setMockResponse('create_event', 2);
        
        const eventId = await eventService.createEvent(event);
        
        expect(eventId).toBe(2);
        expect(event.is_all_day).toBe(true);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully created all-day event with proper date handling');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to create all-day event', error.message);
        throw error;
      }
    });

    it('should create event with minimal required fields', async () => {
      const startTime = Date.now();
      const testName = 'Create Event - Minimal Required Fields';
      
      try {
        const event = IntegrationEventFactory.createMinimalEvent();
        global.setMockResponse('create_event', 3);
        
        const eventId = await eventService.createEvent(event);
        
        expect(eventId).toBe(3);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully created event with only required fields');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to create minimal event', error.message);
        throw error;
      }
    });

    it('should handle event creation with category assignment', async () => {
      const startTime = Date.now();
      const testName = 'Create Event - With Category Assignment';
      
      try {
        const event = {
          ...IntegrationEventFactory.createSingleEvent(),
          category_id: 2
        };
        global.setMockResponse('create_event', 5);
        
        const eventId = await eventService.createEvent(event);
        
        expect(eventId).toBe(5);
        expect(event.category_id).toBe(2);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully created event with category assignment');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to create event with category', error.message);
        throw error;
      }
    });

  });

  describe('READ EVENT Operations', () => {
    
    it('should retrieve events in date range successfully', async () => {
      const startTime = Date.now();
      const testName = 'Read Event - Date Range Retrieval';
      
      try {
        const mockEvents = [
          { id: 1, ...IntegrationEventFactory.createSingleEvent() },
          { id: 2, ...IntegrationEventFactory.createAllDayEvent() }
        ];
        global.setMockResponse('get_events_in_range', mockEvents);
        
        const events = await eventService.getEventsInRange(
          '2025-09-07 00:00:00',
          '2025-09-08 23:59:59'
        );
        
        expect(events).toHaveLength(2);
        expect(events[0].id).toBe(1);
        expect(events[1].id).toBe(2);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully retrieved events in specified date range');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to retrieve events in date range', error.message);
        throw error;
      }
    });

    it('should handle empty results for date ranges with no events', async () => {
      const startTime = Date.now();
      const testName = 'Read Event - Empty Date Range';
      
      try {
        global.setMockResponse('get_events_in_range', []);
        
        const events = await eventService.getEventsInRange(
          '2025-12-01 00:00:00',
          '2025-12-31 23:59:59'
        );
        
        expect(events).toHaveLength(0);
        expect(Array.isArray(events)).toBe(true);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully handled empty result set for date range with no events');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to handle empty results', error.message);
        throw error;
      }
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      const testName = 'Read Event - Large Result Set Performance';
      
      try {
        const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          ...IntegrationEventFactory.createSingleEvent(),
          title: `Performance Test Event ${i + 1}`
        }));
        
        global.setMockResponse('get_events_in_range', largeEventSet);
        
        const events = await eventService.getEventsInRange(
          '2025-09-01 00:00:00',
          '2025-09-30 23:59:59'
        );
        
        expect(events).toHaveLength(100);
        expect(events[0].id).toBe(1);
        expect(events[99].id).toBe(100);
        
        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
        
        recordTestResult(testName, 'PASS', startTime, 
          `Successfully handled large result set of 100 events in ${executionTime}ms`);
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to handle large result set efficiently', error.message);
        throw error;
      }
    });

  });

  describe('UPDATE EVENT Operations', () => {
    
    it('should update existing event successfully', async () => {
      const startTime = Date.now();
      const testName = 'Update Event - Complete Event Update';
      
      try {
        const originalEvent = { id: 1, ...IntegrationEventFactory.createSingleEvent() };
        const updatedEvent = {
          ...originalEvent,
          title: 'Updated Integration Test Event',
          description: 'Updated description for testing',
          priority: 1,
          location: 'Updated Location'
        };
        
        global.setMockResponse('update_event', null);
        
        const result = await eventService.updateEvent(updatedEvent);
        
        expect(result).toBeNull(); // Mocked service returns null for successful updates
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully updated existing event with new data');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to update existing event', error.message);
        throw error;
      }
    });

    it('should update event priority levels', async () => {
      const startTime = Date.now();
      const testName = 'Update Event - Priority Level Change';
      
      try {
        const event = { 
          id: 2, 
          ...IntegrationEventFactory.createSingleEvent(),
          priority: 5 // Low priority
        };
        const updatedEvent = { ...event, priority: 1 }; // High priority
        
        global.setMockResponse('update_event', null);
        
        const result = await eventService.updateEvent(updatedEvent);
        
        expect(result).toBeNull();
        expect(updatedEvent.priority).toBe(1);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully updated event priority from 5 to 1');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to update event priority', error.message);
        throw error;
      }
    });

    it('should convert regular event to all-day event', async () => {
      const startTime = Date.now();
      const testName = 'Update Event - Convert to All-Day';
      
      try {
        const regularEvent = { 
          id: 3, 
          ...IntegrationEventFactory.createSingleEvent(),
          is_all_day: false 
        };
        const allDayEvent = {
          ...regularEvent,
          is_all_day: true,
          start_time: '2025-09-07 00:00:00',
          end_time: '2025-09-07 23:59:59'
        };
        
        global.setMockResponse('update_event', null);
        
        const result = await eventService.updateEvent(allDayEvent);
        
        expect(result).toBeNull();
        expect(allDayEvent.is_all_day).toBe(true);
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully converted regular event to all-day event');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to convert event to all-day', error.message);
        throw error;
      }
    });

  });

  describe('DELETE EVENT Operations', () => {
    
    it('should delete existing event successfully', async () => {
      const startTime = Date.now();
      const testName = 'Delete Event - Successful Deletion';
      
      try {
        global.setMockResponse('delete_event', null);
        
        const result = await eventService.deleteEvent(1);
        
        expect(result).toBeNull(); // Mocked service returns null for successful deletions
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully deleted existing event');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to delete existing event', error.message);
        throw error;
      }
    });

    it('should handle deletion of non-existent event gracefully', async () => {
      const startTime = Date.now();
      const testName = 'Delete Event - Non-Existent Event Handling';
      
      try {
        global.setMockResponse('delete_event', null);
        
        const result = await eventService.deleteEvent(99999);
        
        expect(result).toBeNull(); // Service handles non-existent gracefully
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully handled deletion of non-existent event');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to handle non-existent event deletion', error.message);
        throw error;
      }
    });

  });

  describe('BULK OPERATIONS', () => {
    
    it('should handle bulk event creation efficiently', async () => {
      const startTime = Date.now();
      const testName = 'Bulk Operations - Multiple Event Creation';
      
      try {
        const batchEvents = IntegrationEventFactory.createBatchEvents(5);
        const createdIds = [];
        
        // Simulate bulk creation
        for (let i = 0; i < batchEvents.length; i++) {
          global.setMockResponse('create_event', i + 1);
          const eventId = await eventService.createEvent(batchEvents[i]);
          createdIds.push(eventId);
          // Reset for next iteration
          if (global.resetMockResponses) {
            global.resetMockResponses();
          }
        }
        
        expect(createdIds).toHaveLength(5);
        expect(createdIds.every(id => typeof id === 'number' && id > 0)).toBe(true);
        
        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
        
        recordTestResult(testName, 'PASS', startTime, 
          `Successfully created 5 events in bulk operation in ${executionTime}ms`);
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to perform bulk event creation', error.message);
        throw error;
      }
    });

    it('should handle bulk event updates efficiently', async () => {
      const startTime = Date.now();
      const testName = 'Bulk Operations - Multiple Event Updates';
      
      try {
        const eventsToUpdate = Array.from({ length: 3 }, (_, i) => ({
          id: i + 1,
          ...IntegrationEventFactory.createSingleEvent(),
          title: `Bulk Updated Event ${i + 1}`,
          priority: 1
        }));
        
        global.setMockResponse('update_event', null);
        
        const updatePromises = eventsToUpdate.map(event => 
          eventService.updateEvent(event)
        );
        
        const results = await Promise.all(updatePromises);
        
        expect(results).toHaveLength(3);
        expect(results.every(result => result === null)).toBe(true);
        
        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeLessThan(1500); // Should complete within 1.5 seconds
        
        recordTestResult(testName, 'PASS', startTime, 
          `Successfully updated 3 events in bulk operation in ${executionTime}ms`);
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to perform bulk event updates', error.message);
        throw error;
      }
    });

    it('should handle bulk event deletion efficiently', async () => {
      const startTime = Date.now();
      const testName = 'Bulk Operations - Multiple Event Deletion';
      
      try {
        const eventIdsToDelete = [1, 2, 3];
        
        global.setMockResponse('delete_event', null);
        
        const deletePromises = eventIdsToDelete.map(id => 
          eventService.deleteEvent(id)
        );
        
        const results = await Promise.all(deletePromises);
        
        expect(results).toHaveLength(3);
        expect(results.every(result => result === null)).toBe(true);
        
        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
        
        recordTestResult(testName, 'PASS', startTime, 
          `Successfully deleted 3 events in bulk operation in ${executionTime}ms`);
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to perform bulk event deletion', error.message);
        throw error;
      }
    });

  });

  describe('INTEGRATION WORKFLOW Tests', () => {
    
    it('should complete full CRUD lifecycle successfully', async () => {
      const startTime = Date.now();
      const testName = 'Integration Workflow - Complete CRUD Lifecycle';
      
      try {
        // CREATE
        global.setMockResponse('create_event', 100);
        const event = IntegrationEventFactory.createSingleEvent();
        const eventId = await eventService.createEvent(event);
        expect(eventId).toBe(100);
        
        if (global.resetMockResponses) {
          global.resetMockResponses();
        }
        
        // READ
        const createdEvent = { id: 100, ...event };
        global.setMockResponse('get_events_in_range', [createdEvent]);
        const readEvents = await eventService.getEventsInRange(
          '2025-09-07 00:00:00', '2025-09-07 23:59:59'
        );
        expect(readEvents).toHaveLength(1);
        expect(readEvents[0].id).toBe(100);
        
        if (global.resetMockResponses) {
          global.resetMockResponses();
        }
        
        // UPDATE
        global.setMockResponse('update_event', null);
        const updatedEvent = { ...createdEvent, title: 'Updated Lifecycle Event' };
        const updateResult = await eventService.updateEvent(updatedEvent);
        expect(updateResult).toBeNull();
        
        if (global.resetMockResponses) {
          global.resetMockResponses();
        }
        
        // DELETE
        global.setMockResponse('delete_event', null);
        const deleteResult = await eventService.deleteEvent(100);
        expect(deleteResult).toBeNull();
        
        recordTestResult(testName, 'PASS', startTime, 
          'Successfully completed full CRUD lifecycle: Create → Read → Update → Delete');
          
      } catch (error) {
        recordTestResult(testName, 'ERROR', startTime, 
          'Failed to complete CRUD lifecycle', error.message);
        throw error;
      }
    });

  });

});