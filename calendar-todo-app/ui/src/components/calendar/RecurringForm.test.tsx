import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringRule } from '../../services/recurringService';
import { RecurringForm } from './RecurringForm';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

describe('RecurringForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockWeeklyRule: RecurringRule = {
    frequency: 'WEEKLY',
    interval: 1,
    days_of_week: '[1,3,5]', // Mon, Wed, Fri
    end_occurrences: 10
  };

  const mockMonthlyRule: RecurringRule = {
    frequency: 'MONTHLY',
    interval: 2,
    day_of_month: 15,
    end_date: '2024-12-31'
  };

  describe('Component Rendering', () => {
    it('should render recurring checkbox initially unchecked', () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      const recurringCheckbox = screen.getByLabelText(/repeat this event/i);
      expect(recurringCheckbox).toBeInTheDocument();
      expect(recurringCheckbox).not.toBeChecked();
    });

    it('should render recurring checkbox checked with initial rule', () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm initialRule={mockWeeklyRule} onChange={mockOnChange} />);
      
      const recurringCheckbox = screen.getByLabelText(/repeat event/i);
      expect(recurringCheckbox).toBeInTheDocument();
      expect(recurringCheckbox).toBeChecked();
    });

    it('should show recurring options when enabled', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      expect(screen.getByText('Repeat every')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /weekly/i, selected: true })).toBeInTheDocument();
      expect(screen.getByText('Ends')).toBeInTheDocument();
    });
  });

  describe('Frequency Selection', () => {
    it('should update frequency to DAILY', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      await user.selectOptions(screen.getByRole('combobox'), 'DAILY');
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'DAILY',
            interval: 1
          })
        );
      });
    });

    it('should update frequency to MONTHLY', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      await user.selectOptions(screen.getByRole('combobox'), 'MONTHLY');
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'MONTHLY',
            interval: 1
          })
        );
      });
    });
  });

  describe('Weekly Options', () => {
    it('should show weekday selector for weekly frequency', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      expect(screen.getByText('Repeat on')).toBeInTheDocument();
      expect(screen.getByLabelText('Mon')).toBeInTheDocument();
      expect(screen.getByLabelText('Wed')).toBeInTheDocument();
      expect(screen.getByLabelText('Fri')).toBeInTheDocument();
    });

    it('should select weekdays', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      await user.click(screen.getByLabelText('Mon'));
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'WEEKLY',
            days_of_week: '[1]'
          })
        );
      });
    });
  });

  describe('End Options', () => {
    it('should select never ending by default', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      const neverRadio = screen.getByLabelText(/never/i);
      expect(neverRadio).toBeChecked();
    });

    it('should select end after occurrences', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      await user.click(screen.getByLabelText(/after/i));
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            end_occurrences: 10,
            end_date: undefined
          })
        );
      });
    });

    it('should select end on date', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      await user.click(screen.getByLabelText(/on date/i));
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            end_date: expect.any(String),
            end_occurrences: undefined
          })
        );
      });
    });
  });

  describe('Callback Handling', () => {
    it('should call onChange when recurring is enabled', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'WEEKLY',
            interval: 1
          })
        );
      });
    });

    it('should call onChange with undefined when recurring is disabled', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm initialRule={mockWeeklyRule} onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat event/i));
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      expect(screen.getByText('Repeat every')).toBeInTheDocument();
      expect(screen.getByLabelText(/never/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/after/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/on date/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/repeat this event/i));
      
      await user.keyboard('{Space}');
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid changes efficiently', async () => {
      const mockOnChange = jest.fn();

      render(<RecurringForm onChange={mockOnChange} />);
      
      await user.click(screen.getByLabelText(/repeat this event/i));
      
      const start = performance.now();
      
      const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY'];
      for (const freq of frequencies) {
        await user.selectOptions(screen.getByRole('combobox'), freq);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });
});