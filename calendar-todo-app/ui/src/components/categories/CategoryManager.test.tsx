import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Category } from '../../services/categoryService';
import { categoryService } from '../../services/categoryService';
import { CategoryManager } from './CategoryManager';

// Mock the categoryService
jest.mock('../../services/categoryService');
const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and DOM methods
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    appendChild: mockAppendChild,
    click: mockClick,
    style: { display: '' }
  }))
});
Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true)
});

describe('CategoryManager', () => {
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Work',
      color: '#ff0000',
      symbol: 'circle',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Personal',
      color: '#00ff00',
      symbol: 'triangle',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryService.getCategories.mockResolvedValue(mockCategories);
    mockCategoryService.createCategory.mockResolvedValue(1);
    mockCategoryService.updateCategory.mockResolvedValue();
    mockCategoryService.deleteCategory.mockResolvedValue();
    mockCategoryService.exportCategories.mockResolvedValue('[]');
    mockCategoryService.importCategories.mockResolvedValue();
  });

  describe('Component Rendering', () => {
    test('renders category manager with header and actions', async () => {
      render(<CategoryManager />);
      
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Create Category')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockCategoryService.getCategories).toHaveBeenCalled();
      });
    });

    test('renders categories list after loading', async () => {
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
    });

    test('displays category symbols and colors correctly', async () => {
      render(<CategoryManager />);
      
      await waitFor(() => {
        const symbols = document.querySelectorAll('.category-symbol');
        expect(symbols).toHaveLength(2);
        
        const workSymbol = symbols[0] as HTMLElement;
        expect(workSymbol.style.backgroundColor).toBe('rgb(255, 0, 0)');
        expect(workSymbol.style.maskImage).toContain('circle.svg');
      });
    });

    test('renders edit and delete buttons for each category', async () => {
      render(<CategoryManager />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        expect(editButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);
      });
    });
  });

  describe('Category CRUD Operations', () => {
    test('opens create category form when Create Category button is clicked', async () => {
      render(<CategoryManager />);
      
      const createButton = screen.getByText('Create Category');
      fireEvent.click(createButton);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('creates new category with valid data', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      // Fill form
      const nameInput = screen.getByLabelText('Name');
      const colorInput = screen.getByLabelText('Color');
      const symbolSelect = screen.getByLabelText('Symbol');
      
      await user.type(nameInput, 'Test Category');
      await user.clear(colorInput);
      await user.type(colorInput, '#0000ff');
      await user.selectOptions(symbolSelect, 'square');
      
      // Submit form
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockCategoryService.createCategory).toHaveBeenCalledWith({
          name: 'Test Category',
          color: '#0000ff',
          symbol: 'square'
        });
      });
    });

    test('updates existing category', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Click edit on first category
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Modify form
      const nameInput = screen.getByDisplayValue('Work');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Work');
      
      // Submit form
      const updateButton = screen.getByText('Update');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockCategoryService.updateCategory).toHaveBeenCalledWith({
          name: 'Updated Work',
          color: '#ff0000',
          symbol: 'circle'
        });
      });
    });

    test('deletes category with confirmation', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Click delete on first category
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this category?');
        expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(1);
      });
    });

    test('cancels category creation', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Form should be hidden
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('requires name field for category creation', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      // Try to submit without name
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      // Name input should have required attribute
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveAttribute('required');
    });

    test('displays form preview with selected options', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      // Fill form
      const nameInput = screen.getByLabelText('Name');
      const colorInput = screen.getByLabelText('Color');
      const symbolSelect = screen.getByLabelText('Symbol');
      
      await user.type(nameInput, 'Preview Test');
      await user.clear(colorInput);
      await user.type(colorInput, '#ff00ff');
      await user.selectOptions(symbolSelect, 'hexagon');
      
      // Check preview
      expect(screen.getByText('Preview Test')).toBeInTheDocument();
      const previewSymbol = document.querySelector('.preview .category-symbol') as HTMLElement;
      expect(previewSymbol.style.backgroundColor).toBe('rgb(255, 0, 255)');
      expect(previewSymbol.style.maskImage).toContain('hexagon.svg');
    });

    test('shows all available symbols in dropdown', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      const symbolSelect = screen.getByLabelText('Symbol');
      const options = symbolSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(6);
      expect(options[0]).toHaveTextContent('Circle');
      expect(options[1]).toHaveTextContent('Triangle');
      expect(options[2]).toHaveTextContent('Square');
      expect(options[3]).toHaveTextContent('Pentagon');
      expect(options[4]).toHaveTextContent('Hexagon');
      expect(options[5]).toHaveTextContent('Octagon');
    });

    test('displays color input with color picker and text display', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open create form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      const colorInput = screen.getByLabelText('Color');
      expect(colorInput).toHaveAttribute('type', 'color');
      
      // Check default color display
      expect(screen.getByText('#808080')).toBeInTheDocument();
    });
  });

  describe('Import/Export Functionality', () => {
    test('exports categories as JSON file', async () => {
      const user = userEvent.setup();
      mockCategoryService.exportCategories.mockResolvedValue('[{"name":"Test","color":"#000000"}]');
      
      render(<CategoryManager />);
      
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(mockCategoryService.exportCategories).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });

    test('imports categories from JSON file', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      const fileInput = screen.getByDisplayValue('');
      const file = new File(['[{"name":"Imported","color":"#123456"}]'], 'categories.json', {
        type: 'application/json'
      });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockCategoryService.importCategories).toHaveBeenCalledWith('[{"name":"Imported","color":"#123456"}]');
      });
    });

    test('handles import errors gracefully', async () => {
      const user = userEvent.setup();
      mockCategoryService.importCategories.mockRejectedValue(new Error('Import failed'));
      
      render(<CategoryManager />);
      
      const fileInput = screen.getByDisplayValue('');
      const file = new File(['invalid json'], 'categories.json', { type: 'application/json' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to import categories. Please check the file format.')).toBeInTheDocument();
      });
    });

    test('clears import error on successful import', async () => {
      const user = userEvent.setup();
      
      // First, cause an error
      mockCategoryService.importCategories.mockRejectedValueOnce(new Error('Import failed'));
      
      render(<CategoryManager />);
      
      const fileInput = screen.getByDisplayValue('');
      let file = new File(['invalid'], 'categories.json', { type: 'application/json' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to import categories. Please check the file format.')).toBeInTheDocument();
      });
      
      // Then succeed
      mockCategoryService.importCategories.mockResolvedValue();
      file = new File(['[{"name":"Valid"}]'], 'categories.json', { type: 'application/json' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.queryByText('Failed to import categories. Please check the file format.')).not.toBeInTheDocument();
      });
    });

    test('resets file input after import attempt', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
      const file = new File(['[]'], 'categories.json', { type: 'application/json' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles category loading errors', async () => {
      mockCategoryService.getCategories.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load categories:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles category creation errors', async () => {
      const user = userEvent.setup();
      mockCategoryService.createCategory.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CategoryManager />);
      
      // Open create form and submit
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Test');
      
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create category:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles category update errors', async () => {
      const user = userEvent.setup();
      mockCategoryService.updateCategory.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Edit category
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update category:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles category deletion errors', async () => {
      const user = userEvent.setup();
      mockCategoryService.deleteCategory.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Delete category
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete category:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles export errors', async () => {
      const user = userEvent.setup();
      mockCategoryService.exportCategories.mockRejectedValue(new Error('Export failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CategoryManager />);
      
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to export categories:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('skips deletion when user cancels confirmation', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Try to delete category
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockCategoryService.deleteCategory).not.toHaveBeenCalled();
    });
  });

  describe('Modal Behavior', () => {
    test('shows modal when form is open', async () => {
      render(<CategoryManager />);
      
      const createButton = screen.getByText('Create Category');
      fireEvent.click(createButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).toBeInTheDocument();
    });

    test('hides modal when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      // Open form
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).not.toBeInTheDocument();
    });

    test('resets selected category when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<CategoryManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });
      
      // Edit category
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Cancel edit
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Open create form - should be empty, not pre-filled
      const createButton = screen.getByText('Create Category');
      await user.click(createButton);
      
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});