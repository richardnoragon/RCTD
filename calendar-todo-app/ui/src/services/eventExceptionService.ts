import { invoke } from '@tauri-apps/api/tauri';

export interface EventException {
  id?: number;
  event_id: number;
  original_date: string;
  is_cancelled: boolean;
  modified_title?: string;
  modified_description?: string;
  modified_start_time?: string;
  modified_end_time?: string;
  modified_location?: string;
}

export const eventExceptionService = {
  async createException(exception: EventException): Promise<number> {
    return invoke('create_event_exception', { exception });
  },

  async updateException(exception: EventException): Promise<void> {
    return invoke('update_event_exception', { exception });
  },

  async getExceptionsForEvent(eventId: number): Promise<EventException[]> {
    return invoke('get_event_exceptions', { eventId });
  },

  async deleteException(id: number): Promise<void> {
    return invoke('delete_event_exception', { id });
  },
};
