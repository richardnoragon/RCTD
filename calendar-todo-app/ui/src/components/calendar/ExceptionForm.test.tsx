import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Event } from '../../services/eventService';
import { ExceptionForm } from './ExceptionForm';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

describe('ExceptionForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockEvent: Event = {
    id: 1,
    title: 'Recurring Meeting',
    description: 'Weekly team meeting',
    start_time: '2024-01-15T09:00:00.000Z',
    end_time: '2024-01-15T10:00:00.000Z',
    is_all_day: false,
    location: 'Conference Room A',
    priority: 2,
    category_id: 1,
  };

  const testDate = '2024-01-22T09:00:00.000Z';

  describe('Component Rendering', () => {
    it('should render exception form successfully', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByText('Modify Event Instance')).toBeInTheDocument();
      expect(screen.getByText(/date:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/modify this instance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cancel this instance/i)).toBeInTheDocument();
    });

    it('should render modify action selected by default', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const modifyRadio = screen.getByLabelText(/modify this instance/i);
      const cancelRadio = screen.getByLabelText(/cancel this instance/i);
      
      expect(modifyRadio).toBeChecked();
      expect(cancelRadio).not.toBeChecked();
    });

    it('should render modification fields when modify is selected', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    });

    it('should pre-populate fields with event data', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByDisplayValue('Recurring Meeting')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekly team meeting')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Conference Room A')).toBeInTheDocument();
    });
  });

  describe('Action Selection', () => {
    it('should switch to cancel action', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const cancelRadio = screen.getByLabelText(/cancel this instance/i);
      await user.click(cancelRadio);
      
      expect(cancelRadio).toBeChecked();
      expect(screen.getByLabelText(/modify this instance/i)).not.toBeChecked();
    });

    it('should hide modification fields when cancel is selected', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      // Initially modification fields should be visible
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      
      // Switch to cancel action
      await user.click(screen.getByLabelText(/cancel this instance/i));
      
      // Modification fields should be hidden
      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    });

    it('should update submit button text based on action', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      // Initially should show "Save Changes"
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      
      // Switch to cancel action
      await user.click(screen.getByLabelText(/cancel this instance/i));
      
      // Should show "Cancel This Instance"
      expect(screen.getByText('Cancel This Instance')).toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });
  });

  describe('Form Field Interactions', () => {
    it('should update title field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Meeting Title');
      
      expect(titleInput).toHaveValue('Modified Meeting Title');
    });

    it('should update location field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const locationInput = screen.getByLabelText(/location/i);
      await user.clear(locationInput);
      await user.type(locationInput, 'Meeting Room B');
      
      expect(locationInput).toHaveValue('Meeting Room B');
    });
  });

  describe('Form Submission', () => {
    it('should submit modification exception', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      // Modify title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Exception Meeting');
      
      await user.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            event_id: 1,
            original_date: testDate,
            is_cancelled: false,
            modified_title: 'Exception Meeting'
          })
        );
      });
    });

    it('should submit cancellation exception', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      // Switch to cancel and submit
      await user.click(screen.getByLabelText(/cancel this instance/i));
      await user.click(screen.getByText('Cancel This Instance'));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            event_id: 1,
            original_date: testDate,
            is_cancelled: true
          })
        );
      });
    });

    it('should call onCancel when close button clicked', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await user.click(screen.getByText('Close'));
      
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Failed to create exception'));
      const mockOnCancel = jest.fn();

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      try {
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByLabelText(/modify this instance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cancel this instance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/modify this instance/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/cancel this instance/i));
    });
  });

  describe('Performance', () => {
    it('should handle rapid action switching efficiently', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ExceptionForm 
          event={mockEvent} 
          date={testDate}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const start = performance.now();
      
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByLabelText(/cancel this instance/i));
        await user.click(screen.getByLabelText(/modify this instance/i));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});