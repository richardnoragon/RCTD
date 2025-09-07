import { AVAILABLE_SYMBOLS, Category, categoryService } from './categoryService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Category Service', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  describe('CRUD Operations', () => {
    describe('getCategories', () => {
      it('should fetch categories successfully', async () => {
        const mockCategories: Category[] = [
          {
            id: 1,
            name: 'Work',
            color: '#FF5733',
            symbol: 'circle',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Personal',
            color: '#33FF57',
            symbol: 'square',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        global.setMockResponse('get_categories', mockCategories);

        const result = await categoryService.getCategories();
        expect(result).toEqual(mockCategories);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('get_categories');
      });

      it('should handle empty category list', async () => {
        global.setMockResponse('get_categories', []);

        const result = await categoryService.getCategories();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle network errors', async () => {
        global.setMockError('get_categories', 'Network error');

        await expect(categoryService.getCategories()).rejects.toThrow('Network error');
      });
    });

    describe('createCategory', () => {
      it('should create a category successfully', async () => {
        const newCategory: Category = {
          name: 'Health',
          color: '#3366FF',
          symbol: 'triangle'
        };
        const mockId = 3;

        global.setMockResponse('create_category', mockId);

        const result = await categoryService.createCategory(newCategory);
        expect(result).toBe(mockId);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_category', { category: newCategory });
      });

      it('should handle category creation with all fields', async () => {
        const newCategory: Category = {
          name: 'Finance',
          color: '#FF9933',
          symbol: 'hexagon'
        };
        const mockId = 4;

        global.setMockResponse('create_category', mockId);

        const result = await categoryService.createCategory(newCategory);
        expect(result).toBe(mockId);
      });

      it('should handle creation errors', async () => {
        const newCategory: Category = {
          name: 'Invalid Category',
          color: '#000000',
          symbol: 'circle'
        };

        global.setMockError('create_category', 'Category name already exists');

        await expect(categoryService.createCategory(newCategory)).rejects.toThrow('Category name already exists');
      });
    });

    describe('updateCategory', () => {
      it('should update a category successfully', async () => {
        const categoryToUpdate: Category = {
          id: 1,
          name: 'Updated Work',
          color: '#FF5733',
          symbol: 'pentagon',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        };

        global.setMockResponse('update_category', undefined);

        await categoryService.updateCategory(categoryToUpdate);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('update_category', { category: categoryToUpdate });
      });

      it('should handle update errors', async () => {
        const categoryToUpdate: Category = {
          id: 999,
          name: 'Non-existent',
          color: '#000000',
          symbol: 'circle'
        };

        global.setMockError('update_category', 'Category not found');

        await expect(categoryService.updateCategory(categoryToUpdate)).rejects.toThrow('Category not found');
      });
    });

    describe('deleteCategory', () => {
      it('should delete a category successfully', async () => {
        const categoryId = 1;
        global.setMockResponse('delete_category', undefined);

        await categoryService.deleteCategory(categoryId);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('delete_category', { id: categoryId });
      });

      it('should handle deletion errors', async () => {
        const categoryId = 999;
        global.setMockError('delete_category', 'Category not found');

        await expect(categoryService.deleteCategory(categoryId)).rejects.toThrow('Category not found');
      });

      it('should handle foreign key constraint errors', async () => {
        const categoryId = 1;
        global.setMockError('delete_category', 'Cannot delete category: referenced by existing events or tasks');

        await expect(categoryService.deleteCategory(categoryId)).rejects.toThrow('Cannot delete category: referenced by existing events or tasks');
      });
    });
  });

  describe('Data Validation', () => {
    describe('Category Name Validation', () => {
      it('should handle categories with special characters', async () => {
        const specialCategory: Category = {
          name: 'Work & Personal 🏢',
          color: '#FF5733',
          symbol: 'circle'
        };

        global.setMockResponse('create_category', 5);

        const result = await categoryService.createCategory(specialCategory);
        expect(result).toBe(5);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_category', { category: specialCategory });
      });

      it('should handle very long category names', async () => {
        const longNameCategory: Category = {
          name: 'A'.repeat(255), // Maximum typical varchar length
          color: '#FF5733',
          symbol: 'circle'
        };

        global.setMockResponse('create_category', 6);

        const result = await categoryService.createCategory(longNameCategory);
        expect(result).toBe(6);
      });

      it('should handle empty name validation', async () => {
        const emptyNameCategory: Category = {
          name: '',
          color: '#FF5733',
          symbol: 'circle'
        };

        global.setMockError('create_category', 'Category name cannot be empty');

        await expect(categoryService.createCategory(emptyNameCategory)).rejects.toThrow('Category name cannot be empty');
      });
    });

    describe('Color Validation', () => {
      it('should handle valid hex colors', async () => {
        const validColors = ['#FF5733', '#33FF57', '#3366FF', '#000000', '#FFFFFF'];
        
        for (let i = 0; i < validColors.length; i++) {
          const category: Category = {
            name: `Color Test ${i}`,
            color: validColors[i],
            symbol: 'circle'
          };

          global.setMockResponse('create_category', i + 10);
          const result = await categoryService.createCategory(category);
          expect(result).toBe(i + 10);
        }
      });

      it('should handle invalid color formats', async () => {
        const invalidColorCategory: Category = {
          name: 'Invalid Color',
          color: 'not-a-color',
          symbol: 'circle'
        };

        global.setMockError('create_category', 'Invalid color format');

        await expect(categoryService.createCategory(invalidColorCategory)).rejects.toThrow('Invalid color format');
      });
    });

    describe('Symbol Validation', () => {
      it('should handle all available symbols', async () => {
        for (let i = 0; i < AVAILABLE_SYMBOLS.length; i++) {
          const category: Category = {
            name: `Symbol Test ${i}`,
            color: '#FF5733',
            symbol: AVAILABLE_SYMBOLS[i]
          };

          global.setMockResponse('create_category', i + 20);
          const result = await categoryService.createCategory(category);
          expect(result).toBe(i + 20);
        }
      });

      it('should validate symbol enum values', async () => {
        const invalidSymbolCategory: Category = {
          name: 'Invalid Symbol',
          color: '#FF5733',
          symbol: 'invalid-symbol' as any
        };

        global.setMockError('create_category', 'Invalid symbol');

        await expect(categoryService.createCategory(invalidSymbolCategory)).rejects.toThrow('Invalid symbol');
      });
    });
  });

  describe('Import/Export Functionality', () => {
    describe('exportCategories', () => {
      it('should export categories as JSON string', async () => {
        const mockExportData = JSON.stringify([
          { id: 1, name: 'Work', color: '#FF5733', symbol: 'circle' },
          { id: 2, name: 'Personal', color: '#33FF57', symbol: 'square' }
        ]);

        global.setMockResponse('export_categories', mockExportData);

        const result = await categoryService.exportCategories();
        expect(result).toBe(mockExportData);
        expect(typeof result).toBe('string');
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('export_categories');
      });

      it('should handle empty export', async () => {
        global.setMockResponse('export_categories', '[]');

        const result = await categoryService.exportCategories();
        expect(result).toBe('[]');
      });

      it('should handle export errors', async () => {
        global.setMockError('export_categories', 'Export failed');

        await expect(categoryService.exportCategories()).rejects.toThrow('Export failed');
      });
    });

    describe('importCategories', () => {
      it('should import categories from JSON string', async () => {
        const importData = JSON.stringify([
          { name: 'Imported Work', color: '#FF5733', symbol: 'circle' },
          { name: 'Imported Personal', color: '#33FF57', symbol: 'square' }
        ]);

        global.setMockResponse('import_categories', undefined);

        await categoryService.importCategories(importData);
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('import_categories', { jsonData: importData });
      });

      it('should handle malformed JSON', async () => {
        const invalidJson = '{ invalid json }';

        global.setMockError('import_categories', 'Invalid JSON format');

        await expect(categoryService.importCategories(invalidJson)).rejects.toThrow('Invalid JSON format');
      });

      it('should handle empty import data', async () => {
        global.setMockResponse('import_categories', undefined);

        await categoryService.importCategories('[]');
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('import_categories', { jsonData: '[]' });
      });

      it('should handle import validation errors', async () => {
        const invalidImportData = JSON.stringify([
          { name: '', color: 'invalid', symbol: 'invalid' }
        ]);

        global.setMockError('import_categories', 'Validation error: Invalid category data');

        await expect(categoryService.importCategories(invalidImportData)).rejects.toThrow('Validation error: Invalid category data');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      global.setMockError('get_categories', 'Database connection failed');

      await expect(categoryService.getCategories()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      global.setMockError('create_category', 'Request timeout');

      const category: Category = {
        name: 'Timeout Test',
        color: '#FF5733',
        symbol: 'circle'
      };

      await expect(categoryService.createCategory(category)).rejects.toThrow('Request timeout');
    });

    it('should handle concurrent modification errors', async () => {
      const category: Category = {
        id: 1,
        name: 'Concurrent Test',
        color: '#FF5733',
        symbol: 'circle'
      };

      global.setMockError('update_category', 'Category was modified by another user');

      await expect(categoryService.updateCategory(category)).rejects.toThrow('Category was modified by another user');
    });

    it('should handle permission errors', async () => {
      global.setMockError('delete_category', 'Insufficient permissions');

      await expect(categoryService.deleteCategory(1)).rejects.toThrow('Insufficient permissions');
    });

    it('should handle service unavailable errors', async () => {
      global.setMockError('export_categories', 'Service temporarily unavailable');

      await expect(categoryService.exportCategories()).rejects.toThrow('Service temporarily unavailable');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle bulk category creation', async () => {
      const categories: Category[] = Array.from({ length: 50 }, (_, i) => ({
        name: `Bulk Category ${i}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        symbol: AVAILABLE_SYMBOLS[i % AVAILABLE_SYMBOLS.length]
      }));

      // Mock successful creation for each category
      for (let i = 0; i < categories.length; i++) {
        global.setMockResponse('create_category', i + 100);
        const result = await categoryService.createCategory(categories[i]);
        expect(result).toBe(i + 100);
      }
    });

    it('should handle rapid successive API calls', async () => {
      global.setMockResponse('get_categories', []);

      const promises = Array.from({ length: 10 }, () => categoryService.getCategories());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toEqual([]);
      });
      expect(global.mockTauriInvoke).toHaveBeenCalledTimes(10);
    });

    it('should handle large export data', async () => {
      const largeExportData = JSON.stringify(
        Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Large Category ${i}`,
          color: '#FF5733',
          symbol: 'circle'
        }))
      );

      global.setMockResponse('export_categories', largeExportData);

      const result = await categoryService.exportCategories();
      expect(result).toBe(largeExportData);
      expect(result.length).toBeGreaterThan(10000); // Ensure it's actually large
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce Category interface compliance', async () => {
      const validCategory: Category = {
        name: 'Type Test',
        color: '#FF5733',
        symbol: 'circle'
      };

      global.setMockResponse('create_category', 999);

      const result = await categoryService.createCategory(validCategory);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should handle optional fields correctly', async () => {
      const categoryWithOptionalFields: Category = {
        id: 1,
        name: 'Optional Fields Test',
        color: '#FF5733',
        symbol: 'circle',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      global.setMockResponse('update_category', undefined);

      await categoryService.updateCategory(categoryWithOptionalFields);
      expect(global.mockTauriInvoke).toHaveBeenCalledWith('update_category', { category: categoryWithOptionalFields });
    });

    it('should validate AVAILABLE_SYMBOLS constant', () => {
      expect(AVAILABLE_SYMBOLS).toBeDefined();
      expect(Array.isArray(AVAILABLE_SYMBOLS)).toBe(true);
      expect(AVAILABLE_SYMBOLS.length).toBeGreaterThan(0);
      expect(AVAILABLE_SYMBOLS).toContain('circle');
      expect(AVAILABLE_SYMBOLS).toContain('square');
      expect(AVAILABLE_SYMBOLS).toContain('triangle');
    });
  });
});