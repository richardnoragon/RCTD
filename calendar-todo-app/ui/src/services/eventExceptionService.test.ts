import { EventException, eventExceptionService } from './eventExceptionService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Event Exception Service', () => {
  beforeEach(() => {
    (globalThis as any).resetMocks();
  });

  describe('createException', () => {
    it('should create a new event exception successfully', async () => {
      const mockException: EventException = {
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false,
        modified_title: 'Modified Title',
        modified_description: 'Modified description',
        modified_start_time: '2023-01-15 10:00:00',
        modified_end_time: '2023-01-15 11:00:00',
        modified_location: 'Modified Location'
      };

      const mockExceptionId = 1;
      (globalThis as any).setMockResponse('create_event_exception', mockExceptionId);

      const result = await eventExceptionService.createException(mockException);

      expect(result).toBe(mockExceptionId);
    });

    it('should create a cancelled event exception', async () => {
      const mockException: EventException = {
        event_id: 2,
        original_date: '2023-01-16',
        is_cancelled: true
      };

      const mockExceptionId = 2;
      (globalThis as any).setMockResponse('create_event_exception', mockExceptionId);

      const result = await eventExceptionService.createException(mockException);

      expect(result).toBe(mockExceptionId);
    });

    it('should handle partial modification exception', async () => {
      const mockException: EventException = {
        event_id: 3,
        original_date: '2023-01-17',
        is_cancelled: false,
        modified_title: 'Only Title Changed'
      };

      const mockExceptionId = 3;
      (globalThis as any).setMockResponse('create_event_exception', mockExceptionId);

      const result = await eventExceptionService.createException(mockException);

      expect(result).toBe(mockExceptionId);
    });

    it('should handle error when creating exception fails', async () => {
      const mockException: EventException = {
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('create_event_exception', 'Database error');

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Database error');
    });

    it('should handle network timeout error', async () => {
      const mockException: EventException = {
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('create_event_exception', 'Request timeout');

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Request timeout');
    });

    it('should handle invalid event ID error', async () => {
      const mockException: EventException = {
        event_id: -1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('create_event_exception', 'Invalid event ID');

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Invalid event ID');
    });
  });

  describe('updateException', () => {
    it('should update existing exception successfully', async () => {
      const mockException: EventException = {
        id: 1,
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false,
        modified_title: 'Updated Title',
        modified_description: 'Updated description'
      };

      (globalThis as any).setMockResponse('update_event_exception', undefined);

      const result = await eventExceptionService.updateException(mockException);
      expect(result).toBeNull();
    });

    it('should update exception to cancelled status', async () => {
      const mockException: EventException = {
        id: 2,
        event_id: 2,
        original_date: '2023-01-16',
        is_cancelled: true
      };

      (globalThis as any).setMockResponse('update_event_exception', undefined);

      const result = await eventExceptionService.updateException(mockException);
      expect(result).toBeNull();
    });

    it('should handle error when exception not found', async () => {
      const mockException: EventException = {
        id: 999,
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('update_event_exception', 'Exception not found');

      await expect(eventExceptionService.updateException(mockException))
        .rejects
        .toThrow('Exception not found');
    });

    it('should handle database constraint error', async () => {
      const mockException: EventException = {
        id: 1,
        event_id: 999,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('update_event_exception', 'Foreign key constraint failed');

      await expect(eventExceptionService.updateException(mockException))
        .rejects
        .toThrow('Foreign key constraint failed');
    });

    it('should handle concurrent modification error', async () => {
      const mockException: EventException = {
        id: 1,
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      (globalThis as any).setMockError('update_event_exception', 'Concurrent modification detected');

      await expect(eventExceptionService.updateException(mockException))
        .rejects
        .toThrow('Concurrent modification detected');
    });

    it('should handle null/undefined fields gracefully', async () => {
      const mockException: EventException = {
        id: 1,
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false,
        modified_title: undefined,
        modified_description: null as any,
        modified_start_time: undefined,
        modified_end_time: undefined,
        modified_location: undefined
      };

      (globalThis as any).setMockResponse('update_event_exception', undefined);

      const result = await eventExceptionService.updateException(mockException);
      expect(result).toBeNull();
    });
  });

  describe('getExceptionsForEvent', () => {
    it('should retrieve exceptions for event successfully', async () => {
      const mockExceptions: EventException[] = [
        {
          id: 1,
          event_id: 1,
          original_date: '2023-01-15',
          is_cancelled: false,
          modified_title: 'Exception 1'
        },
        {
          id: 2,
          event_id: 1,
          original_date: '2023-01-22',
          is_cancelled: true
        }
      ];

      (globalThis as any).setMockResponse('get_event_exceptions', mockExceptions);

      const result = await eventExceptionService.getExceptionsForEvent(1);

      expect(result).toEqual(mockExceptions);
      expect(result).toHaveLength(2);
      expect(result[0].modified_title).toBe('Exception 1');
      expect(result[1].is_cancelled).toBe(true);
    });

    it('should return empty array when no exceptions exist', async () => {
      (globalThis as any).setMockResponse('get_event_exceptions', []);

      const result = await eventExceptionService.getExceptionsForEvent(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle error when fetching exceptions', async () => {
      (globalThis as any).setMockError('get_event_exceptions', 'Database connection error');

      await expect(eventExceptionService.getExceptionsForEvent(1))
        .rejects
        .toThrow('Database connection error');
    });

    it('should handle invalid event ID', async () => {
      (globalThis as any).setMockError('get_event_exceptions', 'Invalid event ID');

      await expect(eventExceptionService.getExceptionsForEvent(-1))
        .rejects
        .toThrow('Invalid event ID');
    });

    it('should handle large dataset efficiently', async () => {
      const largeExceptionSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        event_id: 1,
        original_date: `2023-01-${String(i + 1).padStart(2, '0')}`,
        is_cancelled: i % 2 === 0,
        modified_title: `Exception ${i + 1}`
      }));

      (globalThis as any).setMockResponse('get_event_exceptions', largeExceptionSet);

      const result = await eventExceptionService.getExceptionsForEvent(1);

      expect(result).toHaveLength(100);
      expect(result[0].modified_title).toBe('Exception 1');
      expect(result[99].modified_title).toBe('Exception 100');
    });

    it('should handle malformed response data', async () => {
      (globalThis as any).setMockResponse('get_event_exceptions', null);

      const result = await eventExceptionService.getExceptionsForEvent(1);

      expect(result).toBeNull();
    });
  });

  describe('deleteException', () => {
    it('should delete exception successfully', async () => {
      (globalThis as any).setMockResponse('delete_event_exception', undefined);

      const result = await eventExceptionService.deleteException(1);
      expect(result).toBeNull();
    });

    it('should handle error when exception not found', async () => {
      (globalThis as any).setMockError('delete_event_exception', 'Exception not found');

      await expect(eventExceptionService.deleteException(999))
        .rejects
        .toThrow('Exception not found');
    });

    it('should handle database lock error', async () => {
      (globalThis as any).setMockError('delete_event_exception', 'Database is locked');

      await expect(eventExceptionService.deleteException(1))
        .rejects
        .toThrow('Database is locked');
    });

    it('should handle foreign key constraint error', async () => {
      (globalThis as any).setMockError('delete_event_exception', 'Foreign key constraint violation');

      await expect(eventExceptionService.deleteException(1))
        .rejects
        .toThrow('Foreign key constraint violation');
    });

    it('should handle invalid exception ID', async () => {
      (globalThis as any).setMockError('delete_event_exception', 'Invalid exception ID');

      await expect(eventExceptionService.deleteException(-1))
        .rejects
        .toThrow('Invalid exception ID');
    });
  });

  describe('Edge Cases and Error Boundaries', () => {
    it('should handle service unavailable error', async () => {
      (globalThis as any).setMockError('create_event_exception', 'Service temporarily unavailable');

      const mockException: EventException = {
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Service temporarily unavailable');
    });

    it('should handle memory exhaustion during bulk operations', async () => {
      (globalThis as any).setMockError('get_event_exceptions', 'Out of memory');

      await expect(eventExceptionService.getExceptionsForEvent(1))
        .rejects
        .toThrow('Out of memory');
    });

    it('should handle invalid date format', async () => {
      const mockException: EventException = {
        event_id: 1,
        original_date: 'invalid-date',
        is_cancelled: false
      };

      (globalThis as any).setMockError('create_event_exception', 'Invalid date format');

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Invalid date format');
    });

    it('should handle permission denied error', async () => {
      (globalThis as any).setMockError('update_event_exception', 'Permission denied');

      const mockException: EventException = {
        id: 1,
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      await expect(eventExceptionService.updateException(mockException))
        .rejects
        .toThrow('Permission denied');
    });

    it('should handle API rate limiting', async () => {
      (globalThis as any).setMockError('create_event_exception', 'Rate limit exceeded');

      const mockException: EventException = {
        event_id: 1,
        original_date: '2023-01-15',
        is_cancelled: false
      };

      await expect(eventExceptionService.createException(mockException))
        .rejects
        .toThrow('Rate limit exceeded');
    });
  });
});