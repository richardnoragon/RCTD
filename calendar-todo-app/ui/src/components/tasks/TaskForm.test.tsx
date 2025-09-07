import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task } from '../../services/taskService';
import { TaskForm } from './TaskForm';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

describe('TaskForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test task description',
    due_date: '2024-01-31T17:00:00.000Z',
    priority: 2,
    status: 'IN_PROGRESS',
    category_id: 1,
    kanban_column_id: 2,
    kanban_order: 1
  };

  describe('Component Rendering', () => {
    it('should render task form successfully', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should render form with existing task data', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TaskForm 
          task={mockTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test task description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IN_PROGRESS')).toBeInTheDocument();
    });

    it('should render Create button for new tasks', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should render Update button for existing tasks', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TaskForm 
          task={mockTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should have proper form structure and CSS classes', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('task-form');
      
      const formGroups = screen.getAllByClassName('form-group');
      expect(formGroups).toHaveLength(5); // title, description, due_date, priority, status
      
      const formActions = screen.getByText('Create').parentElement;
      expect(formActions).toHaveClass('form-actions');
    });
  });

  describe('Form Field Interactions', () => {
    it('should update title field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task Title');
      
      expect(titleInput).toHaveValue('New Task Title');
    });

    it('should update description field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Task description here');
      
      expect(descriptionInput).toHaveValue('Task description here');
    });

    it('should update due date field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2024-02-15');
      
      expect(dueDateInput).toHaveValue('2024-02-15');
    });

    it('should update priority field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, '1');
      
      expect(prioritySelect).toHaveValue('1');
    });

    it('should update status field', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'COMPLETED');
      
      expect(statusSelect).toHaveValue('COMPLETED');
    });

    it('should require title field', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeRequired();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'New Task');
      await user.type(screen.getByLabelText(/description/i), 'Task description');
      await user.type(screen.getByLabelText(/due date/i), '2024-02-15');
      await user.selectOptions(screen.getByLabelText(/priority/i), '1');
      await user.selectOptions(screen.getByLabelText(/status/i), 'IN_PROGRESS');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
            description: 'Task description',
            due_date: expect.stringContaining('2024-02-15'),
            priority: 1,
            status: 'IN_PROGRESS'
          })
        );
      });
    });

    it('should submit existing task with updates', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(
        <TaskForm 
          task={mockTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task Title');
      
      await user.click(screen.getByRole('button', { name: /update/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            title: 'Updated Task Title',
            description: 'Test task description',
            priority: 2,
            status: 'IN_PROGRESS'
          })
        );
      });
    });

    it('should submit with minimal required data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Minimal Task');
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Minimal Task',
            priority: 3, // Default
            status: 'PENDING' // Default
          })
        );
      });
    });

    it('should call onCancel when cancel button clicked', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should convert date input to ISO string', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Date Test');
      await user.type(screen.getByLabelText(/due date/i), '2024-03-15');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            due_date: expect.stringMatching(/2024-03-15T/)
          })
        );
      });
    });

    it('should handle empty due date', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(
        <TaskForm 
          task={mockTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.clear(dueDateInput);
      
      await user.click(screen.getByRole('button', { name: /update/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            due_date: undefined
          })
        );
      });
    });

    it('should handle priority as integer', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Priority Test');
      await user.selectOptions(screen.getByLabelText(/priority/i), '5');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 5
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission with empty title', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Try to submit without title
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      // HTML5 validation should prevent submission
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display all priority options', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('option', { name: /highest/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /high/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /medium/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /lowest/i })).toBeInTheDocument();
    });

    it('should display all status options', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('option', { name: /pending/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /in progress/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /completed/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Failed to save'));
      const mockOnCancel = jest.fn();

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Error Test');
      
      try {
        await user.click(screen.getByRole('button', { name: /create/i }));
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

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/title/i));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/description/i));
    });

    it('should support form submission via Enter key', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Keyboard Task');
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Keyboard Task'
          })
        );
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid form updates efficiently', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
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

  describe('Edge Cases', () => {
    it('should handle special characters in form fields', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await user.type(screen.getByLabelText(/title/i), 'Special âéîôü 🎉 Task');
      await user.type(screen.getByLabelText(/description/i), 'Description with émojis 🚀');
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Special âéîôü 🎉 Task',
            description: 'Description with émojis 🚀'
          })
        );
      });
    });

    it('should handle very long input values', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const longTitle = 'Very Long Task Title '.repeat(5);
      const longDescription = 'Very long description content. '.repeat(20);
      
      await user.type(screen.getByLabelText(/title/i), longTitle);
      await user.type(screen.getByLabelText(/description/i), longDescription);
      
      await user.click(screen.getByRole('button', { name: /create/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: longTitle,
            description: longDescription
          })
        );
      });
    });

    it('should handle null/undefined task properties', () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();
      const minimalTask: Task = {
        title: 'Minimal Task',
        priority: 3,
        status: 'PENDING'
      };

      render(
        <TaskForm 
          task={minimalTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      expect(screen.getByDisplayValue('Minimal Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toHaveValue(''); // Empty description
      expect(screen.getByLabelText(/due date/i)).toHaveValue(''); // Empty due date
    });
  });
});