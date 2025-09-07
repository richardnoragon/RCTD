use crate::db::models::*;
use crate::db::Database;
use rusqlite::{Connection, Row};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_category_model_creation() {
    let category = Category {
        id: Some(1),
        name: "Work".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: Some("2023-01-01 00:00:00".to_string()),
        updated_at: Some("2023-01-01 00:00:00".to_string()),
    };

    assert_eq!(category.name, "Work");
    assert_eq!(category.color, "#FF0000");
    assert_eq!(category.symbol, "circle");
    assert!(category.id.is_some());
}

#[tokio::test]
#[serial]
async fn test_category_from_row() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Insert test data
    conn.execute(
        "INSERT INTO categories (name, color, symbol) VALUES (?1, ?2, ?3)",
        ["Test Category", "#00FF00", "square"],
    ).expect("Failed to insert test category");

    // Query and test from_row
    let mut stmt = conn.prepare("SELECT id, name, color, symbol, created_at, updated_at FROM categories WHERE name = ?").unwrap();
    let category = stmt.query_row(["Test Category"], Category::from_row).expect("Failed to query category");

    assert_eq!(category.name, "Test Category");
    assert_eq!(category.color, "#00FF00");
    assert_eq!(category.symbol, "square");
    assert!(category.id.is_some());
}

#[tokio::test]
#[serial]
async fn test_event_model_creation() {
    let event = Event {
        id: Some(1),
        title: "Team Meeting".to_string(),
        description: Some("Weekly team sync".to_string()),
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: Some("Conference Room A".to_string()),
        priority: 2,
        category_id: Some(1),
        recurring_rule_id: None,
        created_at: Some("2023-01-01 00:00:00".to_string()),
        updated_at: Some("2023-01-01 00:00:00".to_string()),
    };

    assert_eq!(event.title, "Team Meeting");
    assert_eq!(event.priority, 2);
    assert!(!event.is_all_day);
    assert!(event.category_id.is_some());
}

#[tokio::test]
#[serial]
async fn test_event_from_row() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Insert test category first
    conn.execute(
        "INSERT INTO categories (name, color, symbol) VALUES (?1, ?2, ?3)",
        ["Work", "#FF0000", "circle"],
    ).expect("Failed to insert test category");

    // Insert test event
    conn.execute(
        "INSERT INTO events (title, description, start_time, end_time, is_all_day, location, priority, category_id) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        [
            "Test Event",
            "Event Description", 
            "2023-01-15 09:00:00",
            "2023-01-15 10:00:00",
            "0",
            "Test Location",
            "3",
            "1"
        ],
    ).expect("Failed to insert test event");

    // Query and test from_row
    let mut stmt = conn.prepare(
        "SELECT id, title, description, start_time, end_time, is_all_day, location, priority, category_id, recurring_rule_id, created_at, updated_at 
         FROM events WHERE title = ?"
    ).unwrap();
    let event = stmt.query_row(["Test Event"], Event::from_row).expect("Failed to query event");

    assert_eq!(event.title, "Test Event");
    assert_eq!(event.description, Some("Event Description".to_string()));
    assert_eq!(event.priority, 3);
    assert!(!event.is_all_day);
    assert_eq!(event.location, Some("Test Location".to_string()));
}

#[tokio::test]
#[serial]
async fn test_task_model_creation() {
    let task = Task {
        id: Some(1),
        title: "Complete Project".to_string(),
        description: Some("Finish the calendar app".to_string()),
        due_date: Some("2023-01-31 23:59:59".to_string()),
        priority: 1,
        status: "TODO".to_string(),
        category_id: Some(1),
        recurring_rule_id: None,
        kanban_column_id: Some(1),
        kanban_order: Some(1),
        completed_at: None,
        created_at: Some("2023-01-01 00:00:00".to_string()),
        updated_at: Some("2023-01-01 00:00:00".to_string()),
    };

    assert_eq!(task.title, "Complete Project");
    assert_eq!(task.status, "TODO");
    assert_eq!(task.priority, 1);
    assert!(task.due_date.is_some());
    assert!(task.completed_at.is_none());
}

#[tokio::test]
#[serial]
async fn test_task_from_row() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Insert test category first
    conn.execute(
        "INSERT INTO categories (name, color, symbol) VALUES (?1, ?2, ?3)",
        ["Work", "#FF0000", "circle"],
    ).expect("Failed to insert test category");

    // Insert test task
    conn.execute(
        "INSERT INTO tasks (title, description, due_date, priority, status, category_id, kanban_column_id, kanban_order) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        [
            "Test Task",
            "Task Description",
            "2023-01-31 23:59:59",
            "2",
            "IN_PROGRESS",
            "1",
            "2",
            "5"
        ],
    ).expect("Failed to insert test task");

    // Query and test from_row
    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, priority, status, category_id, recurring_rule_id, kanban_column_id, kanban_order, completed_at, created_at, updated_at 
         FROM tasks WHERE title = ?"
    ).unwrap();
    let task = stmt.query_row(["Test Task"], Task::from_row).expect("Failed to query task");

    assert_eq!(task.title, "Test Task");
    assert_eq!(task.description, Some("Task Description".to_string()));
    assert_eq!(task.status, "IN_PROGRESS");
    assert_eq!(task.priority, 2);
    assert_eq!(task.kanban_order, Some(5));
}

#[tokio::test]
#[serial]
async fn test_recurring_rule_model_creation() {
    let rule = RecurringRule {
        id: Some(1),
        frequency: "WEEKLY".to_string(),
        interval_value: 2,
        days_of_week: Some("1,3,5".to_string()),
        day_of_month: None,
        month_of_year: None,
        end_date: Some("2023-12-31 23:59:59".to_string()),
        end_occurrences: None,
        created_at: Some("2023-01-01 00:00:00".to_string()),
    };

    assert_eq!(rule.frequency, "WEEKLY");
    assert_eq!(rule.interval_value, 2);
    assert!(rule.days_of_week.is_some());
    assert!(rule.end_date.is_some());
}

#[tokio::test]
#[serial]
async fn test_recurring_rule_from_row() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Insert test recurring rule
    conn.execute(
        "INSERT INTO recurring_rules (frequency, interval_value, days_of_week, end_date) 
         VALUES (?1, ?2, ?3, ?4)",
        ["MONTHLY", "1", "1,15", "2023-12-31 23:59:59"],
    ).expect("Failed to insert test recurring rule");

    // Query and test from_row
    let mut stmt = conn.prepare(
        "SELECT id, frequency, interval_value, days_of_week, day_of_month, month_of_year, end_date, end_occurrences, created_at 
         FROM recurring_rules WHERE frequency = ?"
    ).unwrap();
    let rule = stmt.query_row(["MONTHLY"], RecurringRule::from_row).expect("Failed to query recurring rule");

    assert_eq!(rule.frequency, "MONTHLY");
    assert_eq!(rule.interval_value, 1);
    assert_eq!(rule.days_of_week, Some("1,15".to_string()));
    assert!(rule.id.is_some());
}

#[tokio::test]
#[serial]
async fn test_event_exception_model_creation() {
    let exception = EventException {
        id: Some(1),
        event_id: 1,
        original_date: "2023-01-15".to_string(),
        is_cancelled: false,
        modified_title: Some("Modified Meeting".to_string()),
        modified_description: None,
        modified_start_time: Some("2023-01-15 10:00:00".to_string()),
        modified_end_time: Some("2023-01-15 11:00:00".to_string()),
        modified_location: Some("Room B".to_string()),
        created_at: Some("2023-01-01 00:00:00".to_string()),
    };

    assert_eq!(exception.event_id, 1);
    assert!(!exception.is_cancelled);
    assert!(exception.modified_title.is_some());
    assert!(exception.modified_start_time.is_some());
}

#[tokio::test]
#[serial]
async fn test_model_serialization() {
    let category = Category {
        id: Some(1),
        name: "Test".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: Some("2023-01-01 00:00:00".to_string()),
        updated_at: Some("2023-01-01 00:00:00".to_string()),
    };

    let json = serde_json::to_string(&category).expect("Failed to serialize category");
    let deserialized: Category = serde_json::from_str(&json).expect("Failed to deserialize category");

    assert_eq!(category.name, deserialized.name);
    assert_eq!(category.color, deserialized.color);
    assert_eq!(category.symbol, deserialized.symbol);
}

#[tokio::test]
#[serial]
async fn test_model_cloning() {
    let original = Category {
        id: Some(1),
        name: "Original".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: Some("2023-01-01 00:00:00".to_string()),
        updated_at: Some("2023-01-01 00:00:00".to_string()),
    };

    let cloned = original.clone();
    assert_eq!(original.name, cloned.name);
    assert_eq!(original.id, cloned.id);
}

#[tokio::test]
#[serial]
async fn test_database_constraints() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Test foreign key constraint
    let result = conn.execute(
        "INSERT INTO events (title, start_time, end_time, category_id) VALUES (?1, ?2, ?3, ?4)",
        ["Test Event", "2023-01-15 09:00:00", "2023-01-15 10:00:00", "999"],
    );

    // Should fail due to invalid category_id
    assert!(result.is_err());
}

#[tokio::test]
#[serial]
async fn test_task_status_constraint() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    let conn = db.get_connection();

    // Test invalid status
    let result = conn.execute(
        "INSERT INTO tasks (title, status) VALUES (?1, ?2)",
        ["Test Task", "INVALID_STATUS"],
    );

    // Should fail due to invalid status
    assert!(result.is_err());
}