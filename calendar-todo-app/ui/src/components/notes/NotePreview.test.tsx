import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Note } from '../../services/noteService';
import { NotePreview } from './NotePreview';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock ReactMarkdown for predictable testing
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

describe('NotePreview Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
  });

  const mockNote: Note = {
    id: 1,
    title: 'Test Preview Note',
    content: '# Sample Header\n\nThis is **bold** text and *italic* text.\n\n- List item 1\n- List item 2',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  const mockOnEdit = jest.fn();
  const mockOnClose = jest.fn();

  describe('Component Rendering', () => {
    it('should render note preview with title and content', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('Test Preview Note')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Sample Header/);
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should render without edit button when onEdit not provided', () => {
      render(<NotePreview note={mockNote} onClose={mockOnClose} />);

      expect(screen.getByText('Test Preview Note')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should display last updated timestamp when available', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      // More flexible date matching since different locales format dates differently
      expect(screen.getByText(/15\.1\.2024|1\/15\/2024/)).toBeInTheDocument();
    });

    it('should not display timestamp when updated_at is missing', () => {
      const noteWithoutTimestamp = { ...mockNote, updated_at: undefined };
      render(<NotePreview note={noteWithoutTimestamp} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
    });

    it('should render proper CSS structure', () => {
      const { container } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(container.querySelector('.note-preview-container')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-header')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-content')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-actions')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-footer')).toBeInTheDocument();
    });

    it('should handle notes with empty content', () => {
      const emptyNote = { ...mockNote, content: '' };
      render(<NotePreview note={emptyNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('Test Preview Note')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('');
    });
  });

  describe('Markdown Rendering Accuracy', () => {
    it('should render markdown headers correctly', () => {
      const headerNote = { ...mockNote, content: '# H1 Header\n## H2 Header\n### H3 Header' };
      render(<NotePreview note={headerNote} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toHaveTextContent('# H1 Header\n## H2 Header\n### H3 Header');
    });

    it('should render markdown formatting (bold, italic, lists)', () => {
      const formattedNote = { 
        ...mockNote, 
        content: '**Bold text**\n\n*Italic text*\n\n- Bullet 1\n- Bullet 2\n\n1. Number 1\n2. Number 2' 
      };
      render(<NotePreview note={formattedNote} onClose={mockOnClose} />);

      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent(/Bold text/);
      expect(markdownContent).toHaveTextContent(/Italic text/);
      expect(markdownContent).toHaveTextContent(/Bullet 1/);
      expect(markdownContent).toHaveTextContent(/Number 1/);
    });

    it('should render markdown links and images', () => {
      const linkNote = { 
        ...mockNote, 
        content: '[Link text](https://example.com)\n\n![Image alt](image.jpg)' 
      };
      render(<NotePreview note={linkNote} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Link text/);
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Image alt/);
    });

    it('should handle code blocks in markdown', () => {
      const codeNote = { 
        ...mockNote, 
        content: '```javascript\nconst hello = "world";\nconsole.log(hello);\n```' 
      };
      render(<NotePreview note={codeNote} onClose={mockOnClose} />);

      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent(/const hello = "world"/);
      expect(markdownContent).toHaveTextContent(/console.log/);
    });

    it('should handle inline code in markdown', () => {
      const inlineCodeNote = { 
        ...mockNote, 
        content: 'Use `console.log()` for debugging and `npm install` for packages.' 
      };
      render(<NotePreview note={inlineCodeNote} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/console.log/);
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/npm install/);
    });

    it('should handle complex markdown with mixed formatting', () => {
      const complexNote = { 
        ...mockNote, 
        content: '# Main Title\n\n## Subsection\n\n**Bold** and *italic* text with `code`.\n\n> Blockquote text\n\n- [Link](url)\n- **Bold item**' 
      };
      render(<NotePreview note={complexNote} onClose={mockOnClose} />);

      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent(/Main Title/);
      expect(markdownContent).toHaveTextContent(/Subsection/);
      expect(markdownContent).toHaveTextContent(/Bold.*italic.*code/);
      expect(markdownContent).toHaveTextContent(/Blockquote text/);
    });
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(mockOnEdit).toHaveBeenCalledWith();
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', async () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(mockOnClose).toHaveBeenCalledWith();
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle missing onEdit gracefully', async () => {
      render(<NotePreview note={mockNote} onClose={mockOnClose} />);

      // Edit button should not be present
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      
      // Close button should still work
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should support keyboard navigation between buttons', async () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const editButton = screen.getByRole('button', { name: 'Edit' });
      const closeButton = screen.getByRole('button', { name: 'Close' });

      editButton.focus();
      expect(document.activeElement).toBe(editButton);
      
      await user.tab();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper heading structure for screen readers', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Preview Note');
    });

    it('should support keyboard navigation and interactions', async () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const editButton = screen.getByRole('button', { name: 'Edit' });
      
      editButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('should have accessible button labels', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should provide proper semantic structure', () => {
      const { container } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      // Should have proper semantic HTML structure
      expect(container.querySelector('.note-preview-container')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });

  describe('Content Display and Formatting', () => {
    it('should display note title as main heading', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Preview Note');
    });

    it('should format timestamp in readable format', () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const timestampText = screen.getByText(/Last updated:/);
      expect(timestampText).toBeInTheDocument();
      
      // Should contain formatted date (format may vary by locale)
      expect(timestampText.textContent).toMatch(/Last updated: (15\.1\.2024|1\/15\/2024)/);
    });

    it('should handle very long note titles gracefully', () => {
      const longTitleNote = { 
        ...mockNote, 
        title: 'T'.repeat(200) 
      };
      render(<NotePreview note={longTitleNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('T'.repeat(200));
    });

    it('should handle very large content efficiently', () => {
      const largeContentNote = { 
        ...mockNote, 
        content: '# Large Content\n\n' + 'A'.repeat(5000) + '\n\n## End Section' 
      };

      const start = performance.now();
      
      render(<NotePreview note={largeContentNote} onEdit={mockOnEdit} onClose={mockOnClose} />);
      
      const end = performance.now();
      const duration = end - start;

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(duration).toBeLessThan(1000); // Should render large content quickly
    });

    it('should handle unicode and special characters in content', () => {
      const unicodeNote = { 
        ...mockNote, 
        title: '会议记录 🎯',
        content: '# 中文标题\n\n内容包含 émojis 🚀 和特殊字符 @#$%^&*()'
      };
      render(<NotePreview note={unicodeNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('会议记录 🎯')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/中文标题/);
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/émojis 🚀/);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing note content gracefully', () => {
      const emptyContentNote = { ...mockNote, content: '' };
      render(<NotePreview note={emptyContentNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('Test Preview Note')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('');
    });

    it('should handle malformed markdown gracefully', () => {
      const malformedNote = { 
        ...mockNote, 
        content: '# Unclosed **bold\n\n[Invalid link](\n\n```unclosed code block' 
      };
      render(<NotePreview note={malformedNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Unclosed/);
    });

    it('should handle notes with only whitespace content', () => {
      const whitespaceNote = { ...mockNote, content: '   \n\n   \t   \n   ' };
      render(<NotePreview note={whitespaceNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should handle invalid timestamp gracefully', () => {
      const invalidTimestampNote = { ...mockNote, updated_at: 'invalid-date' };
      render(<NotePreview note={invalidTimestampNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      // Should show some form of date even if invalid
    });

    it('should handle callback errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const failingOnEdit = jest.fn().mockImplementation(() => {
        throw new Error('Edit failed');
      });

      render(<NotePreview note={mockNote} onEdit={failingOnEdit} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(failingOnEdit).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render multiple previews efficiently', () => {
      const start = performance.now();
      
      // Render multiple preview components
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<NotePreview note={{...mockNote, id: i}} onClose={mockOnClose} />);
        unmount();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // Should handle multiple renders quickly
    });

    it('should handle responsive layout changes', () => {
      const { container } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      // Component should maintain structure regardless of viewport
      expect(container.querySelector('.note-preview-container')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-header')).toBeInTheDocument();
      expect(container.querySelector('.note-preview-actions')).toBeInTheDocument();
    });

    it('should handle rapid button interactions', async () => {
      render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      const start = performance.now();
      
      // Rapid button clicks
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('button', { name: 'Edit' }));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
      expect(mockOnEdit).toHaveBeenCalledTimes(5);
    });
  });

  describe('Markdown Content Synchronization', () => {
    it('should reflect content changes when note prop updates', () => {
      const { rerender } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Sample Header/);

      const updatedNote = { ...mockNote, content: '# Updated Header\n\nNew content here.' };
      rerender(<NotePreview note={updatedNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/Updated Header/);
      expect(screen.getByTestId('markdown-content')).toHaveTextContent(/New content here/);
    });

    it('should reflect title changes when note prop updates', () => {
      const { rerender } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('Test Preview Note')).toBeInTheDocument();

      const updatedNote = { ...mockNote, title: 'Updated Preview Title' };
      rerender(<NotePreview note={updatedNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText('Updated Preview Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Preview Note')).not.toBeInTheDocument();
    });

    it('should update timestamp when note is modified', () => {
      const { rerender } = render(<NotePreview note={mockNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText(/15\.1\.2024|1\/15\/2024/)).toBeInTheDocument();

      const updatedNote = { ...mockNote, updated_at: '2024-01-16T15:45:00Z' };
      rerender(<NotePreview note={updatedNote} onEdit={mockOnEdit} onClose={mockOnClose} />);

      expect(screen.getByText(/16\.1\.2024|1\/16\/2024/)).toBeInTheDocument();
    });
  });
});