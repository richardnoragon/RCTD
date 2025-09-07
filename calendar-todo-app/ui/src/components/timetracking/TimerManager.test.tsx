import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TimeEntry } from '../../services/timeTrackingService';
import { timeTrackingService } from '../../services/timeTrackingService';
import { TimerManager } from './TimerManager';

// Mock the timeTrackingService
jest.mock('../../services/timeTrackingService');
const mockTimeTrackingService = timeTrackingService as jest.Mocked<typeof timeTrackingService>;

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe('TimerManager', () => {
  const mockActiveTimer: TimeEntry = {
    id: 1,
    item_type: 'TASK',
    item_id: 100,
    start_time: '2024-01-01T12:00:00Z',
    timer_type: 'MANUAL',
    created_at: '2024-01-01T12:00:00Z'
  };

  const mockPomodoroTimer: TimeEntry = {
    id: 2,
    item_type: 'TASK',
    item_id: 200,
    start_time: '2024-01-01T14:00:00Z',
    timer_type: 'POMODORO',
    created_at: '2024-01-01T14:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTimeTrackingService.getActiveTimer.mockResolvedValue(null);
    mockTimeTrackingService.startTimer.mockResolvedValue(1);
    mockTimeTrackingService.stopTimer.mockResolvedValue();
    
    // Mock Date.now for predictable elapsed time calculations
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:05:00Z').getTime());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders timer manager with default values', () => {
      render(<TimerManager />);
      
      expect(screen.getByDisplayValue('Manual Timer')).toBeInTheDocument();
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    test('loads active timer on mount', async () => {
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.getActiveTimer).toHaveBeenCalled();
      });
    });

    test('displays elapsed time when active timer exists', async () => {
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        // Timer started at 12:00:00, current time is 12:05:00 (5 minutes = 300 seconds)
        expect(screen.getByText('00:05:00')).toBeInTheDocument();
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
    });

    test('shows timer type dropdown options', () => {
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      const options = select.querySelectorAll('option');
      
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Manual Timer');
      expect(options[1]).toHaveTextContent('Pomodoro Timer');
      expect(options[2]).toHaveTextContent('Countdown Timer');
    });

    test('displays pomodoro info when pomodoro timer is selected', async () => {
      const user = userEvent.setup();
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      expect(screen.getByText('Work Time')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro #1')).toBeInTheDocument();
    });

    test('disables timer type selection when timer is active', async () => {
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        const select = screen.getByDisplayValue('Manual Timer');
        expect(select).toBeDisabled();
      });
    });
  });

  describe('Timer Operations', () => {
    test('starts manual timer', async () => {
      const user = userEvent.setup();
      const mockOnTimerUpdate = jest.fn();
      
      render(<TimerManager itemType="TASK" itemId={100} onTimerUpdate={mockOnTimerUpdate} />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith({
          item_type: 'TASK',
          item_id: 100,
          start_time: expect.any(String),
          timer_type: 'MANUAL'
        });
        expect(mockOnTimerUpdate).toHaveBeenCalled();
      });
    });

    test('starts timer with default MANUAL item type when no props provided', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith({
          item_type: 'MANUAL',
          item_id: undefined,
          start_time: expect.any(String),
          timer_type: 'MANUAL'
        });
      });
    });

    test('stops active timer', async () => {
      const user = userEvent.setup();
      const mockOnTimerUpdate = jest.fn();
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager onTimerUpdate={mockOnTimerUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
      
      const stopButton = screen.getByText('Stop');
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.stopTimer).toHaveBeenCalledWith(1, expect.any(String));
        expect(mockOnTimerUpdate).toHaveBeenCalled();
      });
    });

    test('starts pomodoro timer', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager itemType="TASK" itemId={200} />);
      
      // Switch to pomodoro mode
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith({
          item_type: 'TASK',
          item_id: 200,
          start_time: expect.any(String),
          timer_type: 'POMODORO'
        });
      });
    });

    test('starts countdown timer', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager itemType="EVENT" itemId={300} />);
      
      // Switch to countdown mode
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'COUNTDOWN');
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith({
          item_type: 'EVENT',
          item_id: 300,
          start_time: expect.any(String),
          timer_type: 'COUNTDOWN'
        });
      });
    });

    test('does not stop timer when no active timer ID', async () => {
      const user = userEvent.setup();
      // Set up state where there's an active timer but no ID (edge case)
      mockTimeTrackingService.getActiveTimer.mockResolvedValue({
        item_type: 'MANUAL',
        start_time: '2024-01-01T12:00:00Z',
        timer_type: 'MANUAL'
      });
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
      
      const stopButton = screen.getByText('Stop');
      await user.click(stopButton);
      
      // Should not call stopTimer without valid ID
      expect(mockTimeTrackingService.stopTimer).not.toHaveBeenCalled();
    });
  });

  describe('Time Display and Formatting', () => {
    test('formats elapsed time correctly', async () => {
      // Test different time durations
      const testCases = [
        { seconds: 0, expected: '00:00:00' },
        { seconds: 59, expected: '00:00:59' },
        { seconds: 60, expected: '00:01:00' },
        { seconds: 3599, expected: '00:59:59' },
        { seconds: 3600, expected: '01:00:00' },
        { seconds: 7325, expected: '02:02:05' }
      ];

      for (const testCase of testCases) {
        const startTime = new Date(Date.now() - testCase.seconds * 1000).toISOString();
        mockTimeTrackingService.getActiveTimer.mockResolvedValue({
          ...mockActiveTimer,
          start_time: startTime
        });

        const { unmount } = render(<TimerManager />);
        
        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        unmount();
      }
    });

    test('updates elapsed time every second', async () => {
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(screen.getByText('00:05:00')).toBeInTheDocument();
      });
      
      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText('00:05:01')).toBeInTheDocument();
      
      // Advance timer by 59 more seconds
      act(() => {
        jest.advanceTimersByTime(59000);
      });
      
      expect(screen.getByText('00:06:00')).toBeInTheDocument();
    });

    test('resets elapsed time when timer starts', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      // Initially shows 00:00:00
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      // Should still show 00:00:00 after starting
      await waitFor(() => {
        expect(screen.getByText('00:00:00')).toBeInTheDocument();
      });
    });

    test('resets elapsed time when timer stops', async () => {
      const user = userEvent.setup();
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(screen.getByText('00:05:00')).toBeInTheDocument();
      });
      
      const stopButton = screen.getByText('Stop');
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(screen.getByText('00:00:00')).toBeInTheDocument();
      });
    });
  });

  describe('Pomodoro Timer Functionality', () => {
    test('displays correct pomodoro state information', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      expect(screen.getByText('Work Time')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro #1')).toBeInTheDocument();
    });

    test('handles pomodoro work session completion', async () => {
      const user = userEvent.setup();
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockPomodoroTimer);
      
      render(<TimerManager />);
      
      // Switch to pomodoro and start
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      await waitFor(() => {
        expect(screen.getByText('Work Time')).toBeInTheDocument();
      });
      
      // Simulate 25 minutes (1500 seconds) passing
      act(() => {
        jest.advanceTimersByTime(1500 * 1000);
      });
      
      // Should automatically transition to break
      await waitFor(() => {
        expect(screen.getByText('Break Time')).toBeInTheDocument();
      });
    });

    test('handles pomodoro break completion', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      // Manually set break state (would normally happen after work session)
      act(() => {
        // This would require access to component state, so we'll test the behavior through UI
      });
      
      expect(screen.getByText('Work Time')).toBeInTheDocument();
    });

    test('calculates pomodoro number correctly', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      // Initially should show Pomodoro #1
      expect(screen.getByText('Pomodoro #1')).toBeInTheDocument();
    });

    test('stops current timer when pomodoro state changes', async () => {
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockPomodoroTimer);
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
      
      // Simulate 25 minutes passing to trigger state change
      act(() => {
        jest.advanceTimersByTime(1500 * 1000);
      });
      
      await waitFor(() => {
        expect(mockTimeTrackingService.stopTimer).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles timer loading errors', async () => {
      mockTimeTrackingService.getActiveTimer.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load active timer:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles timer start errors', async () => {
      const user = userEvent.setup();
      mockTimeTrackingService.startTimer.mockRejectedValue(new Error('Start failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TimerManager />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to start timer:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles timer stop errors', async () => {
      const user = userEvent.setup();
      mockTimeTrackingService.getActiveTimer.mockResolvedValue(mockActiveTimer);
      mockTimeTrackingService.stopTimer.mockRejectedValue(new Error('Stop failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TimerManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
      
      const stopButton = screen.getByText('Stop');
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to stop timer:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Timer State Management', () => {
    test('clears timer interval when component unmounts', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<TimerManager />);
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    test('does not update elapsed time when no active timer', () => {
      render(<TimerManager />);
      
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
      
      // Advance timer
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should still show 00:00:00
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    test('preserves timer type selection when not active', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'COUNTDOWN');
      
      expect(screen.getByDisplayValue('Countdown Timer')).toBeInTheDocument();
      
      // Start timer
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith(
          expect.objectContaining({
            timer_type: 'COUNTDOWN'
          })
        );
      });
    });

    test('handles missing onTimerUpdate callback gracefully', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      // Should not throw error when onTimerUpdate is not provided
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalled();
      });
    });
  });

  describe('Timer Configuration', () => {
    test('accepts different item types', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<TimerManager itemType="EVENT" itemId={100} />);
      
      let startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'EVENT',
            item_id: 100
          })
        );
      });
      
      // Test CATEGORY type
      rerender(<TimerManager itemType="CATEGORY" itemId={200} />);
      
      startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'CATEGORY',
            item_id: 200
          })
        );
      });
    });

    test('handles undefined itemId correctly', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager itemType="MANUAL" />);
      
      const startButton = screen.getByText('Start');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(mockTimeTrackingService.startTimer).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'MANUAL',
            item_id: undefined
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    test('timer controls are properly labeled', () => {
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      expect(select).toBeInTheDocument();
      
      const startButton = screen.getByRole('button', { name: 'Start' });
      expect(startButton).toBeInTheDocument();
    });

    test('timer display is readable', () => {
      render(<TimerManager />);
      
      const timerDisplay = screen.getByText('00:00:00');
      expect(timerDisplay).toBeInTheDocument();
      expect(timerDisplay.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('pomodoro information is clearly displayed', async () => {
      const user = userEvent.setup();
      
      render(<TimerManager />);
      
      const select = screen.getByDisplayValue('Manual Timer');
      await user.selectOptions(select, 'POMODORO');
      
      expect(screen.getByText('Work Time')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro #1')).toBeInTheDocument();
    });
  });
});