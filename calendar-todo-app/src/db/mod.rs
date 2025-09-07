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
    pub fn new() -> Result<Self> {
        let db_path = Self::get_database_path()?;
        fs::create_dir_all(db_path.parent().unwrap())?;
        
        let conn = Connection::open(&db_path)?;
        let db = Database { conn };
        db.initialize()?;
        Ok(db)
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
        
        Ok(())
    }

    fn initialize_in_memory(&self) -> Result<()> {
        // Enable foreign key constraints
        self.conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Execute in-memory schema for testing
        self.conn.execute_batch(&Self::get_test_schema())?;
        
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
