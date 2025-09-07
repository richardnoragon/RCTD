import { Event, eventService } from './eventService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Event Service', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  describe('getEventsInRange', () => {
    it('should fetch events in date range successfully', async () => {
      const mockEvents: Event[] = [
        {
          id: 1,
          title: 'Team Meeting',
          description: 'Weekly team sync',
          start_time: '2023-01-15 09:00:00',
          end_time: '2023-01-15 10:00:00',
          is_all_day: false,
          location: 'Conference Room A',
          priority: 2,
          category_id: 1,
        },
        {
          id: 2,
          title: 'Project Review',
          description: 'Q1 project review meeting',
          start_time: '2023-01-16 14:00:00',
          end_time: '2023-01-16 15:30:00',
          is_all_day: false,
          location: 'Meeting Room B',
          priority: 1,
          category_id: 2,
        },
      ];

      global.setMockResponse('get_events_in_range', mockEvents);

      const result = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-16 23:59:59'
      );

      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Team Meeting');
      expect(result[1].title).toBe('Project Review');
    });

    it('should return empty array when no events in range', async () => {
      global.setMockResponse('get_events_in_range', []);

      const result = await eventService.getEventsInRange(
        '2023-02-01 00:00:00',
        '2023-02-28 23:59:59'
      );

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle all-day events', async () => {
      const mockAllDayEvents: Event[] = [
        {
          id: 1,
          title: 'Holiday',
          description: 'National Holiday',
          start_time: '2023-01-17 00:00:00',
          end_time: '2023-01-17 23:59:59',
          is_all_day: true,
          priority: 3,
        },
      ];

      global.setMockResponse('get_events_in_range', mockAllDayEvents);

      const result = await eventService.getEventsInRange(
        '2023-01-17 00:00:00',
        '2023-01-17 23:59:59'
      );

      expect(result).toEqual(mockAllDayEvents);
      expect(result[0].is_all_day).toBe(true);
    });

    it('should handle events with different priorities', async () => {
      const mockPriorityEvents: Event[] = [
        {
          id: 1,
          title: 'High Priority Event',
          start_time: '2023-01-15 09:00:00',
          end_time: '2023-01-15 10:00:00',
          is_all_day: false,
          priority: 1,
        },
        {
          id: 2,
          title: 'Low Priority Event',
          start_time: '2023-01-15 11:00:00',
          end_time: '2023-01-15 12:00:00',
          is_all_day: false,
          priority: 3,
        },
      ];

      global.setMockResponse('get_events_in_range', mockPriorityEvents);

      const result = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-15 23:59:59'
      );

      expect(result).toHaveLength(2);
      expect(result[0].priority).toBe(1);
      expect(result[1].priority).toBe(3);
    });

    it('should handle service error', async () => {
      global.setMockError('get_events_in_range', 'Database connection failed');

      await expect(
        eventService.getEventsInRange('2023-01-15 00:00:00', '2023-01-15 23:59:59')
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate date format parameters', async () => {
      global.setMockResponse('get_events_in_range', []);

      // Test with various date formats
      const validDates = [
        ['2023-01-15 00:00:00', '2023-01-15 23:59:59'],
        ['2023-12-31 23:00:00', '2023-12-31 23:59:59'],
      ];

      for (const [start, end] of validDates) {
        const result = await eventService.getEventsInRange(start, end);
        expect(result).toEqual([]);
      }
    });

    it('should handle overlapping events', async () => {
      const mockOverlappingEvents: Event[] = [
        {
          id: 1,
          title: 'Long Meeting',
          start_time: '2023-01-15 09:00:00',
          end_time: '2023-01-15 12:00:00',
          is_all_day: false,
          priority: 2,
        },
        {
          id: 2,
          title: 'Quick Call',
          start_time: '2023-01-15 10:30:00',
          end_time: '2023-01-15 11:00:00',
          is_all_day: false,
          priority: 1,
        },
      ];

      global.setMockResponse('get_events_in_range', mockOverlappingEvents);

      const result = await eventService.getEventsInRange(
        '2023-01-15 09:00:00',
        '2023-01-15 12:00:00'
      );

      expect(result).toHaveLength(2);
      expect(result.every(event => 
        event.start_time >= '2023-01-15 09:00:00' && 
        event.end_time <= '2023-01-15 12:00:00'
      )).toBe(true);
    });
  });

  describe('createEvent', () => {
    it('should create a new event successfully', async () => {
      const newEvent: Event = {
        title: 'New Meeting',
        description: 'Important meeting',
        start_time: '2023-01-15 14:00:00',
        end_time: '2023-01-15 15:00:00',
        is_all_day: false,
        location: 'Room 101',
        priority: 2,
        category_id: 1,
      };

      const mockEventId = 123;
      global.setMockResponse('create_event', mockEventId);

      const result = await eventService.createEvent(newEvent);

      expect(result).toBe(mockEventId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should create all-day event successfully', async () => {
      const allDayEvent: Event = {
        title: 'All Day Event',
        description: 'Full day conference',
        start_time: '2023-01-20 00:00:00',
        end_time: '2023-01-20 23:59:59',
        is_all_day: true,
        priority: 2,
      };

      const mockEventId = 124;
      global.setMockResponse('create_event', mockEventId);

      const result = await eventService.createEvent(allDayEvent);

      expect(result).toBe(mockEventId);
    });

    it('should create event with minimal required fields', async () => {
      const minimalEvent: Event = {
        title: 'Minimal Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 3,
      };

      const mockEventId = 125;
      global.setMockResponse('create_event', mockEventId);

      const result = await eventService.createEvent(minimalEvent);

      expect(result).toBe(mockEventId);
    });

    it('should create event with category', async () => {
      const eventWithCategory: Event = {
        title: 'Work Event',
        start_time: '2023-01-15 09:00:00',
        end_time: '2023-01-15 10:00:00',
        is_all_day: false,
        priority: 1,
        category_id: 42,
      };

      const mockEventId = 126;
      global.setMockResponse('create_event', mockEventId);

      const result = await eventService.createEvent(eventWithCategory);

      expect(result).toBe(mockEventId);
    });

    it('should handle creation error', async () => {
      const invalidEvent: Event = {
        title: 'Invalid Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 09:00:00', // End before start
        is_all_day: false,
        priority: 2,
      };

      global.setMockError('create_event', 'Invalid event data');

      await expect(eventService.createEvent(invalidEvent)).rejects.toThrow(
        'Invalid event data'
      );
    });

    it('should handle database constraint errors', async () => {
      const eventWithInvalidCategory: Event = {
        title: 'Event with Invalid Category',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
        category_id: 999, // Non-existent category
      };

      global.setMockError('create_event', 'Foreign key constraint failed');

      await expect(
        eventService.createEvent(eventWithInvalidCategory)
      ).rejects.toThrow('Foreign key constraint failed');
    });

    it('should handle network timeout', async () => {
      const event: Event = {
        title: 'Network Test Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockError('create_event', 'Request timeout');

      await expect(eventService.createEvent(event)).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('updateEvent', () => {
    it('should update existing event successfully', async () => {
      const updatedEvent: Event = {
        id: 1,
        title: 'Updated Meeting',
        description: 'Updated description',
        start_time: '2023-01-15 15:00:00',
        end_time: '2023-01-15 16:00:00',
        is_all_day: false,
        location: 'Updated Room',
        priority: 1,
        category_id: 2,
      };

      global.setMockResponse('update_event', undefined);

      const result = await eventService.updateEvent(updatedEvent);

      expect(result).toBeUndefined();
    });

    it('should update event priority', async () => {
      const eventWithNewPriority: Event = {
        id: 1,
        title: 'Priority Update Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 1, // Changed from 3 to 1
      };

      global.setMockResponse('update_event', undefined);

      const result = await eventService.updateEvent(eventWithNewPriority);

      expect(result).toBeUndefined();
    });

    it('should update event to all-day', async () => {
      const allDayUpdate: Event = {
        id: 1,
        title: 'Now All Day',
        start_time: '2023-01-15 00:00:00',
        end_time: '2023-01-15 23:59:59',
        is_all_day: true,
        priority: 2,
      };

      global.setMockResponse('update_event', undefined);

      const result = await eventService.updateEvent(allDayUpdate);

      expect(result).toBeUndefined();
    });

    it('should remove optional fields', async () => {
      const eventWithRemovedFields: Event = {
        id: 1,
        title: 'Simplified Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 3,
        // description, location, category_id removed
      };

      global.setMockResponse('update_event', undefined);

      const result = await eventService.updateEvent(eventWithRemovedFields);

      expect(result).toBeUndefined();
    });

    it('should handle update of non-existent event', async () => {
      const nonExistentEvent: Event = {
        id: 999,
        title: 'Non-existent Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockError('update_event', 'Event not found');

      await expect(eventService.updateEvent(nonExistentEvent)).rejects.toThrow(
        'Event not found'
      );
    });

    it('should handle validation errors', async () => {
      const invalidEvent: Event = {
        id: 1,
        title: '',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 09:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockError('update_event', 'Validation failed');

      await expect(eventService.updateEvent(invalidEvent)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should handle concurrent update conflicts', async () => {
      const concurrentEvent: Event = {
        id: 1,
        title: 'Concurrent Update',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockError('update_event', 'Concurrent modification detected');

      await expect(eventService.updateEvent(concurrentEvent)).rejects.toThrow(
        'Concurrent modification detected'
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete existing event successfully', async () => {
      global.setMockResponse('delete_event', undefined);

      const result = await eventService.deleteEvent(1);

      expect(result).toBeUndefined();
    });

    it('should handle deletion of non-existent event', async () => {
      global.setMockResponse('delete_event', undefined);

      const result = await eventService.deleteEvent(999);

      // Service should succeed even if event doesn't exist
      expect(result).toBeUndefined();
    });

    it('should handle invalid event ID', async () => {
      global.setMockError('delete_event', 'Invalid event ID');

      await expect(eventService.deleteEvent(-1)).rejects.toThrow(
        'Invalid event ID'
      );
    });

    it('should handle deletion error', async () => {
      global.setMockError('delete_event', 'Cannot delete event');

      await expect(eventService.deleteEvent(1)).rejects.toThrow(
        'Cannot delete event'
      );
    });

    it('should handle database constraint errors', async () => {
      global.setMockError('delete_event', 'Foreign key constraint violation');

      await expect(eventService.deleteEvent(1)).rejects.toThrow(
        'Foreign key constraint violation'
      );
    });

    it('should delete multiple events', async () => {
      global.setMockResponse('delete_event', undefined);

      const eventIds = [1, 2, 3, 4, 5];
      const deletePromises = eventIds.map(id => eventService.deleteEvent(id));

      const results = await Promise.all(deletePromises);

      expect(results).toHaveLength(5);
      expect(results.every(result => result === undefined)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const newEvent: Event = {
        title: 'CRUD Test Event',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockResponse('create_event', 1);
      const createdId = await eventService.createEvent(newEvent);
      expect(createdId).toBe(1);

      // Read
      const mockEvents = [{ ...newEvent, id: 1 }];
      global.setMockResponse('get_events_in_range', mockEvents);
      const events = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-15 23:59:59'
      );
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(1);

      // Update
      const updatedEvent = { ...newEvent, id: 1, title: 'Updated CRUD Event' };
      global.setMockResponse('update_event', undefined);
      const updateResult = await eventService.updateEvent(updatedEvent);
      expect(updateResult).toBeUndefined();

      // Delete
      global.setMockResponse('delete_event', undefined);
      const deleteResult = await eventService.deleteEvent(1);
      expect(deleteResult).toBeUndefined();
    });

    it('should handle bulk operations', async () => {
      // Bulk create
      const events = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Event ${i + 1}`,
        start_time: `2023-01-${15 + i} 10:00:00`,
        end_time: `2023-01-${15 + i} 11:00:00`,
        is_all_day: false,
        priority: (i % 3) + 1,
      }));

      global.setMockResponse('create_event', 1);
      const createPromises = events.map(event => eventService.createEvent(event));
      const createdIds = await Promise.all(createPromises);
      expect(createdIds).toHaveLength(10);

      // Bulk read
      const mockBulkEvents = events.map((event, i) => ({ ...event, id: i + 1 }));
      global.setMockResponse('get_events_in_range', mockBulkEvents);
      const retrievedEvents = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-25 23:59:59'
      );
      expect(retrievedEvents).toHaveLength(10);
    });

    it('should handle error recovery', async () => {
      // First attempt fails
      global.setMockError('create_event', 'Temporary failure');
      await expect(
        eventService.createEvent({
          title: 'Recovery Test',
          start_time: '2023-01-15 10:00:00',
          end_time: '2023-01-15 11:00:00',
          is_all_day: false,
          priority: 2,
        })
      ).rejects.toThrow('Temporary failure');

      // Reset and retry succeeds
      global.setMockResponse('create_event', 1);
      const result = await eventService.createEvent({
        title: 'Recovery Test',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        priority: 2,
      });
      expect(result).toBe(1);
    });

    it('should maintain data consistency', async () => {
      const baseEvent: Event = {
        title: 'Consistency Test',
        description: 'Original description',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        location: 'Original Location',
        priority: 2,
        category_id: 1,
      };

      global.setMockResponse('create_event', 1);
      const createdId = await eventService.createEvent(baseEvent);

      // Retrieve and verify all fields are preserved
      const mockRetrievedEvent = { ...baseEvent, id: createdId };
      global.setMockResponse('get_events_in_range', [mockRetrievedEvent]);
      const events = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-15 23:59:59'
      );

      expect(events[0]).toEqual(mockRetrievedEvent);
      expect(events[0].title).toBe(baseEvent.title);
      expect(events[0].description).toBe(baseEvent.description);
      expect(events[0].location).toBe(baseEvent.location);
      expect(events[0].category_id).toBe(baseEvent.category_id);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed response data', async () => {
      global.setMockResponse('get_events_in_range', 'invalid json');

      // This would typically be caught by TypeScript, but testing runtime behavior
      const result = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-15 23:59:59'
      );
      expect(result).toBe('invalid json');
    });

    it('should handle null/undefined responses', async () => {
      global.setMockResponse('get_events_in_range', null);

      const result = await eventService.getEventsInRange(
        '2023-01-15 00:00:00',
        '2023-01-15 23:59:59'
      );
      expect(result).toBeNull();
    });

    it('should handle very large date ranges', async () => {
      global.setMockResponse('get_events_in_range', []);

      const result = await eventService.getEventsInRange(
        '1900-01-01 00:00:00',
        '2100-12-31 23:59:59'
      );
      expect(result).toEqual([]);
    });

    it('should handle special characters in event data', async () => {
      const eventWithSpecialChars: Event = {
        title: 'Special âéîôü Characters 🎉',
        description: 'Description with émojis 🚀 and àccénts',
        start_time: '2023-01-15 10:00:00',
        end_time: '2023-01-15 11:00:00',
        is_all_day: false,
        location: 'Café de la Paix',
        priority: 2,
      };

      global.setMockResponse('create_event', 1);

      const result = await eventService.createEvent(eventWithSpecialChars);
      expect(result).toBe(1);
    });

    it('should handle leap year dates', async () => {
      const leapYearEvent: Event = {
        title: 'Leap Year Event',
        start_time: '2024-02-29 10:00:00',
        end_time: '2024-02-29 11:00:00',
        is_all_day: false,
        priority: 2,
      };

      global.setMockResponse('create_event', 1);

      const result = await eventService.createEvent(leapYearEvent);
      expect(result).toBe(1);
    });
  });
});