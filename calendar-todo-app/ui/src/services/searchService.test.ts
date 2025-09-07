import { SearchResult, searchService } from './searchService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Search Service', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  describe('searchAll', () => {
    it('should search across all entity types successfully', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 1,
          title: 'Team Meeting',
          description: 'Weekly team sync',
          itemType: 'EVENT',
          date: '2024-01-15T09:00:00Z',
          categoryId: 1,
          priority: 2
        },
        {
          id: 2,
          title: 'Complete project task',
          description: 'Finish the quarterly report',
          itemType: 'TASK',
          date: '2024-01-20T00:00:00Z',
          categoryId: 2,
          priority: 1,
          status: 'IN_PROGRESS'
        },
        {
          id: 3,
          title: 'Project Notes',
          description: 'Important project documentation',
          itemType: 'NOTE',
          date: '2024-01-10T14:30:00Z'
        }
      ];

      global.setMockResponse('search_all', mockResults.map(r => ({
        ...r,
        item_type: r.itemType,
        category_id: r.categoryId
      })));

      const result = await searchService.searchAll('project');

      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(3);
      expect(result.map(r => r.itemType)).toEqual(['EVENT', 'TASK', 'NOTE']);
    });

    it('should handle empty search results', async () => {
      global.setMockResponse('search_all', []);

      const result = await searchService.searchAll('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle search errors', async () => {
      global.setMockError('search_all', 'Search service unavailable');

      await expect(searchService.searchAll('query')).rejects.toThrow('Search service unavailable');
    });

    it('should transform snake_case backend response to camelCase', async () => {
      const backendResponse = [
        {
          id: 1,
          title: 'Test Event',
          description: 'Test description',
          item_type: 'EVENT',
          date: '2024-01-15T09:00:00Z',
          category_id: 5,
          priority: 2
        }
      ];

      global.setMockResponse('search_all', backendResponse);

      const result = await searchService.searchAll('test');

      expect(result[0]).toEqual({
        id: 1,
        title: 'Test Event',
        description: 'Test description',
        itemType: 'EVENT',
        date: '2024-01-15T09:00:00Z',
        categoryId: 5,
        priority: 2
      });
    });

    it('should handle null/undefined optional fields', async () => {
      const backendResponse = [
        {
          id: 1,
          title: 'Minimal Result',
          item_type: 'NOTE',
          date: '2024-01-15T09:00:00Z'
          // description, category_id, priority, status are undefined
        }
      ];

      global.setMockResponse('search_all', backendResponse);

      const result = await searchService.searchAll('minimal');

      expect(result[0]).toEqual({
        id: 1,
        title: 'Minimal Result',
        itemType: 'NOTE',
        date: '2024-01-15T09:00:00Z',
        description: undefined,
        categoryId: undefined,
        priority: undefined,
        status: undefined
      });
    });
  });

  describe('searchEvents', () => {
    it('should search events with all filter parameters', async () => {
      const mockEventResults: SearchResult[] = [
        {
          id: 1,
          title: 'Filtered Event',
          description: 'Event within date range',
          itemType: 'EVENT',
          date: '2024-01-15T09:00:00Z',
          categoryId: 1,
          priority: 2
        }
      ];

      global.setMockResponse('search_events', mockEventResults.map(r => ({
        ...r,
        item_type: r.itemType,
        category_id: r.categoryId
      })));

      const params = {
        query: 'meeting',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        categoryId: 1
      };

      const result = await searchService.searchEvents(params);

      expect(result).toEqual(mockEventResults);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_events', {
        query: 'meeting',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        categoryId: 1
      });
    });

    it('should search events with minimal parameters', async () => {
      global.setMockResponse('search_events', []);

      const result = await searchService.searchEvents({ query: 'simple' });

      expect(result).toEqual([]);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_events', {
        query: 'simple',
        startDate: undefined,
        endDate: undefined,
        categoryId: undefined
      });
    });

    it('should handle date range filtering', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Event in Range',
          item_type: 'EVENT',
          date: '2024-01-15T09:00:00Z',
          category_id: 1,
          priority: 1
        }
      ];

      global.setMockResponse('search_events', mockResults);

      const result = await searchService.searchEvents({
        query: 'event',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z'
      });

      expect(result).toHaveLength(1);
      expect(result[0].itemType).toBe('EVENT');
    });

    it('should handle category filtering', async () => {
      global.setMockResponse('search_events', []);

      await searchService.searchEvents({
        query: 'work',
        categoryId: 5
      });

      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_events', {
        query: 'work',
        startDate: undefined,
        endDate: undefined,
        categoryId: 5
      });
    });

    it('should handle search errors', async () => {
      global.setMockError('search_events', 'Invalid date range');

      await expect(searchService.searchEvents({
        query: 'test',
        startDate: '2024-01-31T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z'
      })).rejects.toThrow('Invalid date range');
    });
  });

  describe('searchTasks', () => {
    it('should search tasks with all filter parameters', async () => {
      const mockTaskResults: SearchResult[] = [
        {
          id: 1,
          title: 'Important Task',
          description: 'High priority task',
          itemType: 'TASK',
          date: '2024-01-20T00:00:00Z',
          categoryId: 2,
          priority: 1,
          status: 'TODO'
        }
      ];

      global.setMockResponse('search_tasks', mockTaskResults.map(r => ({
        ...r,
        item_type: r.itemType,
        category_id: r.categoryId
      })));

      const params = {
        query: 'important',
        dueDateStart: '2024-01-01T00:00:00Z',
        dueDateEnd: '2024-01-31T23:59:59Z',
        categoryId: 2,
        status: 'TODO',
        priority: 1
      };

      const result = await searchService.searchTasks(params);

      expect(result).toEqual(mockTaskResults);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_tasks', {
        query: 'important',
        dueDateStart: '2024-01-01T00:00:00Z',
        dueDateEnd: '2024-01-31T23:59:59Z',
        categoryId: 2,
        status: 'TODO',
        priority: 1
      });
    });

    it('should search tasks by status', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Completed Task',
          item_type: 'TASK',
          status: 'COMPLETED',
          priority: 2
        }
      ];

      global.setMockResponse('search_tasks', mockResults);

      const result = await searchService.searchTasks({
        query: 'task',
        status: 'COMPLETED'
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('COMPLETED');
    });

    it('should search tasks by priority', async () => {
      global.setMockResponse('search_tasks', []);

      await searchService.searchTasks({
        query: 'urgent',
        priority: 1
      });

      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_tasks', {
        query: 'urgent',
        dueDateStart: undefined,
        dueDateEnd: undefined,
        categoryId: undefined,
        status: undefined,
        priority: 1
      });
    });

    it('should handle due date range filtering', async () => {
      global.setMockResponse('search_tasks', []);

      await searchService.searchTasks({
        query: 'deadline',
        dueDateStart: '2024-01-15T00:00:00Z',
        dueDateEnd: '2024-01-20T23:59:59Z'
      });

      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_tasks', {
        query: 'deadline',
        dueDateStart: '2024-01-15T00:00:00Z',
        dueDateEnd: '2024-01-20T23:59:59Z',
        categoryId: undefined,
        status: undefined,
        priority: undefined
      });
    });

    it('should handle task search errors', async () => {
      global.setMockError('search_tasks', 'Invalid status filter');

      await expect(searchService.searchTasks({
        query: 'test',
        status: 'INVALID_STATUS'
      })).rejects.toThrow('Invalid status filter');
    });
  });

  describe('searchNotes', () => {
    it('should search notes successfully', async () => {
      const mockNoteResults: SearchResult[] = [
        {
          id: 1,
          title: 'Meeting Notes',
          description: 'Notes from the team meeting',
          itemType: 'NOTE',
          date: '2024-01-15T14:30:00Z'
        },
        {
          id: 2,
          title: 'Project Documentation',
          description: 'Important project notes',
          itemType: 'NOTE',
          date: '2024-01-12T10:00:00Z'
        }
      ];

      global.setMockResponse('search_notes', mockNoteResults.map(r => ({
        ...r,
        item_type: r.itemType,
        category_id: r.categoryId
      })));

      const result = await searchService.searchNotes('notes');

      expect(result).toEqual(mockNoteResults);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.itemType === 'NOTE')).toBe(true);
    });

    it('should handle empty note search results', async () => {
      global.setMockResponse('search_notes', []);

      const result = await searchService.searchNotes('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle note search errors', async () => {
      global.setMockError('search_notes', 'Notes index unavailable');

      await expect(searchService.searchNotes('query')).rejects.toThrow('Notes index unavailable');
    });

    it('should pass query to backend correctly', async () => {
      global.setMockResponse('search_notes', []);

      await searchService.searchNotes('documentation');

      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_notes', {
        query: 'documentation'
      });
    });
  });

  describe('Query Validation and Edge Cases', () => {
    it('should handle empty query strings', async () => {
      global.setMockResponse('search_all', []);

      const result = await searchService.searchAll('');

      expect(result).toEqual([]);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_all', {
        query: ''
      });
    });

    it('should handle whitespace-only queries', async () => {
      global.setMockResponse('search_all', []);

      const result = await searchService.searchAll('   ');

      expect(result).toEqual([]);
    });

    it('should handle special characters in queries', async () => {
      const specialQueries = [
        'search@query.com',
        'query-with-dashes',
        'query_with_underscores',
        'query with spaces',
        'émojis 🔍 and àccents',
        'numbers 123 and symbols !@#$%'
      ];

      for (const query of specialQueries) {
        global.setMockResponse('search_all', []);
        const result = await searchService.searchAll(query);
        expect(result).toEqual([]);
      }
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      global.setMockResponse('search_all', []);

      const result = await searchService.searchAll(longQuery);

      expect(result).toEqual([]);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('search_all', {
        query: longQuery
      });
    });

    it('should handle malformed date strings', async () => {
      global.setMockError('search_events', 'Invalid date format');

      await expect(searchService.searchEvents({
        query: 'test',
        startDate: 'invalid-date',
        endDate: 'also-invalid'
      })).rejects.toThrow('Invalid date format');
    });

    it('should handle invalid category IDs', async () => {
      global.setMockError('search_events', 'Category not found');

      await expect(searchService.searchEvents({
        query: 'test',
        categoryId: -1
      })).rejects.toThrow('Category not found');
    });

    it('should handle invalid priority values', async () => {
      global.setMockError('search_tasks', 'Invalid priority value');

      await expect(searchService.searchTasks({
        query: 'test',
        priority: 999
      })).rejects.toThrow('Invalid priority value');
    });
  });

  describe('Performance and Bulk Operations', () => {
    it('should handle large search result sets', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Result ${i + 1}`,
        description: `Description for result ${i + 1}`,
        item_type: 'EVENT',
        date: '2024-01-15T09:00:00Z',
        category_id: (i % 5) + 1,
        priority: (i % 3) + 1
      }));

      global.setMockResponse('search_all', largeResultSet);

      const result = await searchService.searchAll('result');

      expect(result).toHaveLength(1000);
      expect(result.every(r => r.itemType === 'EVENT')).toBe(true);
    });

    it('should handle concurrent search requests', async () => {
      global.setMockResponse('search_all', []);

      const promises = Array.from({ length: 10 }, (_, i) => 
        searchService.searchAll(`query${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(r => Array.isArray(r) && r.length === 0)).toBe(true);
    });

    it('should handle rapid successive searches', async () => {
      global.setMockResponse('search_all', []);

      for (let i = 0; i < 50; i++) {
        const result = await searchService.searchAll(`rapid${i}`);
        expect(result).toEqual([]);
      }

      expect(global.mockTauriInvoke).toHaveBeenCalledTimes(50);
    });

    it('should handle search timeout scenarios', async () => {
      global.setMockError('search_all', 'Search timeout');

      await expect(searchService.searchAll('slow-query')).rejects.toThrow('Search timeout');
    });
  });

  describe('Result Filtering and Sorting', () => {
    it('should maintain result order from backend', async () => {
      const orderedResults = [
        { id: 3, title: 'Third', item_type: 'EVENT', date: '2024-01-17T00:00:00Z' },
        { id: 1, title: 'First', item_type: 'TASK', date: '2024-01-15T00:00:00Z' },
        { id: 2, title: 'Second', item_type: 'NOTE', date: '2024-01-16T00:00:00Z' }
      ];

      global.setMockResponse('search_all', orderedResults);

      const result = await searchService.searchAll('ordered');

      expect(result.map(r => r.id)).toEqual([3, 1, 2]);
      expect(result.map(r => r.title)).toEqual(['Third', 'First', 'Second']);
    });

    it('should preserve all result metadata', async () => {
      const completeResult = {
        id: 1,
        title: 'Complete Result',
        description: 'Full description',
        item_type: 'EVENT',
        date: '2024-01-15T09:00:00Z',
        category_id: 3,
        priority: 2
      };

      global.setMockResponse('search_all', [completeResult]);

      const result = await searchService.searchAll('complete');

      expect(result[0]).toEqual({
        id: 1,
        title: 'Complete Result',
        description: 'Full description',
        itemType: 'EVENT',
        date: '2024-01-15T09:00:00Z',
        categoryId: 3,
        priority: 2
      });
    });

    it('should handle mixed entity types in results', async () => {
      const mixedResults = [
        { id: 1, title: 'Event', item_type: 'EVENT', priority: 1 },
        { id: 2, title: 'Task', item_type: 'TASK', status: 'TODO' },
        { id: 3, title: 'Note', item_type: 'NOTE' }
      ];

      global.setMockResponse('search_all', mixedResults);

      const result = await searchService.searchAll('mixed');

      expect(result.map(r => r.itemType)).toEqual(['EVENT', 'TASK', 'NOTE']);
      expect(result[0].priority).toBe(1);
      expect(result[1].status).toBe('TODO');
      expect(result[2].priority).toBeUndefined();
    });
  });

  describe('Error Recovery and Reliability', () => {
    it('should handle network failures gracefully', async () => {
      global.setMockError('search_all', 'Network connection failed');

      await expect(searchService.searchAll('network-test')).rejects.toThrow('Network connection failed');
    });

    it('should handle backend service unavailable', async () => {
      global.setMockError('search_all', 'Search service temporarily unavailable');

      await expect(searchService.searchAll('service-test')).rejects.toThrow('Search service temporarily unavailable');
    });

    it('should handle database connection errors', async () => {
      global.setMockError('search_all', 'Database connection lost');

      await expect(searchService.searchAll('db-test')).rejects.toThrow('Database connection lost');
    });

    it('should handle malformed backend responses', async () => {
      global.setMockResponse('search_all', 'invalid-json-response');

      // This should not throw, just return the invalid response
      const result = await searchService.searchAll('malformed');
      expect(result).toBe('invalid-json-response');
    });

    it('should handle null backend responses', async () => {
      global.setMockResponse('search_all', null);

      const result = await searchService.searchAll('null-response');
      expect(result).toBeNull();
    });
  });
});