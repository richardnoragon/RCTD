use anyhow::Result;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use directories::ProjectDirs;

pub struct Database {
    conn: Connection,
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

    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }
}
