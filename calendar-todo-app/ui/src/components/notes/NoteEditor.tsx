import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note, NoteLink } from '../../services/noteService';
import './Notes.css';

interface NoteEditorProps {
  note?: Note;
  linkedItems?: { type: 'event' | 'task'; id: number; title: string }[];
  onSubmit: (note: Note) => Promise<void>;
  onUnlink?: (link: NoteLink) => Promise<void>;
  onCancel: () => void;
}

export function NoteEditor({  note,  linkedItems = [],
  onSubmit,
  onUnlink,
  onCancel,
}: NoteEditorProps) {
  const [formData, setFormData] = React.useState<Note>({
    title: note?.title || '',
    content: note?.content || '',
    ...note,
  });
  const [isPreview, setIsPreview] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleUnlink = async (type: 'event' | 'task', id: number) => {
    if (note?.id && onUnlink) {
      await onUnlink({
        note_id: note.id,
        entity_type: type,
        entity_id: id,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          placeholder="Note title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="note-editor-content">
        <div className="note-editor-tabs">
          <button
            type="button"
            className={`note-editor-tab ${!isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(false)}
          >
            Edit
          </button>
          <button
            type="button"
            className={`note-editor-tab ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(true)}
          >
            Preview
          </button>
        </div>

        {isPreview ? (
          <div className="note-preview">
            <ReactMarkdown>{formData.content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your note in Markdown..."
            required
          />
        )}
      </div>

      {linkedItems && linkedItems.length > 0 && (
        <div className="note-link-section">
          <h4>Linked Items</h4>
          <div className="note-link-list">
            {linkedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="note-link-item">
                <span>{item.title}</span>
                {onUnlink && (
                  <button
                    type="button"
                    onClick={() => handleUnlink(item.type, item.id)}
                    title="Remove link"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="note-form-actions">
        <button type="submit">{note ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
