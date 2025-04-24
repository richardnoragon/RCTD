use super::setup_test_db;
use crate::services::{event_service, task_service, search_service};
use std::time::Instant;
use crate::db::models::{Event, Task};

#[tokio::test]
async fn test_search_performance() {
    let db = setup_test_db();
    let db_state = tauri::State::new(db);
    
    // Insert test data
    for i in 0..100 {
        let event = Event {
            id: None,
            title: format!("Test Event {}", i),
            description: Some(format!("Description for event {}", i)),
            start_time: "2025-04-11T10:00:00Z".to_string(),
            end_time: "2025-04-11T11:00:00Z".to_string(),
            is_all_day: false,
            location: Some("Test Location".to_string()),
            priority: Some(1),
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        };
        event_service::create_event(event, db_state.clone()).await.unwrap();
    }

    // Measure search performance
    let start = Instant::now();
    let results = search_service::search_all("Test".to_string(), db_state.clone()).await.unwrap();
    let duration = start.elapsed();

    assert!(results.len() > 0);
    assert!(duration.as_millis() < 100, "Search took longer than 100ms: {:?}", duration);
}

#[tokio::test]
async fn test_database_operations_performance() {
    let db = setup_test_db();
    let db_state = tauri::State::new(db);
    
    // Test bulk insert performance
    let start = Instant::now();
    for i in 0..50 {
        let task = Task {
            id: None,
            title: format!("Performance Test Task {}", i),
            description: Some(format!("Description for task {}", i)),
            due_date: Some("2025-04-11T10:00:00Z".to_string()),
            status: "PENDING".to_string(),
            priority: Some(1),
            category_id: None,
            kanban_column_id: None,
            created_at: None,
            updated_at: None,
        };
        task_service::create_task(task, db_state.clone()).await.unwrap();
    }
    let duration = start.elapsed();
    
    assert!(duration.as_millis() < 1000, "Bulk insert took longer than 1000ms: {:?}", duration);
}
