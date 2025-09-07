import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task } from '../../services/taskService';
import { TaskCard } from './TaskCard';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock TaskForm component
jest.mock('./TaskForm', () => {
  return {
    TaskForm: function MockTaskForm(props: any) {
      return (
        <div data-testid="task-form">
          <input 
            data-testid="task-form-title" 
            defaultValue={props.task?.title || ''}
            onChange={(e) => {
              if (props.onSubmit) {
                const updatedTask = { ...props.task, title: (e.target as HTMLInputElement).value };
                props.onSubmit(updatedTask);
              }
            }}
          />
          <button 
            data-testid="save-task-button" 
            onClick={() => props.onSubmit && props.onSubmit(props.task)}
          >
            Save Task
          </button>
          <button 
            data-testid="cancel-task-button" 
            onClick={props.onCancel}
          >
            Cancel
          </button>
        </div>
      );
    }
  };
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn()
});

describe('TaskCard Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    // Setup default mock responses
    (globalThis as any).setMockResponse('update_task_status', undefined);
  });

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test task description',
    due_date: '2024-01-31T17:00:00.000Z',
    priority: 2,
    status: 'TODO',
    category_id: 1,
    kanban_column_id: 1,
    kanban_order: 0
  };

  const mockCompletedTask: Task = {
    ...mockTask,
    id: 2,
    title: 'Completed Task',
    status: 'COMPLETED',
    completed_at: '2024-01-15T16:30:00.000Z'
  };

  describe('Component Rendering', () => {
    it('should render task card successfully', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test task description')).toBeInTheDocument();
      expect(screen.getByText(/due:/i)).toBeInTheDocument();
      expect(screen.getByText('Priority: 2')).toBeInTheDocument();
      expect(screen.getByText('TODO')).toBeInTheDocument();
    });

    it('should render task card with minimal data', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const minimalTask: Task = {
        id: 3,
        title: 'Minimal Task',
        priority: 3,
        status: 'TODO'
      };

      render(
        <TaskCard 
          task={minimalTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
      expect(screen.getByText('Priority: 3')).toBeInTheDocument();
      expect(screen.getByText('TODO')).toBeInTheDocument();
      expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
    });

    it('should render task checkbox for status', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render completed task with checkbox checked', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockCompletedTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      
      const taskTitle = screen.getByText('Completed Task');
      expect(taskTitle).toHaveStyle('text-decoration: line-through');
    });

    it('should render edit and delete buttons', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should have proper CSS classes and structure', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const taskCard = screen.getByText('Test Task').closest('.task-card');
      expect(taskCard).toBeInTheDocument();
      expect(taskCard).toHaveStyle('border-left: 4px solid #ff8800'); // Priority 2 = orange
      
      expect(screen.getByText('Test Task').closest('.task-card-title')).toBeInTheDocument();
      expect(screen.getByText('Edit').closest('.task-card-actions')).toBeInTheDocument();
      expect(screen.getByText('Priority: 2').closest('.task-card-footer')).toBeInTheDocument();
    });

    it('should display priority colors correctly', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      const priorities = [
        { priority: 1, color: '#ff4444' }, // Highest - Red
        { priority: 2, color: '#ff8800' }, // High - Orange
        { priority: 3, color: '#ffbb33' }, // Medium - Yellow
        { priority: 4, color: '#00C851' }, // Low - Light Green
        { priority: 5, color: '#33b5e5' }, // Lowest - Blue
      ];

      priorities.forEach(({ priority, color }) => {
        const { unmount } = render(
          <TaskCard 
            task={{ ...mockTask, priority }} 
            onUpdate={mockOnUpdate} 
            onDelete={mockOnDelete} 
          />
        );
        
        const taskCard = screen.getByText('Test Task').closest('.task-card');
        expect(taskCard).toHaveStyle(`border-left: 4px solid ${color}`);
        
        unmount();
      });
    });
  });

  describe('User Interactions', () => {
    it('should show edit form when edit button clicked', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Edit'));
      
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
      expect(screen.getByTestId('task-form-title')).toBeInTheDocument();
      expect(screen.getByTestId('save-task-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-task-button')).toBeInTheDocument();
    });

    it('should hide task card when edit form is shown', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Edit'));
      
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('should handle task form submission', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByTestId('save-task-button'));
      
      expect(mockOnUpdate).toHaveBeenCalledWith(mockTask);
    });

    it('should handle task form cancellation', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Edit'));
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('cancel-task-button'));
      
      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should handle delete with confirmation', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn().mockResolvedValue(undefined);

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Delete'));
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    it('should not delete when confirmation denied', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      (window.confirm as jest.Mock).mockReturnValue(false);

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      await user.click(screen.getByText('Delete'));
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Status Management', () => {
    it('should toggle task status from TODO to COMPLETED', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'update_task_status',
          expect.objectContaining({
            id: 1,
            status: 'COMPLETED'
          })
        );
      });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: 'COMPLETED'
        })
      );
    });

    it('should toggle task status from COMPLETED to PENDING', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockCompletedTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'update_task_status',
          expect.objectContaining({
            id: 2,
            status: 'PENDING'
          })
        );
      });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          status: 'PENDING'
        })
      );
    });

    it('should handle status update errors gracefully', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      (globalThis as any).setMockError('update_task_status', 'Failed to update status');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update task status:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Date Formatting', () => {
    it('should format due date correctly', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText(/due:/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/31\/2024/)).toBeInTheDocument(); // Formatted date
    });

    it('should not show due date when not provided', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const taskWithoutDueDate = { ...mockTask, due_date: undefined };

      render(
        <TaskCard 
          task={taskWithoutDueDate} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
    });

    it('should handle invalid due dates gracefully', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const taskWithInvalidDate = { ...mockTask, due_date: 'invalid-date' };

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskCard 
          task={taskWithInvalidDate} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      // Should not crash with invalid date
      expect(screen.getByText('Test Task')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('checkbox'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Edit'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Delete'));
    });

    it('should support keyboard activation of checkbox', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      
      await user.keyboard('{Space}');
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'update_task_status',
          expect.any(Object)
        );
      });
    });
  });

  describe('Visual Design', () => {
    it('should apply correct priority border colors', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      const priorityTests = [
        { priority: 1, expectedColor: '#ff4444' }, // Highest - Red
        { priority: 2, expectedColor: '#ff8800' }, // High - Orange  
        { priority: 3, expectedColor: '#ffbb33' }, // Medium - Yellow
        { priority: 4, expectedColor: '#00C851' }, // Low - Light Green
        { priority: 5, expectedColor: '#33b5e5' }, // Lowest - Blue
      ];

      priorityTests.forEach(({ priority, expectedColor }) => {
        const { unmount } = render(
          <TaskCard 
            task={{ ...mockTask, priority }} 
            onUpdate={mockOnUpdate} 
            onDelete={mockOnDelete} 
          />
        );
        
        const taskCard = screen.getByText('Test Task').closest('.task-card');
        expect(taskCard).toHaveStyle(`border-left: 4px solid ${expectedColor}`);
        
        unmount();
      });
    });

    it('should apply strikethrough for completed tasks', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockCompletedTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const taskTitle = screen.getByText('Completed Task');
      expect(taskTitle).toHaveStyle('text-decoration: line-through');
    });

    it('should not apply strikethrough for non-completed tasks', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const taskTitle = screen.getByText('Test Task');
      expect(taskTitle).toHaveStyle('text-decoration: none');
    });
  });

  describe('Performance', () => {
    it('should handle rapid status changes efficiently', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      
      const start = performance.now();
      
      // Rapid status changes
      for (let i = 0; i < 5; i++) {
        await user.click(checkbox);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
      expect(mockOnUpdate).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid edit form open/close efficiently', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <TaskCard 
          task={mockTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      const start = performance.now();
      
      // Rapid edit form operations
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Edit'));
        await user.click(screen.getByTestId('cancel-task-button'));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1500); // 1.5 seconds
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks without description', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const taskWithoutDescription = { ...mockTask, description: undefined };

      render(
        <TaskCard 
          task={taskWithoutDescription} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText(/test task description/i)).not.toBeInTheDocument();
    });

    it('should handle tasks with very long titles', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const longTitle = 'Very Long Task Title '.repeat(10);
      const taskWithLongTitle = { ...mockTask, title: longTitle };

      render(
        <TaskCard 
          task={taskWithLongTitle} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle tasks with special characters', () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const specialTask = {
        ...mockTask,
        title: 'Special âéîôü Task 🎉',
        description: 'Description with émojis 🚀 and symbols & characters'
      };

      render(
        <TaskCard 
          task={specialTask} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      expect(screen.getByText('Special âéîôü Task 🎉')).toBeInTheDocument();
      expect(screen.getByText('Description with émojis 🚀 and symbols & characters')).toBeInTheDocument();
    });

    it('should handle missing task ID gracefully', async () => {
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();
      const taskWithoutId = { ...mockTask, id: undefined };

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskCard 
          task={taskWithoutId as Task} 
          onUpdate={mockOnUpdate} 
          onDelete={mockOnDelete} 
        />
      );
      
      // Should still render the task card
      expect(screen.getByText('Test Task')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });
});