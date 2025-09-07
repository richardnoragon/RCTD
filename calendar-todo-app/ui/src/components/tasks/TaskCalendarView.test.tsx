import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task } from '../../services/taskService';
import { TaskCalendarView } from './TaskCalendarView';

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
          <label htmlFor="task-form-due-date">Due Date</label>
          <input 
            id="task-form-due-date"
            data-testid="task-form-due-date" 
            defaultValue={props.task?.due_date || ''}
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

describe('TaskCalendarView Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    
    // Setup default mock responses
    (globalThis as any).setMockResponse('get_tasks', []);
    (globalThis as any).setMockResponse('create_task', 1);
    (globalThis as any).setMockResponse('update_task', undefined);
  });

  const mockTasksWithDates: Task[] = [
    {
      id: 1,
      title: 'Task on 15th',
      description: 'Task due on January 15th',
      due_date: '2024-01-15',
      priority: 1,
      status: 'PENDING'
    },
    {
      id: 2,
      title: 'Task on 20th',
      description: 'Task due on January 20th',
      due_date: '2024-01-20',
      priority: 3,
      status: 'COMPLETED'
    },
    {
      id: 3,
      title: 'High Priority Task',
      description: 'Urgent task on January 25th',
      due_date: '2024-01-25',
      priority: 2,
      status: 'IN_PROGRESS'
    },
    {
      id: 4,
      title: 'Task Without Date',
      description: 'Task without due date',
      priority: 4,
      status: 'PENDING'
    }
  ];

  const mockOnTaskUpdate = jest.fn().mockResolvedValue(undefined);
  const mockOnTaskDelete = jest.fn().mockResolvedValue(undefined);

  describe('Component Rendering', () => {
    it('should render calendar view successfully with header and grid', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      const { container } = render(
        <TaskCalendarView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      // Check calendar header elements
      expect(screen.getByText('Previous Month')).toBeInTheDocument();
      expect(screen.getByText('Next Month')).toBeInTheDocument();
      
      // Check calendar grid structure
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      
      // Wait for tasks to load
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_tasks');
      });
    });

    it('should display current month and year in header navigation', () => {
      const { container } = render(
        <TaskCalendarView
          onTaskUpdate={mockOnTaskUpdate}
          onTaskDelete={mockOnTaskDelete}
        />
      );
      
      const currentDate = new Date();
      const expectedMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      expect(screen.getByText(expectedMonth)).toBeInTheDocument();
    });

    it('should render weekday headers in correct order', () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should show calendar grid with 42 day cells (6 weeks)', () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const calendarDays = document.querySelectorAll('.calendar-day');
      expect(calendarDays).toHaveLength(42); // 6 weeks * 7 days
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to previous month and update display', async () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const currentDate = new Date();
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const expectedText = prevMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      await user.click(screen.getByText('Previous Month'));
      
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('should navigate to next month and update display', async () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
      const expectedText = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      await user.click(screen.getByText('Next Month'));
      
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('should handle rapid navigation efficiently', async () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const start = performance.now();
      
      // Rapid navigation
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('Next Month'));
        await user.click(screen.getByText('Previous Month'));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Task Integration & Display', () => {
    it('should load and display tasks on correct calendar dates', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_tasks');
      });

      // Tasks should appear on their respective dates
      await waitFor(() => {
        expect(screen.getByText('Task on 15th')).toBeInTheDocument();
        expect(screen.getByText('Task on 20th')).toBeInTheDocument();
        expect(screen.getByText('High Priority Task')).toBeInTheDocument();
      });
    });

    it('should render task indicators with priority colors', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const task1 = screen.getByText('Task on 15th');
        const task2 = screen.getByText('Task on 20th');
        const task3 = screen.getByText('High Priority Task');
        
        // Check priority color styling
        expect(task1).toHaveStyle('background-color: #ff4444'); // Priority 1 - Red
        expect(task2).toHaveStyle('background-color: #ffbb33'); // Priority 3 - Yellow
        expect(task3).toHaveStyle('background-color: #ff8800'); // Priority 2 - Orange
      });
    });

    it('should handle tasks without due dates gracefully', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        // Task without due date should not appear on calendar
        expect(screen.queryByText('Task Without Date')).not.toBeInTheDocument();
      });
    });

    it('should show multiple tasks per day with proper layout', async () => {
      const multipleTasks: Task[] = [
        {
          id: 1,
          title: 'Morning Task',
          due_date: '2024-01-15',
          priority: 1,
          status: 'PENDING'
        },
        {
          id: 2,
          title: 'Afternoon Task',
          due_date: '2024-01-15',
          priority: 2,
          status: 'IN_PROGRESS'
        },
        {
          id: 3,
          title: 'Evening Task',
          due_date: '2024-01-15',
          priority: 3,
          status: 'COMPLETED'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', multipleTasks);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Morning Task')).toBeInTheDocument();
        expect(screen.getByText('Afternoon Task')).toBeInTheDocument();
        expect(screen.getByText('Evening Task')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should click on date to create new task with pre-filled due date', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Click on a calendar day (day 15 for example)
      const dayCell = screen.getByText('15');
      await user.click(dayCell);
      
      // Task form should open with pre-filled due date
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('task-form-due-date')).toHaveValue('2024-01-15');
    });

    it('should click on task indicator to edit existing task', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Task on 15th')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Task on 15th'));
      
      // Task form should open with existing task data
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('task-form-title')).toHaveValue('Task on 15th');
    });

    it('should handle task form modal open/close operations', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Open modal by clicking date
      const dayCell = screen.getByText('15');
      await user.click(dayCell);
      
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      
      // Close modal by canceling
      await user.click(screen.getByTestId('cancel-task-button'));
      
      expect(screen.queryByTestId('task-form-modal')).not.toBeInTheDocument();
    });
  });

  describe('Task Management Operations', () => {
    it('should create new task and refresh calendar', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Click on date to open form
      await user.click(screen.getByText('15'));
      
      // Fill and submit form
      const titleInput = screen.getByTestId('task-form-title');
      await user.type(titleInput, 'New Calendar Task');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'create_task',
          expect.objectContaining({
            task: expect.objectContaining({
              title: 'New Calendar Task',
              due_date: '2024-01-15'
            })
          })
        );
      });

      // Should reload tasks after creation
      expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_tasks');
    });

    it('should update existing task and refresh calendar', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Task on 15th')).toBeInTheDocument();
      });

      // Click on task to edit
      await user.click(screen.getByText('Task on 15th'));
      
      // Update title and submit
      const titleInput = screen.getByTestId('task-form-title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Calendar Task');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'update_task',
          expect.objectContaining({
            task: expect.objectContaining({
              id: 1,
              title: 'Updated Calendar Task'
            })
          })
        );
      });
    });

    it('should handle task creation errors gracefully', async () => {
      (globalThis as any).setMockResponse('get_tasks', []);
      (globalThis as any).setMockError('create_task', 'Failed to create task');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('15'));
      
      const titleInput = screen.getByTestId('task-form-title');
      await user.type(titleInput, 'Error Task');
      
      await user.click(screen.getByTestId('save-task-button'));
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save task:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Calendar Grid Logic', () => {
    it('should display correct number of days for current month', () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const currentDate = new Date();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      // Check that all days of current month are present
      for (let i = 1; i <= daysInMonth; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should show previous and next month overflow days', () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const calendarDays = document.querySelectorAll('.calendar-day');
      const currentMonthDays = document.querySelectorAll('.current-month');
      const otherMonthDays = document.querySelectorAll('.other-month');
      
      expect(calendarDays).toHaveLength(42);
      expect(currentMonthDays.length + otherMonthDays.length).toBe(42);
    });

    it('should correctly identify current month vs other month days', () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      const currentMonthDays = document.querySelectorAll('.current-month');
      const otherMonthDays = document.querySelectorAll('.other-month');
      
      expect(currentMonthDays.length).toBeGreaterThan(0);
      expect(otherMonthDays.length).toBeGreaterThan(0);
      expect(currentMonthDays.length + otherMonthDays.length).toBe(42);
    });
  });

  describe('Priority Color System', () => {
    it('should apply correct priority colors to task indicators', async () => {
      const priorityTasks: Task[] = [
        { id: 1, title: 'P1 Task', due_date: '2024-01-15', priority: 1, status: 'PENDING' },
        { id: 2, title: 'P2 Task', due_date: '2024-01-16', priority: 2, status: 'PENDING' },
        { id: 3, title: 'P3 Task', due_date: '2024-01-17', priority: 3, status: 'PENDING' },
        { id: 4, title: 'P4 Task', due_date: '2024-01-18', priority: 4, status: 'PENDING' },
        { id: 5, title: 'P5 Task', due_date: '2024-01-19', priority: 5, status: 'PENDING' }
      ];

      (globalThis as any).setMockResponse('get_tasks', priorityTasks);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const p1Task = screen.getByText('P1 Task');
        const p2Task = screen.getByText('P2 Task');
        const p3Task = screen.getByText('P3 Task');
        const p4Task = screen.getByText('P4 Task');
        const p5Task = screen.getByText('P5 Task');
        
        expect(p1Task).toHaveStyle('background-color: #ff4444'); // Red
        expect(p2Task).toHaveStyle('background-color: #ff8800'); // Orange
        expect(p3Task).toHaveStyle('background-color: #ffbb33'); // Yellow
        expect(p4Task).toHaveStyle('background-color: #00C851'); // Green
        expect(p5Task).toHaveStyle('background-color: #33b5e5'); // Blue
      });
    });

    it('should apply completed task styling', async () => {
      const completedTasks: Task[] = [
        {
          id: 1,
          title: 'Completed Task',
          due_date: '2024-01-15',
          priority: 2,
          status: 'COMPLETED'
        },
        {
          id: 2,
          title: 'Pending Task',
          due_date: '2024-01-16',
          priority: 2,
          status: 'PENDING'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', completedTasks);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const completedTask = screen.getByText('Completed Task');
        const pendingTask = screen.getByText('Pending Task');
        
        expect(completedTask).toHaveClass('completed');
        expect(pendingTask).not.toHaveClass('completed');
      });
    });
  });

  describe('Event Handling', () => {
    it('should prevent event bubbling when clicking task indicators', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Task on 15th')).toBeInTheDocument();
      });

      // Click on task indicator should open task form, not date form
      await user.click(screen.getByText('Task on 15th'));
      
      expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('task-form-title')).toHaveValue('Task on 15th');
      
      // Should not create a new task template
      expect(screen.getByTestId('task-form-due-date')).toHaveValue('2024-01-15');
    });

    it('should handle edge case dates correctly (month boundaries)', async () => {
      // Test with January to ensure proper month boundary handling
      const boundaryTasks: Task[] = [
        {
          id: 1,
          title: 'End of December',
          due_date: '2023-12-31',
          priority: 1,
          status: 'PENDING'
        },
        {
          id: 2,
          title: 'Start of February',
          due_date: '2024-02-01',
          priority: 2,
          status: 'PENDING'
        }
      ];

      (globalThis as any).setMockResponse('get_tasks', boundaryTasks);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Navigate to January 2024
      await waitFor(() => {
        // Tasks from adjacent months should appear in overflow cells
        const calendarDays = document.querySelectorAll('.calendar-day');
        expect(calendarDays).toHaveLength(42);
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle task loading errors gracefully', async () => {
      (globalThis as any).setMockError('get_tasks', 'Failed to load tasks');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load tasks:', expect.any(Error));
      });

      // Calendar should still render despite error
      expect(screen.getByText('Previous Month')).toBeInTheDocument();
      expect(screen.getByText('Next Month')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and keyboard navigation', async () => {
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      // Navigation buttons should be accessible
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
      
      // Calendar days should be clickable
      const dayCell = screen.getByText('15');
      expect(dayCell).toBeInTheDocument();
      
      // Test keyboard navigation
      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Previous Month'));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Next Month'));
    });

    it('should provide proper task indicator tooltips', async () => {
      (globalThis as any).setMockResponse('get_tasks', mockTasksWithDates);

      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        const taskIndicator = screen.getByText('Task on 15th');
        expect(taskIndicator).toHaveAttribute('title', 'Task on 15th');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of tasks efficiently', async () => {
      const largeTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        due_date: `2024-01-${(i % 28) + 1}`,
        priority: (i % 5) + 1,
        status: i % 3 === 0 ? 'COMPLETED' : 'PENDING'
      }));

      (globalThis as any).setMockResponse('get_tasks', largeTasks);

      const start = performance.now();
      
      render(
        <TaskCalendarView 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000); // 3 seconds for 100 tasks
    });
  });
});