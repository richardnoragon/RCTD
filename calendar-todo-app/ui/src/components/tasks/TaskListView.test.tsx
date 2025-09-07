import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task } from '../../services/taskService';
import { TaskListView } from './TaskListView';

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
        <div data-testid="task-form-modal">
          <label htmlFor="task-form-title">Task Title</label>
          <input 
            id="task-form-title"
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

// Mock TaskCard component
jest.mock('./TaskCard', () => {
  return {
    TaskCard: function MockTaskCard(props: any) {
      return (
        <div data-testid={`task-card-${props.task.id}`} className="task-card">
          <span data-testid="task-title">{props.task.title}</span>
          <span data-testid="task-status">{props.task.status}</span>
          <span data-testid="task-priority">Priority: {props.task.priority}</span>
          {props.task.due_date && (
            <span data-testid="task-due-date">Due: {props.task.due_date}</span>
          )}
          <button 
            data-testid={`edit-task-${props.task.id}`}
            onClick={() => props.onUpdate && props.onUpdate(props.task)}
          >
            Edit
          </button>
          <button 
            data-testid={`delete-task-${props.task.id}`}
            onClick={() => props.onDelete && props.onDelete(props.task.id)}
          >
            Delete
          </button>
        </div>
      );
    }
  };
});

describe('TaskListView Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    
    // Setup default mock responses
    (globalThis as any).setMockResponse('get_tasks', []);
    (globalThis as any).setMockResponse('create_task', 1);
  });

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'High Priority Task',
      description: 'Urgent task to complete',
      due_date: '2024-01-15',
      priority: 1,
      status: 'PENDING'
    },
    {
      id: 2,
      title: 'Completed Task',
      description: 'Already finished task',
      due_date: '2024-01-10',
      priority: 3,
      status: 'COMPLETED'
    },
    {
      id: 3,
      title: 'In Progress Task',
      description: 'Currently working on this',
      due_date: '2024-01-20',
      priority: 2,
      status: 'IN_PROGRESS'
    },
    {
      id: 4,
      title: 'Low Priority Task',
      description: 'Can be done later',
      priority: 4,
      status: 'PENDING'
    },
    {
      id: 5,
      title: 'No Due Date Task',
      description: 'Task without specific deadline',
      priority: 2,
      status: 'PENDING'
    }
  ];

  const mockOnTaskUpdate = jest.fn().mockResolvedValue(undefined);
  const mockOnTaskDelete = jest.fn().mockResolvedValue(undefined);

  describe('Component Rendering', () => {
    it('should render task list view with filters and task list', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Check filter controls
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument();
      
      // Check create button
      expect(screen.getByText('Create Task')).toBeInTheDocument();
      
      // Wait for tasks to load
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_tasks');
      });
    });

    it('should display filter controls (search, status, priority)', () => {
      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Search input
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      // Status and priority filters
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
      
      // Check option values
      expect(screen.getByRole('option', { name: 'All Statuses' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'All Priorities' })).toBeInTheDocument();
    });

    it('should show create task button', () => {
      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter tasks by search term (title and description)', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Search by title
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'High Priority');
      
      // Should show only matching tasks
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument();
    });

    it('should filter tasks by status (All/Pending/In Progress/Completed)', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Filter by COMPLETED status
      const statusFilter = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusFilter, 'COMPLETED');
      
      // Should show only completed tasks
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument();
    });

    it('should filter tasks by priority (All/Highest through Lowest)', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Filter by priority 1 (Highest)
      const priorityFilter = screen.getByDisplayValue('All Priorities');
      await user.selectOptions(priorityFilter, '1');
      
      // Should show only priority 1 tasks
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument();
    });

    it('should combine multiple filters simultaneously', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Apply both status and priority filters
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const priorityFilter = screen.getByDisplayValue('All Priorities');
      
      await user.selectOptions(statusFilter, 'PENDING');
      await user.selectOptions(priorityFilter, '2');
      
      // Should show only tasks matching both criteria (task 5)
      expect(screen.getByTestId('task-card-5')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument(); // Priority 1
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument(); // COMPLETED
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument(); // IN_PROGRESS
    });

    it('should clear filters and show all tasks', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Apply filter first
      const statusFilter = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusFilter, 'COMPLETED');
      
      // Only completed task should show
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument();
      
      // Clear filter
      await user.selectOptions(statusFilter, '');
      
      // All tasks should show again
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-3')).toBeInTheDocument();
    });
  });

  describe('Task Display & Sorting', () => {
    it('should sort tasks by due date first, then priority', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const taskCards = screen.getAllByTestId(/task-card-/);
        expect(taskCards).toHaveLength(5);
      });

      // Tasks should be sorted by due date (earliest first), then priority
      const taskCards = screen.getAllByTestId(/task-card-/);
      
      // Task 2 has earliest due date (2024-01-10)
      expect(taskCards[0]).toHaveAttribute('data-testid', 'task-card-2');
      
      // Task 1 has next due date (2024-01-15)  
      expect(taskCards[1]).toHaveAttribute('data-testid', 'task-card-1');
      
      // Task 3 has later due date (2024-01-20)
      expect(taskCards[2]).toHaveAttribute('data-testid', 'task-card-3');
    });

    it('should display filtered and sorted task list', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Filter by PENDING status
      const statusFilter = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusFilter, 'PENDING');
      
      // Should show pending tasks in sorted order
      const visibleTasks = screen.getAllByTestId(/task-card-/);
      expect(visibleTasks.length).toBeGreaterThan(0);
      
      // All visible tasks should be PENDING
      visibleTasks.forEach(taskCard => {
        const statusElement = taskCard.querySelector('[data-testid="task-status"]');
        expect(statusElement?.textContent).toBe('PENDING');
      });
    });

    it('should handle empty states (no tasks, no matches)', async () => {
      // Test no tasks scenario
      (globalThis as any).setMockResponse('get_tasks', []);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('No tasks yet. Create one!')).toBeInTheDocument();
      });

      // Test no matches scenario - reload with tasks and search for non-existent
      (globalThis as any).setMockResponse('get_tasks', mockTasks);
      
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'nonexistent task');
      
      await waitFor(() => {
        expect(screen.getByText('No tasks match your filters')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should create new task via modal form', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Click create task button
      await user.click(screen.getByText('Create Task'));
      
      // Form should open
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      
      // Fill and submit form
      const titleInput = screen.getByTestId('task-form-title');
      await user.type(titleInput, 'New List Task');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'create_task',
          expect.objectContaining({
            task: expect.objectContaining({
              title: 'New List Task'
            })
          })
        );
      });
    });

    it('should update search input and trigger filtering', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      
      // Type search term
      await user.type(searchInput, 'Completed');
      
      // Should filter to matching tasks
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument();
      
      // Clear search
      await user.clear(searchInput);
      
      // All tasks should show again
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
    });

    it('should change filter dropdowns and update results', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      // Change status filter
      const statusFilter = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusFilter, 'IN_PROGRESS');
      
      // Should show only in-progress tasks
      expect(screen.getByTestId('task-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
      
      // Reset status, change priority filter
      await user.selectOptions(statusFilter, '');
      const priorityFilter = screen.getByDisplayValue('All Priorities');
      await user.selectOptions(priorityFilter, '1');
      
      // Should show only priority 1 tasks
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
    });
  });

  describe('Sorting Logic', () => {
    it('should prioritize tasks with due dates over those without', async () => {
      const mixedTasks: Task[] = [
        {
          id: 1,
          title: 'No Due Date',
          priority: 1,
          status: 'PENDING'
        },
        {
          id: 2,
          title: 'Has Due Date',
          due_date: '2024-01-15',
          priority: 3,
          status: 'PENDING'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', mixedTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const taskCards = screen.getAllByTestId(/task-card-/);
        
        // Task with due date should come first
        expect(taskCards[0]).toHaveAttribute('data-testid', 'task-card-2');
        expect(taskCards[1]).toHaveAttribute('data-testid', 'task-card-1');
      });
    });

    it('should sort by priority when due dates are equal or missing', async () => {
      const sameDateTasks: Task[] = [
        {
          id: 1,
          title: 'Low Priority',
          priority: 4,
          status: 'PENDING'
        },
        {
          id: 2,
          title: 'High Priority',
          priority: 1,
          status: 'PENDING'
        },
        {
          id: 3,
          title: 'Medium Priority',
          priority: 3,
          status: 'PENDING'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', sameDateTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const taskCards = screen.getAllByTestId(/task-card-/);
        
        // Should be sorted by priority (1, 3, 4)
        expect(taskCards[0]).toHaveAttribute('data-testid', 'task-card-2'); // Priority 1
        expect(taskCards[1]).toHaveAttribute('data-testid', 'task-card-3'); // Priority 3
        expect(taskCards[2]).toHaveAttribute('data-testid', 'task-card-1'); // Priority 4
      });
    });

    it('should handle complex sorting scenarios', async () => {
      const complexTasks: Task[] = [
        {
          id: 1,
          title: 'Later Date, High Priority',
          due_date: '2024-01-20',
          priority: 1,
          status: 'PENDING'
        },
        {
          id: 2,
          title: 'Earlier Date, Low Priority',
          due_date: '2024-01-10',
          priority: 4,
          status: 'PENDING'
        },
        {
          id: 3,
          title: 'No Date, Highest Priority',
          priority: 1,
          status: 'PENDING'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', complexTasks);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const taskCards = screen.getAllByTestId(/task-card-/);
        
        // Due date tasks first (sorted by date), then no-date tasks (sorted by priority)
        expect(taskCards[0]).toHaveAttribute('data-testid', 'task-card-2'); // 2024-01-10
        expect(taskCards[1]).toHaveAttribute('data-testid', 'task-card-1'); // 2024-01-20
        expect(taskCards[2]).toHaveAttribute('data-testid', 'task-card-3'); // No date, priority 1
      });
    });
  });

  describe('Task Form Integration', () => {
    it('should open task form for creating new task', async () => {
      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Create Task'));
      
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('task-form-title')).toBeInTheDocument();
      expect(screen.getByTestId('save-task-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-task-button')).toBeInTheDocument();
    });

    it('should close task form on cancel', async () => {
      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Create Task'));
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('cancel-task-button'));
      expect(screen.queryByTestId('task-form-modal')).not.toBeInTheDocument();
    });

    it('should handle task creation and reload list', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Create Task'));
      
      const titleInput = screen.getByTestId('task-form-title');
      await user.type(titleInput, 'New Task from List');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'create_task',
          expect.objectContaining({
            task: expect.objectContaining({
              title: 'New Task from List'
            })
          })
        );
      });

      // Should reload tasks and close form
      expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_tasks');
    });
  });

  describe('Error Handling', () => {
    it('should handle task loading errors gracefully', async () => {
      (globalThis as any).setMockError('get_tasks', 'Failed to load tasks');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <TaskListView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load tasks:', expect.any(Error));
      });

      // Component should still render
      expect(screen.getByText('Create Task')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should handle task creation errors gracefully', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);
      (globalThis as any).setMockError('create_task', 'Failed to create task');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <TaskListView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      await user.click(screen.getByText('Create Task'));
      
      const titleInput = screen.getByTestId('task-form-title');
      await user.type(titleInput, 'Error Task');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to create task:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and keyboard navigation', async () => {
      const { container } = render(
        <TaskListView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      // Check accessible form elements
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      
      // Test keyboard navigation
      await user.tab();
      expect(document.activeElement).toBe(screen.getByPlaceholderText('Search tasks...'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByDisplayValue('All Statuses'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByDisplayValue('All Priorities'));
    });

    it('should support keyboard interaction with filters', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue('All Statuses');
      statusFilter.focus();
      
      // Use keyboard to select option
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Should trigger filtering
      expect(statusFilter.value).not.toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle large task lists efficiently (50+ tasks)', async () => {
      const largeTasks: Task[] = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        due_date: i % 3 === 0 ? `2024-01-${(i % 28) + 1}` : undefined,
        priority: (i % 5) + 1,
        status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][i % 3]
      }));

      (globalThis as any).setMockResponse('get_tasks', largeTasks);

      const start = performance.now();
      
      const { container } = render(
        <TaskListView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000); // 3 seconds for 75 tasks
    });

    it('should handle rapid filter changes efficiently', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasks);

      const { container } = render(
        <TaskListView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      });

      const start = performance.now();
      
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const priorityFilter = screen.getByDisplayValue('All Priorities');
      
      // Rapid filter changes
      for (let i = 0; i < 5; i++) {
        await user.selectOptions(statusFilter, 'PENDING');
        await user.selectOptions(statusFilter, 'COMPLETED');
        await user.selectOptions(priorityFilter, '1');
        await user.selectOptions(priorityFilter, '');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });
});