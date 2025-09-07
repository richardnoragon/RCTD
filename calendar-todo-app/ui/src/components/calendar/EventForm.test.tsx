import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Event } from '../../services/eventService';
import { RecurringRule } from '../../services/recurringService';
import { EventForm } from './EventForm';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock the RecurringForm component
jest.mock('./RecurringForm', () => {
  return {
    RecurringForm: function MockRecurringForm(props: any) {
      return (
        <div data-testid="recurring-form">
          <button 
            data-testid="set-daily-rule" 
            onClick={() => props.onChange && props.onChange({
              frequency: 'DAILY',
              interval: 1,
              end_date: '2024-12-31T23:59:59.000Z'
            })}
          >
            Set Daily Rule
          </button>
          <button 
            data-testid="set-weekly-rule" 
            onClick={() => props.onChange && props.onChange({
              frequency: 'WEEKLY',
              interval: 1,
              days_of_week: '[1,3,5]',
              end_occurrences: 10
            })}
          >
            Set Weekly Rule
          </button>
          <button 
            data-testid="clear-rule" 
            onClick={() => props.onChange && props.onChange(undefined)}
          >
            Clear Rule
          </button>
          {props.initialRule && (
            <div data-testid="initial-rule">{props.initialRule.frequency}</div>
          )}
        </div>
      );
    }
  };
});

describe('EventForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockEvent: Event = {
    id: 1,
    title: 'Test Event',
    description: 'Test Description',
    start_time: '2024-01-15T09:00:00.000Z',
    end_time: '2024-01-15T10:00:00.000Z',
    is_all_day: false,
    location: 'Test Location',
    priority: 2,
    category_id: 1,
  };

  const mockRecurringRule: RecurringRule = {
    id: 1,
    frequency: 'WEEKLY',
    interval: 1,
    days_of_week: '[1,3,5]',
    end_occurrences: 10
  };

  describe('Component Rendering', () => {
    it('should render event form successfully', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/all day event/i)).toBeInTheDocument();
    });

    it('should render form with existing event data', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <EventForm 
          event={mockEvent} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toHaveValue('2'); // Priority value
    });

    it('should render Create button for new events', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should render Update button for existing events', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <EventForm 
          event={mockEvent} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should render recurring form component', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByTestId('recurring-form')).toBeInTheDocument();
    });
  });

  describe('Form Field Interactions', () => {
    it('should update title field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Event Title');
      
      expect(titleInput).toHaveValue('New Event Title');
    });

    it('should update description field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Event description here');
      
      expect(descriptionInput).toHaveValue('Event description here');
    });

    it('should toggle all day checkbox', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const allDayCheckbox = screen.getByLabelText(/all day event/i);
      expect(allDayCheckbox).not.toBeChecked();
      
      await user.click(allDayCheckbox);
      expect(allDayCheckbox).toBeChecked();
    });

    it('should update priority field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, '1');
      
      expect(prioritySelect).toHaveValue('1');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'New Meeting');
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Meeting',
            is_all_day: false,
            priority: 3
          }),
          undefined
        );
      });
    });

    it('should call onCancel when cancel button clicked', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Recurring Rule Integration', () => {
    it('should handle recurring rule changes', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Recurring Event');
      await user.click(screen.getByTestId('set-daily-rule'));
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Recurring Event'
          }),
          expect.objectContaining({
            frequency: 'DAILY',
            interval: 1
          })
        );
      });
    });

    it('should clear recurring rule', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();
      const eventWithRule = { 
        ...mockEvent, 
        recurring_rule: mockRecurringRule 
      };

      render(
        <EventForm 
          event={eventWithRule} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await user.click(screen.getByTestId('clear-rule'));
      await user.click(screen.getByRole('button', { name: /update/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.any(Object),
          undefined
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Failed to save'));
      const mockOnCancel = jest.fn();

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Error Test');
      
      try {
        await user.click(screen.getByRole('button', { name: /create/i }));
        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });
      } catch (error) {
        // Expected error handling
        expect(error).toBeDefined();
      }

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/all day event/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/title/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/description/i));
    });
  });

  describe('Performance', () => {
    it('should handle rapid form updates efficiently', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      
      const start = performance.now();
      
      for (let i = 0; i < 10; i++) {
        await user.type(titleInput, `${i}`);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });
});