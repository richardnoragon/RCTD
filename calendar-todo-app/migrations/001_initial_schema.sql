-- Initial schema for Calendar Todo App

PRAGMA foreign_keys = ON;

-- Base tables
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#808080', -- Default gray color
    symbol TEXT NOT NULL DEFAULT 'circle',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar_location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE recurring_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY')),
    interval INTEGER NOT NULL DEFAULT 1,
    days_of_week TEXT, -- JSON array of weekday numbers (0-6)
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    month_of_year INTEGER CHECK (month_of_year BETWEEN 1 AND 12),
    end_date TEXT,
    end_occurrences INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE kanban_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    column_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Core functionality tables
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL, -- ISO 8601 format
    end_time TEXT NOT NULL, -- ISO 8601 format
    is_all_day BOOLEAN NOT NULL DEFAULT 0,
    location TEXT,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    recurring_rule_id INTEGER REFERENCES recurring_rules(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE event_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    original_date TEXT NOT NULL, -- ISO 8601 date of the exception
    is_cancelled BOOLEAN NOT NULL DEFAULT 0,
    modified_title TEXT,
    modified_description TEXT,
    modified_start_time TEXT,
    modified_end_time TEXT,
    modified_location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT, -- ISO 8601 format, optional
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    recurring_rule_id INTEGER REFERENCES recurring_rules(id) ON DELETE SET NULL,
    kanban_column_id INTEGER REFERENCES kanban_columns(id) ON DELETE SET NULL,
    kanban_order INTEGER,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT 'VIEW_ONLY' CHECK (permissions IN ('VIEW_ONLY', 'EDIT')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Relationship tables
CREATE TABLE event_participants (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (event_id, participant_id)
);

CREATE TABLE event_notes (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (event_id, note_id)
);

CREATE TABLE task_notes (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (task_id, note_id)
);

-- Supporting functionality tables
CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL CHECK (item_type IN ('EVENT', 'TASK')),
    item_id INTEGER NOT NULL,
    trigger_time TEXT NOT NULL, -- ISO 8601 format
    offset_description TEXT NOT NULL, -- e.g., '15 minutes before'
    is_dismissed BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (item_type, item_id)
);

CREATE TABLE time_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL CHECK (item_type IN ('EVENT', 'TASK', 'CATEGORY', 'MANUAL')),
    item_id INTEGER,
    start_time TEXT NOT NULL, -- ISO 8601 format
    end_time TEXT, -- ISO 8601 format, NULL if ongoing
    duration_seconds INTEGER,
    timer_type TEXT NOT NULL CHECK (timer_type IN ('MANUAL', 'POMODORO', 'COUNTDOWN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE holiday_feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT 1,
    last_sync_time TEXT,
    sync_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_recurring_rule ON events(recurring_rule_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_end_time ON events(end_time);

CREATE INDEX idx_tasks_category ON tasks(category_id);
CREATE INDEX idx_tasks_recurring_rule ON tasks(recurring_rule_id);
CREATE INDEX idx_tasks_kanban_column ON tasks(kanban_column_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_event_exceptions_event ON event_exceptions(event_id);
CREATE INDEX idx_event_exceptions_date ON event_exceptions(original_date);

CREATE INDEX idx_reminders_item ON reminders(item_type, item_id);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_time);

CREATE INDEX idx_time_tracking_item ON time_tracking(item_type, item_id);
CREATE INDEX idx_time_tracking_start ON time_tracking(start_time);

-- Default data
INSERT INTO kanban_columns (name, column_order) VALUES
    ('To Do', 0),
    ('In Progress', 1),
    ('Completed', 2);

-- Insert some default settings
INSERT INTO settings (key, value) VALUES
    ('default_view', 'week'),
    ('week_start_day', '1'), -- Monday
    ('pomodoro_work_minutes', '25'),
    ('pomodoro_break_minutes', '5'),
    ('pomodoro_long_break_minutes', '15'),
    ('pomodoro_long_break_interval', '4');

-- Triggers for updated_at
CREATE TRIGGER categories_updated_at AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER participants_updated_at AFTER UPDATE ON participants
BEGIN
    UPDATE participants SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER kanban_columns_updated_at AFTER UPDATE ON kanban_columns
BEGIN
    UPDATE kanban_columns SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER events_updated_at AFTER UPDATE ON events
BEGIN
    UPDATE events SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER tasks_updated_at AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER notes_updated_at AFTER UPDATE ON notes
BEGIN
    UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER holiday_feeds_updated_at AFTER UPDATE ON holiday_feeds
BEGIN
    UPDATE holiday_feeds SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER settings_updated_at AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = datetime('now') WHERE key = NEW.key;
END;
