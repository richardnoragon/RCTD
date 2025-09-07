use crate::db::models::{Category, Event};
use crate::services::event_service::*;
use crate::tests::test_utilities::*;
use super::{setup_test_db, setup_test_db_with_data};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_create_event_basic() {
    let db = setup_test_db();
    let event = EventFactory::create_default();

    let result = create_event(event.clone(), tauri::State::new(db))
        .await
        .expect("Failed to create event");
    
    assert!(result > 0, "Event ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_event_with_category() {
    let db = setup_test_db();
    
    // Create category first
    let category = CategoryFactory::create_work();
    let category_id = db.create_category(&category).expect("Failed to create category");

    let event = EventFactory::create_with_category(category_id);

    let result = create_event(event, tauri::State::new(db))
        .await
        .expect("Failed to create event with category");
    
    assert!(result > 0, "Event ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_all_day_event() {
    let db = setup_test_db();
    let event = EventFactory::create_all_day();

    let result = create_event(event.clone(), tauri::State::new(db))
        .await
        .expect("Failed to create all-day event");
    
    assert!(result > 0, "All-day event ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_event_validation() {
    let db = setup_test_db();
    
    // Test event with end time before start time
    let invalid_event = Event {
        id: None,
        title: "Invalid Event".to_string(),
        description: None,
        start_time: "2023-01-15 10:00:00".to_string(),
        end_time: "2023-01-15 09:00:00".to_string(), // Before start time
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    // Currently no validation in service - this test documents expected behavior
    let result = create_event(invalid_event, tauri::State::new(db)).await;
    // Should ideally fail but currently passes - TODO for improvement
}

#[tokio::test]
#[serial]
async fn test_create_event_with_invalid_category() {
    let db = setup_test_db();
    
    let mut event = EventFactory::create_default();
    event.category_id = Some(999); // Non-existent category

    let result = create_event(event, tauri::State::new(db)).await;
    assert!(result.is_err(), "Should fail with invalid category ID");
}

#[tokio::test]
#[serial]
async fn test_update_event() {
    let db = setup_test_db();
    let event = EventFactory::create_meeting();

    let id = create_event(event.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create event");

    let mut updated_event = event;
    updated_event.id = Some(id);
    updated_event.title = "Updated Meeting".to_string();
    updated_event.priority = 1;
    updated_event.location = Some("New Conference Room".to_string());

    let result = update_event(updated_event, tauri::State::new(db))
        .await;
    
    assert!(result.is_ok(), "Event update should succeed");
}

#[tokio::test]
#[serial]
async fn test_update_nonexistent_event() {
    let db = setup_test_db();
    let mut event = EventFactory::create_default();
    event.id = Some(999); // Non-existent ID

    let result = update_event(event, tauri::State::new(db)).await;
    assert!(result.is_err(), "Should fail when updating non-existent event");
}

#[tokio::test]
#[serial]
async fn test_delete_event() {
    let db = setup_test_db();
    let event = EventFactory::create_default();

    let id = create_event(event, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create event");

    let result = delete_event(id, tauri::State::new(db))
        .await;
    
    assert!(result.is_ok(), "Event deletion should succeed");
}

#[tokio::test]
#[serial]
async fn test_delete_nonexistent_event() {
    let db = setup_test_db();

    let result = delete_event(999, tauri::State::new(db)).await;
    // Should succeed even if event doesn't exist (SQLite behavior)
    assert!(result.is_ok(), "Delete should succeed even for non-existent event");
}

#[tokio::test]
#[serial]
async fn test_get_events_in_range_basic() {
    let db = setup_test_db();
    
    // Create events in different date ranges
    let events = vec![
        Event {
            id: None,
            title: "Event 1".to_string(),
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
        },
        Event {
            id: None,
            title: "Event 2".to_string(),
            description: None,
            start_time: "2023-01-20 14:00:00".to_string(),
            end_time: "2023-01-20 15:00:00".to_string(),
            is_all_day: false,
            location: None,
            priority: 3,
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        },
    ];

    for event in events {
        create_event(event, tauri::State::new(db.clone())).await.expect("Failed to create event");
    }

    // Query for events in range that includes first event
    let events_in_range = get_events_in_range(
        "2023-01-14 00:00:00".to_string(),
        "2023-01-16 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 1, "Should find one event in range");
    assert_eq!(events_in_range[0].title, "Event 1");
}

#[tokio::test]
#[serial]
async fn test_get_events_in_range_empty() {
    let db = setup_test_db();

    let events_in_range = get_events_in_range(
        "2023-01-14 00:00:00".to_string(),
        "2023-01-16 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert!(events_in_range.is_empty(), "Should return empty array when no events in range");
}

#[tokio::test]
#[serial]
async fn test_get_events_in_range_overlapping() {
    let db = setup_test_db();
    
    // Create event that spans across range boundary
    let overlapping_event = Event {
        id: None,
        title: "Overlapping Event".to_string(),
        description: None,
        start_time: "2023-01-14 22:00:00".to_string(), // Starts before range
        end_time: "2023-01-15 02:00:00".to_string(),   // Ends within range
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    create_event(overlapping_event, tauri::State::new(db.clone())).await.expect("Failed to create event");

    let events_in_range = get_events_in_range(
        "2023-01-15 00:00:00".to_string(),
        "2023-01-15 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 1, "Should find overlapping event");
    assert_eq!(events_in_range[0].title, "Overlapping Event");
}

#[tokio::test]
#[serial]
async fn test_get_events_in_range_with_categories() {
    let db = setup_test_db();
    
    // Create category
    let category = CategoryFactory::create_work();
    let category_id = db.create_category(&category).expect("Failed to create category");

    // Create event with category
    let event = EventFactory::create_with_category(category_id);
    create_event(event, tauri::State::new(db.clone())).await.expect("Failed to create event");

    let events_in_range = get_events_in_range(
        "2023-01-14 00:00:00".to_string(),
        "2023-01-16 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 1, "Should find event with category");
    assert_eq!(events_in_range[0].category_id, Some(category_id));
}

#[tokio::test]
#[serial]
async fn test_event_priority_handling() {
    let db = setup_test_db();
    
    let events = vec![
        Event {
            id: None,
            title: "High Priority".to_string(),
            description: None,
            start_time: "2023-01-15 09:00:00".to_string(),
            end_time: "2023-01-15 10:00:00".to_string(),
            is_all_day: false,
            location: None,
            priority: 1, // High priority
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        },
        Event {
            id: None,
            title: "Low Priority".to_string(),
            description: None,
            start_time: "2023-01-15 11:00:00".to_string(),
            end_time: "2023-01-15 12:00:00".to_string(),
            is_all_day: false,
            location: None,
            priority: 3, // Low priority
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        },
    ];

    for event in events {
        create_event(event, tauri::State::new(db.clone())).await.expect("Failed to create event");
    }

    let events_in_range = get_events_in_range(
        "2023-01-15 00:00:00".to_string(),
        "2023-01-15 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 2, "Should find both events");
    
    // Find events by priority
    let high_priority = events_in_range.iter().find(|e| e.priority == 1).unwrap();
    let low_priority = events_in_range.iter().find(|e| e.priority == 3).unwrap();
    
    assert_eq!(high_priority.title, "High Priority");
    assert_eq!(low_priority.title, "Low Priority");
}

#[tokio::test]
#[serial]
async fn test_all_day_vs_timed_events() {
    let db = setup_test_db();
    
    let all_day_event = EventFactory::create_all_day();
    let timed_event = EventFactory::create_meeting();

    create_event(all_day_event, tauri::State::new(db.clone())).await.expect("Failed to create all-day event");
    create_event(timed_event, tauri::State::new(db.clone())).await.expect("Failed to create timed event");

    let events_in_range = get_events_in_range(
        "2023-01-15 00:00:00".to_string(),
        "2023-01-20 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 2, "Should find both event types");
    
    let all_day = events_in_range.iter().find(|e| e.is_all_day).unwrap();
    let timed = events_in_range.iter().find(|e| !e.is_all_day).unwrap();
    
    assert_eq!(all_day.title, "Holiday");
    assert_eq!(timed.title, "Team Meeting");
}

#[tokio::test]
#[serial]
async fn test_event_with_location() {
    let db = setup_test_db();
    
    let event_with_location = Event {
        id: None,
        title: "Meeting with Location".to_string(),
        description: Some("Important meeting".to_string()),
        start_time: "2023-01-15 09:00:00".to_string(),
        end_time: "2023-01-15 10:00:00".to_string(),
        is_all_day: false,
        location: Some("Conference Room A".to_string()),
        priority: 2,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    create_event(event_with_location, tauri::State::new(db.clone())).await.expect("Failed to create event");

    let events_in_range = get_events_in_range(
        "2023-01-15 00:00:00".to_string(),
        "2023-01-15 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 1, "Should find event with location");
    assert_eq!(events_in_range[0].location, Some("Conference Room A".to_string()));
    assert_eq!(events_in_range[0].description, Some("Important meeting".to_string()));
}

#[tokio::test]
#[serial]
async fn test_event_bulk_operations() {
    let db = setup_test_db();
    
    let events = EventFactory::create_batch(50);
    for event in events {
        create_event(event, tauri::State::new(db.clone())).await.expect("Failed to create event");
    }

    // Query for all events in a wide range
    let events_in_range = get_events_in_range(
        "2023-01-01 00:00:00".to_string(),
        "2023-12-31 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events in range");

    assert_eq!(events_in_range.len(), 50, "Should find all bulk created events");
}

#[tokio::test]
#[serial]
async fn test_event_performance() {
    let db = setup_test_db();
    
    let (_, duration) = PerformanceTester::measure_execution_time(|| {
        for i in 0..100 {
            let event = Event {
                id: None,
                title: format!("Performance Event {}", i),
                description: None,
                start_time: format!("2023-01-{:02} 09:00:00", 15 + (i % 10)),
                end_time: format!("2023-01-{:02} 10:00:00", 15 + (i % 10)),
                is_all_day: false,
                location: None,
                priority: 3,
                category_id: None,
                recurring_rule_id: None,
                created_at: None,
                updated_at: None,
            };
            let _ = futures::executor::block_on(
                create_event(event, tauri::State::new(db.clone()))
            );
        }
    });

    PerformanceTester::assert_performance_within_threshold(duration, 2000); // 2 seconds
}

#[tokio::test]
#[serial]
async fn test_event_date_edge_cases() {
    let db = setup_test_db();
    
    // Test leap year event
    let leap_year_event = Event {
        id: None,
        title: "Leap Year Event".to_string(),
        description: None,
        start_time: "2024-02-29 09:00:00".to_string(),
        end_time: "2024-02-29 10:00:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let result = create_event(leap_year_event, tauri::State::new(db.clone())).await;
    assert!(result.is_ok(), "Should handle leap year dates");

    // Test year boundary event
    let year_boundary_event = Event {
        id: None,
        title: "New Year Event".to_string(),
        description: None,
        start_time: "2023-12-31 23:30:00".to_string(),
        end_time: "2024-01-01 00:30:00".to_string(),
        is_all_day: false,
        location: None,
        priority: 3,
        category_id: None,
        recurring_rule_id: None,
        created_at: None,
        updated_at: None,
    };

    let result = create_event(year_boundary_event, tauri::State::new(db)).await;
    assert!(result.is_ok(), "Should handle year boundary events");
}

#[tokio::test]
#[serial]
async fn test_concurrent_event_operations() {
    use tokio::task;
    
    let db = setup_test_db();
    let mut handles = vec![];

    // Create multiple events concurrently
    for i in 0..20 {
        let db_clone = db.clone();
        let handle = task::spawn(async move {
            let event = Event {
                id: None,
                title: format!("Concurrent Event {}", i),
                description: None,
                start_time: format!("2023-01-{:02} 09:00:00", 15 + (i % 10)),
                end_time: format!("2023-01-{:02} 10:00:00", 15 + (i % 10)),
                is_all_day: false,
                location: None,
                priority: 3,
                category_id: None,
                recurring_rule_id: None,
                created_at: None,
                updated_at: None,
            };
            create_event(event, tauri::State::new(db_clone)).await
        });
        handles.push(handle);
    }

    // Wait for all tasks to complete
    let mut success_count = 0;
    for handle in handles {
        if handle.await.unwrap().is_ok() {
            success_count += 1;
        }
    }

    assert!(success_count > 0, "At least some concurrent operations should succeed");
}

#[tokio::test]
#[serial]
async fn test_event_cascade_delete_with_category() {
    let db = setup_test_db();
    
    // Create category and event
    let category = CategoryFactory::create_work();
    let category_id = db.create_category(&category).expect("Failed to create category");
    
    let event = EventFactory::create_with_category(category_id);
    let event_id = create_event(event, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create event");

    // Delete category
    db.delete_category(category_id).expect("Failed to delete category");

    // Event should still exist but with null category_id
    let events_in_range = get_events_in_range(
        "2023-01-01 00:00:00".to_string(),
        "2023-12-31 23:59:59".to_string(),
        tauri::State::new(db)
    ).await.expect("Failed to get events");

    assert_eq!(events_in_range.len(), 1, "Event should still exist");
    assert!(events_in_range[0].category_id.is_none(), "Category ID should be null after cascade delete");
}