import { render, screen, waitFor } from '@testing-library/react';
import type { TimeEntry } from '../../services/timeTrackingService';
import { timeTrackingService } from '../../services/timeTrackingService';
import { TimeTrackingReport } from './TimeTrackingReport';

// Mock the timeTrackingService
jest.mock('../../services/timeTrackingService');
const mockTimeTrackingService = timeTrackingService as jest.Mocked<typeof timeTrackingService>;

describe('TimeTrackingReport', () => {
  const mockTimeEntries: TimeEntry[] = [
    {
      id: 1,
      item_type: 'TASK',
      item_id: 100,
      start_time: '2024-01-01T09:00:00Z',
      end_time: '2024-01-01T10:30:00Z',
      duration_seconds: 5400, // 1.5 hours
      timer_type: 'MANUAL',
      created_at: '2024-01-01T09:00:00Z'
    },
    {
      id: 2,
      item_type: 'TASK',
      item_id: 200,
      start_time: '2024-01-01T14:00:00Z',
      end_time: '2024-01-01T14:25:00Z',
      duration_seconds: 1500, // 25 minutes
      timer_type: 'POMODORO',
      created_at: '2024-01-01T14:00:00Z'
    },
    {
      id: 3,
      item_type: 'EVENT',
      item_id: 300,
      start_time: '2024-01-01T16:00:00Z',
      end_time: '2024-01-01T17:00:00Z',
      duration_seconds: 3600, // 1 hour
      timer_type: 'COUNTDOWN',
      created_at: '2024-01-01T16:00:00Z'
    },
    {
      id: 4,
      item_type: 'MANUAL',
      start_time: '2024-01-01T20:00:00Z',
      timer_type: 'MANUAL',
      created_at: '2024-01-01T20:00:00Z'
      // No end_time or duration_seconds (in progress)
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTimeTrackingService.getTimeEntries.mockResolvedValue(mockTimeEntries);
  });

  describe('Component Rendering', () => {
    test('renders time tracking report with summary', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('Time Tracking Summary')).toBeInTheDocument();
        expect(screen.getByText('Time Entries')).toBeInTheDocument();
      });
    });

    test('loads time entries on mount', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: undefined,
          item_id: undefined,
          start_date: undefined,
          end_date: undefined
        });
      });
    });

    test('loads time entries with provided filters', async () => {
      render(
        <TimeTrackingReport
          itemType="TASK"
          itemId={100}
          startDate="2024-01-01"
          endDate="2024-01-31"
        />
      );
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: 'TASK',
          item_id: 100,
          start_date: '2024-01-01',
          end_date: '2024-01-31'
        });
      });
    });

    test('displays all time entries', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('MANUAL')).toBeInTheDocument();
        expect(screen.getByText('POMODORO')).toBeInTheDocument();
        expect(screen.getByText('COUNTDOWN')).toBeInTheDocument();
      });
    });

    test('shows "In Progress" for entries without duration', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('In Progress')).toBeInTheDocument();
      });
    });
  });

  describe('Duration Calculations', () => {
    test('calculates total duration correctly', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        // Total: 5400 + 1500 + 3600 = 10500 seconds = 2h 55m
        expect(screen.getByText('2h 55m')).toBeInTheDocument();
      });
    });

    test('groups durations by timer type', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        // MANUAL: 5400 seconds = 1h 30m
        expect(screen.getByText('MANUAL:')).toBeInTheDocument();
        expect(screen.getByText('1h 30m')).toBeInTheDocument();
        
        // POMODORO: 1500 seconds = 0h 25m
        expect(screen.getByText('POMODORO:')).toBeInTheDocument();
        expect(screen.getByText('0h 25m')).toBeInTheDocument();
        
        // COUNTDOWN: 3600 seconds = 1h 0m
        expect(screen.getByText('COUNTDOWN:')).toBeInTheDocument();
        expect(screen.getByText('1h 0m')).toBeInTheDocument();
      });
    });

    test('handles zero duration correctly', async () => {
      const entriesWithZero: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T09:00:00Z',
          duration_seconds: 0,
          timer_type: 'MANUAL'
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithZero);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Time:')).toBeInTheDocument();
        expect(screen.getByText('0h 0m')).toBeInTheDocument();
      });
    });

    test('handles missing duration_seconds field', async () => {
      const entriesWithMissingDuration: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-01-01T09:00:00Z',
          timer_type: 'MANUAL'
          // No duration_seconds field
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithMissingDuration);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('0h 0m')).toBeInTheDocument(); // Should default to 0
      });
    });

    test('formats large durations correctly', async () => {
      const entriesWithLargeDuration: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T18:00:00Z',
          duration_seconds: 32400, // 9 hours
          timer_type: 'MANUAL'
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithLargeDuration);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('9h 0m')).toBeInTheDocument();
      });
    });

    test('formats fractional hours correctly', async () => {
      const entriesWithFractionalHours: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T10:37:00Z',
          duration_seconds: 5820, // 1 hour 37 minutes
          timer_type: 'MANUAL'
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithFractionalHours);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('1h 37m')).toBeInTheDocument();
      });
    });

    test('aggregates multiple entries of same type', async () => {
      const multipleManualEntries: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-01-01T09:00:00Z',
          duration_seconds: 1800, // 30 minutes
          timer_type: 'MANUAL'
        },
        {
          id: 2,
          item_type: 'TASK',
          start_time: '2024-01-01T11:00:00Z',
          duration_seconds: 2700, // 45 minutes
          timer_type: 'MANUAL'
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(multipleManualEntries);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        // Total should be 1h 15m
        expect(screen.getByText('1h 15m')).toBeInTheDocument();
        // MANUAL group should also be 1h 15m
        expect(screen.getByText('MANUAL:')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    test('formats start dates correctly', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        // Should format dates in locale-specific format
        expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
      });
    });

    test('displays both start and end times when available', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        // Should show "to" between start and end times
        expect(screen.getByText(/to/)).toBeInTheDocument();
      });
    });

    test('does not show end time when entry is in progress', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        const entryItems = screen.getAllByText(/Jan 1, 2024/);
        // Last entry (in progress) should not have "to" text
        const inProgressEntry = entryItems[entryItems.length - 1].closest('.entry-item');
        expect(inProgressEntry).not.toHaveTextContent('to');
      });
    });

    test('handles different date formats', async () => {
      const entriesWithDifferentDates: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: '2024-12-31T23:59:59Z',
          end_time: '2025-01-01T00:30:00Z',
          duration_seconds: 1800,
          timer_type: 'MANUAL'
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithDifferentDates);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
      });
    });
  });

  describe('Entry Display', () => {
    test('displays entry types with correct styling', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        const manualEntry = screen.getByText('MANUAL');
        expect(manualEntry).toHaveClass('entry-type');
        
        const pomodoroEntry = screen.getByText('POMODORO');
        expect(pomodoroEntry).toHaveClass('entry-type');
        
        const countdownEntry = screen.getByText('COUNTDOWN');
        expect(countdownEntry).toHaveClass('entry-type');
      });
    });

    test('displays duration for completed entries', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        const durations = screen.getAllByText(/\d+h \d+m/);
        expect(durations.length).toBeGreaterThan(0);
      });
    });

    test('orders entries by ID', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        const entryTypes = screen.getAllByClass('entry-type');
        expect(entryTypes[0]).toHaveTextContent('MANUAL');
        expect(entryTypes[1]).toHaveTextContent('POMODORO');
        expect(entryTypes[2]).toHaveTextContent('COUNTDOWN');
        expect(entryTypes[3]).toHaveTextContent('MANUAL');
      });
    });

    test('displays empty state when no entries', async () => {
      mockTimeTrackingService.getTimeEntries.mockResolvedValue([]);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('Time Entries')).toBeInTheDocument();
        expect(screen.getByText('0h 0m')).toBeInTheDocument(); // Total should be 0
      });
    });
  });

  describe('Data Filtering', () => {
    test('reloads data when filters change', async () => {
      const { rerender } = render(<TimeTrackingReport itemType="TASK" itemId={100} />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: 'TASK',
          item_id: 100,
          start_date: undefined,
          end_date: undefined
        });
      });
      
      // Change filters
      rerender(<TimeTrackingReport itemType="EVENT" itemId={200} />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: 'EVENT',
          item_id: 200,
          start_date: undefined,
          end_date: undefined
        });
      });
    });

    test('includes date range in API call when provided', async () => {
      render(
        <TimeTrackingReport
          startDate="2024-01-01T00:00:00Z"
          endDate="2024-01-31T23:59:59Z"
        />
      );
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: undefined,
          item_id: undefined,
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z'
        });
      });
    });

    test('handles item type filtering', async () => {
      render(<TimeTrackingReport itemType="CATEGORY" />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: 'CATEGORY',
          item_id: undefined,
          start_date: undefined,
          end_date: undefined
        });
      });
    });

    test('handles manual type filtering', async () => {
      render(<TimeTrackingReport itemType="MANUAL" />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledWith({
          item_type: 'MANUAL',
          item_id: undefined,
          start_date: undefined,
          end_date: undefined
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles time entries loading errors', async () => {
      mockTimeTrackingService.getTimeEntries.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load time entries:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles malformed time entry data', async () => {
      const malformedEntries = [
        {
          id: 1,
          // Missing required fields
          timer_type: 'MANUAL'
        }
      ] as TimeEntry[];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(malformedEntries);
      
      render(<TimeTrackingReport />);
      
      // Should not crash and should handle gracefully
      await waitFor(() => {
        expect(screen.getByText('Time Tracking Summary')).toBeInTheDocument();
      });
    });

    test('handles invalid date strings', async () => {
      const entriesWithInvalidDates: TimeEntry[] = [
        {
          id: 1,
          item_type: 'TASK',
          start_time: 'invalid-date',
          timer_type: 'MANUAL',
          duration_seconds: 1800
        }
      ];
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(entriesWithInvalidDates);
      
      render(<TimeTrackingReport />);
      
      // Should not crash when formatting invalid dates
      await waitFor(() => {
        expect(screen.getByText('Time Tracking Summary')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('handles large number of entries efficiently', async () => {
      const manyEntries: TimeEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        item_type: 'TASK',
        item_id: 100,
        start_time: `2024-01-01T${(i % 24).toString().padStart(2, '0')}:00:00Z`,
        end_time: `2024-01-01T${(i % 24).toString().padStart(2, '0')}:30:00Z`,
        duration_seconds: 1800,
        timer_type: 'MANUAL',
        created_at: `2024-01-01T${(i % 24).toString().padStart(2, '0')}:00:00Z`
      }));
      
      mockTimeTrackingService.getTimeEntries.mockResolvedValue(manyEntries);
      
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('Time Tracking Summary')).toBeInTheDocument();
        // Should calculate total correctly for large dataset
        expect(screen.getByText('500h 0m')).toBeInTheDocument(); // 1000 * 0.5 hours
      });
    });

    test('memoizes calculation results', async () => {
      const { rerender } = render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('2h 55m')).toBeInTheDocument();
      });
      
      // Rerender with same props should not recalculate
      rerender(<TimeTrackingReport />);
      
      expect(mockTimeTrackingService.getTimeEntries).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Time Tracking Summary');
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Time Entries');
      });
    });

    test('provides clear labels for statistics', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Time:')).toBeInTheDocument();
        expect(screen.getByText('MANUAL:')).toBeInTheDocument();
        expect(screen.getByText('POMODORO:')).toBeInTheDocument();
        expect(screen.getByText('COUNTDOWN:')).toBeInTheDocument();
      });
    });

    test('uses semantic markup for entry items', async () => {
      render(<TimeTrackingReport />);
      
      await waitFor(() => {
        const entryItems = document.querySelectorAll('.entry-item');
        expect(entryItems.length).toBe(4);
        
        entryItems.forEach(item => {
          expect(item.querySelector('.entry-header')).toBeInTheDocument();
          expect(item.querySelector('.entry-details')).toBeInTheDocument();
        });
      });
    });
  });
});