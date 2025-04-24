import { invoke } from '@tauri-apps/api/tauri';

export interface RecurringRule {
  id?: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUALLY';
  interval: number;
  days_of_week?: string; // JSON array of weekday numbers (0-6)
  day_of_month?: number;
  month_of_year?: number;
  end_date?: string;
  end_occurrences?: number;
}

export const recurringService = {
  async createRecurringRule(rule: RecurringRule): Promise<number> {
    return invoke('create_recurring_rule', { rule });
  },

  async updateRecurringRule(rule: RecurringRule): Promise<void> {
    return invoke('update_recurring_rule', { rule });
  },

  async getRecurringRule(id: number): Promise<RecurringRule> {
    return invoke('get_recurring_rule', { id });
  },

  async expandRecurringEvents(eventId: number, startDate: string, endDate: string): Promise<any[]> {
    return invoke('expand_recurring_events', { eventId, startDate, endDate });
  },
};
