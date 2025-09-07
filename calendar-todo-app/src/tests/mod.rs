use crate::db::Database;

pub mod category_tests;
pub mod event_tests;
pub mod kanban_tests;
pub mod note_tests;
pub mod participant_tests;
pub mod recurring_tests;
pub mod task_tests;
pub mod time_tracking_tests;
pub mod search_tests;
pub mod reminder_tests;
pub mod holiday_feed_tests;
pub mod models_tests;
pub mod operations_tests;
pub mod test_utilities;

// Helper function to create a test database
pub fn setup_test_db() -> Database {
    let db = Database::new_in_memory().expect("Failed to create test database");
    db
}

// Enhanced test database with specific schema
pub fn setup_test_db_with_data() -> Database {
    let db = setup_test_db();
    seed_test_data(&db);
    db
}

// Seed test database with sample data
pub fn seed_test_data(db: &Database) {
    let conn = db.get_connection();
    
    // Seed categories
    conn.execute(
        "INSERT INTO categories (name, color, symbol) VALUES
         ('Work', '#FF0000', 'circle'),
         ('Personal', '#00FF00', 'square'),
         ('Health', '#0000FF', 'triangle')",
        [],
    ).expect("Failed to seed categories");
    
    // Seed recurring rules
    conn.execute(
        "INSERT INTO recurring_rules (frequency, interval_value, days_of_week) VALUES
         ('WEEKLY', 1, '1,3,5'),
         ('MONTHLY', 1, NULL),
         ('DAILY', 2, NULL)",
        [],
    ).expect("Failed to seed recurring rules");
    
    // Seed events
    conn.execute(
        "INSERT INTO events (title, description, start_time, end_time, is_all_day, location, priority, category_id) VALUES
         ('Morning Standup', 'Daily team standup', '2023-01-16 09:00:00', '2023-01-16 09:30:00', 0, 'Conference Room A', 2, 1),
         ('Lunch Break', 'Personal time', '2023-01-16 12:00:00', '2023-01-16 13:00:00', 0, NULL, 3, 2),
         ('Doctor Appointment', 'Annual checkup', '2023-01-17 14:00:00', '2023-01-17 15:00:00', 0, 'Medical Center', 1, 3)",
        [],
    ).expect("Failed to seed events");
    
    // Seed tasks
    conn.execute(
        "INSERT INTO tasks (title, description, due_date, priority, status, category_id, kanban_column_id, kanban_order) VALUES
         ('Complete project proposal', 'Write and submit the Q1 project proposal', '2023-01-31 17:00:00', 1, 'TODO', 1, 1, 1),
         ('Buy groceries', 'Weekly grocery shopping', '2023-01-18 19:00:00', 3, 'TODO', 2, 1, 2),
         ('Exercise routine', 'Complete 30-minute workout', '2023-01-16 18:00:00', 2, 'IN_PROGRESS', 3, 2, 1)",
        [],
    ).expect("Failed to seed tasks");
}

// Clean up test database
pub fn cleanup_test_db(db: &Database) {
    let conn = db.get_connection();
    
    // Clear all tables in reverse dependency order
    let _ = conn.execute("DELETE FROM tasks", []);
    let _ = conn.execute("DELETE FROM events", []);
    let _ = conn.execute("DELETE FROM recurring_rules", []);
    let _ = conn.execute("DELETE FROM categories", []);
    
    // Reset autoincrement counters
    let _ = conn.execute("DELETE FROM sqlite_sequence", []);
}
