import { invoke } from '@tauri-apps/api/tauri';

export interface Note {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteLink {
  id?: number;
  note_id: number;
  entity_type: 'event' | 'task';
  entity_id: number;
}

export const noteService = {
  async getNotes(): Promise<Note[]> {
    return invoke('get_notes');
  },

  async createNote(note: Note): Promise<number> {
    return invoke('create_note', { note });
  },

  async updateNote(note: Note): Promise<void> {
    return invoke('update_note', { note });
  },

  async deleteNote(id: number): Promise<void> {
    return invoke('delete_note', { id });
  },

  async linkNoteToEntity(link: NoteLink): Promise<void> {
    return invoke('link_note', { link });
  },

  async unlinkNoteFromEntity(link: NoteLink): Promise<void> {
    return invoke('unlink_note', { link });
  },

  async getNotesForEntity(entityType: 'event' | 'task', entityId: number): Promise<Note[]> {
    return invoke('get_notes_for_entity', { entityType, entityId });
  },
};
