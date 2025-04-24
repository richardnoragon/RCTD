use crate::db::Database;

pub mod category_tests;
pub mod event_tests;
pub mod task_tests;
pub mod search_tests;

// Helper function to create a test database
pub fn setup_test_db() -> Database {
    let db = Database::new_in_memory().expect("Failed to create test database");
    // Run migrations
    db.run_migrations().expect("Failed to run migrations");
    db
}
