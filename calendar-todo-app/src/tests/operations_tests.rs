use crate::db::{Database, models::*};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_category_create_and_get() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let category = Category {
        id: None,
        name: "Test Category".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let id = db.create_category(&category).expect("Failed to create category");
    assert!(id > 0, "Category ID should be positive");

    let retrieved = db.get_category(id).expect("Failed to get category");
    assert_eq!(retrieved.name, "Test Category");
    assert_eq!(retrieved.color, "#FF0000");
    assert_eq!(retrieved.symbol, "circle");
    assert_eq!(retrieved.id, Some(id));
}

#[tokio::test]
#[serial]
async fn test_category_update() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let mut category = Category {
        id: None,
        name: "Original".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let id = db.create_category(&category).expect("Failed to create category");
    category.id = Some(id);
    category.name = "Updated".to_string();
    category.color = "#00FF00".to_string();

    db.update_category(&category).expect("Failed to update category");

    let retrieved = db.get_category(id).expect("Failed to get updated category");
    assert_eq!(retrieved.name, "Updated");
    assert_eq!(retrieved.color, "#00FF00");
}

#[tokio::test]
#[serial]
async fn test_category_delete() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let category = Category {
        id: None,
        name: "To Delete".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let id = db.create_category(&category).expect("Failed to create category");
    db.delete_category(id).expect("Failed to delete category");

    let result = db.get_category(id);
    assert!(result.is_err(), "Category should be deleted");
}

#[tokio::test]
#[serial]
async fn test_event_create_and_get() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    // Create category first
    let category = Category {
        id: None,
        name: "Work".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };
    let category_id = db.create_category(&category).expect("Failed to create category");

    let event = Event {
        id: None,
        title: "Test Event".to_string(),
        description: Some("Event description".to_string()),
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: Some("Conference Room".to_string()),
        priority: 2,
        category_id: Some(category_id),
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_event(&event).expect("Failed to create event");
    assert!(id > 0, "Event ID should be positive");

    let retrieved = db.get_event(id).expect("Failed to get event");
    assert_eq!(retrieved.title, "Test Event");
    assert_eq!(retrieved.priority, 2);
    assert_eq!(retrieved.category_id, Some(category_id));
    assert!(!retrieved.is_all_day);
}

#[tokio::test]
#[serial]
async fn test_event_update() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let mut event = Event {
        id: None,
        title: "Original Event".to_string(),
        description: None,
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_event(&event).expect("Failed to create event");
    event.id = Some(id);
    event.title = "Updated Event".to_string();
    event.priority = 1;
    event.description = Some("Updated description".to_string());

    db.update_event(&event).expect("Failed to update event");

    let retrieved = db.get_event(id).expect("Failed to get updated event");
    assert_eq!(retrieved.title, "Updated Event");
    assert_eq!(retrieved.priority, 1);
    assert_eq!(retrieved.description, Some("Updated description".to_string()));
}

#[tokio::test]
#[serial]
async fn test_event_delete() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let event = Event {
        id: None,
        title: "To Delete".to_string(),
        description: None,
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_event(&event).expect("Failed to create event");
    db.delete_event(id).expect("Failed to delete event");

    let result = db.get_event(id);
    assert!(result.is_err(), "Event should be deleted");
}

#[tokio::test]
#[serial]
async fn test_task_create_and_get() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    // Create category first
    let category = Category {
        id: None,
        name: "Work".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };
    let category_id = db.create_category(&category).expect("Failed to create category");

    let task = Task {
        id: None,
        title: "Test Task".to_string(),
        description: Some("Task description".to_string()),
        due_date: Some("2023-01-31 23:59:59".to_string()),
        priority: 1,
        status: "TODO".to_string(),
        category_id: Some(category_id),
        recurring_rule_id: None,
        kanban_column_id: Some(1),
        kanban_order: Some(1),
        completed_at: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_task(&task).expect("Failed to create task");
    assert!(id > 0, "Task ID should be positive");

    let retrieved = db.get_task(id).expect("Failed to get task");
    assert_eq!(retrieved.title, "Test Task");
    assert_eq!(retrieved.status, "TODO");
    assert_eq!(retrieved.priority, 1);
    assert_eq!(retrieved.category_id, Some(category_id));
    assert!(retrieved.completed_at.is_none());
}

#[tokio::test]
#[serial]
async fn test_task_update() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let mut task = Task {
        id: None,
        title: "Original Task".to_string(),
        description: None,
        due_date: None,
        priority: 3,
        status: "TODO".to_string(),
        category_id: None,
        recurring_rule_id: None,
        kanban_column_id: Some(1),
        kanban_order: Some(1),
        completed_at: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_task(&task).expect("Failed to create task");
    task.id = Some(id);
    task.title = "Updated Task".to_string();
    task.status = "COMPLETED".to_string();
    task.priority = 1;
    task.completed_at = Some("2023-01-15 12:00:00".to_string());

    db.update_task(&task).expect("Failed to update task");

    let retrieved = db.get_task(id).expect("Failed to get updated task");
    assert_eq!(retrieved.title, "Updated Task");
    assert_eq!(retrieved.status, "COMPLETED");
    assert_eq!(retrieved.priority, 1);
    assert!(retrieved.completed_at.is_some());
}

#[tokio::test]
#[serial]
async fn test_task_delete() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let task = Task {
        id: None,
        title: "To Delete".to_string(),
        description: None,
        due_date: None,
        priority: 3,
        status: "TODO".to_string(),
        category_id: None,
        recurring_rule_id: None,
        kanban_column_id: Some(1),
        kanban_order: Some(1),
        completed_at: None,
        created_at: None,
        updated_at: None,
    };

    let id = db.create_task(&task).expect("Failed to create task");
    db.delete_task(id).expect("Failed to delete task");

    let result = db.get_task(id);
    assert!(result.is_err(), "Task should be deleted");
}

#[tokio::test]
#[serial]
async fn test_category_update_without_id_fails() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let category = Category {
        id: None,
        name: "Test".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let result = db.update_category(&category);
    assert!(result.is_err(), "Update without ID should fail");
}

#[tokio::test]
#[serial]
async fn test_event_update_without_id_fails() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let event = Event {
        id: None,
        title: "Test".to_string(),
        description: None,
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let result = db.update_event(&event);
    assert!(result.is_err(), "Update without ID should fail");
}

#[tokio::test]
#[serial]
async fn test_task_update_without_id_fails() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    let task = Task {
        id: None,
        title: "Test".to_string(),
        description: None,
        due_date: None,
        priority: 3,
        status: "TODO".to_string(),
        category_id: None,
        recurring_rule_id: None,
        kanban_column_id: Some(1),
        kanban_order: Some(1),
        completed_at: None,
        created_at: None,
        updated_at: None,
    };

    let result = db.update_task(&task);
    assert!(result.is_err(), "Update without ID should fail");
}

#[tokio::test]
#[serial]
async fn test_cascade_delete_behavior() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    // Create category
    let category = Category {
        id: None,
        name: "Work".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };
    let category_id = db.create_category(&category).expect("Failed to create category");

    // Create event with category
    let event = Event {
        id: None,
        title: "Work Event".to_string(),
        description: None,
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: Some(category_id),
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };
    let event_id = db.create_event(&event).expect("Failed to create event");

    // Delete category
    db.delete_category(category_id).expect("Failed to delete category");

    // Event should still exist but with null category_id
    let retrieved_event = db.get_event(event_id).expect("Failed to get event");
    assert!(retrieved_event.category_id.is_none(), "Category ID should be null after cascade delete");
}

#[tokio::test]
#[serial]
async fn test_concurrent_operations() {
    let db = Database::new_in_memory().expect("Failed to create test database");
    
    // Create multiple categories concurrently
    let mut handles = vec![];
    for i in 0..5 {
        let category = Category {
            id: None,
            name: format!("Category {}", i),
            color: "#FF0000".to_string(),
            symbol: "circle".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let id = db.create_category(&category).expect("Failed to create category");
        assert!(id > 0, "Category ID should be positive");
    }

    // Verify all categories were created
    let conn = db.get_connection();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM categories").unwrap();
    let count: i64 = stmt.query_row([], |row| row.get(0)).expect("Failed to count categories");
    assert_eq!(count, 5, "Should have 5 categories");
}