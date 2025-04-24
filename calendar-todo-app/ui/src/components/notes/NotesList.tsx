import React from 'react';
import { Note, noteService } from '../../services/noteService';
import { NoteEditor } from './NoteEditor';
import { NotePreview } from './NotePreview';
import './Notes.css';

interface NotesListProps {
  entityType?: 'event' | 'task';  entityId?: number;
}

export function NotesList({ entityType, entityId }: NotesListProps) {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  React.useEffect(() => {
    loadNotes();
  }, [entityType, entityId]);

  const loadNotes = async () => {
    try {
      let loadedNotes: Note[];
      if (entityType && entityId) {
        loadedNotes = await noteService.getNotesForEntity(entityType, entityId);
      } else {
        loadedNotes = await noteService.getNotes();
      }
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleCreateNote = async (note: Note) => {
    try {
      const noteId = await noteService.createNote(note);
      if (entityType && entityId) {
        await noteService.linkNoteToEntity({
          note_id: noteId,
          entity_type: entityType,
          entity_id: entityId,
        });
      }
      await loadNotes();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (note: Note) => {
    try {
      await noteService.updateNote(note);
      await loadNotes();
      setSelectedNote(null);
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteService.deleteNote(id);
        await loadNotes();
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleUnlinkNote = async (noteId: number) => {
    if (entityType && entityId && window.confirm('Are you sure you want to unlink this note?')) {
      try {
        await noteService.unlinkNoteFromEntity({
          note_id: noteId,
          entity_type: entityType,
          entity_id: entityId,
        });
        await loadNotes();
      } catch (error) {
        console.error('Failed to unlink note:', error);
      }
    }
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h3>{entityType ? `Notes for ${entityType}` : 'All Notes'}</h3>
        <button onClick={() => setShowCreateForm(true)}>Create Note</button>
      </div>

      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-item">
            <div className="note-item-content" onClick={() => {
              setSelectedNote(note);
              setShowEditor(false);
            }}>
              <h4>{note.title}</h4>
              <small>
                {new Date(note.updated_at || '').toLocaleDateString()}
              </small>
            </div>
            <div className="note-item-actions">
              <button onClick={() => {
                setSelectedNote(note);
                setShowEditor(true);
              }}>
                Edit
              </button>
              {entityType && entityId ? (
                <button onClick={() => handleUnlinkNote(note.id!)}>
                  Unlink
                </button>
              ) : (
                <button onClick={() => handleDeleteNote(note.id!)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="modal">
          <NoteEditor
            onSubmit={handleCreateNote}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {selectedNote && (
        <div className="modal">
          {showEditor ? (
            <NoteEditor
              note={selectedNote}
              onSubmit={handleUpdateNote}
              onCancel={() => {
                setSelectedNote(null);
                setShowEditor(false);
              }}
            />
          ) : (
            <NotePreview
              note={selectedNote}
              onEdit={() => setShowEditor(true)}
              onClose={() => setSelectedNote(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};
