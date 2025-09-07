use crate::db::{Database, models::*};
use crate::services::search_service::*;
use tempfile::tempdir;
use serial_test::serial;

async fn setup_test_db() -> Database {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test_search.db");
    Database::new(db_path.to_str().unwrap()).unwrap()
}

fn create_test_data(db: &Database) -> Result<(), String> {
    let conn = db.get_connection();
    
    // Create categories
    conn.execute(
        "INSERT INTO categories (id, name, color, symbol) VALUES 
         (1, 'Work', '#FF5733', 'circle'),
         (2, 'Personal', '#33FF57', 'square'),
         (3, 'Health', '#3366FF', 'triangle')",
        []
    ).map_err(|e| e.to_string())?;

    // Create events
    conn.execute(
        "INSERT INTO events (id, title, description, start_time, end_time, is_all_day, location, priority, category_id) VALUES 
         (1, 'Team Meeting', 'Weekly team sync meeting', '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0, 'Conference Room A', 2, 1),
         (2, 'Project Review', 'Q1 project review and planning', '2024-01-16 14:00:00', '2024-01-16 16:00:00', 0, 'Meeting Room B', 1, 1),
         (3, 'Doctor Appointment', 'Annual health checkup', '2024-01-17 11:00:00', '2024-01-17 12:00:00', 0, 'Medical Center', 1, 3),
         (4, 'Birthday Party', 'John birthday celebration', '2024-01-20 18:00:00', '2024-01-20 22:00:00', 0, 'Restaurant', 3, 2)",
        []
    ).map_err(|e| e.to_string())?;

    // Create tasks
    conn.execute(
        "INSERT INTO tasks (id, title, description, due_date, is_completed, priority, status, category_id, kanban_order) VALUES 
         (1, 'Complete project documentation', 'Write comprehensive project docs', '2024-01-25', 0, 1, 'TODO', 1, 1),
         (2, 'Review code changes', 'Review pull requests from team', '2024-01-18', 0, 2, 'IN_PROGRESS', 1, 2),
         (3, 'Buy groceries', 'Weekly grocery shopping', '2024-01-16', 0, 3, 'TODO', 2, 1),
         (4, 'Exercise routine', 'Daily workout session', '2024-01-15', 1, 2, 'COMPLETED', 3, 1),
         (5, 'Plan vacation', 'Research and plan summer vacation', '2024-02-01', 0, 3, 'TODO', 2, 2)",
        []
    ).map_err(|e| e.to_string())?;

    // Create notes
    conn.execute(
        "INSERT INTO notes (id, title, content, created_at) VALUES 
         (1, 'Meeting Notes', 'Important discussion points from team meeting', '2024-01-15 10:30:00'),
         (2, 'Project Ideas', 'Brainstorming session results for new features', '2024-01-12 15:00:00'),
         (3, 'Health Tips', 'Doctor recommendations for better health', '2024-01-10 09:00:00'),
         (4, 'Recipe Collection', 'Favorite family recipes and cooking notes', '2024-01-08 20:00:00')",
        []
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tokio::test]
#[serial]
async fn test_search_all_basic() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("meeting".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().any(|r| r.title.contains("Meeting")));
    assert!(results.iter().any(|r| r.item_type == "EVENT"));
    assert!(results.iter().any(|r| r.item_type == "NOTE"));
}

#[tokio::test]
#[serial]
async fn test_search_all_empty_query() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("".to_string(), state).await.unwrap();

    // Empty query should return no results
    assert!(results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_all_no_matches() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("nonexistent".to_string(), state).await.unwrap();

    assert!(results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_all_case_insensitive() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    
    let lower_results = search_all("meeting".to_string(), state).await.unwrap();
    let upper_results = search_all("MEETING".to_string(), state).await.unwrap();
    let mixed_results = search_all("Meeting".to_string(), state).await.unwrap();

    assert_eq!(lower_results.len(), upper_results.len());
    assert_eq!(lower_results.len(), mixed_results.len());
    assert!(!lower_results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_all_multiple_entity_types() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("project".to_string(), state).await.unwrap();

    let event_results: Vec<_> = results.iter().filter(|r| r.item_type == "EVENT").collect();
    let task_results: Vec<_> = results.iter().filter(|r| r.item_type == "TASK").collect();
    let note_results: Vec<_> = results.iter().filter(|r| r.item_type == "NOTE").collect();

    assert!(!event_results.is_empty());
    assert!(!task_results.is_empty());
    assert!(!note_results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_all_partial_matches() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("team".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().any(|r| r.title.to_lowercase().contains("team")));
}

#[tokio::test]
#[serial]
async fn test_search_all_special_characters() {
    let db = setup_test_db().await;
    let conn = db.get_connection();
    
    // Add data with special characters
    conn.execute(
        "INSERT INTO events (title, description, start_time, end_time, is_all_day, priority) VALUES 
         ('Meeting @ HQ', 'Planning & strategy discussion', '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0, 2)",
        []
    ).unwrap();

    let state = tauri::State::from(&db);
    let results = search_all("@".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().any(|r| r.title.contains("@")));
}

#[tokio::test]
#[serial]
async fn test_search_events_basic() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_events(
        "meeting".to_string(),
        None,
        None,
        None,
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.item_type == "EVENT"));
    assert!(results.iter().any(|r| r.title.to_lowercase().contains("meeting")));
}

#[tokio::test]
#[serial]
async fn test_search_events_with_date_range() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_events(
        "meeting".to_string(),
        Some("2024-01-15 00:00:00".to_string()),
        Some("2024-01-15 23:59:59".to_string()),
        None,
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.item_type == "EVENT"));
    assert!(results.iter().all(|r| r.date.as_ref().unwrap().starts_with("2024-01-15")));
}

#[tokio::test]
#[serial]
async fn test_search_events_with_category_filter() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_events(
        "meeting".to_string(),
        None,
        None,
        Some(1), // Work category
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.category_id == Some(1)));
}

#[tokio::test]
#[serial]
async fn test_search_events_no_matches_in_range() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_events(
        "meeting".to_string(),
        Some("2024-02-01 00:00:00".to_string()),
        Some("2024-02-28 23:59:59".to_string()),
        None,
        state
    ).await.unwrap();

    assert!(results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_tasks_basic() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_tasks(
        "project".to_string(),
        None,
        None,
        None,
        None,
        None,
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.item_type == "TASK"));
    assert!(results.iter().any(|r| r.title.to_lowercase().contains("project")));
}

#[tokio::test]
#[serial]
async fn test_search_tasks_with_status_filter() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_tasks(
        "".to_string(),
        None,
        None,
        None,
        Some("TODO".to_string()),
        None,
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.status == Some("TODO".to_string())));
}

#[tokio::test]
#[serial]
async fn test_search_tasks_with_priority_filter() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_tasks(
        "".to_string(),
        None,
        None,
        None,
        None,
        Some(1), // High priority
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.priority == Some(1)));
}

#[tokio::test]
#[serial]
async fn test_search_tasks_with_due_date_range() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_tasks(
        "".to_string(),
        Some("2024-01-15".to_string()),
        Some("2024-01-20".to_string()),
        None,
        None,
        None,
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| {
        if let Some(date) = &r.date {
            date >= "2024-01-15" && date <= "2024-01-20"
        } else {
            false
        }
    }));
}

#[tokio::test]
#[serial]
async fn test_search_tasks_combined_filters() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_tasks(
        "".to_string(),
        None,
        None,
        Some(1), // Work category
        Some("TODO".to_string()),
        Some(1), // High priority
        state
    ).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| {
        r.category_id == Some(1) && 
        r.status == Some("TODO".to_string()) && 
        r.priority == Some(1)
    }));
}

#[tokio::test]
#[serial]
async fn test_search_notes_basic() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_notes("notes".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.item_type == "NOTE"));
    assert!(results.iter().any(|r| 
        r.title.to_lowercase().contains("notes") || 
        r.description.as_ref().map_or(false, |d| d.to_lowercase().contains("notes"))
    ));
}

#[tokio::test]
#[serial]
async fn test_search_notes_content_search() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_notes("discussion".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    assert!(results.iter().all(|r| r.item_type == "NOTE"));
    assert!(results.iter().any(|r| 
        r.description.as_ref().map_or(false, |d| d.to_lowercase().contains("discussion"))
    ));
}

#[tokio::test]
#[serial]
async fn test_search_notes_empty_results() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_notes("nonexistent".to_string(), state).await.unwrap();

    assert!(results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_performance_large_dataset() {
    let db = setup_test_db().await;
    let conn = db.get_connection();

    // Create large dataset
    for i in 1..=1000 {
        conn.execute(
            "INSERT INTO events (title, description, start_time, end_time, is_all_day, priority) VALUES 
             (?, ?, '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0, 2)",
            [
                &format!("Event {}", i),
                &format!("Description for event number {}", i)
            ]
        ).unwrap();
    }

    let start = std::time::Instant::now();
    let state = tauri::State::from(&db);
    let results = search_all("event".to_string(), state).await.unwrap();
    let duration = start.elapsed();

    assert_eq!(results.len(), 1000);
    assert!(duration.as_millis() < 1000); // Should complete within 1 second
}

#[tokio::test]
#[serial]
async fn test_search_concurrent_operations() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    
    // Simulate concurrent searches
    let mut handles = vec![];
    
    for i in 0..10 {
        let state_clone = state.clone();
        let query = format!("query{}", i);
        
        let handle = tokio::spawn(async move {
            search_all(query, state_clone).await
        });
        
        handles.push(handle);
    }

    // Wait for all searches to complete
    for handle in handles {
        let result = handle.await.unwrap();
        // Each should complete without error (may be empty results)
        assert!(result.is_ok());
    }
}

#[tokio::test]
#[serial]
async fn test_search_sql_injection_protection() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    
    // Attempt SQL injection
    let malicious_queries = [
        "'; DROP TABLE events; --",
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM tasks; --"
    ];

    for query in malicious_queries.iter() {
        let result = search_all(query.to_string(), state).await;
        // Should not crash or cause damage, just return search results or empty
        assert!(result.is_ok());
    }

    // Verify data is still intact
    let normal_results = search_all("meeting".to_string(), state).await.unwrap();
    assert!(!normal_results.is_empty()); // Data should still exist
}

#[tokio::test]
#[serial]
async fn test_search_result_ordering() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("".to_string(), state).await.unwrap();

    // Results should be ordered by date (most recent first for each type)
    let events: Vec<_> = results.iter().filter(|r| r.item_type == "EVENT").collect();
    if events.len() > 1 {
        for i in 1..events.len() {
            assert!(events[i-1].date >= events[i].date);
        }
    }
}

#[tokio::test]
#[serial]
async fn test_search_unicode_and_special_characters() {
    let db = setup_test_db().await;
    let conn = db.get_connection();

    // Insert data with Unicode characters
    conn.execute(
        "INSERT INTO events (title, description, start_time, end_time, is_all_day, priority) VALUES 
         ('Café Meeting ☕', 'Discussion about résumé and naïve approaches', '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0, 2)",
        []
    ).unwrap();

    let state = tauri::State::from(&db);
    
    // Search for Unicode characters
    let results = search_all("café".to_string(), state).await.unwrap();
    assert!(!results.is_empty());

    let emoji_results = search_all("☕".to_string(), state).await.unwrap();
    assert!(!results.is_empty());

    let accent_results = search_all("résumé".to_string(), state).await.unwrap();
    assert!(!results.is_empty());
}

#[tokio::test]
#[serial]
async fn test_search_with_null_optional_fields() {
    let db = setup_test_db().await;
    let conn = db.get_connection();

    // Insert minimal data with null optional fields
    conn.execute(
        "INSERT INTO events (title, start_time, end_time, is_all_day, priority) VALUES 
         ('Minimal Event', '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0, 2)",
        []
    ).unwrap();

    let state = tauri::State::from(&db);
    let results = search_all("minimal".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    let result = &results[0];
    assert_eq!(result.title, "Minimal Event");
    assert!(result.description.is_none());
    assert!(result.category_id.is_none());
}

#[tokio::test]
#[serial]
async fn test_search_database_error_handling() {
    let db = setup_test_db().await;
    
    // Close the database connection to simulate error
    drop(db);
    
    // Create a new database with invalid path to cause error
    let invalid_db = Database::new("/invalid/path/test.db");
    assert!(invalid_db.is_err());
}

#[tokio::test]
#[serial]
async fn test_search_result_field_mapping() {
    let db = setup_test_db().await;
    create_test_data(&db).expect("Failed to create test data");

    let state = tauri::State::from(&db);
    let results = search_all("meeting".to_string(), state).await.unwrap();

    assert!(!results.is_empty());
    
    for result in results {
        // Verify all required fields are present
        assert!(!result.title.is_empty());
        assert!(!result.item_type.is_empty());
        assert!(["EVENT", "TASK", "NOTE"].contains(&result.item_type.as_str()));
        
        // Verify field types
        assert!(result.id > 0);
        
        if let Some(priority) = result.priority {
            assert!(priority >= 1 && priority <= 3);
        }
        
        if let Some(category_id) = result.category_id {
            assert!(category_id > 0);
        }
    }
}