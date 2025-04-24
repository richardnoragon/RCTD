import { invoke } from '@tauri-apps/api/tauri';

export interface Reminder {
  id?: number;
  item_type: 'EVENT' | 'TASK';
  item_id: number;
  trigger_time: string;
  offset_description: string;
  is_dismissed: boolean;
  created_at?: string;
}

export const reminderService = {
  async createReminder(reminder: Reminder): Promise<number> {
    return invoke('create_reminder', { reminder });
  },

  async getReminder(item_type: 'EVENT' | 'TASK', item_id: number): Promise<Reminder | null> {
    return invoke('get_reminder', { item_type, item_id });
  },

  async updateReminder(reminder: Reminder): Promise<void> {
    return invoke('update_reminder', { reminder });
  },

  async deleteReminder(item_type: 'EVENT' | 'TASK', item_id: number): Promise<void> {
    return invoke('delete_reminder', { item_type, item_id });
  },

  async getPendingReminders(): Promise<Reminder[]> {
    return invoke('get_pending_reminders');
  }
};
