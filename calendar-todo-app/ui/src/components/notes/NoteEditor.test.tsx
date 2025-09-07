import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Note } from '../../services/noteService';
import { NoteEditor } from './NoteEditor';

declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-preview">{children}</div>;
  };
});

describe('NoteEditor Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockNote: Note = {
    id: 1,
    title: 'Test Note',
    content: '# Sample Content\n\nThis is a test note with **bold** text.',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  const mockLinkedItems = [
    { type: 'event' as const, id: 5, title: 'Team Meeting' },
    { type: 'task' as const, id: 10, title: 'Complete Report' }
  ];

  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
  const mockOnUnlink = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  describe('Component Rendering', () => {
    it('should render note editor form with all essential elements', () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByPlaceholderText('Note title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write your note in Markdown...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render with existing note data for editing', () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Sample Content/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('should display linked items section when provided', () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      expect(screen.getByText('Linked Items')).toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Complete Report')).toBeInTheDocument();
      expect(screen.getAllByTitle('Remove link')).toHaveLength(2);
    });

    it('should hide linked items section when no items provided', () => {
      render(<NoteEditor note={mockNote} linkedItems={[]} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.queryByText('Linked Items')).not.toBeInTheDocument();
    });

    it('should start in edit mode by default', () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('active');
      expect(screen.getByRole('button', { name: 'Preview' })).not.toHaveClass('active');
      expect(screen.getByPlaceholderText('Write your note in Markdown...')).toBeInTheDocument();
    });

    it('should render proper form structure with CSS classes', () => {
      const { container } = render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(container.querySelector('.note-editor')).toBeInTheDocument();
      expect(container.querySelector('.note-editor-header')).toBeInTheDocument();
      expect(container.querySelector('.note-editor-content')).toBeInTheDocument();
      expect(container.querySelector('.note-editor-tabs')).toBeInTheDocument();
      expect(container.querySelector('.note-form-actions')).toBeInTheDocument();
    });
  });

  describe('Rich Text Editing Functionality', () => {
    it('should allow typing in content textarea', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      await user.type(contentTextarea, '# My Note\n\nThis is **bold** text.');

      expect(contentTextarea).toHaveValue('# My Note\n\nThis is **bold** text.');
    });

    it('should handle markdown content editing', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByDisplayValue(/Sample Content/);
      await user.clear(contentTextarea);
      await user.type(contentTextarea, '## Updated Header\n\n- List item 1\n- List item 2');

      expect(contentTextarea).toHaveValue('## Updated Header\n\n- List item 1\n- List item 2');
    });

    it('should update title field dynamically', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      await user.type(titleInput, 'Dynamic Title Update');

      expect(titleInput).toHaveValue('Dynamic Title Update');
    });

    it('should handle special characters and unicode content', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'Special 🚀');
      await user.type(contentTextarea, '# Special Chars 🎯');

      expect(titleInput).toHaveValue('Special 🚀');
      expect(contentTextarea).toHaveValue('# Special Chars 🎯');
    });

    it('should handle content with code blocks', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      const codeContent = '```javascript\nconst test = "hello";\n```';
      await user.type(contentTextarea, codeContent);

      expect(contentTextarea).toHaveValue(codeContent);
    });
  });

  describe('Preview Mode Toggle Functionality', () => {
    it('should switch to preview mode and render markdown', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: 'Preview' }));

      expect(screen.getByRole('button', { name: 'Preview' })).toHaveClass('active');
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: /write your note/i })).not.toBeInTheDocument();
    });

    it('should switch back to edit mode from preview', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: 'Preview' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('active');
      expect(screen.getByPlaceholderText('Write your note in Markdown...')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
    });

    it('should preserve content when toggling between modes', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'Toggle Test');
      await user.type(contentTextarea, '# Header');

      await user.click(screen.getByRole('button', { name: 'Preview' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      
      expect(titleInput).toHaveValue('Toggle Test');
      expect(contentTextarea).toHaveValue('# Header');
    });

    it('should update preview content in real-time', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(contentTextarea, '# Initial');
      await user.click(screen.getByRole('button', { name: 'Preview' }));
      expect(screen.getByTestId('markdown-preview')).toHaveTextContent('# Initial');

      await user.click(screen.getByRole('button', { name: 'Edit' }));
      // Clear and retype content
      await user.clear(contentTextarea);
      await user.type(contentTextarea, '## Modified');

      await user.click(screen.getByRole('button', { name: 'Preview' }));
      expect(screen.getByTestId('markdown-preview')).toHaveTextContent('## Modified');
    });

    it('should render markdown with proper CSS classes in preview', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: 'Preview' }));

      const previewContainer = document.querySelector('.note-preview');
      expect(previewContainer).toBeInTheDocument();
      expect(previewContainer).toContainElement(screen.getByTestId('markdown-preview'));
    });
  });

  describe('Form Submission and Validation', () => {
    it('should submit form with valid note data', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'New Note Title');
      await user.type(contentTextarea, '# New Note');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'New Note Title',
          content: '# New Note'
        });
      });
    });

    it('should submit updated note with existing id', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByDisplayValue('Test Note');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Note Title');
      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          id: 1,
          title: 'Updated Note Title',
          content: mockNote.content
        }));
      });
    });

    it('should require title field for submission', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      await user.type(contentTextarea, 'Content without title');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require content field for submission', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      await user.type(titleInput, 'Title without content');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle submission errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const failingOnSubmit = jest.fn().mockImplementation(() => {
        throw new Error('Submission failed');
      });

      render(<NoteEditor onSubmit={failingOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'Error Test');
      await user.type(contentTextarea, 'Error content');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(failingOnSubmit).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Entity Linking Operations', () => {
    it('should display linked items with unlink buttons', () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Complete Report')).toBeInTheDocument();
      expect(screen.getAllByTitle('Remove link')).toHaveLength(2);
    });

    it('should call onUnlink when removing entity link', async () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      const unlinkButtons = screen.getAllByTitle('Remove link');
      await user.click(unlinkButtons[0]);

      await waitFor(() => {
        expect(mockOnUnlink).toHaveBeenCalledWith({
          note_id: 1,
          entity_type: 'event',
          entity_id: 5
        });
      });
    });

    it('should handle unlinking tasks correctly', async () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      const unlinkButtons = screen.getAllByTitle('Remove link');
      await user.click(unlinkButtons[1]);

      await waitFor(() => {
        expect(mockOnUnlink).toHaveBeenCalledWith({
          note_id: 1,
          entity_type: 'task',
          entity_id: 10
        });
      });
    });

    it('should not show unlink buttons when onUnlink not provided', () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Complete Report')).toBeInTheDocument();
      expect(screen.queryByTitle('Remove link')).not.toBeInTheDocument();
    });

    it('should not call onUnlink when note has no id', async () => {
      render(<NoteEditor linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      const unlinkButtons = screen.getAllByTitle('Remove link');
      await user.click(unlinkButtons[0]);

      expect(mockOnUnlink).not.toHaveBeenCalled();
    });

    it('should handle multiple linked items efficiently', () => {
      const manyLinkedItems = Array.from({ length: 5 }, (_, i) => ({
        type: i % 2 === 0 ? 'event' as const : 'task' as const,
        id: i + 1,
        title: `Item ${i + 1}`
      }));

      render(<NoteEditor note={mockNote} linkedItems={manyLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      manyLinkedItems.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });
      expect(screen.getAllByTitle('Remove link')).toHaveLength(5);
    });
  });

  describe('Keyboard Shortcuts and Accessibility', () => {
    it('should support keyboard navigation between form elements', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const editTab = screen.getByRole('button', { name: 'Edit' });

      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);
      
      await user.tab();
      expect(document.activeElement).toBe(editTab);
    });

    it('should support keyboard shortcuts for mode switching', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const previewTab = screen.getByRole('button', { name: 'Preview' });
      previewTab.focus();
      await user.keyboard('{Enter}');

      expect(previewTab).toHaveClass('active');
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
      expect(screen.getAllByTitle('Remove link')).toHaveLength(2);
    });

    it('should support screen reader navigation', () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      expect(screen.getByPlaceholderText('Note title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write your note in Markdown...')).toBeInTheDocument();
      expect(screen.getByText('Linked Items')).toBeInTheDocument();
    });

    it('should support unlink operations via keyboard', async () => {
      render(<NoteEditor note={mockNote} linkedItems={mockLinkedItems} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);

      const unlinkButtons = screen.getAllByTitle('Remove link');
      unlinkButtons[0].focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnUnlink).toHaveBeenCalledWith({
          note_id: 1,
          entity_type: 'event',
          entity_id: 5
        });
      });
    });
  });

  describe('State Management', () => {
    it('should maintain form state during mode switching', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'State Test');
      await user.type(contentTextarea, 'State content');

      await user.click(screen.getByRole('button', { name: 'Preview' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(titleInput).toHaveValue('State Test');
      expect(contentTextarea).toHaveValue('State content');
    });

    it('should reset form state when note prop changes', () => {
      const { rerender } = render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByPlaceholderText('Note title')).toHaveValue('');

      rerender(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
    });

    it('should handle form data state updates correctly', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByDisplayValue('Test Note');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Title');
      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          id: 1,
          title: 'Modified Title'
        }));
      });
    });
  });

  describe('Cancel Operations', () => {
    it('should call onCancel when cancel button clicked', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not submit form when canceling', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      await user.type(titleInput, 'Should not submit');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      await user.type(titleInput, 'Empty content note');

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      expect(contentTextarea).toHaveValue('');
    });

    it('should handle very long titles', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByPlaceholderText('Note title');
      const longTitle = 'T'.repeat(255);
      await user.type(titleInput, longTitle);

      expect(titleInput).toHaveValue(longTitle);
    });

    it('should handle rapid mode switching', async () => {
      render(<NoteEditor note={mockNote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const start = performance.now();
      
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: 'Preview' }));
        await user.click(screen.getByRole('button', { name: 'Edit' }));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000);
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('active');
    });

    it('should handle invalid markdown gracefully', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      const invalidMarkdown = '# Unclosed **bold';
      await user.type(contentTextarea, invalidMarkdown);
      await user.click(screen.getByRole('button', { name: 'Preview' }));

      expect(screen.getByTestId('markdown-preview')).toHaveTextContent(invalidMarkdown);
    });
  });

  describe('Performance', () => {
    it('should handle form operations efficiently', async () => {
      render(<NoteEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const start = performance.now();
      
      const titleInput = screen.getByPlaceholderText('Note title');
      const contentTextarea = screen.getByPlaceholderText('Write your note in Markdown...');
      
      await user.type(titleInput, 'Performance Test');
      await user.type(contentTextarea, '# Performance Content');
      await user.click(screen.getByRole('button', { name: 'Preview' }));
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000);
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      const largeLinkList = Array.from({ length: 50 }, (_, i) => ({
        type: i % 2 === 0 ? 'event' as const : 'task' as const,
        id: i + 1,
        title: `Large Item ${i + 1}`
      }));

      const start = performance.now();
      
      render(<NoteEditor note={mockNote} linkedItems={largeLinkList} onSubmit={mockOnSubmit} onUnlink={mockOnUnlink} onCancel={mockOnCancel} />);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
      expect(screen.getAllByTitle('Remove link')).toHaveLength(50);
    });
  });
});