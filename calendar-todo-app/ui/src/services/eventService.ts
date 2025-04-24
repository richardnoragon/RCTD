import { invoke } from '@tauri-apps/api/tauri';

export interface Event {
  id?: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string;
  priority: number;
  category_id?: number;
}

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
