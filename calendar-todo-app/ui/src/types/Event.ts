export interface Event {
  id?: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  location?: string;
  priority?: number;
  category_id?: number;
  recurring_rule_id?: number;
}
