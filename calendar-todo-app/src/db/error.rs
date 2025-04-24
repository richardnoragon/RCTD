use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Migration error: {0}")]
    Migration(String),
    
    #[error("Data error: {0}")]
    Data(String),
}

pub type DbResult<T> = Result<T, DatabaseError>;
