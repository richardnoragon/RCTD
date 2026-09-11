-- Query optimization indexes for issue #6
PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_events_time_window ON events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_category_start ON events(category_id, start_time);

CREATE INDEX IF NOT EXISTS idx_tasks_status_order ON tasks(status, kanban_order, id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_order ON tasks(kanban_column_id, kanban_order, id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_order ON tasks(due_date, kanban_order, id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_due ON tasks(category_id, due_date);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
