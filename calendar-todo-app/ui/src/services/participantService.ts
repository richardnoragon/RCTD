import { invoke } from '@tauri-apps/api/tauri';

export interface Participant {
  id?: number;
  name: string;
  email?: string;
  avatar_location?: string;
  created_at?: string;
  updated_at?: string;
}

export const participantService = {
  async getParticipants(): Promise<Participant[]> {
    return invoke('get_participants');
  },

  async createParticipant(participant: Participant): Promise<number> {
    return invoke('create_participant', { participant });
  },

  async updateParticipant(participant: Participant): Promise<void> {
    return invoke('update_participant', { participant });
  },

  async deleteParticipant(id: number): Promise<void> {
    return invoke('delete_participant', { id });
  },

  async getEventParticipants(eventId: number): Promise<Participant[]> {
    return invoke('get_event_participants', { eventId });
  },

  async addParticipantToEvent(eventId: number, participantId: number): Promise<void> {
    return invoke('add_participant_to_event', { eventId, participantId });
  },

  async removeParticipantFromEvent(eventId: number, participantId: number): Promise<void> {
    return invoke('remove_participant_from_event', { eventId, participantId });
  },

  async importParticipantsCsv(csvData: string): Promise<void> {
    return invoke('import_participants_csv', { csvData });
  },

  async exportParticipantsCsv(): Promise<string> {
    return invoke('export_participants_csv');
  }
};
