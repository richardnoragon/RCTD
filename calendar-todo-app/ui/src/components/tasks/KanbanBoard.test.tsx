import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanColumn } from '../../services/kanbanService';
import { Task } from '../../services/taskService';
import { KanbanBoard } from './KanbanBoard';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: function MockDragDropContext(props: any) {
    return (
      <div data-testid="drag-drop-context">
        {props.children}
        <button 
          data-testid="simulate-drag" 
          onClick={() => props.onDragEnd && props.onDragEnd({
            source: { droppableId: '1', index: 0 },
            destination: { droppableId: '2', index: 1 },
            draggableId: 'task-1'
          })}
        >
          Simulate Drag
        </button>
      </div>
    );
  },
  Droppable: function MockDroppable(props: any) {
    return (
      <div data-testid={`droppable-${props.droppableId}`}>
        {props.children({
          innerRef: () => {},
          droppableProps: {},
          placeholder: <div data-testid="placeholder" />
        })}
      </div>
    );
  },
  Draggable: function MockDraggable(props: any) {
    return (
      <div data-testid={`draggable-${props.draggableId}`}>
        {props.children({
          innerRef: () => {},
          draggableProps: {},
          dragHandleProps: {}
        })}
      </div>
    );
  }
}));

// Mock TaskCard component
jest.mock('./TaskCard', () => {
  return {
    TaskCard: function MockTaskCard(props: any) {
      return (
        <div data-testid={`task-card-${props.task.id}`} className="task-card">
          <span data-testid="task-title">{props.task.title}</span>
          <span data-testid="task-status">{props.task.status}</span>
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

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn()
});

describe('KanbanBoard Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    // Setup default mock responses
    (globalThis as any).setMockResponse('get_kanban_columns', []);
    (globalThis as any).setMockResponse('create_kanban_column', 1);
    (globalThis as any).setMockResponse('delete_kanban_column', undefined);
  });

  const mockColumns: KanbanColumn[] = [
    { id: 1, name: 'To Do', column_order: 0 },
    { id: 2, name: 'In Progress', column_order: 1 },
    { id: 3, name: 'Done', column_order: 2 }
  ];

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'First task',
      priority: 2,
      status: 'TODO',
      kanban_column_id: 1,
      kanban_order: 0
    },
    {
      id: 2,
      title: 'Task 2', 
      description: 'Second task',
      priority: 1,
      status: 'IN_PROGRESS',
      kanban_column_id: 2,
      kanban_order: 0
    }
  ];

  describe('Component Rendering', () => {
    it('should render kanban board successfully', () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      expect(screen.getByText('Add Column')).toBeInTheDocument();
    });

    it('should render columns when loaded', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('To Do')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('should render tasks in appropriate columns', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      });
    });
  });

  describe('Column Management', () => {
    it('should show add column form when button clicked', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Add Column'));
      
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should create new column successfully', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Add Column'));
      await user.type(screen.getByPlaceholderText('Column name'), 'Review');
      await user.click(screen.getByText('Save'));
      
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith(
          'create_kanban_column',
          expect.objectContaining({
            column: expect.objectContaining({
              name: 'Review',
              column_order: 0
            })
          })
        );
      });
    });

    it('should cancel column creation', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.click(screen.getByText('Add Column'));
      await user.type(screen.getByPlaceholderText('Column name'), 'Test Column');
      await user.click(screen.getByText('Cancel'));
      
      expect(screen.getByText('Add Column')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Column name')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag and drop between columns', async () => {
      const mockOnTaskUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('simulate-drag')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('simulate-drag'));
      
      await waitFor(() => {
        expect(mockOnTaskUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            kanban_column_id: 2,
            kanban_order: 1
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle column loading errors gracefully', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockError('get_kanban_columns', 'Failed to load columns');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load Kanban columns:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Task Integration', () => {
    it('should pass correct props to TaskCard components', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByTestId('edit-task-1')).toBeInTheDocument();
      });
    });

    it('should handle task updates from TaskCard', async () => {
      const mockOnTaskUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnTaskDelete = jest.fn();

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-task-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-task-1'));
      
      expect(mockOnTaskUpdate).toHaveBeenCalledWith(mockTasks[0]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      expect(screen.getByRole('button', { name: /add column/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      render(
        <KanbanBoard 
          tasks={mockTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Add Column'));
    });
  });

  describe('Performance', () => {
    it('should handle large task lists efficiently', async () => {
      const mockOnTaskUpdate = jest.fn();
      const mockOnTaskDelete = jest.fn();

      const largeTasks: Task[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        priority: (i % 3) + 1,
        status: 'TODO',
        kanban_column_id: (i % 3) + 1,
        kanban_order: i
      }));

      (globalThis as any).setMockResponse('get_kanban_columns', mockColumns);

      const start = performance.now();
      
      render(
        <KanbanBoard 
          tasks={largeTasks} 
          onTaskUpdate={mockOnTaskUpdate} 
          onTaskDelete={mockOnTaskDelete} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });
});