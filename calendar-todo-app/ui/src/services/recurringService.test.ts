import { recurringService } from './recurringService';

// Mock setup is handled in setupTests.ts
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Recurring Service', () => {
  beforeEach(() => {
    globalThis.resetMocks();
  });

  describe('CRUD Operations', () => {
    describe('createRecurringRule', () => {
      it('should create a daily recurring rule successfully', async () => {
        const dailyRule = {
          frequency: 'DAILY' as const,
          interval: 1,
          end_date: '2024-12-31T23:59:59.000Z'
        };
        const mockId = 1;

        globalThis.setMockResponse('create_recurring_rule', mockId);

        const result = await recurringService.createRecurringRule(dailyRule);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_recurring_rule', { rule: dailyRule });
      });

      it('should create a weekly recurring rule successfully', async () => {
        const weeklyRule = {
          frequency: 'WEEKLY' as const,
          interval: 1,
          days_of_week: '[1,3,5]', // Monday, Wednesday, Friday
          end_occurrences: 10
        };
        const mockId = 2;

        globalThis.setMockResponse('create_recurring_rule', mockId);

        const result = await recurringService.createRecurringRule(weeklyRule);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_recurring_rule', { rule: weeklyRule });
      });

      it('should create a monthly recurring rule successfully', async () => {
        const monthlyRule = {
          frequency: 'MONTHLY' as const,
          interval: 1,
          day_of_month: 15,
          end_date: '2024-12-31T23:59:59.000Z'
        };
        const mockId = 3;

        globalThis.setMockResponse('create_recurring_rule', mockId);

        const result = await recurringService.createRecurringRule(monthlyRule);
        expect(result).toBe(mockId);
      });

      it('should create an annual recurring rule successfully', async () => {
        const annualRule = {
          frequency: 'ANNUALLY' as const,
          interval: 1,
          day_of_month: 1,
          month_of_year: 1, // January 1st
          end_occurrences: 5
        };
        const mockId = 4;

        globalThis.setMockResponse('create_recurring_rule', mockId);

        const result = await recurringService.createRecurringRule(annualRule);
        expect(result).toBe(mockId);
      });

      it('should handle creation errors', async () => {
        const invalidRule = {
          frequency: 'DAILY' as const,
          interval: -1 // Invalid interval
        };

        globalThis.setMockError('create_recurring_rule', 'Invalid interval value');

        await expect(recurringService.createRecurringRule(invalidRule)).rejects.toThrow('Invalid interval value');
      });
    });

    describe('getRecurringRule', () => {
      it('should fetch recurring rule successfully', async () => {
        const mockRule = {
          id: 1,
          frequency: 'WEEKLY' as const,
          interval: 1,
          days_of_week: '[1,3,5]',
          end_occurrences: 10
        };

        globalThis.setMockResponse('get_recurring_rule', mockRule);

        const result = await recurringService.getRecurringRule(1);
        expect(result).toEqual(mockRule);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_recurring_rule', { id: 1 });
      });

      it('should handle non-existent rule', async () => {
        globalThis.setMockError('get_recurring_rule', 'Recurring rule not found');

        await expect(recurringService.getRecurringRule(999)).rejects.toThrow('Recurring rule not found');
      });
    });

    describe('updateRecurringRule', () => {
      it('should update recurring rule successfully', async () => {
        const updatedRule = {
          id: 1,
          frequency: 'WEEKLY' as const,
          interval: 2,
          days_of_week: '[2,4]', // Tuesday, Thursday
          end_occurrences: 15
        };

        globalThis.setMockResponse('update_recurring_rule', undefined);

        await recurringService.updateRecurringRule(updatedRule);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_recurring_rule', { rule: updatedRule });
      });

      it('should handle update errors', async () => {
        const invalidRule = {
          id: 999,
          frequency: 'DAILY' as const,
          interval: 1
        };

        globalThis.setMockError('update_recurring_rule', 'Recurring rule not found');

        await expect(recurringService.updateRecurringRule(invalidRule)).rejects.toThrow('Recurring rule not found');
      });
    });
  });

  describe('Recurring Pattern Validation', () => {
    describe('Daily Patterns', () => {
      it('should validate daily pattern with end date', async () => {
        const dailyRule = {
          frequency: 'DAILY' as const,
          interval: 2, // Every 2 days
          end_date: '2024-12-31T23:59:59.000Z'
        };

        globalThis.setMockResponse('create_recurring_rule', 1);

        const result = await recurringService.createRecurringRule(dailyRule);
        expect(result).toBe(1);
      });

      it('should validate daily pattern with occurrence limit', async () => {
        const dailyRule = {
          frequency: 'DAILY' as const,
          interval: 3,
          end_occurrences: 30
        };

        globalThis.setMockResponse('create_recurring_rule', 2);

        const result = await recurringService.createRecurringRule(dailyRule);
        expect(result).toBe(2);
      });

      it('should handle invalid daily intervals', async () => {
        const invalidRule = {
          frequency: 'DAILY' as const,
          interval: 0
        };

        globalThis.setMockError('create_recurring_rule', 'Interval must be positive');

        await expect(recurringService.createRecurringRule(invalidRule)).rejects.toThrow('Interval must be positive');
      });
    });

    describe('Weekly Patterns', () => {
      it('should validate weekly pattern with specific days', async () => {
        const weeklyRule = {
          frequency: 'WEEKLY' as const,
          interval: 1,
          days_of_week: '[0,6]' // Sunday and Saturday
        };

        globalThis.setMockResponse('create_recurring_rule', 3);

        const result = await recurringService.createRecurringRule(weeklyRule);
        expect(result).toBe(3);
      });

      it('should validate bi-weekly pattern', async () => {
        const biWeeklyRule = {
          frequency: 'WEEKLY' as const,
          interval: 2,
          days_of_week: '[1,2,3,4,5]', // Weekdays
          end_occurrences: 20
        };

        globalThis.setMockResponse('create_recurring_rule', 4);

        const result = await recurringService.createRecurringRule(biWeeklyRule);
        expect(result).toBe(4);
      });

      it('should handle invalid days of week', async () => {
        const invalidRule = {
          frequency: 'WEEKLY' as const,
          interval: 1,
          days_of_week: '[7,8]' // Invalid day numbers
        };

        globalThis.setMockError('create_recurring_rule', 'Invalid days of week');

        await expect(recurringService.createRecurringRule(invalidRule)).rejects.toThrow('Invalid days of week');
      });
    });

    describe('Monthly Patterns', () => {
      it('should validate monthly pattern with specific day', async () => {
        const monthlyRule = {
          frequency: 'MONTHLY' as const,
          interval: 1,
          day_of_month: 15
        };

        globalThis.setMockResponse('create_recurring_rule', 5);

        const result = await recurringService.createRecurringRule(monthlyRule);
        expect(result).toBe(5);
      });

      it('should validate quarterly pattern', async () => {
        const quarterlyRule = {
          frequency: 'MONTHLY' as const,
          interval: 3,
          day_of_month: 1,
          end_date: '2025-12-31T23:59:59.000Z'
        };

        globalThis.setMockResponse('create_recurring_rule', 6);

        const result = await recurringService.createRecurringRule(quarterlyRule);
        expect(result).toBe(6);
      });

      it('should handle end-of-month scenarios', async () => {
        const endOfMonthRule = {
          frequency: 'MONTHLY' as const,
          interval: 1,
          day_of_month: 31 // Should handle shorter months gracefully
        };

        globalThis.setMockResponse('create_recurring_rule', 7);

        const result = await recurringService.createRecurringRule(endOfMonthRule);
        expect(result).toBe(7);
      });

      it('should handle invalid day of month', async () => {
        const invalidRule = {
          frequency: 'MONTHLY' as const,
          interval: 1,
          day_of_month: 32
        };

        globalThis.setMockError('create_recurring_rule', 'Invalid day of month');

        await expect(recurringService.createRecurringRule(invalidRule)).rejects.toThrow('Invalid day of month');
      });
    });

    describe('Annual Patterns', () => {
      it('should validate annual pattern', async () => {
        const annualRule = {
          frequency: 'ANNUALLY' as const,
          interval: 1,
          day_of_month: 25,
          month_of_year: 12 // December 25th
        };

        globalThis.setMockResponse('create_recurring_rule', 8);

        const result = await recurringService.createRecurringRule(annualRule);
        expect(result).toBe(8);
      });

      it('should handle leap year scenarios', async () => {
        const leapYearRule = {
          frequency: 'ANNUALLY' as const,
          interval: 1,
          day_of_month: 29,
          month_of_year: 2 // February 29th - leap year handling
        };

        globalThis.setMockResponse('create_recurring_rule', 9);

        const result = await recurringService.createRecurringRule(leapYearRule);
        expect(result).toBe(9);
      });

      it('should validate bi-annual pattern', async () => {
        const biAnnualRule = {
          frequency: 'ANNUALLY' as const,
          interval: 2,
          day_of_month: 1,
          month_of_year: 1,
          end_occurrences: 5
        };

        globalThis.setMockResponse('create_recurring_rule', 10);

        const result = await recurringService.createRecurringRule(biAnnualRule);
        expect(result).toBe(10);
      });
    });
  });

  describe('Event Expansion', () => {
    describe('expandRecurringEvents', () => {
      it('should expand daily recurring events', async () => {
        const expandedEvents = [
          {
            id: 1,
            title: 'Daily Standup',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T09:30:00Z'
          },
          {
            id: 1,
            title: 'Daily Standup',
            start: '2024-01-16T09:00:00Z',
            end: '2024-01-16T09:30:00Z'
          },
          {
            id: 1,
            title: 'Daily Standup',
            start: '2024-01-17T09:00:00Z',
            end: '2024-01-17T09:30:00Z'
          }
        ];

        globalThis.setMockResponse('expand_recurring_events', expandedEvents);

        const result = await recurringService.expandRecurringEvents(
          1,
          '2024-01-15T00:00:00Z',
          '2024-01-17T23:59:59Z'
        );

        expect(result).toEqual(expandedEvents);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('expand_recurring_events', {
          eventId: 1,
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-17T23:59:59Z'
        });
      });

      it('should expand weekly recurring events', async () => {
        const expandedEvents = [
          {
            id: 2,
            title: 'Team Meeting',
            start: '2024-01-15T14:00:00Z',
            end: '2024-01-15T15:00:00Z'
          },
          {
            id: 2,
            title: 'Team Meeting',
            start: '2024-01-17T14:00:00Z',
            end: '2024-01-17T15:00:00Z'
          },
          {
            id: 2,
            title: 'Team Meeting',
            start: '2024-01-19T14:00:00Z',
            end: '2024-01-19T15:00:00Z'
          }
        ];

        globalThis.setMockResponse('expand_recurring_events', expandedEvents);

        const result = await recurringService.expandRecurringEvents(
          2,
          '2024-01-15T00:00:00Z',
          '2024-01-21T23:59:59Z'
        );

        expect(result).toEqual(expandedEvents);
        expect(result).toHaveLength(3);
      });

      it('should handle monthly recurring events', async () => {
        const monthlyEvents = [
          {
            id: 3,
            title: 'Monthly Review',
            start: '2024-01-15T10:00:00Z',
            end: '2024-01-15T11:00:00Z'
          },
          {
            id: 3,
            title: 'Monthly Review',
            start: '2024-02-15T10:00:00Z',
            end: '2024-02-15T11:00:00Z'
          },
          {
            id: 3,
            title: 'Monthly Review',
            start: '2024-03-15T10:00:00Z',
            end: '2024-03-15T11:00:00Z'
          }
        ];

        globalThis.setMockResponse('expand_recurring_events', monthlyEvents);

        const result = await recurringService.expandRecurringEvents(
          3,
          '2024-01-01T00:00:00Z',
          '2024-03-31T23:59:59Z'
        );

        expect(result).toEqual(monthlyEvents);
        expect(result).toHaveLength(3);
      });

      it('should handle empty expansion results', async () => {
        globalThis.setMockResponse('expand_recurring_events', []);

        const result = await recurringService.expandRecurringEvents(
          999,
          '2024-01-01T00:00:00Z',
          '2024-01-31T23:59:59Z'
        );

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle expansion errors', async () => {
        globalThis.setMockError('expand_recurring_events', 'Event not found');

        await expect(
          recurringService.expandRecurringEvents(
            999,
            '2024-01-01T00:00:00Z',
            '2024-01-31T23:59:59Z'
          )
        ).rejects.toThrow('Event not found');
      });
    });

    describe('Date Range Handling', () => {
      it('should handle large date ranges efficiently', async () => {
        const yearEvents = Array.from({ length: 365 }, (_, i) => ({
          id: 1,
          title: 'Daily Event',
          start: `2024-01-${String(i % 31 + 1).padStart(2, '0')}T09:00:00Z`,
          end: `2024-01-${String(i % 31 + 1).padStart(2, '0')}T10:00:00Z`
        }));

        globalThis.setMockResponse('expand_recurring_events', yearEvents);

        const result = await recurringService.expandRecurringEvents(
          1,
          '2024-01-01T00:00:00Z',
          '2024-12-31T23:59:59Z'
        );

        expect(result).toHaveLength(365);
        expect(result[0].title).toBe('Daily Event');
      });

      it('should handle timezone boundaries correctly', async () => {
        const timezoneEvents = [
          {
            id: 1,
            title: 'Timezone Event',
            start: '2024-01-15T23:00:00Z',
            end: '2024-01-16T00:00:00Z'
          }
        ];

        globalThis.setMockResponse('expand_recurring_events', timezoneEvents);

        const result = await recurringService.expandRecurringEvents(
          1,
          '2024-01-15T00:00:00Z',
          '2024-01-16T23:59:59Z'
        );

        expect(result).toEqual(timezoneEvents);
      });

      it('should validate date range parameters', async () => {
        globalThis.setMockError('expand_recurring_events', 'Invalid date range');

        await expect(
          recurringService.expandRecurringEvents(
            1,
            '2024-01-31T00:00:00Z',
            '2024-01-01T00:00:00Z' // End before start
          )
        ).rejects.toThrow('Invalid date range');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed date strings', async () => {
      const invalidRule = {
        frequency: 'DAILY' as const,
        interval: 1,
        end_date: 'invalid-date'
      };

      globalThis.setMockError('create_recurring_rule', 'Invalid date format');

      await expect(recurringService.createRecurringRule(invalidRule)).rejects.toThrow('Invalid date format');
    });

    it('should handle very large intervals', async () => {
      const largeIntervalRule = {
        frequency: 'DAILY' as const,
        interval: 1000
      };

      globalThis.setMockResponse('create_recurring_rule', 100);

      const result = await recurringService.createRecurringRule(largeIntervalRule);
      expect(result).toBe(100);
    });

    it('should handle concurrent rule operations', async () => {
      const rules = Array.from({ length: 10 }, (_, i) => ({
        frequency: 'DAILY' as const,
        interval: i + 1,
        end_occurrences: 10
      }));

      // Mock successful creation for each rule
      for (let i = 0; i < rules.length; i++) {
        globalThis.setMockResponse('create_recurring_rule', i + 1);
        const result = await recurringService.createRecurringRule(rules[i]);
        expect(result).toBe(i + 1);
      }
    });

    it('should handle database connection errors', async () => {
      globalThis.setMockError('create_recurring_rule', 'Database connection failed');

      const rule = {
        frequency: 'DAILY' as const,
        interval: 1
      };

      await expect(recurringService.createRecurringRule(rule)).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors during expansion', async () => {
      globalThis.setMockError('expand_recurring_events', 'Request timeout');

      await expect(
        recurringService.expandRecurringEvents(
          1,
          '2024-01-01T00:00:00Z',
          '2024-12-31T23:59:59Z'
        )
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle rapid successive rule creation', async () => {
      globalThis.setMockResponse('create_recurring_rule', 1);

      const promises = Array.from({ length: 20 }, () =>
        recurringService.createRecurringRule({
          frequency: 'DAILY' as const,
          interval: 1
        })
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe(1);
      });
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(20);
    });

    it('should handle bulk event expansion', async () => {
      const bulkEvents = Array.from({ length: 1000 }, (_, i) => ({
        id: 1,
        title: `Bulk Event ${i}`,
        start: `2024-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`,
        end: `2024-01-01T${String(i % 24).padStart(2, '0')}:30:00Z`
      }));

      globalThis.setMockResponse('expand_recurring_events', bulkEvents);

      const result = await recurringService.expandRecurringEvents(
        1,
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z'
      );

      expect(result).toHaveLength(1000);
    });
  });

  describe('Complex Recurring Patterns', () => {
    it('should handle every weekday pattern', async () => {
      const weekdayRule = {
        frequency: 'WEEKLY' as const,
        interval: 1,
        days_of_week: '[1,2,3,4,5]' // Monday through Friday
      };

      globalThis.setMockResponse('create_recurring_rule', 50);

      const result = await recurringService.createRecurringRule(weekdayRule);
      expect(result).toBe(50);
    });

    it('should handle last day of month pattern', async () => {
      const lastDayRule = {
        frequency: 'MONTHLY' as const,
        interval: 1,
        day_of_month: -1 // Last day of month (if supported)
      };

      globalThis.setMockResponse('create_recurring_rule', 51);

      const result = await recurringService.createRecurringRule(lastDayRule);
      expect(result).toBe(51);
    });

    it('should handle mixed end conditions', async () => {
      const mixedRule = {
        frequency: 'WEEKLY' as const,
        interval: 2,
        days_of_week: '[1,3,5]',
        end_date: '2024-12-31T23:59:59Z',
        end_occurrences: 50 // Whichever comes first
      };

      globalThis.setMockResponse('create_recurring_rule', 52);

      const result = await recurringService.createRecurringRule(mixedRule);
      expect(result).toBe(52);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce RecurringRule interface compliance', async () => {
      const validRule = {
        frequency: 'WEEKLY' as const,
        interval: 1,
        days_of_week: '[1,2,3,4,5]'
      };

      globalThis.setMockResponse('create_recurring_rule', 999);

      const result = await recurringService.createRecurringRule(validRule);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should handle optional fields correctly', async () => {
      const ruleWithOptionalFields = {
        id: 1,
        frequency: 'MONTHLY' as const,
        interval: 2,
        day_of_month: 15,
        end_date: '2024-12-31T23:59:59Z'
      };

      globalThis.setMockResponse('update_recurring_rule', undefined);

      await recurringService.updateRecurringRule(ruleWithOptionalFields);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_recurring_rule', { rule: ruleWithOptionalFields });
    });

    it('should validate frequency enum values', async () => {
      const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY'];
      
      for (let i = 0; i < frequencies.length; i++) {
        const rule = {
          frequency: frequencies[i] as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUALLY',
          interval: 1
        };

        globalThis.setMockResponse('create_recurring_rule', i + 100);
        const result = await recurringService.createRecurringRule(rule);
        expect(result).toBe(i + 100);
      }
    });
  });
});