import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../../services/noteService';
import './Notes.css';

interface NotePreviewProps {
  note: Note;
  onEdit?: () => void;
  onClose: () => void;
}

export const NotePreview = (props: NotePreviewProps) => {
  const { note, onEdit, onClose } = props;
  
  return (
    <div className="note-preview-container">
      <div className="note-preview-header">
        <h3>{note.title}</h3>
        <div className="note-preview-actions">
          {onEdit && <button onClick={onEdit}>Edit</button>}
          <button onClick={onClose}>Close</button>
        </div>
      </div>      <div className="note-preview-content">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
      {note.updated_at && (
        <div className="note-preview-footer">
          <small>Last updated: {new Date(note.updated_at).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
};
