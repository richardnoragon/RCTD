import { Task, taskService } from './taskService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Task Service', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  describe('getTasks', () => {
    it('should fetch all tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Complete project proposal',
          description: 'Write and submit Q1 project proposal',
          due_date: '2023-01-31 17:00:00',
          priority: 1,
          status: 'TODO',
          category_id: 1,
          kanban_column_id: 1,
          kanban_order: 1,
        },
        {
          id: 2,
          title: 'Review documentation',
          description: 'Review and update project documentation',
          due_date: '2023-02-15 17:00:00',
          priority: 2,
          status: 'IN_PROGRESS',
          category_id: 2,
          kanban_column_id: 2,
          kanban_order: 1,
        },
      ];

      global.setMockResponse('get_tasks', mockTasks);

      const result = await taskService.getTasks();

      expect(result).toEqual(mockTasks);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Complete project proposal');
      expect(result[1].status).toBe('IN_PROGRESS');
    });

    it('should return empty array when no tasks exist', async () => {
      global.setMockResponse('get_tasks', []);

      const result = await taskService.getTasks();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle tasks with different statuses', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'TODO Task',
          priority: 3,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 1,
        },
        {
          id: 2,
          title: 'In Progress Task',
          priority: 2,
          status: 'IN_PROGRESS',
          kanban_column_id: 2,
          kanban_order: 1,
        },
        {
          id: 3,
          title: 'Completed Task',
          priority: 1,
          status: 'COMPLETED',
          kanban_column_id: 3,
          kanban_order: 1,
          completed_at: '2023-01-15 16:30:00',
        },
      ];

      global.setMockResponse('get_tasks', mockTasks);

      const result = await taskService.getTasks();

      expect(result).toHaveLength(3);
      expect(result.find(t => t.status === 'TODO')).toBeDefined();
      expect(result.find(t => t.status === 'IN_PROGRESS')).toBeDefined();
      expect(result.find(t => t.status === 'COMPLETED')).toBeDefined();
    });

    it('should handle service error', async () => {
      global.setMockError('get_tasks', 'Database connection failed');

      await expect(taskService.getTasks()).rejects.toThrow('Database connection failed');
    });

    it('should handle tasks with different priorities', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'High Priority Task',
          priority: 1,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 1,
        },
        {
          id: 2,
          title: 'Medium Priority Task',
          priority: 2,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 2,
        },
        {
          id: 3,
          title: 'Low Priority Task',
          priority: 3,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 3,
        },
      ];

      global.setMockResponse('get_tasks', mockTasks);

      const result = await taskService.getTasks();

      expect(result).toHaveLength(3);
      expect(result[0].priority).toBe(1);
      expect(result[1].priority).toBe(2);
      expect(result[2].priority).toBe(3);
    });
  });

  describe('getTasksInColumn', () => {
    it('should fetch tasks for specific column', async () => {
      const mockColumnTasks: Task[] = [
        {
          id: 1,
          title: 'Column Task 1',
          priority: 2,
          status: 'IN_PROGRESS',
          kanban_column_id: 2,
          kanban_order: 1,
        },
        {
          id: 2,
          title: 'Column Task 2',
          priority: 1,
          status: 'IN_PROGRESS',
          kanban_column_id: 2,
          kanban_order: 2,
        },
      ];

      global.setMockResponse('get_tasks_in_column', mockColumnTasks);

      const result = await taskService.getTasksInColumn(2);

      expect(result).toEqual(mockColumnTasks);
      expect(result).toHaveLength(2);
      expect(result.every(task => task.kanban_column_id === 2)).toBe(true);
    });

    it('should return empty array for column with no tasks', async () => {
      global.setMockResponse('get_tasks_in_column', []);

      const result = await taskService.getTasksInColumn(5);

      expect(result).toEqual([]);
    });

    it('should handle invalid column ID', async () => {
      global.setMockError('get_tasks_in_column', 'Invalid column ID');

      await expect(taskService.getTasksInColumn(-1)).rejects.toThrow('Invalid column ID');
    });

    it('should handle tasks ordered correctly', async () => {
      const mockOrderedTasks: Task[] = [
        {
          id: 1,
          title: 'First Task',
          priority: 3,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 1,
        },
        {
          id: 2,
          title: 'Second Task',
          priority: 2,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 2,
        },
        {
          id: 3,
          title: 'Third Task',
          priority: 1,
          status: 'TODO',
          kanban_column_id: 1,
          kanban_order: 3,
        },
      ];

      global.setMockResponse('get_tasks_in_column', mockOrderedTasks);

      const result = await taskService.getTasksInColumn(1);

      expect(result).toHaveLength(3);
      expect(result[0].kanban_order).toBe(1);
      expect(result[1].kanban_order).toBe(2);
      expect(result[2].kanban_order).toBe(3);
    });
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      const newTask: Task = {
        title: 'New Task',
        description: 'Task description',
        due_date: '2023-01-31 17:00:00',
        priority: 2,
        status: 'TODO',
        category_id: 1,
        kanban_column_id: 1,
        kanban_order: 1,
      };

      const mockTaskId = 123;
      global.setMockResponse('create_task', mockTaskId);

      const result = await taskService.createTask(newTask);

      expect(result).toBe(mockTaskId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should create task with minimal required fields', async () => {
      const minimalTask: Task = {
        title: 'Minimal Task',
        priority: 3,
        status: 'TODO',
      };

      const mockTaskId = 124;
      global.setMockResponse('create_task', mockTaskId);

      const result = await taskService.createTask(minimalTask);

      expect(result).toBe(mockTaskId);
    });

    it('should create urgent task', async () => {
      const urgentTask: Task = {
        title: 'Urgent Task',
        description: 'High priority urgent task',
        due_date: '2023-01-16 17:00:00',
        priority: 1,
        status: 'TODO',
        kanban_column_id: 1,
        kanban_order: 1,
      };

      const mockTaskId = 125;
      global.setMockResponse('create_task', mockTaskId);

      const result = await taskService.createTask(urgentTask);

      expect(result).toBe(mockTaskId);
    });

    it('should create completed task with timestamp', async () => {
      const completedTask: Task = {
        title: 'Completed Task',
        description: 'This task is already completed',
        priority: 2,
        status: 'COMPLETED',
        kanban_column_id: 3,
        kanban_order: 1,
        completed_at: '2023-01-14 16:30:00',
      };

      const mockTaskId = 126;
      global.setMockResponse('create_task', mockTaskId);

      const result = await taskService.createTask(completedTask);

      expect(result).toBe(mockTaskId);
    });

    it('should handle creation error', async () => {
      const invalidTask: Task = {
        title: '',
        priority: 2,
        status: 'INVALID_STATUS',
      };

      global.setMockError('create_task', 'Invalid task data');

      await expect(taskService.createTask(invalidTask)).rejects.toThrow('Invalid task data');
    });

    it('should handle database constraint errors', async () => {
      const taskWithInvalidCategory: Task = {
        title: 'Task with Invalid Category',
        priority: 2,
        status: 'TODO',
        category_id: 999,
      };

      global.setMockError('create_task', 'Foreign key constraint failed');

      await expect(taskService.createTask(taskWithInvalidCategory)).rejects.toThrow(
        'Foreign key constraint failed'
      );
    });
  });

  describe('updateTask', () => {
    it('should update existing task successfully', async () => {
      const updatedTask: Task = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated description',
        due_date: '2023-02-15 17:00:00',
        priority: 1,
        status: 'IN_PROGRESS',
        category_id: 2,
        kanban_column_id: 2,
        kanban_order: 1,
      };

      global.setMockResponse('update_task', undefined);

      const result = await taskService.updateTask(updatedTask);

      expect(result).toBeUndefined();
    });

    it('should update task priority', async () => {
      const taskWithNewPriority: Task = {
        id: 1,
        title: 'Priority Update Task',
        priority: 1,
        status: 'TODO',
      };

      global.setMockResponse('update_task', undefined);

      const result = await taskService.updateTask(taskWithNewPriority);

      expect(result).toBeUndefined();
    });

    it('should update task status', async () => {
      const taskWithNewStatus: Task = {
        id: 1,
        title: 'Status Update Task',
        priority: 2,
        status: 'COMPLETED',
        completed_at: '2023-01-15 16:00:00',
      };

      global.setMockResponse('update_task', undefined);

      const result = await taskService.updateTask(taskWithNewStatus);

      expect(result).toBeUndefined();
    });

    it('should remove optional fields', async () => {
      const taskWithRemovedFields: Task = {
        id: 1,
        title: 'Simplified Task',
        priority: 3,
        status: 'TODO',
      };

      global.setMockResponse('update_task', undefined);

      const result = await taskService.updateTask(taskWithRemovedFields);

      expect(result).toBeUndefined();
    });

    it('should handle update of non-existent task', async () => {
      const nonExistentTask: Task = {
        id: 999,
        title: 'Non-existent Task',
        priority: 2,
        status: 'TODO',
      };

      global.setMockError('update_task', 'Task not found');

      await expect(taskService.updateTask(nonExistentTask)).rejects.toThrow('Task not found');
    });

    it('should handle validation errors', async () => {
      const invalidTask: Task = {
        id: 1,
        title: '',
        priority: 2,
        status: 'INVALID_STATUS',
      };

      global.setMockError('update_task', 'Validation failed');

      await expect(taskService.updateTask(invalidTask)).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task successfully', async () => {
      global.setMockResponse('delete_task', undefined);

      const result = await taskService.deleteTask(1);

      expect(result).toBeUndefined();
    });

    it('should handle deletion of non-existent task', async () => {
      global.setMockResponse('delete_task', undefined);

      const result = await taskService.deleteTask(999);

      expect(result).toBeUndefined();
    });

    it('should handle invalid task ID', async () => {
      global.setMockError('delete_task', 'Invalid task ID');

      await expect(taskService.deleteTask(-1)).rejects.toThrow('Invalid task ID');
    });

    it('should handle deletion error', async () => {
      global.setMockError('delete_task', 'Cannot delete task');

      await expect(taskService.deleteTask(1)).rejects.toThrow('Cannot delete task');
    });

    it('should delete multiple tasks', async () => {
      global.setMockResponse('delete_task', undefined);

      const taskIds = [1, 2, 3, 4, 5];
      const deletePromises = taskIds.map(id => taskService.deleteTask(id));

      const results = await Promise.all(deletePromises);

      expect(results).toHaveLength(5);
      expect(results.every(result => result === undefined)).toBe(true);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      global.setMockResponse('update_task_status', undefined);

      const result = await taskService.updateTaskStatus(1, 'IN_PROGRESS');

      expect(result).toBeUndefined();
    });

    it('should mark task as completed', async () => {
      global.setMockResponse('update_task_status', undefined);

      const result = await taskService.updateTaskStatus(1, 'COMPLETED');

      expect(result).toBeUndefined();
    });

    it('should revert task back to TODO', async () => {
      global.setMockResponse('update_task_status', undefined);

      const result = await taskService.updateTaskStatus(1, 'TODO');

      expect(result).toBeUndefined();
    });

    it('should handle invalid status', async () => {
      global.setMockError('update_task_status', 'Invalid status');

      await expect(taskService.updateTaskStatus(1, 'INVALID_STATUS')).rejects.toThrow(
        'Invalid status'
      );
    });

    it('should handle non-existent task', async () => {
      global.setMockError('update_task_status', 'Task not found');

      await expect(taskService.updateTaskStatus(999, 'COMPLETED')).rejects.toThrow(
        'Task not found'
      );
    });

    it('should handle status transitions', async () => {
      global.setMockResponse('update_task_status', undefined);

      const statusTransitions = [
        ['TODO', 'IN_PROGRESS'],
        ['IN_PROGRESS', 'COMPLETED'],
        ['COMPLETED', 'TODO'],
      ];

      for (const [fromStatus, toStatus] of statusTransitions) {
        const result = await taskService.updateTaskStatus(1, toStatus);
        expect(result).toBeUndefined();
      }
    });
  });

  describe('updateTaskOrder', () => {
    it('should update task order successfully', async () => {
      global.setMockResponse('update_task_order', undefined);

      const result = await taskService.updateTaskOrder(1, 2, 5);

      expect(result).toBeUndefined();
    });

    it('should move task to different column', async () => {
      global.setMockResponse('update_task_order', undefined);

      const result = await taskService.updateTaskOrder(1, 3, 1);

      expect(result).toBeUndefined();
    });

    it('should reorder within same column', async () => {
      global.setMockResponse('update_task_order', undefined);

      const result = await taskService.updateTaskOrder(1, 1, 3);

      expect(result).toBeUndefined();
    });

    it('should handle invalid task ID', async () => {
      global.setMockError('update_task_order', 'Task not found');

      await expect(taskService.updateTaskOrder(999, 1, 1)).rejects.toThrow('Task not found');
    });

    it('should handle invalid column ID', async () => {
      global.setMockError('update_task_order', 'Invalid column ID');

      await expect(taskService.updateTaskOrder(1, 999, 1)).rejects.toThrow('Invalid column ID');
    });

    it('should handle invalid order', async () => {
      global.setMockError('update_task_order', 'Invalid order');

      await expect(taskService.updateTaskOrder(1, 1, -1)).rejects.toThrow('Invalid order');
    });

    it('should handle bulk reordering', async () => {
      global.setMockResponse('update_task_order', undefined);

      const reorderOperations = [
        [1, 1, 1],
        [2, 1, 2],
        [3, 1, 3],
        [4, 2, 1],
        [5, 2, 2],
      ];

      for (const [taskId, columnId, order] of reorderOperations) {
        const result = await taskService.updateTaskOrder(taskId, columnId, order);
        expect(result).toBeUndefined();
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const newTask: Task = {
        title: 'CRUD Test Task',
        description: 'Test task for CRUD workflow',
        priority: 2,
        status: 'TODO',
        kanban_column_id: 1,
        kanban_order: 1,
      };

      global.setMockResponse('create_task', 1);
      const createdId = await taskService.createTask(newTask);
      expect(createdId).toBe(1);

      // Read
      const mockTasks = [{ ...newTask, id: 1 }];
      global.setMockResponse('get_tasks', mockTasks);
      const tasks = await taskService.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(1);

      // Update
      const updatedTask = { ...newTask, id: 1, title: 'Updated CRUD Task' };
      global.setMockResponse('update_task', undefined);
      const updateResult = await taskService.updateTask(updatedTask);
      expect(updateResult).toBeUndefined();

      // Delete
      global.setMockResponse('delete_task', undefined);
      const deleteResult = await taskService.deleteTask(1);
      expect(deleteResult).toBeUndefined();
    });

    it('should handle kanban workflow', async () => {
      const taskId = 1;

      // Create task in TODO column
      const newTask: Task = {
        title: 'Kanban Test Task',
        priority: 2,
        status: 'TODO',
        kanban_column_id: 1,
        kanban_order: 1,
      };

      global.setMockResponse('create_task', taskId);
      const createdId = await taskService.createTask(newTask);
      expect(createdId).toBe(taskId);

      // Move to IN_PROGRESS
      global.setMockResponse('update_task_order', undefined);
      await taskService.updateTaskOrder(taskId, 2, 1);

      global.setMockResponse('update_task_status', undefined);
      await taskService.updateTaskStatus(taskId, 'IN_PROGRESS');

      // Move to COMPLETED
      await taskService.updateTaskOrder(taskId, 3, 1);
      await taskService.updateTaskStatus(taskId, 'COMPLETED');

      // All operations should succeed
      expect(true).toBe(true);
    });

    it('should handle bulk operations', async () => {
      // Bulk create
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        priority: (i % 3) + 1,
        status: 'TODO',
        kanban_column_id: 1,
        kanban_order: i + 1,
      }));

      global.setMockResponse('create_task', 1);
      const createPromises = tasks.map(task => taskService.createTask(task));
      const createdIds = await Promise.all(createPromises);
      expect(createdIds).toHaveLength(10);

      // Bulk read
      const mockBulkTasks = tasks.map((task, i) => ({ ...task, id: i + 1 }));
      global.setMockResponse('get_tasks', mockBulkTasks);
      const retrievedTasks = await taskService.getTasks();
      expect(retrievedTasks).toHaveLength(10);

      // Bulk status update
      global.setMockResponse('update_task_status', undefined);
      const statusUpdatePromises = createdIds.map(id => 
        taskService.updateTaskStatus(id, 'IN_PROGRESS')
      );
      const statusResults = await Promise.all(statusUpdatePromises);
      expect(statusResults.every(result => result === undefined)).toBe(true);
    });

    it('should handle error recovery', async () => {
      // First attempt fails
      global.setMockError('create_task', 'Temporary failure');
      await expect(
        taskService.createTask({
          title: 'Recovery Test',
          priority: 2,
          status: 'TODO',
        })
      ).rejects.toThrow('Temporary failure');

      // Reset and retry succeeds
      global.setMockResponse('create_task', 1);
      const result = await taskService.createTask({
        title: 'Recovery Test',
        priority: 2,
        status: 'TODO',
      });
      expect(result).toBe(1);
    });

    it('should maintain data consistency', async () => {
      const baseTask: Task = {
        title: 'Consistency Test',
        description: 'Original description',
        due_date: '2023-01-31 17:00:00',
        priority: 2,
        status: 'TODO',
        category_id: 1,
        kanban_column_id: 1,
        kanban_order: 1,
      };

      global.setMockResponse('create_task', 1);
      const createdId = await taskService.createTask(baseTask);

      // Retrieve and verify all fields are preserved
      const mockRetrievedTask = { ...baseTask, id: createdId };
      global.setMockResponse('get_tasks', [mockRetrievedTask]);
      const tasks = await taskService.getTasks();

      expect(tasks[0]).toEqual(mockRetrievedTask);
      expect(tasks[0].title).toBe(baseTask.title);
      expect(tasks[0].description).toBe(baseTask.description);
      expect(tasks[0].due_date).toBe(baseTask.due_date);
      expect(tasks[0].category_id).toBe(baseTask.category_id);
      expect(tasks[0].kanban_column_id).toBe(baseTask.kanban_column_id);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed response data', async () => {
      global.setMockResponse('get_tasks', 'invalid json');

      const result = await taskService.getTasks();
      expect(result).toBe('invalid json');
    });

    it('should handle null/undefined responses', async () => {
      global.setMockResponse('get_tasks', null);

      const result = await taskService.getTasks();
      expect(result).toBeNull();
    });

    it('should handle tasks with special characters', async () => {
      const taskWithSpecialChars: Task = {
        title: 'Special âéîôü Characters 🎉',
        description: 'Description with émojis 🚀 and àccénts',
        priority: 2,
        status: 'TODO',
      };

      global.setMockResponse('create_task', 1);

      const result = await taskService.createTask(taskWithSpecialChars);
      expect(result).toBe(1);
    });

    it('should handle tasks with very long titles', async () => {
      const longTitleTask: Task = {
        title: 'A'.repeat(1000),
        priority: 3,
        status: 'TODO',
      };

      global.setMockResponse('create_task', 1);

      const result = await taskService.createTask(longTitleTask);
      expect(result).toBe(1);
    });

    it('should handle leap year due dates', async () => {
      const leapYearTask: Task = {
        title: 'Leap Year Task',
        due_date: '2024-02-29 17:00:00',
        priority: 2,
        status: 'TODO',
      };

      global.setMockResponse('create_task', 1);

      const result = await taskService.createTask(leapYearTask);
      expect(result).toBe(1);
    });

    it('should handle tasks with no due date', async () => {
      const noDueDateTask: Task = {
        title: 'No Due Date Task',
        description: 'Task without due date',
        priority: 2,
        status: 'TODO',
      };

      global.setMockResponse('create_task', 1);

      const result = await taskService.createTask(noDueDateTask);
      expect(result).toBe(1);
    });

    it('should handle priority boundary values', async () => {
      const priorities = [1, 2, 3];

      global.setMockResponse('create_task', 1);

      for (const priority of priorities) {
        const task: Task = {
          title: `Priority ${priority} Task`,
          priority,
          status: 'TODO',
        };

        const result = await taskService.createTask(task);
        expect(result).toBe(1);
      }
    });

    it('should handle concurrent operations', async () => {
      global.setMockResponse('update_task_status', undefined);

      const concurrentPromises = Array.from({ length: 10 }, (_, i) =>
        taskService.updateTaskStatus(i + 1, 'IN_PROGRESS')
      );

      const results = await Promise.all(concurrentPromises);
      expect(results.every(result => result === undefined)).toBe(true);
    });

    it('should handle network timeouts', async () => {
      global.setMockError('get_tasks', 'Request timeout');

      await expect(taskService.getTasks()).rejects.toThrow('Request timeout');
    });

    it('should handle database locking', async () => {
      global.setMockError('update_task', 'Database is locked');

      await expect(
        taskService.updateTask({
          id: 1,
          title: 'Locked Test',
          priority: 2,
          status: 'TODO',
        })
      ).rejects.toThrow('Database is locked');
    });
  });
});