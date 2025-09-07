import { kanbanService } from './kanbanService';

// Mock setup is handled in setupTests.ts
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Kanban Service', () => {
  beforeEach(() => {
    globalThis.resetMocks();
  });

  describe('CRUD Operations', () => {
    describe('getColumns', () => {
      it('should fetch kanban columns successfully', async () => {
        const mockColumns = [
          {
            id: 1,
            name: 'To Do',
            column_order: 1
          },
          {
            id: 2,
            name: 'In Progress',
            column_order: 2
          },
          {
            id: 3,
            name: 'Done',
            column_order: 3
          }
        ];

        globalThis.setMockResponse('get_kanban_columns', mockColumns);

        const result = await kanbanService.getColumns();
        expect(result).toEqual(mockColumns);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_kanban_columns');
      });

      it('should handle empty column list', async () => {
        globalThis.setMockResponse('get_kanban_columns', []);

        const result = await kanbanService.getColumns();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle network errors', async () => {
        globalThis.setMockError('get_kanban_columns', 'Failed to fetch columns');

        await expect(kanbanService.getColumns()).rejects.toThrow('Failed to fetch columns');
      });

      it('should handle database connection errors', async () => {
        globalThis.setMockError('get_kanban_columns', 'Database connection failed');

        await expect(kanbanService.getColumns()).rejects.toThrow('Database connection failed');
      });
    });

    describe('createColumn', () => {
      it('should create a column successfully', async () => {
        const newColumn = {
          name: 'Review',
          column_order: 4
        };
        const mockId = 4;

        globalThis.setMockResponse('create_kanban_column', mockId);

        const result = await kanbanService.createColumn(newColumn);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_kanban_column', { column: newColumn });
      });

      it('should handle column creation with all fields', async () => {
        const newColumn = {
          id: 5,
          name: 'Testing',
          column_order: 5
        };
        const mockId = 5;

        globalThis.setMockResponse('create_kanban_column', mockId);

        const result = await kanbanService.createColumn(newColumn);
        expect(result).toBe(mockId);
      });

      it('should handle creation errors', async () => {
        const newColumn = {
          name: 'Invalid Column',
          column_order: -1
        };

        globalThis.setMockError('create_kanban_column', 'Invalid column order');

        await expect(kanbanService.createColumn(newColumn)).rejects.toThrow('Invalid column order');
      });

      it('should handle duplicate column names', async () => {
        const duplicateColumn = {
          name: 'To Do',
          column_order: 6
        };

        globalThis.setMockError('create_kanban_column', 'Column name already exists');

        await expect(kanbanService.createColumn(duplicateColumn)).rejects.toThrow('Column name already exists');
      });
    });

    describe('updateColumn', () => {
      it('should update a column successfully', async () => {
        const columnToUpdate = {
          id: 1,
          name: 'Updated To Do',
          column_order: 1
        };

        globalThis.setMockResponse('update_kanban_column', undefined);

        await kanbanService.updateColumn(columnToUpdate);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_kanban_column', { column: columnToUpdate });
      });

      it('should handle update errors', async () => {
        const columnToUpdate = {
          id: 999,
          name: 'Non-existent',
          column_order: 1
        };

        globalThis.setMockError('update_kanban_column', 'Column not found');

        await expect(kanbanService.updateColumn(columnToUpdate)).rejects.toThrow('Column not found');
      });

      it('should handle column order conflicts', async () => {
        const columnToUpdate = {
          id: 1,
          name: 'To Do',
          column_order: 2
        };

        globalThis.setMockError('update_kanban_column', 'Column order already exists');

        await expect(kanbanService.updateColumn(columnToUpdate)).rejects.toThrow('Column order already exists');
      });
    });

    describe('deleteColumn', () => {
      it('should delete a column successfully', async () => {
        const columnId = 1;
        globalThis.setMockResponse('delete_kanban_column', undefined);

        await kanbanService.deleteColumn(columnId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('delete_kanban_column', { id: columnId });
      });

      it('should handle deletion errors', async () => {
        const columnId = 999;
        globalThis.setMockError('delete_kanban_column', 'Column not found');

        await expect(kanbanService.deleteColumn(columnId)).rejects.toThrow('Column not found');
      });

      it('should handle foreign key constraint errors', async () => {
        const columnId = 1;
        globalThis.setMockError('delete_kanban_column', 'Cannot delete column: contains tasks');

        await expect(kanbanService.deleteColumn(columnId)).rejects.toThrow('Cannot delete column: contains tasks');
      });
    });
  });

  describe('Data Validation', () => {
    describe('Column Name Validation', () => {
      it('should handle columns with special characters', async () => {
        const specialColumn = {
          name: 'Review & Test 🚀',
          column_order: 4
        };

        globalThis.setMockResponse('create_kanban_column', 4);

        const result = await kanbanService.createColumn(specialColumn);
        expect(result).toBe(4);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_kanban_column', { column: specialColumn });
      });

      it('should handle very long column names', async () => {
        const longNameColumn = {
          name: 'A'.repeat(255),
          column_order: 5
        };

        globalThis.setMockResponse('create_kanban_column', 5);

        const result = await kanbanService.createColumn(longNameColumn);
        expect(result).toBe(5);
      });

      it('should handle empty name validation', async () => {
        const emptyNameColumn = {
          name: '',
          column_order: 6
        };

        globalThis.setMockError('create_kanban_column', 'Column name cannot be empty');

        await expect(kanbanService.createColumn(emptyNameColumn)).rejects.toThrow('Column name cannot be empty');
      });

      it('should handle whitespace-only names', async () => {
        const whitespaceColumn = {
          name: '   ',
          column_order: 7
        };

        globalThis.setMockError('create_kanban_column', 'Column name cannot be empty');

        await expect(kanbanService.createColumn(whitespaceColumn)).rejects.toThrow('Column name cannot be empty');
      });
    });

    describe('Column Order Validation', () => {
      it('should handle valid column orders', async () => {
        const validOrders = [1, 2, 3, 4, 5];
        
        for (let i = 0; i < validOrders.length; i++) {
          const column = {
            name: `Column ${i + 1}`,
            column_order: validOrders[i]
          };

          globalThis.setMockResponse('create_kanban_column', i + 10);
          const result = await kanbanService.createColumn(column);
          expect(result).toBe(i + 10);
        }
      });

      it('should handle negative column orders', async () => {
        const negativeOrderColumn = {
          name: 'Invalid Order',
          column_order: -1
        };

        globalThis.setMockError('create_kanban_column', 'Column order must be positive');

        await expect(kanbanService.createColumn(negativeOrderColumn)).rejects.toThrow('Column order must be positive');
      });

      it('should handle zero column order', async () => {
        const zeroOrderColumn = {
          name: 'Zero Order',
          column_order: 0
        };

        globalThis.setMockError('create_kanban_column', 'Column order must be positive');

        await expect(kanbanService.createColumn(zeroOrderColumn)).rejects.toThrow('Column order must be positive');
      });
    });
  });

  describe('Column Management', () => {
    describe('Column Ordering', () => {
      it('should maintain column order after creation', async () => {
        const columns = [
          { name: 'To Do', column_order: 1 },
          { name: 'In Progress', column_order: 2 },
          { name: 'Review', column_order: 3 },
          { name: 'Done', column_order: 4 }
        ];

        // Create columns
        for (let i = 0; i < columns.length; i++) {
          globalThis.setMockResponse('create_kanban_column', i + 1);
          await kanbanService.createColumn(columns[i]);
        }

        // Verify order is maintained when fetching
        const orderedColumns = columns.map((col, i) => ({ ...col, id: i + 1 }));
        globalThis.setMockResponse('get_kanban_columns', orderedColumns);

        const result = await kanbanService.getColumns();
        expect(result).toHaveLength(4);
        expect(result[0].column_order).toBe(1);
        expect(result[1].column_order).toBe(2);
        expect(result[2].column_order).toBe(3);
        expect(result[3].column_order).toBe(4);
      });

      it('should handle column reordering', async () => {
        const originalColumn = {
          id: 1,
          name: 'To Do',
          column_order: 1
        };

        const reorderedColumn = {
          ...originalColumn,
          column_order: 3
        };

        globalThis.setMockResponse('update_kanban_column', undefined);

        await kanbanService.updateColumn(reorderedColumn);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_kanban_column', { column: reorderedColumn });
      });
    });

    describe('Default Columns', () => {
      it('should handle default kanban setup', async () => {
        const defaultColumns = [
          { id: 1, name: 'To Do', column_order: 1 },
          { id: 2, name: 'In Progress', column_order: 2 },
          { id: 3, name: 'Done', column_order: 3 }
        ];

        globalThis.setMockResponse('get_kanban_columns', defaultColumns);

        const result = await kanbanService.getColumns();
        expect(result).toEqual(defaultColumns);
        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('To Do');
        expect(result[1].name).toBe('In Progress');
        expect(result[2].name).toBe('Done');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      globalThis.setMockError('get_kanban_columns', 'Request timeout');

      await expect(kanbanService.getColumns()).rejects.toThrow('Request timeout');
    });

    it('should handle server errors', async () => {
      globalThis.setMockError('create_kanban_column', 'Internal server error');

      const column = {
        name: 'Test Column',
        column_order: 1
      };

      await expect(kanbanService.createColumn(column)).rejects.toThrow('Internal server error');
    });

    it('should handle concurrent modification errors', async () => {
      const column = {
        id: 1,
        name: 'Concurrent Test',
        column_order: 1
      };

      globalThis.setMockError('update_kanban_column', 'Column was modified by another user');

      await expect(kanbanService.updateColumn(column)).rejects.toThrow('Column was modified by another user');
    });

    it('should handle permission errors', async () => {
      globalThis.setMockError('delete_kanban_column', 'Insufficient permissions');

      await expect(kanbanService.deleteColumn(1)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle bulk column operations', async () => {
      const columns = Array.from({ length: 20 }, (_, i) => ({
        name: `Column ${i + 1}`,
        column_order: i + 1
      }));

      // Mock successful creation for each column
      for (let i = 0; i < columns.length; i++) {
        globalThis.setMockResponse('create_kanban_column', i + 100);
        const result = await kanbanService.createColumn(columns[i]);
        expect(result).toBe(i + 100);
      }
    });

    it('should handle rapid successive API calls', async () => {
      globalThis.setMockResponse('get_kanban_columns', []);

      const promises = Array.from({ length: 10 }, () => kanbanService.getColumns());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toEqual([]);
      });
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(10);
    });

    it('should handle large column datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Column ${i + 1}`,
        column_order: i + 1
      }));

      globalThis.setMockResponse('get_kanban_columns', largeDataset);

      const result = await kanbanService.getColumns();
      expect(result).toEqual(largeDataset);
      expect(result).toHaveLength(100);
    });

    it('should handle unicode column names', async () => {
      const unicodeColumns = [
        { name: '待办事项', column_order: 1 },
        { name: 'En Cours', column_order: 2 },
        { name: 'Готово', column_order: 3 },
        { name: '🚀 Launch', column_order: 4 }
      ];

      for (let i = 0; i < unicodeColumns.length; i++) {
        globalThis.setMockResponse('create_kanban_column', i + 200);
        const result = await kanbanService.createColumn(unicodeColumns[i]);
        expect(result).toBe(i + 200);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete column workflow', async () => {
      // Create a new column
      const newColumn = {
        name: 'Testing',
        column_order: 4
      };
      globalThis.setMockResponse('create_kanban_column', 4);
      const columnId = await kanbanService.createColumn(newColumn);
      expect(columnId).toBe(4);

      // Update the column
      const updatedColumn = {
        id: columnId,
        name: 'QA Testing',
        column_order: 4
      };
      globalThis.setMockResponse('update_kanban_column', undefined);
      await kanbanService.updateColumn(updatedColumn);

      // Verify update
      const allColumns = [
        { id: 1, name: 'To Do', column_order: 1 },
        { id: 2, name: 'In Progress', column_order: 2 },
        { id: 3, name: 'Done', column_order: 3 },
        { id: 4, name: 'QA Testing', column_order: 4 }
      ];
      globalThis.setMockResponse('get_kanban_columns', allColumns);
      const result = await kanbanService.getColumns();
      expect(result).toHaveLength(4);
      expect(result[3].name).toBe('QA Testing');

      // Delete the column
      globalThis.setMockResponse('delete_kanban_column', undefined);
      await kanbanService.deleteColumn(columnId);
    });

    it('should handle column reordering workflow', async () => {
      // Initial columns
      const initialColumns = [
        { id: 1, name: 'To Do', column_order: 1 },
        { id: 2, name: 'In Progress', column_order: 2 },
        { id: 3, name: 'Done', column_order: 3 }
      ];
      globalThis.setMockResponse('get_kanban_columns', initialColumns);
      
      let result = await kanbanService.getColumns();
      expect(result[0].column_order).toBe(1);
      expect(result[1].column_order).toBe(2);
      expect(result[2].column_order).toBe(3);

      // Reorder: move "Done" to position 1
      globalThis.setMockResponse('update_kanban_column', undefined);
      await kanbanService.updateColumn({
        id: 3,
        name: 'Done',
        column_order: 1
      });
      await kanbanService.updateColumn({
        id: 1,
        name: 'To Do',
        column_order: 2
      });
      await kanbanService.updateColumn({
        id: 2,
        name: 'In Progress',
        column_order: 3
      });

      // Verify new order
      const reorderedColumns = [
        { id: 3, name: 'Done', column_order: 1 },
        { id: 1, name: 'To Do', column_order: 2 },
        { id: 2, name: 'In Progress', column_order: 3 }
      ];
      globalThis.setMockResponse('get_kanban_columns', reorderedColumns);
      result = await kanbanService.getColumns();
      expect(result[0].name).toBe('Done');
      expect(result[1].name).toBe('To Do');
      expect(result[2].name).toBe('In Progress');
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce KanbanColumn interface compliance', async () => {
      const validColumn = {
        name: 'Type Test',
        column_order: 1
      };

      globalThis.setMockResponse('create_kanban_column', 999);

      const result = await kanbanService.createColumn(validColumn);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should handle optional id field correctly', async () => {
      const columnWithId = {
        id: 1,
        name: 'Optional ID Test',
        column_order: 1
      };

      globalThis.setMockResponse('update_kanban_column', undefined);

      await kanbanService.updateColumn(columnWithId);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_kanban_column', { column: columnWithId });
    });

    it('should validate required fields', async () => {
      const incompleteColumn = {
        name: 'Incomplete Column'
        // Missing column_order
      } as any;

      globalThis.setMockError('create_kanban_column', 'Column order is required');

      await expect(kanbanService.createColumn(incompleteColumn)).rejects.toThrow('Column order is required');
    });
  });
});