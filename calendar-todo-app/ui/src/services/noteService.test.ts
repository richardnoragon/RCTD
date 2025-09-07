import { noteService } from './noteService';

// Mock setup is handled in setupTests.ts
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Note Service', () => {
  beforeEach(() => {
    globalThis.resetMocks();
  });

  describe('CRUD Operations', () => {
    describe('getNotes', () => {
      it('should fetch notes successfully', async () => {
        const mockNotes = [
          {
            id: 1,
            title: 'Meeting Notes',
            content: 'Discussion points from team meeting',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            title: 'Project Ideas',
            content: 'Brainstorming session results',
            created_at: '2024-01-16T14:00:00Z',
            updated_at: '2024-01-16T14:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_notes', mockNotes);

        const result = await noteService.getNotes();
        expect(result).toEqual(mockNotes);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_notes');
      });

      it('should handle empty notes list', async () => {
        globalThis.setMockResponse('get_notes', []);

        const result = await noteService.getNotes();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle network errors', async () => {
        globalThis.setMockError('get_notes', 'Failed to fetch notes');

        await expect(noteService.getNotes()).rejects.toThrow('Failed to fetch notes');
      });
    });

    describe('createNote', () => {
      it('should create a note successfully', async () => {
        const newNote = {
          title: 'New Note',
          content: 'This is a new note content'
        };
        const mockId = 1;

        globalThis.setMockResponse('create_note', mockId);

        const result = await noteService.createNote(newNote);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_note', { note: newNote });
      });

      it('should handle note creation with all fields', async () => {
        const newNote = {
          id: 3,
          title: 'Detailed Note',
          content: 'Comprehensive note content with details',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        };
        const mockId = 3;

        globalThis.setMockResponse('create_note', mockId);

        const result = await noteService.createNote(newNote);
        expect(result).toBe(mockId);
      });

      it('should handle creation errors', async () => {
        const newNote = {
          title: '',
          content: 'Content without title'
        };

        globalThis.setMockError('create_note', 'Note title cannot be empty');

        await expect(noteService.createNote(newNote)).rejects.toThrow('Note title cannot be empty');
      });
    });

    describe('updateNote', () => {
      it('should update a note successfully', async () => {
        const noteToUpdate = {
          id: 1,
          title: 'Updated Note',
          content: 'Updated content',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        };

        globalThis.setMockResponse('update_note', undefined);

        await noteService.updateNote(noteToUpdate);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_note', { note: noteToUpdate });
      });

      it('should handle update errors', async () => {
        const noteToUpdate = {
          id: 999,
          title: 'Non-existent Note',
          content: 'Content'
        };

        globalThis.setMockError('update_note', 'Note not found');

        await expect(noteService.updateNote(noteToUpdate)).rejects.toThrow('Note not found');
      });
    });

    describe('deleteNote', () => {
      it('should delete a note successfully', async () => {
        const noteId = 1;
        globalThis.setMockResponse('delete_note', undefined);

        await noteService.deleteNote(noteId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('delete_note', { id: noteId });
      });

      it('should handle deletion errors', async () => {
        const noteId = 999;
        globalThis.setMockError('delete_note', 'Note not found');

        await expect(noteService.deleteNote(noteId)).rejects.toThrow('Note not found');
      });
    });
  });

  describe('Note Linking Operations', () => {
    describe('linkNoteToEntity', () => {
      it('should link note to event successfully', async () => {
        const noteLink = {
          note_id: 1,
          entity_type: 'event' as const,
          entity_id: 5
        };

        globalThis.setMockResponse('link_note', undefined);

        await noteService.linkNoteToEntity(noteLink);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('link_note', { link: noteLink });
      });

      it('should link note to task successfully', async () => {
        const noteLink = {
          note_id: 2,
          entity_type: 'task' as const,
          entity_id: 10
        };

        globalThis.setMockResponse('link_note', undefined);

        await noteService.linkNoteToEntity(noteLink);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('link_note', { link: noteLink });
      });

      it('should handle linking errors', async () => {
        const invalidLink = {
          note_id: 999,
          entity_type: 'event' as const,
          entity_id: 999
        };

        globalThis.setMockError('link_note', 'Note or entity not found');

        await expect(noteService.linkNoteToEntity(invalidLink)).rejects.toThrow('Note or entity not found');
      });
    });

    describe('unlinkNoteFromEntity', () => {
      it('should unlink note from entity successfully', async () => {
        const noteLink = {
          note_id: 1,
          entity_type: 'event' as const,
          entity_id: 5
        };

        globalThis.setMockResponse('unlink_note', undefined);

        await noteService.unlinkNoteFromEntity(noteLink);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('unlink_note', { link: noteLink });
      });

      it('should handle unlinking errors', async () => {
        const invalidLink = {
          note_id: 999,
          entity_type: 'task' as const,
          entity_id: 999
        };

        globalThis.setMockError('unlink_note', 'Link not found');

        await expect(noteService.unlinkNoteFromEntity(invalidLink)).rejects.toThrow('Link not found');
      });
    });

    describe('getNotesForEntity', () => {
      it('should fetch notes for event successfully', async () => {
        const mockNotes = [
          {
            id: 1,
            title: 'Event Note 1',
            content: 'Notes for this event',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            title: 'Event Note 2',
            content: 'Additional event notes',
            created_at: '2024-01-15T11:00:00Z',
            updated_at: '2024-01-15T11:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_notes_for_entity', mockNotes);

        const result = await noteService.getNotesForEntity('event', 5);
        expect(result).toEqual(mockNotes);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'event',
          entityId: 5
        });
      });

      it('should fetch notes for task successfully', async () => {
        const mockNotes = [
          {
            id: 3,
            title: 'Task Note',
            content: 'Notes related to this task',
            created_at: '2024-01-16T09:00:00Z',
            updated_at: '2024-01-16T09:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_notes_for_entity', mockNotes);

        const result = await noteService.getNotesForEntity('task', 10);
        expect(result).toEqual(mockNotes);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_notes_for_entity', {
          entityType: 'task',
          entityId: 10
        });
      });

      it('should handle empty notes for entity', async () => {
        globalThis.setMockResponse('get_notes_for_entity', []);

        const result = await noteService.getNotesForEntity('event', 999);
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle entity not found errors', async () => {
        globalThis.setMockError('get_notes_for_entity', 'Entity not found');

        await expect(noteService.getNotesForEntity('event', 999)).rejects.toThrow('Entity not found');
      });
    });
  });

  describe('Data Validation', () => {
    describe('Note Content Validation', () => {
      it('should handle notes with markdown content', async () => {
        const markdownNote = {
          title: 'Markdown Note',
          content: '# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2'
        };

        globalThis.setMockResponse('create_note', 5);

        const result = await noteService.createNote(markdownNote);
        expect(result).toBe(5);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_note', { note: markdownNote });
      });

      it('should handle notes with special characters', async () => {
        const specialNote = {
          title: 'Special Characters & Symbols 🎯',
          content: 'Content with special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./'
        };

        globalThis.setMockResponse('create_note', 6);

        const result = await noteService.createNote(specialNote);
        expect(result).toBe(6);
      });

      it('should handle very long note content', async () => {
        const longNote = {
          title: 'Long Note',
          content: 'A'.repeat(10000) // 10KB content
        };

        globalThis.setMockResponse('create_note', 7);

        const result = await noteService.createNote(longNote);
        expect(result).toBe(7);
      });

      it('should handle empty content', async () => {
        const emptyContentNote = {
          title: 'Empty Content Note',
          content: ''
        };

        globalThis.setMockResponse('create_note', 8);

        const result = await noteService.createNote(emptyContentNote);
        expect(result).toBe(8);
      });

      it('should handle unicode content', async () => {
        const unicodeNote = {
          title: '会议记录',
          content: '今天的会议讨论了以下内容：\n1. 项目进度\n2. 技术方案\n3. 时间安排'
        };

        globalThis.setMockResponse('create_note', 9);

        const result = await noteService.createNote(unicodeNote);
        expect(result).toBe(9);
      });
    });

    describe('Title Validation', () => {
      it('should handle long titles', async () => {
        const longTitleNote = {
          title: 'T'.repeat(255),
          content: 'Content for long title note'
        };

        globalThis.setMockResponse('create_note', 10);

        const result = await noteService.createNote(longTitleNote);
        expect(result).toBe(10);
      });

      it('should handle empty title validation', async () => {
        const emptyTitleNote = {
          title: '',
          content: 'Content without title'
        };

        globalThis.setMockError('create_note', 'Note title cannot be empty');

        await expect(noteService.createNote(emptyTitleNote)).rejects.toThrow('Note title cannot be empty');
      });
    });
  });

  describe('Entity Linking Validation', () => {
    it('should validate entity type restrictions', async () => {
      const validEntityTypes = ['event', 'task'];
      
      for (const entityType of validEntityTypes) {
        const link = {
          note_id: 1,
          entity_type: entityType as 'event' | 'task',
          entity_id: 1
        };

        globalThis.setMockResponse('link_note', undefined);
        await noteService.linkNoteToEntity(link);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('link_note', { link });
      }
    });

    it('should handle duplicate link attempts', async () => {
      const duplicateLink = {
        note_id: 1,
        entity_type: 'event' as const,
        entity_id: 5
      };

      globalThis.setMockError('link_note', 'Link already exists');

      await expect(noteService.linkNoteToEntity(duplicateLink)).rejects.toThrow('Link already exists');
    });

    it('should handle multiple notes per entity', async () => {
      const entityNotes = [
        {
          id: 1,
          title: 'Note 1 for Event',
          content: 'First note content',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: 'Note 2 for Event',
          content: 'Second note content',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        }
      ];

      globalThis.setMockResponse('get_notes_for_entity', entityNotes);

      const result = await noteService.getNotesForEntity('event', 5);
      expect(result).toEqual(entityNotes);
      expect(result).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      globalThis.setMockError('get_notes', 'Database connection failed');

      await expect(noteService.getNotes()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      globalThis.setMockError('create_note', 'Request timeout');

      const note = {
        title: 'Timeout Test',
        content: 'Content'
      };

      await expect(noteService.createNote(note)).rejects.toThrow('Request timeout');
    });

    it('should handle concurrent modification errors', async () => {
      const note = {
        id: 1,
        title: 'Concurrent Test',
        content: 'Modified content'
      };

      globalThis.setMockError('update_note', 'Note was modified by another user');

      await expect(noteService.updateNote(note)).rejects.toThrow('Note was modified by another user');
    });

    it('should handle permission errors', async () => {
      globalThis.setMockError('delete_note', 'Insufficient permissions');

      await expect(noteService.deleteNote(1)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle bulk note operations', async () => {
      const notes = Array.from({ length: 50 }, (_, i) => ({
        title: `Bulk Note ${i + 1}`,
        content: `Content for note ${i + 1}`
      }));

      // Mock successful creation for each note
      for (let i = 0; i < notes.length; i++) {
        globalThis.setMockResponse('create_note', i + 100);
        const result = await noteService.createNote(notes[i]);
        expect(result).toBe(i + 100);
      }
    });

    it('should handle rapid successive API calls', async () => {
      globalThis.setMockResponse('get_notes', []);

      const promises = Array.from({ length: 10 }, () => noteService.getNotes());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toEqual([]);
      });
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(10);
    });

    it('should handle large note datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Note ${i + 1}`,
        content: `Content for note ${i + 1}`,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }));

      globalThis.setMockResponse('get_notes', largeDataset);

      const result = await noteService.getNotes();
      expect(result).toEqual(largeDataset);
      expect(result).toHaveLength(1000);
    });

    it('should handle complex linking scenarios', async () => {
      // Link one note to multiple entities
      const multiLink = [
        { note_id: 1, entity_type: 'event' as const, entity_id: 5 },
        { note_id: 1, entity_type: 'task' as const, entity_id: 10 }
      ];

      globalThis.setMockResponse('link_note', undefined);

      for (const link of multiLink) {
        await noteService.linkNoteToEntity(link);
      }

      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Workflows', () => {
    it('should handle complete note workflow', async () => {
      // Create note
      const newNote = {
        title: 'Integration Test Note',
        content: 'Content for integration testing'
      };
      globalThis.setMockResponse('create_note', 1);
      const noteId = await noteService.createNote(newNote);
      expect(noteId).toBe(1);

      // Link to event
      const eventLink = {
        note_id: noteId,
        entity_type: 'event' as const,
        entity_id: 5
      };
      globalThis.setMockResponse('link_note', undefined);
      await noteService.linkNoteToEntity(eventLink);

      // Update note
      const updatedNote = {
        id: noteId,
        title: 'Updated Integration Note',
        content: 'Updated content for integration testing'
      };
      globalThis.setMockResponse('update_note', undefined);
      await noteService.updateNote(updatedNote);

      // Get notes for entity
      const linkedNotes = [updatedNote];
      globalThis.setMockResponse('get_notes_for_entity', linkedNotes);
      const entityNotes = await noteService.getNotesForEntity('event', 5);
      expect(entityNotes).toEqual(linkedNotes);

      // Unlink note
      globalThis.setMockResponse('unlink_note', undefined);
      await noteService.unlinkNoteFromEntity(eventLink);

      // Delete note
      globalThis.setMockResponse('delete_note', undefined);
      await noteService.deleteNote(noteId);
    });

    it('should handle note sharing between entities', async () => {
      const sharedNote = {
        id: 1,
        title: 'Shared Note',
        content: 'This note is shared between event and task',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      // Link to both event and task
      const eventLink = { note_id: 1, entity_type: 'event' as const, entity_id: 5 };
      const taskLink = { note_id: 1, entity_type: 'task' as const, entity_id: 10 };

      globalThis.setMockResponse('link_note', undefined);
      await noteService.linkNoteToEntity(eventLink);
      await noteService.linkNoteToEntity(taskLink);

      // Verify note appears for both entities
      globalThis.setMockResponse('get_notes_for_entity', [sharedNote]);
      
      const eventNotes = await noteService.getNotesForEntity('event', 5);
      expect(eventNotes).toContain(sharedNote);
      
      const taskNotes = await noteService.getNotesForEntity('task', 10);
      expect(taskNotes).toContain(sharedNote);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce Note interface compliance', async () => {
      const validNote = {
        title: 'Type Test Note',
        content: 'Content for type testing'
      };

      globalThis.setMockResponse('create_note', 999);

      const result = await noteService.createNote(validNote);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should enforce NoteLink interface compliance', async () => {
      const validLink = {
        note_id: 1,
        entity_type: 'event' as const,
        entity_id: 5
      };

      globalThis.setMockResponse('link_note', undefined);

      await noteService.linkNoteToEntity(validLink);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('link_note', { link: validLink });
    });

    it('should handle optional fields correctly', async () => {
      const noteWithOptionalFields = {
        id: 1,
        title: 'Optional Fields Test',
        content: 'Content',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      };

      globalThis.setMockResponse('update_note', undefined);

      await noteService.updateNote(noteWithOptionalFields);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_note', { note: noteWithOptionalFields });
    });
  });
});