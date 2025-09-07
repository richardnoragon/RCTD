import '@testing-library/jest-dom';

// Simple and effective Tauri API mocks
const mockResponses: Record<string, any> = {
  // Category service mocks
  get_categories: [],
  create_category: 1,
  update_category: undefined,
  delete_category: undefined,
  export_categories: '[]',
  import_categories: undefined,
  
  // Event service mocks  
  get_events_in_range: [],
  create_event: 1,
  update_event: undefined,
  delete_event: undefined,
  
  // Task service mocks
  get_tasks: [],
  get_tasks_in_column: [],
  create_task: 1,
  update_task: undefined,
  delete_task: undefined,
  update_task_status: undefined,
  update_task_order: undefined,
  
  // Search service mocks
  search_all: [],
  
  // Kanban service mocks
  get_kanban_columns: [],
  create_kanban_column: 1,
  update_kanban_column: undefined,
  delete_kanban_column: undefined,
  
  // Recurring service mocks
  create_recurring_rule: 1,
  get_recurring_rule: null,
  update_recurring_rule: undefined,
  expand_recurring_events: [],
  
  // Note service mocks
  get_notes: [],
  create_note: 1,
  update_note: undefined,
  delete_note: undefined,
  link_note: undefined,
  unlink_note: undefined,
  get_notes_for_entity: [],
  
  // Participant service mocks
  get_participants: [],
  create_participant: 1,
  update_participant: undefined,
  delete_participant: undefined,
  get_event_participants: [],
  add_participant_to_event: undefined,
  remove_participant_from_event: undefined,
  import_participants_csv: undefined,
  export_participants_csv: '',
  
  // Time tracking service mocks
  start_timer: 1,
  stop_timer: undefined,
  get_active_timer: null,
  get_time_entries: [],
  
  // Event exception service mocks
  create_event_exception: 1,
  update_event_exception: undefined,
  get_event_exceptions: [],
  delete_event_exception: undefined,
  
  // Holiday feed service mocks
  get_holiday_feeds: [],
  create_holiday_feed: 1,
  update_holiday_feed: undefined,
  delete_holiday_feed: undefined,
  sync_holiday_feed: undefined,
  
  // Reminder service mocks
  create_reminder: 1,
  get_reminder: null,
  update_reminder: undefined,
  delete_reminder: undefined,
  get_pending_reminders: [],
};

const mockInvoke = jest.fn().mockImplementation((command: string) => {
  if (Object.prototype.hasOwnProperty.call(mockResponses, command)) {
    return Promise.resolve(mockResponses[command]);
  }
  return Promise.resolve(null);
});

// Mock the Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke
}));

// Global test utilities
(globalThis as any).mockTauriInvoke = mockInvoke;
(globalThis as any).setMockResponse = (command: string, response: any) => {
  mockResponses[command] = response;
};
(globalThis as any).setMockError = (command: string, error: string) => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === command) {
      return Promise.reject(new Error(error));
    }
    return Promise.resolve(mockResponses[cmd] || null);
  });
};
(globalThis as any).resetMocks = () => {
  mockInvoke.mockClear();
  mockInvoke.mockImplementation((command: string) => {
    return Promise.resolve(mockResponses[command] || null);
  });
};

// Reset mocks before each test
beforeEach(() => {
  (globalThis as any).resetMocks();
});
