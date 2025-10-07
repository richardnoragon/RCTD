import { invoke } from '@tauri-apps/api/tauri';
import type { Event } from '../types/Event';

export const eventService = {
  async getEventsInRange(start: string, end: string): Promise<Event[]> {
    return invoke('get_events_in_range', { start, end });
  },

  async createEvent(event: Event): Promise<number> {
    return invoke('create_event', { event });
  },

  async updateEvent(event: Event): Promise<void> {
    return invoke('update_event', { event });
  },

  async deleteEvent(id: number): Promise<void> {
    return invoke('delete_event', { id });
  },
};
