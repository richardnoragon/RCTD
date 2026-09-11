use anyhow::Result;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use directories::ProjectDirs;

pub mod models;
pub mod operations;
pub mod error;

pub use error::{DatabaseError, DbResult};

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new<P: AsRef<std::path::Path>>(db_path: P) -> Result<Self> {
        let db_path = db_path.as_ref();
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.initialize()?;
        Ok(db)
    }

    pub fn new_default() -> Result<Self> {
        let db_path = Self::get_database_path()?;
        Self::new(db_path)
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.initialize_in_memory()?;
        Ok(db)
    }

    fn get_database_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("dev", "calendar", "todo")
            .ok_or_else(|| anyhow::anyhow!("Could not determine project directories"))?;
        
        let data_dir = proj_dirs.data_dir();
        Ok(data_dir.join("calendar_todo.db"))
    }

    fn initialize(&self) -> Result<()> {
        // Enable foreign key constraints
        self.conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Read and execute the migration file
        let migration_path = std::env::current_dir()?.join("migrations").join("001_initial_schema.sql");
        let migration_sql = fs::read_to_string(migration_path)?;
        
        self.conn.execute_batch(&migration_sql)?;
        self.apply_performance_indexes()?;
        self.apply_search_indexes()?;
        
        Ok(())
    }

    fn initialize_in_memory(&self) -> Result<()> {
        // Enable foreign key constraints
        self.conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Execute in-memory schema for testing
        self.conn.execute_batch(&Self::get_test_schema())?;
        self.apply_performance_indexes()?;
        self.apply_search_indexes()?;
        
        Ok(())
    }

    fn apply_performance_indexes(&self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE INDEX IF NOT EXISTS idx_events_time_window ON events(start_time, end_time);
            CREATE INDEX IF NOT EXISTS idx_events_category_start ON events(category_id, start_time);

            CREATE INDEX IF NOT EXISTS idx_tasks_status_order ON tasks(status, kanban_order, id);
            CREATE INDEX IF NOT EXISTS idx_tasks_column_order ON tasks(kanban_column_id, kanban_order, id);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_order ON tasks(due_date, kanban_order, id);
            CREATE INDEX IF NOT EXISTS idx_tasks_category_due ON tasks(category_id, due_date);

            CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
            "#,
        )?;

        Ok(())
    }

    fn apply_search_indexes(&self) -> Result<()> {
        let fts_sql = r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                entity_type UNINDEXED,
                entity_id UNINDEXED,
                title,
                content,
                tokenize = 'porter unicode61'
            );

            DELETE FROM search_index;

            INSERT INTO search_index(entity_type, entity_id, title, content)
            SELECT 'EVENT', id, title, COALESCE(description, '') || ' ' || COALESCE(location, '')
            FROM events;

            INSERT INTO search_index(entity_type, entity_id, title, content)
            SELECT 'TASK', id, title, COALESCE(description, '')
            FROM tasks;

            INSERT INTO search_index(entity_type, entity_id, title, content)
            SELECT 'NOTE', id, COALESCE(title, ''), COALESCE(content, '')
            FROM notes;

            CREATE TRIGGER IF NOT EXISTS events_search_ai AFTER INSERT ON events BEGIN
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('EVENT', NEW.id, NEW.title, COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.location, ''));
            END;

            CREATE TRIGGER IF NOT EXISTS events_search_ad AFTER DELETE ON events BEGIN
                DELETE FROM search_index WHERE entity_type = 'EVENT' AND entity_id = OLD.id;
            END;

            CREATE TRIGGER IF NOT EXISTS events_search_au AFTER UPDATE ON events BEGIN
                DELETE FROM search_index WHERE entity_type = 'EVENT' AND entity_id = OLD.id;
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('EVENT', NEW.id, NEW.title, COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.location, ''));
            END;

            CREATE TRIGGER IF NOT EXISTS tasks_search_ai AFTER INSERT ON tasks BEGIN
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('TASK', NEW.id, NEW.title, COALESCE(NEW.description, ''));
            END;

            CREATE TRIGGER IF NOT EXISTS tasks_search_ad AFTER DELETE ON tasks BEGIN
                DELETE FROM search_index WHERE entity_type = 'TASK' AND entity_id = OLD.id;
            END;

            CREATE TRIGGER IF NOT EXISTS tasks_search_au AFTER UPDATE ON tasks BEGIN
                DELETE FROM search_index WHERE entity_type = 'TASK' AND entity_id = OLD.id;
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('TASK', NEW.id, NEW.title, COALESCE(NEW.description, ''));
            END;

            CREATE TRIGGER IF NOT EXISTS notes_search_ai AFTER INSERT ON notes BEGIN
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('NOTE', NEW.id, COALESCE(NEW.title, ''), COALESCE(NEW.content, ''));
            END;

            CREATE TRIGGER IF NOT EXISTS notes_search_ad AFTER DELETE ON notes BEGIN
                DELETE FROM search_index WHERE entity_type = 'NOTE' AND entity_id = OLD.id;
            END;

            CREATE TRIGGER IF NOT EXISTS notes_search_au AFTER UPDATE ON notes BEGIN
                DELETE FROM search_index WHERE entity_type = 'NOTE' AND entity_id = OLD.id;
                INSERT INTO search_index(entity_type, entity_id, title, content)
                VALUES ('NOTE', NEW.id, COALESCE(NEW.title, ''), COALESCE(NEW.content, ''));
            END;
        "#;

        if self.conn.execute_batch(fts_sql).is_err() {
            // SQLite builds without FTS5 support should gracefully fall back to the original LIKE-based path.
        }

        Ok(())
    }

    pub fn run_migrations(&self) -> Result<()> {
        self.initialize()
    }

    fn get_test_schema() -> &'static str {
        r#"
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            symbol TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recurring_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
            interval_value INTEGER NOT NULL DEFAULT 1,
            days_of_week TEXT,
            day_of_month INTEGER,
            month_of_year INTEGER,
            end_date DATETIME,
            end_occurrences INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            is_all_day BOOLEAN NOT NULL DEFAULT 0,
            location TEXT,
            priority INTEGER NOT NULL DEFAULT 3,
            category_id INTEGER,
            recurring_rule_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS kanban_columns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            due_date DATETIME,
            priority INTEGER NOT NULL DEFAULT 3,
            status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

        CREATE TABLE IF NOT EXISTS reminder_delivery_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
            delivery_key TEXT NOT NULL UNIQUE,
            claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_reminder_delivery_log_reminder_id ON reminder_delivery_log(reminder_id);
        CREATE INDEX IF NOT EXISTS idx_reminder_delivery_log_claimed_at ON reminder_delivery_log(claimed_at);
            category_id INTEGER,
            recurring_rule_id INTEGER,
            kanban_column_id INTEGER,
            kanban_order INTEGER,
            completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE SET NULL,
            FOREIGN KEY (kanban_column_id) REFERENCES kanban_columns(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT OR IGNORE INTO kanban_columns (name, position) VALUES
            ('To Do', 1),
            ('In Progress', 2),
            ('Completed', 3);
        "#
    }

    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }
}
