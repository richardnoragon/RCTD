import { invoke } from '@tauri-apps/api/tauri';

export interface HolidayFeed {
  id?: number;
  url: string;
  name: string;
  is_visible: boolean;
  last_sync_time?: string;
  sync_error?: string;
  created_at?: string;
  updated_at?: string;
}

export const holidayFeedService = {
  async getHolidayFeeds(): Promise<HolidayFeed[]> {
    return invoke('get_holiday_feeds');
  },

  async createHolidayFeed(feed: HolidayFeed): Promise<number> {
    return invoke('create_holiday_feed', { feed });
  },

  async updateHolidayFeed(feed: HolidayFeed): Promise<void> {
    return invoke('update_holiday_feed', { feed });
  },

  async deleteHolidayFeed(id: number): Promise<void> {
    return invoke('delete_holiday_feed', { id });
  },

  async syncHolidayFeed(id: number): Promise<void> {
    return invoke('sync_holiday_feed', { id });
  }
};
