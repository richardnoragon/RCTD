use crate::services::reminder_service::*;
use crate::tests::test_utilities::*;
use super::{setup_test_db, setup_test_db_with_data};
use serial_test::serial;

/// Data factory for creating test reminders
pub struct ReminderFactory;

impl ReminderFactory {
    pub fn create_event_reminder() -> Reminder {
        Reminder {
            id: None,
            item_type: "EVENT".to_string(),
            item_id: 1,
            trigger_time: "2023-01-15 08:45:00".to_string(),
            offset_description: "15 minutes before".to_string(),
            is_dismissed: false,
            created_at: None,
        }
    }

    pub fn create_task_reminder() -> Reminder {
        Reminder {
            id: None,
            item_type: "TASK".to_string(),
            item_id: 2,
            trigger_time: "2023-01-16 09:00:00".to_string(),
            offset_description: "At due time".to_string(),
            is_dismissed: false,
            created_at: None,
        }
    }

    pub fn create_dismissed_reminder() -> Reminder {
        Reminder {
            id: None,
            item_type: "EVENT".to_string(),
            item_id: 3,
            trigger_time: "2023-01-17 10:00:00".to_string(),
            offset_description: "30 minutes before".to_string(),
            is_dismissed: true,
            created_at: None,
        }
    }

    pub fn create_custom_reminder(item_type: &str, item_id: i64, trigger_time: &str, offset: &str) -> Reminder {
        Reminder {
            id: None,
            item_type: item_type.to_string(),
            item_id,
            trigger_time: trigger_time.to_string(),
            offset_description: offset.to_string(),
            is_dismissed: false,
            created_at: None,
        }
    }

    pub fn create_batch_reminders(count: usize) -> Vec<Reminder> {
        (0..count)
            .map(|i| Reminder {
                id: None,
                item_type: if i % 2 == 0 { "EVENT" } else { "TASK" }.to_string(),
                item_id: (i + 1) as i64,
                trigger_time: format!("2023-01-{:02} 09:00:00", (i % 28) + 1),
                offset_description: format!("{} minutes before", (i + 1) * 5),
                is_dismissed: false,
                created_at: None,
            })
            .collect()
    }
}

#[tokio::test]
#[serial]
async fn test_create_reminder_basic() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    let result = create_reminder(reminder, tauri::State::new(db))
        .await
        .expect("Failed to create reminder");
    
    assert!(result > 0, "Reminder ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_task_reminder() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_task_reminder();

    let result = create_reminder(reminder, tauri::State::new(db))
        .await
        .expect("Failed to create task reminder");
    
    assert!(result > 0, "Task reminder ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_reminder_with_custom_offset() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_custom_reminder(
        "EVENT", 
        1, 
        "2023-01-15 07:30:00", 
        "1 hour 30 minutes before"
    );

    let result = create_reminder(reminder, tauri::State::new(db))
        .await
        .expect("Failed to create reminder with custom offset");
    
    assert!(result > 0, "Custom reminder ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_get_reminder_success() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    // Create reminder first
    let reminder_id = create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Retrieve reminder
    let result = get_reminder(reminder.item_type, reminder.item_id, tauri::State::new(db))
        .await
        .expect("Failed to get reminder");
    
    assert!(result.is_some(), "Reminder should be found");
    let retrieved_reminder = result.unwrap();
    assert_eq!(retrieved_reminder.item_type, "EVENT");
    assert_eq!(retrieved_reminder.item_id, 1);
    assert_eq!(retrieved_reminder.offset_description, "15 minutes before");
}

#[tokio::test]
#[serial]
async fn test_get_reminder_not_found() {
    let db = setup_test_db();

    let result = get_reminder("EVENT".to_string(), 999, tauri::State::new(db))
        .await
        .expect("Failed to execute get reminder query");
    
    assert!(result.is_none(), "Non-existent reminder should return None");
}

#[tokio::test]
#[serial]
async fn test_update_reminder_success() {
    let db = setup_test_db();
    let mut reminder = ReminderFactory::create_event_reminder();

    // Create reminder first
    let reminder_id = create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Update reminder
    reminder.id = Some(reminder_id);
    reminder.trigger_time = "2023-01-15 08:30:00".to_string();
    reminder.offset_description = "30 minutes before".to_string();

    let result = update_reminder(reminder, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Reminder update should succeed");
}

#[tokio::test]
#[serial]
async fn test_update_reminder_to_dismissed() {
    let db = setup_test_db();
    let mut reminder = ReminderFactory::create_event_reminder();

    // Create reminder first
    let reminder_id = create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Update to dismissed
    reminder.id = Some(reminder_id);
    reminder.is_dismissed = true;

    let result = update_reminder(reminder, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Reminder dismissal should succeed");
}

#[tokio::test]
#[serial]
async fn test_update_reminder_not_found() {
    let db = setup_test_db();
    let mut reminder = ReminderFactory::create_event_reminder();
    reminder.id = Some(999);

    let result = update_reminder(reminder, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Update should not fail even if no rows affected");
}

#[tokio::test]
#[serial]
async fn test_delete_reminder_success() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    // Create reminder first
    create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Delete reminder
    let result = delete_reminder(reminder.item_type, reminder.item_id, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Reminder deletion should succeed");
}

#[tokio::test]
#[serial]
async fn test_delete_reminder_not_found() {
    let db = setup_test_db();

    let result = delete_reminder("EVENT".to_string(), 999, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Delete should not fail even if reminder not found");
}

#[tokio::test]
#[serial]
async fn test_get_pending_reminders_empty() {
    let db = setup_test_db();

    let result = get_pending_reminders(tauri::State::new(db))
        .await
        .expect("Failed to get pending reminders");
    
    assert_eq!(result.len(), 0, "Should return empty list when no pending reminders");
}

#[tokio::test]
#[serial]
async fn test_get_pending_reminders_with_data() {
    let db = setup_test_db();
    
    // Create multiple reminders with past trigger times
    let reminder1 = ReminderFactory::create_custom_reminder(
        "EVENT", 
        1, 
        "2023-01-01 09:00:00", 
        "15 minutes before"
    );
    let reminder2 = ReminderFactory::create_custom_reminder(
        "TASK", 
        2, 
        "2023-01-01 10:00:00", 
        "At due time"
    );

    create_reminder(reminder1, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder 1");
    create_reminder(reminder2, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder 2");

    let result = get_pending_reminders(tauri::State::new(db))
        .await
        .expect("Failed to get pending reminders");
    
    assert_eq!(result.len(), 2, "Should return two pending reminders");
    assert_eq!(result[0].item_type, "EVENT");
    assert_eq!(result[1].item_type, "TASK");
}

#[tokio::test]
#[serial]
async fn test_get_pending_reminders_excludes_dismissed() {
    let db = setup_test_db();
    
    // Create one active and one dismissed reminder
    let active_reminder = ReminderFactory::create_custom_reminder(
        "EVENT", 
        1, 
        "2023-01-01 09:00:00", 
        "15 minutes before"
    );
    let dismissed_reminder = ReminderFactory::create_dismissed_reminder();

    create_reminder(active_reminder, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create active reminder");
    create_reminder(dismissed_reminder, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create dismissed reminder");

    let result = get_pending_reminders(tauri::State::new(db))
        .await
        .expect("Failed to get pending reminders");
    
    assert_eq!(result.len(), 1, "Should only return non-dismissed reminders");
    assert_eq!(result[0].item_type, "EVENT");
    assert!(!result[0].is_dismissed, "Returned reminder should not be dismissed");
}

#[tokio::test]
#[serial]
async fn test_reminder_business_rule_validation() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    // Test with invalid item type
    let invalid_reminder = ReminderFactory::create_custom_reminder(
        "INVALID", 
        1, 
        "2023-01-15 09:00:00", 
        "15 minutes before"
    );

    let result = create_reminder(invalid_reminder, tauri::State::new(db.clone()))
        .await;

    // Should succeed as business rules are enforced at application layer
    assert!(result.is_ok(), "Database layer should accept any string for item_type");
}

#[tokio::test]
#[serial]
async fn test_reminder_data_persistence() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    // Create reminder
    let reminder_id = create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Verify persistence by retrieving
    let retrieved = get_reminder(reminder.item_type.clone(), reminder.item_id, tauri::State::new(db))
        .await
        .expect("Failed to retrieve reminder");

    assert!(retrieved.is_some(), "Reminder should persist in database");
    let persisted_reminder = retrieved.unwrap();
    assert_eq!(persisted_reminder.item_type, reminder.item_type);
    assert_eq!(persisted_reminder.item_id, reminder.item_id);
    assert_eq!(persisted_reminder.trigger_time, reminder.trigger_time);
    assert_eq!(persisted_reminder.offset_description, reminder.offset_description);
    assert!(!persisted_reminder.is_dismissed);
}

#[tokio::test]
#[serial]
async fn test_bulk_reminder_operations() {
    let db = setup_test_db();
    let reminders = ReminderFactory::create_batch_reminders(10);

    // Create multiple reminders
    for reminder in reminders {
        let result = create_reminder(reminder, tauri::State::new(db.clone()))
            .await;
        assert!(result.is_ok(), "Bulk reminder creation should succeed");
    }

    // Verify all were created by checking pending reminders
    let pending = get_pending_reminders(tauri::State::new(db))
        .await
        .expect("Failed to get pending reminders");

    assert_eq!(pending.len(), 10, "All 10 reminders should be pending");
}

#[tokio::test]
#[serial]
async fn test_reminder_cross_service_integration() {
    let db = setup_test_db_with_data();
    
    // Create reminder for existing event
    let reminder = ReminderFactory::create_custom_reminder(
        "EVENT", 
        1, 
        "2023-01-15 08:45:00", 
        "15 minutes before"
    );

    let result = create_reminder(reminder, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Reminder creation for existing event should succeed");
}

#[tokio::test]
#[serial]
async fn test_reminder_edge_cases() {
    let db = setup_test_db();

    // Test with empty offset description
    let reminder_empty_offset = ReminderFactory::create_custom_reminder(
        "EVENT", 
        1, 
        "2023-01-15 09:00:00", 
        ""
    );

    let result = create_reminder(reminder_empty_offset, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Should handle empty offset description");

    // Test with very long offset description
    let long_offset = "A".repeat(1000);
    let reminder_long_offset = ReminderFactory::create_custom_reminder(
        "EVENT", 
        2, 
        "2023-01-15 09:00:00", 
        &long_offset
    );

    let result = create_reminder(reminder_long_offset, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Should handle long offset description");

    // Test with extreme item_id values
    let reminder_large_id = ReminderFactory::create_custom_reminder(
        "EVENT", 
        i64::MAX, 
        "2023-01-15 09:00:00", 
        "15 minutes before"
    );

    let result = create_reminder(reminder_large_id, tauri::State::new(db))
        .await;
    assert!(result.is_ok(), "Should handle large item_id values");
}

#[tokio::test]
#[serial]
async fn test_reminder_datetime_handling() {
    let db = setup_test_db();

    // Test various datetime formats
    let datetime_formats = vec![
        "2023-01-15 09:00:00",
        "2023-12-31 23:59:59",
        "2024-02-29 12:00:00", // Leap year
        "2023-06-15 00:00:00",
    ];

    for (i, datetime) in datetime_formats.iter().enumerate() {
        let reminder = ReminderFactory::create_custom_reminder(
            "EVENT",
            (i + 1) as i64,
            datetime,
            "Test reminder"
        );

        let result = create_reminder(reminder, tauri::State::new(db.clone()))
            .await;
        assert!(result.is_ok(), "Should handle datetime format: {}", datetime);
    }
}

#[tokio::test]
#[serial]
async fn test_reminder_concurrent_access() {
    let db = setup_test_db();
    let reminder = ReminderFactory::create_event_reminder();

    // Create reminder
    let reminder_id = create_reminder(reminder.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create reminder");

    // Simulate concurrent updates
    let mut reminder1 = reminder.clone();
    reminder1.id = Some(reminder_id);
    reminder1.offset_description = "Update 1".to_string();

    let mut reminder2 = reminder.clone();
    reminder2.id = Some(reminder_id);
    reminder2.offset_description = "Update 2".to_string();

    // Both updates should succeed (last one wins)
    let result1 = update_reminder(reminder1, tauri::State::new(db.clone())).await;
    let result2 = update_reminder(reminder2, tauri::State::new(db)).await;

    assert!(result1.is_ok(), "First concurrent update should succeed");
    assert!(result2.is_ok(), "Second concurrent update should succeed");
}

#[tokio::test]
#[serial]
async fn test_reminder_performance_benchmarks() {
    let db = setup_test_db();
    let start_time = std::time::Instant::now();

    // Create 100 reminders
    for i in 0..100 {
        let reminder = ReminderFactory::create_custom_reminder(
            if i % 2 == 0 { "EVENT" } else { "TASK" },
            i + 1,
            &format!("2023-01-{:02} 09:00:00", (i % 28) + 1),
            &format!("{} minutes before", (i + 1) * 5)
        );

        create_reminder(reminder, tauri::State::new(db.clone()))
            .await
            .expect("Failed to create reminder in performance test");
    }

    let creation_time = start_time.elapsed();
    assert!(creation_time.as_millis() < 5000, "100 reminder creations should complete within 5 seconds");

    // Test retrieval performance
    let start_time = std::time::Instant::now();
    let pending = get_pending_reminders(tauri::State::new(db))
        .await
        .expect("Failed to get pending reminders");

    let retrieval_time = start_time.elapsed();
    assert!(retrieval_time.as_millis() < 1000, "Retrieving 100 reminders should complete within 1 second");
    assert_eq!(pending.len(), 100, "Should retrieve all 100 reminders");
}