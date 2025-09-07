import { timeTrackingService } from './timeTrackingService';

// Mock setup is handled in setupTests.ts
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Time Tracking Service', () => {
  beforeEach(() => {
    globalThis.resetMocks();
  });

  describe('Timer Operations', () => {
    describe('startTimer', () => {
      it('should start a timer for an event successfully', async () => {
        const timeEntry = {
          item_type: 'EVENT' as const,
          item_id: 5,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: 'MANUAL' as const
        };
        const mockId = 1;

        globalThis.setMockResponse('start_timer', mockId);

        const result = await timeTrackingService.startTimer(timeEntry);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('start_timer', { entry: timeEntry });
      });

      it('should start a timer for a task successfully', async () => {
        const timeEntry = {
          item_type: 'TASK' as const,
          item_id: 10,
          start_time: '2024-01-15T14:00:00Z',
          timer_type: 'POMODORO' as const
        };
        const mockId = 2;

        globalThis.setMockResponse('start_timer', mockId);

        const result = await timeTrackingService.startTimer(timeEntry);
        expect(result).toBe(mockId);
      });

      it('should start a manual timer successfully', async () => {
        const timeEntry = {
          item_type: 'MANUAL' as const,
          start_time: '2024-01-15T16:00:00Z',
          timer_type: 'COUNTDOWN' as const
        };
        const mockId = 3;

        globalThis.setMockResponse('start_timer', mockId);

        const result = await timeTrackingService.startTimer(timeEntry);
        expect(result).toBe(mockId);
      });

      it('should handle timer start errors', async () => {
        const timeEntry = {
          item_type: 'EVENT' as const,
          item_id: 999,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: 'MANUAL' as const
        };

        globalThis.setMockError('start_timer', 'Event not found');

        await expect(timeTrackingService.startTimer(timeEntry)).rejects.toThrow('Event not found');
      });

      it('should handle concurrent timer errors', async () => {
        const timeEntry = {
          item_type: 'TASK' as const,
          item_id: 10,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: 'MANUAL' as const
        };

        globalThis.setMockError('start_timer', 'Another timer is already running');

        await expect(timeTrackingService.startTimer(timeEntry)).rejects.toThrow('Another timer is already running');
      });
    });

    describe('stopTimer', () => {
      it('should stop a timer successfully', async () => {
        const timerId = 1;
        const endTime = '2024-01-15T11:00:00Z';

        globalThis.setMockResponse('stop_timer', undefined);

        await timeTrackingService.stopTimer(timerId, endTime);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('stop_timer', { id: timerId, endTime });
      });

      it('should handle stop timer errors', async () => {
        const timerId = 999;
        const endTime = '2024-01-15T11:00:00Z';

        globalThis.setMockError('stop_timer', 'Timer not found');

        await expect(timeTrackingService.stopTimer(timerId, endTime)).rejects.toThrow('Timer not found');
      });

      it('should handle invalid end time', async () => {
        const timerId = 1;
        const invalidEndTime = '2024-01-15T09:00:00Z'; // Before start time

        globalThis.setMockError('stop_timer', 'End time cannot be before start time');

        await expect(timeTrackingService.stopTimer(timerId, invalidEndTime)).rejects.toThrow('End time cannot be before start time');
      });
    });

    describe('getActiveTimer', () => {
      it('should get active timer successfully', async () => {
        const mockActiveTimer = {
          id: 1,
          item_type: 'TASK' as const,
          item_id: 10,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: 'MANUAL' as const,
          created_at: '2024-01-15T10:00:00Z'
        };

        globalThis.setMockResponse('get_active_timer', mockActiveTimer);

        const result = await timeTrackingService.getActiveTimer();
        expect(result).toEqual(mockActiveTimer);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_active_timer');
      });

      it('should handle no active timer', async () => {
        globalThis.setMockResponse('get_active_timer', null);

        const result = await timeTrackingService.getActiveTimer();
        expect(result).toBeNull();
      });

      it('should handle active timer errors', async () => {
        globalThis.setMockError('get_active_timer', 'Failed to check active timer');

        await expect(timeTrackingService.getActiveTimer()).rejects.toThrow('Failed to check active timer');
      });
    });
  });

  describe('Time Entry Queries', () => {
    describe('getTimeEntries', () => {
      it('should get all time entries successfully', async () => {
        const mockEntries = [
          {
            id: 1,
            item_type: 'EVENT' as const,
            item_id: 5,
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            duration_seconds: 3600,
            timer_type: 'MANUAL' as const,
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            item_type: 'TASK' as const,
            item_id: 10,
            start_time: '2024-01-15T14:00:00Z',
            end_time: '2024-01-15T15:30:00Z',
            duration_seconds: 5400,
            timer_type: 'POMODORO' as const,
            created_at: '2024-01-15T14:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_time_entries', mockEntries);

        const result = await timeTrackingService.getTimeEntries({});
        expect(result).toEqual(mockEntries);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_time_entries', {});
      });

      it('should filter by item type', async () => {
        const taskEntries = [
          {
            id: 1,
            item_type: 'TASK' as const,
            item_id: 10,
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            duration_seconds: 3600,
            timer_type: 'MANUAL' as const,
            created_at: '2024-01-15T10:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_time_entries', taskEntries);

        const result = await timeTrackingService.getTimeEntries({ item_type: 'TASK' });
        expect(result).toEqual(taskEntries);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_time_entries', { item_type: 'TASK' });
      });

      it('should filter by specific item', async () => {
        const itemEntries = [
          {
            id: 1,
            item_type: 'EVENT' as const,
            item_id: 5,
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            duration_seconds: 3600,
            timer_type: 'MANUAL' as const,
            created_at: '2024-01-15T10:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_time_entries', itemEntries);

        const result = await timeTrackingService.getTimeEntries({ 
          item_type: 'EVENT',
          item_id: 5 
        });
        expect(result).toEqual(itemEntries);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_time_entries', { 
          item_type: 'EVENT',
          item_id: 5 
        });
      });

      it('should filter by date range', async () => {
        const dateRangeEntries = [
          {
            id: 1,
            item_type: 'TASK' as const,
            item_id: 10,
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            duration_seconds: 3600,
            timer_type: 'MANUAL' as const,
            created_at: '2024-01-15T10:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_time_entries', dateRangeEntries);

        const result = await timeTrackingService.getTimeEntries({
          start_date: '2024-01-15',
          end_date: '2024-01-15'
        });
        expect(result).toEqual(dateRangeEntries);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_time_entries', {
          start_date: '2024-01-15',
          end_date: '2024-01-15'
        });
      });

      it('should handle empty results', async () => {
        globalThis.setMockResponse('get_time_entries', []);

        const result = await timeTrackingService.getTimeEntries({ item_type: 'MANUAL' });
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle query errors', async () => {
        globalThis.setMockError('get_time_entries', 'Invalid date range');

        await expect(
          timeTrackingService.getTimeEntries({
            start_date: '2024-01-31',
            end_date: '2024-01-01'
          })
        ).rejects.toThrow('Invalid date range');
      });
    });
  });

  describe('Timer Type Validation', () => {
    it('should handle all timer types correctly', async () => {
      const timerTypes = ['MANUAL', 'POMODORO', 'COUNTDOWN'] as const;
      
      for (let i = 0; i < timerTypes.length; i++) {
        const timeEntry = {
          item_type: 'TASK' as const,
          item_id: i + 1,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: timerTypes[i]
        };

        globalThis.setMockResponse('start_timer', i + 10);
        const result = await timeTrackingService.startTimer(timeEntry);
        expect(result).toBe(i + 10);
      }
    });

    it('should handle pomodoro timer workflow', async () => {
      const pomodoroEntry = {
        item_type: 'TASK' as const,
        item_id: 15,
        start_time: '2024-01-15T10:00:00Z',
        timer_type: 'POMODORO' as const
      };

      // Start pomodoro timer
      globalThis.setMockResponse('start_timer', 50);
      const timerId = await timeTrackingService.startTimer(pomodoroEntry);
      expect(timerId).toBe(50);

      // Check active timer
      const activeTimer = { ...pomodoroEntry, id: timerId };
      globalThis.setMockResponse('get_active_timer', activeTimer);
      const active = await timeTrackingService.getActiveTimer();
      expect(active).toEqual(activeTimer);

      // Stop timer after 25 minutes (typical pomodoro)
      globalThis.setMockResponse('stop_timer', undefined);
      await timeTrackingService.stopTimer(timerId, '2024-01-15T10:25:00Z');
    });

    it('should handle countdown timer workflow', async () => {
      const countdownEntry = {
        item_type: 'CATEGORY' as const,
        item_id: 3,
        start_time: '2024-01-15T16:00:00Z',
        timer_type: 'COUNTDOWN' as const
      };

      globalThis.setMockResponse('start_timer', 60);
      const timerId = await timeTrackingService.startTimer(countdownEntry);
      expect(timerId).toBe(60);

      // Stop after predetermined time
      globalThis.setMockResponse('stop_timer', undefined);
      await timeTrackingService.stopTimer(timerId, '2024-01-15T16:15:00Z');
    });
  });

  describe('Duration Calculations', () => {
    it('should handle various duration calculations', async () => {
      const durations = [
        { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', expected: 3600 }, // 1 hour
        { start: '2024-01-15T10:00:00Z', end: '2024-01-15T10:30:00Z', expected: 1800 }, // 30 minutes
        { start: '2024-01-15T10:00:00Z', end: '2024-01-15T10:05:00Z', expected: 300 },  // 5 minutes
        { start: '2024-01-15T23:00:00Z', end: '2024-01-16T01:00:00Z', expected: 7200 }  // 2 hours across midnight
      ];

      for (let i = 0; i < durations.length; i++) {
        const timeEntry = {
          item_type: 'TASK' as const,
          item_id: i + 1,
          start_time: durations[i].start,
          end_time: durations[i].end,
          duration_seconds: durations[i].expected,
          timer_type: 'MANUAL' as const,
          created_at: durations[i].start
        };

        globalThis.setMockResponse('get_time_entries', [timeEntry]);
        const result = await timeTrackingService.getTimeEntries({ item_id: i + 1 });
        expect(result[0].duration_seconds).toBe(durations[i].expected);
      }
    });

    it('should handle timezone boundary calculations', async () => {
      const timezoneEntry = {
        item_type: 'EVENT' as const,
        item_id: 20,
        start_time: '2024-01-15T23:30:00Z',
        end_time: '2024-01-16T00:30:00Z',
        duration_seconds: 3600,
        timer_type: 'MANUAL' as const,
        created_at: '2024-01-15T23:30:00Z'
      };

      globalThis.setMockResponse('get_time_entries', [timezoneEntry]);

      const result = await timeTrackingService.getTimeEntries({ item_id: 20 });
      expect(result[0]).toEqual(timezoneEntry);
      expect(result[0].duration_seconds).toBe(3600);
    });
  });

  describe('Data Persistence', () => {
    it('should persist timer data across sessions', async () => {
      // Simulate timer session
      const timeEntry = {
        item_type: 'TASK' as const,
        item_id: 25,
        start_time: '2024-01-15T09:00:00Z',
        timer_type: 'MANUAL' as const
      };

      globalThis.setMockResponse('start_timer', 100);
      const timerId = await timeTrackingService.startTimer(timeEntry);

      // Stop timer
      globalThis.setMockResponse('stop_timer', undefined);
      await timeTrackingService.stopTimer(timerId, '2024-01-15T17:00:00Z');

      // Retrieve completed entry
      const completedEntry = {
        id: timerId,
        item_type: 'TASK' as const,
        item_id: 25,
        start_time: '2024-01-15T09:00:00Z',
        end_time: '2024-01-15T17:00:00Z',
        duration_seconds: 28800, // 8 hours
        timer_type: 'MANUAL' as const,
        created_at: '2024-01-15T09:00:00Z'
      };

      globalThis.setMockResponse('get_time_entries', [completedEntry]);
      const result = await timeTrackingService.getTimeEntries({ item_id: 25 });
      expect(result[0]).toEqual(completedEntry);
    });

    it('should handle long-running timers', async () => {
      const longRunningEntry = {
        item_type: 'EVENT' as const,
        item_id: 30,
        start_time: '2024-01-15T08:00:00Z',
        timer_type: 'MANUAL' as const
      };

      globalThis.setMockResponse('start_timer', 200);
      const timerId = await timeTrackingService.startTimer(longRunningEntry);

      // Stop after 12 hours
      globalThis.setMockResponse('stop_timer', undefined);
      await timeTrackingService.stopTimer(timerId, '2024-01-15T20:00:00Z');

      // Verify long duration handling
      const longEntry = {
        id: timerId,
        ...longRunningEntry,
        end_time: '2024-01-15T20:00:00Z',
        duration_seconds: 43200, // 12 hours
        created_at: '2024-01-15T08:00:00Z'
      };

      globalThis.setMockResponse('get_time_entries', [longEntry]);
      const result = await timeTrackingService.getTimeEntries({ item_id: 30 });
      expect(result[0].duration_seconds).toBe(43200);
    });
  });

  describe('Reporting and Analytics', () => {
    it('should handle time tracking reports by date range', async () => {
      const reportEntries = [
        {
          id: 1,
          item_type: 'TASK' as const,
          item_id: 1,
          start_time: '2024-01-15T09:00:00Z',
          end_time: '2024-01-15T12:00:00Z',
          duration_seconds: 10800,
          timer_type: 'MANUAL' as const,
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          item_type: 'EVENT' as const,
          item_id: 5,
          start_time: '2024-01-15T14:00:00Z',
          end_time: '2024-01-15T16:00:00Z',
          duration_seconds: 7200,
          timer_type: 'POMODORO' as const,
          created_at: '2024-01-15T14:00:00Z'
        }
      ];

      globalThis.setMockResponse('get_time_entries', reportEntries);

      const result = await timeTrackingService.getTimeEntries({
        start_date: '2024-01-15',
        end_date: '2024-01-15'
      });

      expect(result).toEqual(reportEntries);
      expect(result).toHaveLength(2);
      
      // Verify total time calculation
      const totalSeconds = result.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
      expect(totalSeconds).toBe(18000); // 5 hours total
    });

    it('should handle weekly time tracking reports', async () => {
      const weeklyEntries = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        item_type: 'TASK' as const,
        item_id: 10,
        start_time: `2024-01-${15 + i}T09:00:00Z`,
        end_time: `2024-01-${15 + i}T17:00:00Z`,
        duration_seconds: 28800, // 8 hours per day
        timer_type: 'MANUAL' as const,
        created_at: `2024-01-${15 + i}T09:00:00Z`
      }));

      globalThis.setMockResponse('get_time_entries', weeklyEntries);

      const result = await timeTrackingService.getTimeEntries({
        start_date: '2024-01-15',
        end_date: '2024-01-21'
      });

      expect(result).toHaveLength(7);
      
      // Verify weekly total (7 * 8 hours = 56 hours = 201,600 seconds)
      const weeklyTotal = result.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
      expect(weeklyTotal).toBe(201600);
    });

    it('should handle category-based time tracking', async () => {
      const categoryEntries = [
        {
          id: 1,
          item_type: 'CATEGORY' as const,
          item_id: 1,
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T12:00:00Z',
          duration_seconds: 7200,
          timer_type: 'MANUAL' as const,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      globalThis.setMockResponse('get_time_entries', categoryEntries);

      const result = await timeTrackingService.getTimeEntries({ item_type: 'CATEGORY' });
      expect(result).toEqual(categoryEntries);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      globalThis.setMockError('get_time_entries', 'Database connection failed');

      await expect(timeTrackingService.getTimeEntries({})).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      globalThis.setMockError('start_timer', 'Request timeout');

      const timeEntry = {
        item_type: 'TASK' as const,
        item_id: 1,
        start_time: '2024-01-15T10:00:00Z',
        timer_type: 'MANUAL' as const
      };

      await expect(timeTrackingService.startTimer(timeEntry)).rejects.toThrow('Request timeout');
    });

    it('should handle permission errors', async () => {
      globalThis.setMockError('stop_timer', 'Insufficient permissions');

      await expect(timeTrackingService.stopTimer(1, '2024-01-15T11:00:00Z')).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid timer operations', async () => {
      globalThis.setMockResponse('get_active_timer', null);

      const promises = Array.from({ length: 20 }, () => timeTrackingService.getActiveTimer());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeNull();
      });
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(20);
    });

    it('should handle large time entry datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        item_type: 'TASK' as const,
        item_id: Math.floor(i / 10) + 1,
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        duration_seconds: 3600,
        timer_type: 'MANUAL' as const,
        created_at: '2024-01-15T10:00:00Z'
      }));

      globalThis.setMockResponse('get_time_entries', largeDataset);

      const result = await timeTrackingService.getTimeEntries({});
      expect(result).toEqual(largeDataset);
      expect(result).toHaveLength(1000);
    });

    it('should handle complex filtering scenarios', async () => {
      const complexFilter = {
        item_type: 'TASK' as const,
        item_id: 5,
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };

      const filteredEntries = [
        {
          id: 1,
          item_type: 'TASK' as const,
          item_id: 5,
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          duration_seconds: 3600,
          timer_type: 'MANUAL' as const,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      globalThis.setMockResponse('get_time_entries', filteredEntries);

      const result = await timeTrackingService.getTimeEntries(complexFilter);
      expect(result).toEqual(filteredEntries);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_time_entries', complexFilter);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce TimeEntry interface compliance', async () => {
      const validEntry = {
        item_type: 'EVENT' as const,
        item_id: 1,
        start_time: '2024-01-15T10:00:00Z',
        timer_type: 'MANUAL' as const
      };

      globalThis.setMockResponse('start_timer', 999);

      const result = await timeTrackingService.startTimer(validEntry);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should validate item type enum values', async () => {
      const itemTypes = ['EVENT', 'TASK', 'CATEGORY', 'MANUAL'] as const;
      
      for (let i = 0; i < itemTypes.length; i++) {
        const entry = {
          item_type: itemTypes[i],
          item_id: i + 1,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: 'MANUAL' as const
        };

        globalThis.setMockResponse('start_timer', i + 100);
        const result = await timeTrackingService.startTimer(entry);
        expect(result).toBe(i + 100);
      }
    });

    it('should validate timer type enum values', async () => {
      const timerTypes = ['MANUAL', 'POMODORO', 'COUNTDOWN'] as const;
      
      for (let i = 0; i < timerTypes.length; i++) {
        const entry = {
          item_type: 'TASK' as const,
          item_id: 1,
          start_time: '2024-01-15T10:00:00Z',
          timer_type: timerTypes[i]
        };

        globalThis.setMockResponse('start_timer', i + 200);
        const result = await timeTrackingService.startTimer(entry);
        expect(result).toBe(i + 200);
      }
    });
  });
});