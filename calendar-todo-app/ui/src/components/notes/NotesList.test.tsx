import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Note } from '../../services/noteService';
import { NotesList } from './NotesList';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock NoteEditor and NotePreview components for isolation
jest.mock('./NoteEditor', () => {
  return {
    NoteEditor: ({ note, onSubmit, onCancel }: any) => (
      <div data-testid="note-editor-mock">
        <span>Note Editor - {note ? 'Edit' : 'Create'} Mode</span>
        <button onClick={() => onSubmit({ title: 'Test Note', content: 'Test Content' })}>
          Submit
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    )
  };
});

jest.mock('./NotePreview', () => {
  return {
    NotePreview: ({ note, onEdit, onClose }: any) => (
      <div data-testid="note-preview-mock">
        <span>Note Preview - {note.title}</span>
        {onEdit && <button onClick={onEdit}>Edit</button>}
        <button onClick={onClose}>Close</button>
      </div>
    )
  };
});

describe('NotesList Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  const mockNotes: Note[] = [
    {
      id: 1,
      title: 'First Note',
      content: '# First Note Content\n\nThis is the first note.',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: 'Second Note',
      content: '## Second Note\n\nSecond note content here.',
      created_at: '2024-01-16T09:00:00Z',
      updated_at: '2024-01-16T09:15:00Z'
    },
    {
      id: 3,
      title: 'Third Note',
      content: 'Simple third note content.',
      created_at: '2024-01-17T14:30:00Z',
      updated_at: '2024-01-17T14:45:00Z'
    }
  ];

  describe('Component Rendering and Basic Structure', () => {
    it('should render notes list with header and create button', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      
      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('All Notes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
        expect(screen.getByText('Third Note')).toBeInTheDocument();
      });
    });

    it('should render entity-specific notes list when entityType provided', async () => {
      const entityNotes = [mockNotes[0], mockNotes[1]];
      (globalThis as any).setMockResponse('get_notes_for_entity', entityNotes);

      render(<NotesList entityType="event" entityId={5} />);

      await waitFor(() => {
        expect(screen.getByText('Notes for event')).toBeInTheDocument();
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
        expect(screen.queryByText('Third Note')).not.toBeInTheDocument();
      });
      
      expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
        entityType: 'event',
        entityId: 5
      });
    });

    it('should render task-specific notes list', async () => {
      const taskNotes = [mockNotes[2]];
      (globalThis as any).setMockResponse('get_notes_for_entity', taskNotes);

      render(<NotesList entityType="task" entityId={10} />);

      await waitFor(() => {
        expect(screen.getByText('Notes for task')).toBeInTheDocument();
        expect(screen.getByText('Third Note')).toBeInTheDocument();
      });
    });

    it('should render empty notes list when no notes available', async () => {
      (globalThis as any).setMockResponse('get_notes', []);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('All Notes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });
    });

    it('should display note timestamps correctly', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        // Use more flexible date matching since different locales format dates differently
        expect(screen.getByText(/15\.1\.2024|1\/15\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/16\.1\.2024|1\/16\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/17\.1\.2024|1\/17\/2024/)).toBeInTheDocument();
      });
    });

    it('should render proper CSS structure for notes list', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      
      const { container } = render(<NotesList />);

      await waitFor(() => {
        expect(container.querySelector('.notes-container')).toBeInTheDocument();
        expect(container.querySelector('.notes-header')).toBeInTheDocument();
        expect(container.querySelector('.notes-list')).toBeInTheDocument();
        expect(container.querySelectorAll('.note-item')).toHaveLength(3);
      });
    });
  });

  describe('CRUD Operations - Create Operations', () => {
    it('should open create note form when create button clicked', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));

      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();
      expect(screen.getByText('Note Editor - Create Mode')).toBeInTheDocument();
    });

    it('should create new note and refresh list', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('create_note', 4);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('create_note', {
          note: { title: 'Test Note', content: 'Test Content' }
        });
      });
    });

    it('should create and link note to entity when entityType provided', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', []);
      (globalThis as any).setMockResponse('create_note', 5);
      (globalThis as any).setMockResponse('link_note', undefined);

      render(<NotesList entityType="event" entityId={15} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('create_note', {
          note: { title: 'Test Note', content: 'Test Content' }
        });
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('link_note', {
          link: {
            note_id: 5,
            entity_type: 'event',
            entity_id: 15
          }
        });
      });
    });

    it('should close create form when cancel clicked', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('note-editor-mock')).not.toBeInTheDocument();
    });

    it('should handle create note errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockError('create_note', 'Create failed');

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to create note:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('CRUD Operations - Read Operations', () => {
    it('should load notes on component mount', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes');
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });
    });

    it('should load entity notes when entityType provided', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', mockNotes.slice(0, 2));

      render(<NotesList entityType="task" entityId={20} />);

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'task',
          entityId: 20
        });
      });
    });

    it('should reload notes when entityType or entityId changes', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', mockNotes);

      const { rerender } = render(<NotesList entityType="event" entityId={1} />);

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'event',
          entityId: 1
        });
      });

      (globalThis as any).mockTauriInvoke.mockClear();
      rerender(<NotesList entityType="task" entityId={2} />);

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'task',
          entityId: 2
        });
      });
    });

    it('should handle load notes errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockError('get_notes', 'Load failed');

      render(<NotesList />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load notes:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should open note preview when note item clicked', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      await user.click(screen.getByText('First Note'));

      expect(screen.getByTestId('note-preview-mock')).toBeInTheDocument();
      expect(screen.getByText('Note Preview - First Note')).toBeInTheDocument();
    });
  });

  describe('CRUD Operations - Update Operations', () => {
    it('should open edit form when edit button clicked', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]); // Click the first Edit button (from note list)

      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();
      expect(screen.getByText('Note Editor - Edit Mode')).toBeInTheDocument();
    });

    it('should update note and refresh list', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('update_note', undefined);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('update_note', {
          note: { title: 'Test Note', content: 'Test Content' }
        });
      });
    });

    it('should switch from preview to edit mode', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Open preview first
      await user.click(screen.getByText('First Note'));
      expect(screen.getByTestId('note-preview-mock')).toBeInTheDocument();

      // Click edit in preview - look for Edit button within the modal
      const previewEditButton = screen.getByTestId('note-preview-mock').querySelector('button');
      if (previewEditButton && previewEditButton.textContent === 'Edit') {
        await user.click(previewEditButton);
      }
      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();
      expect(screen.getByText('Note Editor - Edit Mode')).toBeInTheDocument();
    });

    it('should handle update note errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockError('update_note', 'Update failed');

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update note:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should close edit form and clear selection after update', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('update_note', undefined);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.queryByTestId('note-editor-mock')).not.toBeInTheDocument();
      });
    });
  });

  describe('CRUD Operations - Delete Operations', () => {
    it('should delete note when delete button clicked and confirmed', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('delete_note', undefined);
      window.confirm = jest.fn(() => true);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this note?');
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('delete_note', { id: 1 });
      });
    });

    it('should not delete note when deletion not confirmed', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      window.confirm = jest.fn(() => false);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect((globalThis as any).mockTauriInvoke).not.toHaveBeenCalledWith('delete_note', expect.any(Object));
    });

    it('should handle delete note errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockError('delete_note', 'Delete failed');
      window.confirm = jest.fn(() => true);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to delete note:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should show unlink option instead of delete for entity-specific notes', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', mockNotes.slice(0, 2));

      render(<NotesList entityType="event" entityId={5} />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getAllByText('Unlink')).toHaveLength(2);
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });

    it('should unlink note from entity when unlink clicked and confirmed', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', mockNotes.slice(0, 2));
      (globalThis as any).setMockResponse('unlink_note', undefined);
      window.confirm = jest.fn(() => true);

      render(<NotesList entityType="task" entityId={10} />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const unlinkButtons = screen.getAllByText('Unlink');
      await user.click(unlinkButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to unlink this note?');
      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('unlink_note', {
          link: {
            note_id: 1,
            entity_type: 'task',
            entity_id: 10
          }
        });
      });
    });

    it('should handle unlink note errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockResponse('get_notes_for_entity', mockNotes.slice(0, 1));
      (globalThis as any).setMockError('unlink_note', 'Unlink failed');
      window.confirm = jest.fn(() => true);

      render(<NotesList entityType="event" entityId={15} />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const unlinkButtons = screen.getAllByText('Unlink');
      await user.click(unlinkButtons[0]);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to unlink note:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Search and Filtering Capabilities', () => {
    it('should display all notes when no filters applied', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
        expect(screen.getByText('Third Note')).toBeInTheDocument();
      });
    });

    it('should filter notes by entity type and id', async () => {
      const eventNotes = [mockNotes[0], mockNotes[2]];
      (globalThis as any).setMockResponse('get_notes_for_entity', eventNotes);

      render(<NotesList entityType="event" entityId={25} />);

      await waitFor(() => {
        expect((globalThis as any).mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'event',
          entityId: 25
        });
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Third Note')).toBeInTheDocument();
        expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
      });
    });

    it('should handle empty search results gracefully', async () => {
      (globalThis as any).setMockResponse('get_notes_for_entity', []);

      render(<NotesList entityType="task" entityId={99} />);

      await waitFor(() => {
        expect(screen.getByText('Notes for task')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
        expect(screen.queryByText('First Note')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sorting Mechanisms', () => {
    it('should display notes in correct order by update time', async () => {
      const orderedNotes = [...mockNotes].sort((a, b) => 
        new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
      );
      (globalThis as any).setMockResponse('get_notes', orderedNotes);

      render(<NotesList />);

      await waitFor(() => {
        const noteElements = screen.getAllByRole('heading', { level: 4 });
        expect(noteElements[0]).toHaveTextContent('Third Note'); // Most recent
        expect(noteElements[1]).toHaveTextContent('Second Note');
        expect(noteElements[2]).toHaveTextContent('First Note'); // Oldest
      });
    });

    it('should handle notes with missing timestamps', async () => {
      const notesWithMissingDates = [
        { ...mockNotes[0], updated_at: undefined },
        mockNotes[1],
        { ...mockNotes[2], updated_at: undefined }
      ];
      (globalThis as any).setMockResponse('get_notes', notesWithMissingDates);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
        expect(screen.getByText('Third Note')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination and State Management', () => {
    it('should handle large number of notes efficiently', async () => {
      const manyNotes = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Note ${i + 1}`,
        content: `Content for note ${i + 1}`,
        created_at: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`,
        updated_at: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:30:00Z`
      }));
      (globalThis as any).setMockResponse('get_notes', manyNotes);

      const start = performance.now();
      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('Note 1')).toBeInTheDocument();
        expect(screen.getByText('Note 50')).toBeInTheDocument();
      });
      
      const end = performance.now();
      expect(end - start).toBeLessThan(2000); // Should render quickly
    });

    it('should maintain component state during operations', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Open create form
      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();

      // Cancel and verify state is reset
      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('note-editor-mock')).not.toBeInTheDocument();
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    it('should refresh notes list after create operations', async () => {
      let callCount = 0;
      (globalThis as any).mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_notes') {
          callCount++;
          return Promise.resolve(callCount === 1 ? mockNotes : [...mockNotes, { id: 4, title: 'New Note', content: 'New content' }]);
        }
        return Promise.resolve(4);
      });

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      await user.click(screen.getByText('Submit'));

      // Should call get_notes twice: once on mount, once after create
      await waitFor(() => {
        expect(callCount).toBe(2);
      });
    });

    it('should maintain selection state correctly', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Select first note
      await user.click(screen.getByText('First Note'));
      expect(screen.getByTestId('note-preview-mock')).toBeInTheDocument();

      // Close preview
      await user.click(screen.getByText('Close'));
      expect(screen.queryByTestId('note-preview-mock')).not.toBeInTheDocument();
    });
  });

  describe('Modal and UI State Management', () => {
    it('should show modal when create form is open', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      
      const { container } = render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Note' }));

      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();
    });

    it('should show modal when note preview is open', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      
      const { container } = render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      await user.click(screen.getByText('First Note'));

      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(screen.getByTestId('note-preview-mock')).toBeInTheDocument();
    });

    it('should show modal when edit form is open', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      
      const { container } = render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Click note to open preview
      await user.click(screen.getByText('First Note'));
      // Click edit in preview - use the first Edit button found within the modal
      const modal = container.querySelector('.modal');
      const editButtonInModal = modal?.querySelector('button');
      if (editButtonInModal && editButtonInModal.textContent === 'Edit') {
        await user.click(editButtonInModal);
      }

      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(screen.getByTestId('note-editor-mock')).toBeInTheDocument();
    });

    it('should close modal when operations complete', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('update_note', undefined);
      
      const { container } = render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Open edit form
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      expect(container.querySelector('.modal')).toBeInTheDocument();

      // Submit update
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(container.querySelector('.modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle notes with missing or invalid data', async () => {
      const invalidNotes = [
        { id: 1, title: '', content: '', created_at: '', updated_at: '' },
        { id: 2, title: 'Valid Title', content: 'Valid content', created_at: 'invalid-date', updated_at: 'invalid-date' },
        { id: 3, title: 'Another Note', content: 'Content here', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:30:00Z' }
      ];
      (globalThis as any).setMockResponse('get_notes', invalidNotes);

      render(<NotesList />);

      await waitFor(() => {
        // Should still render notes even with invalid data
        expect(screen.getByText('Valid Title')).toBeInTheDocument();
        expect(screen.getByText('Another Note')).toBeInTheDocument();
      });
    });

    it('should handle service errors during loading', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).setMockError('get_notes', 'Service unavailable');

      render(<NotesList />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load notes:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle rapid user interactions gracefully', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      const start = performance.now();
      
      // Rapid clicking between notes
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('First Note'));
        await user.click(screen.getByText('Close'));
        await user.click(screen.getByText('Second Note'));
        await user.click(screen.getByText('Close'));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000);
      expect(screen.queryByTestId('note-preview-mock')).not.toBeInTheDocument();
    });

    it('should handle component unmount gracefully', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);

      const { unmount } = render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render efficiently with large datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Performance Note ${i + 1}`,
        content: `Content for performance test note ${i + 1}`,
        created_at: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
        updated_at: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z`
      }));
      
      (globalThis as any).setMockResponse('get_notes', largeDataset);

      const start = performance.now();
      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('Performance Note 1')).toBeInTheDocument();
      });
      
      const end = performance.now();
      const renderTime = end - start;
      
      expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds
    });

    it('should handle multiple simultaneous operations', async () => {
      (globalThis as any).setMockResponse('get_notes', mockNotes);
      (globalThis as any).setMockResponse('create_note', 4);
      (globalThis as any).setMockResponse('update_note', undefined);
      (globalThis as any).setMockResponse('delete_note', undefined);

      render(<NotesList />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Simulate multiple operations quickly
      await user.click(screen.getByRole('button', { name: 'Create Note' }));
      await user.click(screen.getByText('Cancel'));
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      await user.click(screen.getByText('Cancel'));
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });
  });
});