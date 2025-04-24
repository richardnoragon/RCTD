import { invoke } from '@tauri-apps/api/tauri';

export interface TimeEntry {
  id?: number;
  item_type: 'EVENT' | 'TASK' | 'CATEGORY' | 'MANUAL';
  item_id?: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  timer_type: 'MANUAL' | 'POMODORO' | 'COUNTDOWN';
  created_at?: string;
}

export const timeTrackingService = {
  async startTimer(entry: TimeEntry): Promise<number> {
    return invoke('start_timer', { entry });
  },

  async stopTimer(id: number, endTime: string): Promise<void> {
    return invoke('stop_timer', { id, endTime });
  },

  async getActiveTimer(): Promise<TimeEntry | null> {
    return invoke('get_active_timer');
  },

  async getTimeEntries(params: {
    item_type?: 'EVENT' | 'TASK' | 'CATEGORY' | 'MANUAL';
    item_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<TimeEntry[]> {
    return invoke('get_time_entries', params);
  }
};
