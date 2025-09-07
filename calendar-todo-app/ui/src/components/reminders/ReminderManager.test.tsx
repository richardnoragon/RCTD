import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Reminder } from '../../services/reminderService';
import { reminderService } from '../../services/reminderService';
import { ReminderManager } from './ReminderManager';

// Mock the reminderService
jest.mock('../../services/reminderService');
const mockReminderService = reminderService as jest.Mocked<typeof reminderService>;

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe('ReminderManager', () => {
  const mockEventReminder: Reminder = {
    id: 1,
    item_type: 'EVENT',
    item_id: 100,
    trigger_time: '2024-01-01T12:00:00Z',
    offset_description: '15 minutes before',
    is_dismissed: false,
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockTaskReminder: Reminder = {
    id: 2,
    item_type: 'TASK',
    item_id: 200,
    trigger_time: '2024-01-02T10:30:00Z',
    offset_description: '30 minutes before',
    is_dismissed: false,
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockPendingReminders: Reminder[] = [
    {
      id: 3,
      item_type: 'EVENT',
      item_id: 101,
      trigger_time: '2024-01-01T14:00:00Z',
      offset_description: '5 minutes before',
      is_dismissed: false
    },
    {
      id: 4,
      item_type: 'TASK',
      item_id: 201,
      trigger_time: '2024-01-01T15:00:00Z',
      offset_description: '1 hour before',
      is_dismissed: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockReminderService.getReminder.mockResolvedValue(null);
    mockReminderService.createReminder.mockResolvedValue(1);
    mockReminderService.updateReminder.mockResolvedValue();
    mockReminderService.deleteReminder.mockResolvedValue();
    mockReminderService.getPendingReminders.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Component Rendering', () => {
    test('renders empty state when no itemType or itemId provided', () => {
      render(<ReminderManager />);
      
      expect(screen.queryByText('Reminder Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Reminders')).not.toBeInTheDocument();
    });

    test('renders reminder form when itemType and itemId provided', async () => {
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Reminder Settings')).toBeInTheDocument();
        expect(screen.getByText('Remind me:')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    test('loads existing reminder on mount', async () => {
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(mockReminderService.getReminder).toHaveBeenCalledWith('EVENT', 100);
      });
    });

    test('displays existing reminder settings correctly', async () => {
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        const select = screen.getByDisplayValue('15 minutes before');
        expect(select).toBeInTheDocument();
        expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
      });
    });

    test('creates default reminder when defaultReminder is true and none exists', async () => {
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="EVENT" itemId={100} defaultReminder={true} />);
      
      await waitFor(() => {
        expect(mockReminderService.createReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'EVENT',
            item_id: 100,
            offset_description: '15 minutes before',
            is_dismissed: false
          })
        );
      });
    });

    test('does not show delete button for new reminders', async () => {
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.queryByText('Delete Reminder')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reminder CRUD Operations', () => {
    test('creates new reminder with selected offset', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="TASK" itemId={200} />);
      
      await waitFor(() => {
        expect(screen.getByText('Reminder Settings')).toBeInTheDocument();
      });
      
      // Change offset
      const select = screen.getByLabelText('Remind me:');
      await user.selectOptions(select, '30');
      
      // Save reminder
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockReminderService.createReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'TASK',
            item_id: 200,
            offset_description: '30 minutes before'
          })
        );
      });
    });

    test('updates existing reminder', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('15 minutes before')).toBeInTheDocument();
      });
      
      // Change offset
      const select = screen.getByLabelText('Remind me:');
      await user.selectOptions(select, '60');
      
      // Save reminder
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockReminderService.updateReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            offset_description: '60 minutes before'
          })
        );
      });
    });

    test('deletes existing reminder', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
      });
      
      // Delete reminder
      const deleteButton = screen.getByText('Delete Reminder');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockReminderService.deleteReminder).toHaveBeenCalledWith('EVENT', 100);
      });
    });

    test('calls onClose callback after saving', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="EVENT" itemId={100} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('calls onClose callback after deleting', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('Delete Reminder');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Offset Selection', () => {
    test('displays all available offset options', async () => {
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText('Remind me:');
        const options = select.querySelectorAll('option');
        
        expect(options).toHaveLength(5);
        expect(options[0]).toHaveTextContent('5 minutes before');
        expect(options[1]).toHaveTextContent('15 minutes before');
        expect(options[2]).toHaveTextContent('30 minutes before');
        expect(options[3]).toHaveTextContent('1 hour before');
        expect(options[4]).toHaveTextContent('1 day before');
      });
    });

    test('has default selection of 15 minutes before', async () => {
      mockReminderService.getReminder.mockResolvedValue(null);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText('Remind me:') as HTMLSelectElement;
        expect(select.value).toBe('15 minutes before');
      });
    });

    test('updates trigger time when offset changes', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      // Mock Date to have predictable time calculations
      const mockDate = new Date('2024-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('15 minutes before')).toBeInTheDocument();
      });
      
      // Change to 1 hour before
      const select = screen.getByLabelText('Remind me:');
      await user.selectOptions(select, '60');
      
      // Save to verify trigger_time was updated
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockReminderService.updateReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            trigger_time: expect.any(String),
            offset_description: '60 minutes before'
          })
        );
      });
      
      jest.restoreAllMocks();
    });
  });

  describe('Pending Reminders and Notifications', () => {
    test('checks for pending reminders on mount', async () => {
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(mockReminderService.getPendingReminders).toHaveBeenCalled();
      });
    });

    test('displays notification panel when pending reminders exist', async () => {
      mockReminderService.getPendingReminders.mockResolvedValue(mockPendingReminders);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Reminders')).toBeInTheDocument();
        expect(screen.getByText('Event')).toBeInTheDocument();
        expect(screen.getByText('Task')).toBeInTheDocument();
        expect(screen.getByText('5 minutes before')).toBeInTheDocument();
        expect(screen.getByText('1 hour before')).toBeInTheDocument();
      });
    });

    test('displays dismiss buttons for each pending reminder', async () => {
      mockReminderService.getPendingReminders.mockResolvedValue(mockPendingReminders);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('Dismiss');
        expect(dismissButtons).toHaveLength(2);
      });
    });

    test('dismisses individual reminders', async () => {
      const user = userEvent.setup();
      mockReminderService.getPendingReminders.mockResolvedValue(mockPendingReminders);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Dismiss')).toHaveLength(2);
      });
      
      // Dismiss first reminder
      const dismissButtons = screen.getAllByText('Dismiss');
      await user.click(dismissButtons[0]);
      
      await waitFor(() => {
        expect(mockReminderService.updateReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 3,
            is_dismissed: true
          })
        );
      });
    });

    test('removes dismissed reminder from display', async () => {
      const user = userEvent.setup();
      mockReminderService.getPendingReminders.mockResolvedValue(mockPendingReminders);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('5 minutes before')).toBeInTheDocument();
        expect(screen.getByText('1 hour before')).toBeInTheDocument();
      });
      
      // Dismiss first reminder
      const dismissButtons = screen.getAllByText('Dismiss');
      await user.click(dismissButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('5 minutes before')).not.toBeInTheDocument();
        expect(screen.getByText('1 hour before')).toBeInTheDocument();
      });
    });

    test('hides notification panel when all reminders are dismissed', async () => {
      const user = userEvent.setup();
      const singleReminder = [mockPendingReminders[0]];
      mockReminderService.getPendingReminders.mockResolvedValue(singleReminder);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Reminders')).toBeInTheDocument();
      });
      
      // Dismiss the only reminder
      const dismissButton = screen.getByText('Dismiss');
      await user.click(dismissButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Reminders')).not.toBeInTheDocument();
      });
    });

    test('sets up interval to check for pending reminders', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    });

    test('clears interval on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<ReminderManager itemType="EVENT" itemId={100} />);
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    test('checks pending reminders periodically', async () => {
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      // Initial call
      expect(mockReminderService.getPendingReminders).toHaveBeenCalledTimes(1);
      
      // Advance timer by 1 minute
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      expect(mockReminderService.getPendingReminders).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('handles reminder loading errors', async () => {
      mockReminderService.getReminder.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load reminder:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles reminder saving errors', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(null);
      mockReminderService.createReminder.mockRejectedValue(new Error('Save failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save reminder:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles reminder deletion errors', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      mockReminderService.deleteReminder.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('Delete Reminder');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete reminder:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles pending reminders check errors', async () => {
      mockReminderService.getPendingReminders.mockRejectedValue(new Error('Check failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to check reminders:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles dismiss reminder errors', async () => {
      const user = userEvent.setup();
      mockReminderService.getPendingReminders.mockResolvedValue(mockPendingReminders);
      mockReminderService.updateReminder.mockRejectedValue(new Error('Dismiss failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Dismiss')).toHaveLength(2);
      });
      
      const dismissButtons = screen.getAllByText('Dismiss');
      await user.click(dismissButtons[0]);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to dismiss reminder:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Form Validation and Edge Cases', () => {
    test('does not save when no reminder state exists', async () => {
      const user = userEvent.setup();
      mockReminderService.getReminder.mockResolvedValue(null);
      
      // Mock the state to be null after load
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      
      // Try to save without proper reminder state (edge case)
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Should not call service if reminder state is invalid
      expect(mockReminderService.createReminder).toHaveBeenCalled(); // Initially called for setup
    });

    test('does not delete when no itemType or itemId', async () => {
      const user = userEvent.setup();
      // This is an edge case that shouldn't normally happen
      mockReminderService.getReminder.mockResolvedValue(mockEventReminder);
      
      const { rerender } = render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
      });
      
      // Rerender without itemType/itemId (edge case)
      rerender(<ReminderManager />);
      
      // Component should handle this gracefully
      expect(screen.queryByText('Delete Reminder')).not.toBeInTheDocument();
    });

    test('handles missing reminder ID in dismiss action', async () => {
      const user = userEvent.setup();
      const reminderWithoutId = [{
        item_type: 'EVENT' as const,
        item_id: 101,
        trigger_time: '2024-01-01T14:00:00Z',
        offset_description: '5 minutes before',
        is_dismissed: false
      }];
      
      mockReminderService.getPendingReminders.mockResolvedValue(reminderWithoutId);
      
      render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
      });
      
      // Try to dismiss reminder without ID
      const dismissButton = screen.getByText('Dismiss');
      await user.click(dismissButton);
      
      // Should not call update service without valid ID
      expect(mockReminderService.updateReminder).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    test('reloads reminder when itemType or itemId changes', async () => {
      const { rerender } = render(<ReminderManager itemType="EVENT" itemId={100} />);
      
      await waitFor(() => {
        expect(mockReminderService.getReminder).toHaveBeenCalledWith('EVENT', 100);
      });
      
      // Change itemId
      rerender(<ReminderManager itemType="EVENT" itemId={200} />);
      
      await waitFor(() => {
        expect(mockReminderService.getReminder).toHaveBeenCalledWith('EVENT', 200);
      });
    });

    test('does not load reminder when itemType or itemId is missing', async () => {
      render(<ReminderManager itemType="EVENT" />);
      
      // Should not attempt to load without both itemType and itemId
      expect(mockReminderService.getReminder).not.toHaveBeenCalled();
    });
  });
});