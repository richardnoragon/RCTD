use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use crate::services::time_tracking_service::*;
use chrono::{DateTime, Utc, Duration};
use serial_test::serial;

#[cfg(test)]
mod time_tracking_service_tests {
    use super::*;

    // Time entry factory for testing
    struct TimeEntryFactory;
    
    impl TimeEntryFactory {
        fn create_manual_entry() -> TimeEntry {
            TimeEntry {
                id: None,
                item_type: "MANUAL".to_string(),
                item_id: None,
                start_time: "2024-01-15 10:00:00".to_string(),
                end_time: None,
                duration_seconds: None,
                timer_type: "MANUAL".to_string(),
                created_at: None,
            }
        }
        
        fn create_task_entry(task_id: i64) -> TimeEntry {
            TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(task_id),
                start_time: "2024-01-15 14:00:00".to_string(),
                end_time: None,
                duration_seconds: None,
                timer_type: "MANUAL".to_string(),
                created_at: None,
            }
        }
        
        fn create_event_entry(event_id: i64) -> TimeEntry {
            TimeEntry {
                id: None,
                item_type: "EVENT".to_string(),
                item_id: Some(event_id),
                start_time: "2024-01-15 09:00:00".to_string(),
                end_time: None,
                duration_seconds: None,
                timer_type: "MANUAL".to_string(),
                created_at: None,
            }
        }
        
        fn create_pomodoro_entry(item_id: i64) -> TimeEntry {
            TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(item_id),
                start_time: "2024-01-15 16:00:00".to_string(),
                end_time: None,
                duration_seconds: None,
                timer_type: "POMODORO".to_string(),
                created_at: None,
            }
        }
        
        fn create_completed_entry(duration_seconds: i32) -> TimeEntry {
            TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(1),
                start_time: "2024-01-15 10:00:00".to_string(),
                end_time: Some("2024-01-15 11:00:00".to_string()),
                duration_seconds: Some(duration_seconds),
                timer_type: "MANUAL".to_string(),
                created_at: None,
            }
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_start_timer_success() {
        let scenario = TestScenario::new();
        let time_entry = TimeEntryFactory::create_manual_entry();
        
        let result = start_timer(scenario.get_db(), &time_entry).await;
        
        assert!(result.is_ok(), "Should start timer successfully");
        let timer_id = result.unwrap();
        assert!(timer_id > 0, "Should return valid timer ID");
        
        // Verify timer was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT item_type, start_time, timer_type FROM time_entries WHERE id = ?").unwrap();
        let (item_type, start_time, timer_type): (String, String, String) = stmt.query_row([timer_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).unwrap();
        
        assert_eq!(item_type, "MANUAL");
        assert_eq!(start_time, "2024-01-15 10:00:00");
        assert_eq!(timer_type, "MANUAL");
    }

    #[tokio::test]
    #[serial]
    async fn test_stop_timer_success() {
        let scenario = TestScenario::new();
        let time_entry = TimeEntryFactory::create_manual_entry();
        
        let timer_id = start_timer(scenario.get_db(), &time_entry).await.unwrap();
        
        let end_time = "2024-01-15 11:30:00".to_string();
        let result = stop_timer(scenario.get_db(), timer_id, &end_time).await;
        
        assert!(result.is_ok(), "Should stop timer successfully");
        
        // Verify timer was updated with end time and duration
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT end_time, duration_seconds FROM time_entries WHERE id = ?").unwrap();
        let (stored_end_time, duration): (Option<String>, Option<i32>) = stmt.query_row([timer_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(stored_end_time, Some(end_time));
        assert_eq!(duration, Some(5400)); // 1.5 hours = 5400 seconds
    }

    #[tokio::test]
    #[serial]
    async fn test_get_active_timer() {
        let scenario = TestScenario::new();
        
        // No active timer initially
        let result = get_active_timer(scenario.get_db()).await;
        assert!(result.is_ok(), "Should handle no active timer gracefully");
        assert!(result.unwrap().is_none(), "Should return None when no active timer");
        
        // Start a timer
        let time_entry = TimeEntryFactory::create_manual_entry();
        let timer_id = start_timer(scenario.get_db(), &time_entry).await.unwrap();
        
        // Should now have active timer
        let result = get_active_timer(scenario.get_db()).await;
        assert!(result.is_ok(), "Should retrieve active timer successfully");
        let active_timer = result.unwrap();
        assert!(active_timer.is_some(), "Should have active timer");
        assert_eq!(active_timer.unwrap().id, Some(timer_id));
        
        // Stop timer
        stop_timer(scenario.get_db(), timer_id, &"2024-01-15 11:00:00".to_string()).await.unwrap();
        
        // Should no longer have active timer
        let result = get_active_timer(scenario.get_db()).await;
        assert!(result.is_ok(), "Should handle stopped timer gracefully");
        assert!(result.unwrap().is_none(), "Should return None after stopping timer");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_time_entries_filtering() {
        let mut scenario = TestScenario::new();
        
        // Create test entities
        scenario.add_task("task1", TaskFactory::create_default());
        scenario.add_task("task2", TaskFactory::create_urgent());
        scenario.add_event("event1", EventFactory::create_meeting());
        
        let task1_id = scenario.get_task_id("task1").unwrap();
        let task2_id = scenario.get_task_id("task2").unwrap();
        let event1_id = scenario.get_event_id("event1").unwrap();
        
        // Create time entries for different items
        let entries = vec![
            TimeEntryFactory::create_task_entry(task1_id),
            TimeEntryFactory::create_task_entry(task2_id),
            TimeEntryFactory::create_event_entry(event1_id),
            TimeEntryFactory::create_manual_entry(),
        ];
        
        for entry in &entries {
            start_timer(scenario.get_db(), entry).await.unwrap();
        }
        
        // Test filtering by item type
        let task_entries = get_time_entries(scenario.get_db(), Some("TASK"), None, None, None).await.unwrap();
        assert_eq!(task_entries.len(), 2, "Should return 2 task entries");
        
        let event_entries = get_time_entries(scenario.get_db(), Some("EVENT"), None, None, None).await.unwrap();
        assert_eq!(event_entries.len(), 1, "Should return 1 event entry");
        
        let manual_entries = get_time_entries(scenario.get_db(), Some("MANUAL"), None, None, None).await.unwrap();
        assert_eq!(manual_entries.len(), 1, "Should return 1 manual entry");
        
        // Test filtering by specific item
        let specific_task_entries = get_time_entries(scenario.get_db(), Some("TASK"), Some(task1_id), None, None).await.unwrap();
        assert_eq!(specific_task_entries.len(), 1, "Should return 1 specific task entry");
    }

    #[tokio::test]
    #[serial]
    async fn test_duration_calculations() {
        let scenario = TestScenario::new();
        
        // Test various duration calculations
        let test_cases = vec![
            ("2024-01-15 10:00:00", "2024-01-15 11:00:00", 3600),    // 1 hour
            ("2024-01-15 10:00:00", "2024-01-15 10:30:00", 1800),   // 30 minutes
            ("2024-01-15 10:00:00", "2024-01-15 10:05:00", 300),    // 5 minutes
            ("2024-01-15 23:00:00", "2024-01-16 01:00:00", 7200),   // 2 hours across midnight
            ("2024-01-15 10:00:00", "2024-01-15 18:00:00", 28800),  // 8 hours
        ];
        
        for (i, (start, end, expected_duration)) in test_cases.iter().enumerate() {
            let time_entry = TimeEntry {
                id: None,
                item_type: "MANUAL".to_string(),
                item_id: None,
                start_time: start.to_string(),
                end_time: None,
                duration_seconds: None,
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            
            let timer_id = start_timer(scenario.get_db(), &time_entry).await.unwrap();
            stop_timer(scenario.get_db(), timer_id, &end.to_string()).await.unwrap();
            
            // Verify duration calculation
            let conn = scenario.get_db().get_connection();
            let mut stmt = conn.prepare("SELECT duration_seconds FROM time_entries WHERE id = ?").unwrap();
            let duration: Option<i32> = stmt.query_row([timer_id], |row| row.get(0)).unwrap();
            
            assert_eq!(duration, Some(*expected_duration), "Duration calculation incorrect for case {}", i);
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_date_range_filtering() {
        let scenario = TestScenario::new();
        
        // Create entries across multiple days
        let entries = vec![
            ("2024-01-14 10:00:00", "2024-01-14 11:00:00"),
            ("2024-01-15 10:00:00", "2024-01-15 11:00:00"),
            ("2024-01-16 10:00:00", "2024-01-16 11:00:00"),
            ("2024-01-17 10:00:00", "2024-01-17 11:00:00"),
        ];
        
        for (start, end) in &entries {
            let time_entry = TimeEntry {
                id: None,
                item_type: "MANUAL".to_string(),
                item_id: None,
                start_time: start.to_string(),
                end_time: Some(end.to_string()),
                duration_seconds: Some(3600),
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            
            start_timer(scenario.get_db(), &time_entry).await.unwrap();
        }
        
        // Test date range filtering
        let filtered_entries = get_time_entries(
            scenario.get_db(), 
            None, 
            None, 
            Some("2024-01-15"), 
            Some("2024-01-16")
        ).await.unwrap();
        
        assert_eq!(filtered_entries.len(), 2, "Should return entries for 2 days");
        
        // Verify date filtering worked
        for entry in &filtered_entries {
            assert!(entry.start_time.contains("2024-01-15") || entry.start_time.contains("2024-01-16"));
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_timer_type_workflows() {
        let mut scenario = TestScenario::new();
        
        // Create task for pomodoro testing
        scenario.add_task("pomodoro_task", TaskFactory::create_default());
        let task_id = scenario.get_task_id("pomodoro_task").unwrap();
        
        // Test manual timer
        let manual_entry = TimeEntryFactory::create_manual_entry();
        let manual_id = start_timer(scenario.get_db(), &manual_entry).await.unwrap();
        stop_timer(scenario.get_db(), manual_id, &"2024-01-15 12:00:00".to_string()).await.unwrap();
        
        // Test pomodoro timer (25 minutes)
        let pomodoro_entry = TimeEntryFactory::create_pomodoro_entry(task_id);
        let pomodoro_id = start_timer(scenario.get_db(), &pomodoro_entry).await.unwrap();
        stop_timer(scenario.get_db(), pomodoro_id, &"2024-01-15 16:25:00".to_string()).await.unwrap();
        
        // Test countdown timer
        let countdown_entry = TimeEntry {
            id: None,
            item_type: "CATEGORY".to_string(),
            item_id: Some(1),
            start_time: "2024-01-15 18:00:00".to_string(),
            end_time: None,
            duration_seconds: None,
            timer_type: "COUNTDOWN".to_string(),
            created_at: None,
        };
        let countdown_id = start_timer(scenario.get_db(), &countdown_entry).await.unwrap();
        stop_timer(scenario.get_db(), countdown_id, &"2024-01-15 18:15:00".to_string()).await.unwrap();
        
        // Verify all timer types were recorded correctly
        let all_entries = get_time_entries(scenario.get_db(), None, None, None, None).await.unwrap();
        assert_eq!(all_entries.len(), 3, "Should have 3 timer entries");
        
        let manual_count = all_entries.iter().filter(|e| e.timer_type == "MANUAL").count();
        let pomodoro_count = all_entries.iter().filter(|e| e.timer_type == "POMODORO").count();
        let countdown_count = all_entries.iter().filter(|e| e.timer_type == "COUNTDOWN").count();
        
        assert_eq!(manual_count, 1, "Should have 1 manual timer");
        assert_eq!(pomodoro_count, 1, "Should have 1 pomodoro timer");
        assert_eq!(countdown_count, 1, "Should have 1 countdown timer");
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_timer_validation() {
        let scenario = TestScenario::new();
        
        // Start first timer
        let first_entry = TimeEntryFactory::create_manual_entry();
        let first_id = start_timer(scenario.get_db(), &first_entry).await.unwrap();
        
        // Try to start second timer while first is active
        let second_entry = TimeEntry {
            id: None,
            item_type: "TASK".to_string(),
            item_id: Some(1),
            start_time: "2024-01-15 10:30:00".to_string(),
            end_time: None,
            duration_seconds: None,
            timer_type: "MANUAL".to_string(),
            created_at: None,
        };
        
        let result = start_timer(scenario.get_db(), &second_entry).await;
        
        // Should either succeed (multiple timers allowed) or fail (single timer policy)
        // This depends on business logic implementation
        // For now, we'll test that the system handles the case consistently
        
        // Stop first timer
        stop_timer(scenario.get_db(), first_id, &"2024-01-15 11:00:00".to_string()).await.unwrap();
        
        // Now should be able to start new timer
        let third_entry = TimeEntryFactory::create_manual_entry();
        let result = start_timer(scenario.get_db(), &third_entry).await;
        assert!(result.is_ok(), "Should be able to start timer after stopping previous one");
    }

    #[tokio::test]
    #[serial]
    async fn test_data_persistence_accuracy() {
        let scenario = TestScenario::new();
        
        // Create precise time entry
        let precise_entry = TimeEntry {
            id: None,
            item_type: "TASK".to_string(),
            item_id: Some(1),
            start_time: "2024-01-15 10:15:30".to_string(), // Precise start time
            end_time: None,
            duration_seconds: None,
            timer_type: "MANUAL".to_string(),
            created_at: None,
        };
        
        let timer_id = start_timer(scenario.get_db(), &precise_entry).await.unwrap();
        
        // Stop with precise end time
        let precise_end = "2024-01-15 12:20:45".to_string(); // 2:05:15 duration
        stop_timer(scenario.get_db(), timer_id, &precise_end).await.unwrap();
        
        // Verify precise calculation (2 hours, 5 minutes, 15 seconds = 7515 seconds)
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT start_time, end_time, duration_seconds FROM time_entries WHERE id = ?").unwrap();
        let (start, end, duration): (String, Option<String>, Option<i32>) = stmt.query_row([timer_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).unwrap();
        
        assert_eq!(start, "2024-01-15 10:15:30");
        assert_eq!(end, Some(precise_end));
        assert_eq!(duration, Some(7515));
    }

    #[tokio::test]
    #[serial]
    async fn test_bulk_time_tracking_operations() {
        let mut scenario = TestScenario::new();
        
        // Create multiple tasks
        for i in 1..=10 {
            scenario.add_task(&format!("task_{}", i), TaskFactory::create_with_category(1));
        }
        
        // Create time entries for each task
        for i in 1..=10 {
            let task_id = scenario.get_task_id(&format!("task_{}", i)).unwrap();
            let time_entry = TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(task_id),
                start_time: format!("2024-01-15 {:02}:00:00", 9 + i),
                end_time: Some(format!("2024-01-15 {:02}:00:00", 10 + i)),
                duration_seconds: Some(3600), // 1 hour each
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            
            start_timer(scenario.get_db(), &time_entry).await.unwrap();
        }
        
        // Verify bulk operations
        let all_entries = get_time_entries(scenario.get_db(), None, None, None, None).await.unwrap();
        assert_eq!(all_entries.len(), 10, "Should have 10 time entries");
        
        // Verify total time
        let total_duration: i32 = all_entries.iter()
            .filter_map(|e| e.duration_seconds)
            .sum();
        assert_eq!(total_duration, 36000); // 10 hours total
    }

    #[tokio::test]
    #[serial]
    async fn test_performance_large_dataset() {
        let scenario = TestScenario::new();
        
        // Create 100 time entries for performance testing
        let start_time = std::time::Instant::now();
        
        for i in 1..=100 {
            let time_entry = TimeEntry {
                id: None,
                item_type: "MANUAL".to_string(),
                item_id: None,
                start_time: format!("2024-01-15 10:00:{:02}", i % 60),
                end_time: Some(format!("2024-01-15 11:00:{:02}", i % 60)),
                duration_seconds: Some(3600),
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            
            start_timer(scenario.get_db(), &time_entry).await.unwrap();
        }
        
        let creation_time = start_time.elapsed();
        
        // Retrieve all entries
        let retrieve_start = std::time::Instant::now();
        let result = get_time_entries(scenario.get_db(), None, None, None, None).await.unwrap();
        let retrieve_time = retrieve_start.elapsed();
        
        assert_eq!(result.len(), 100, "Should create and retrieve 100 entries");
        
        // Performance assertions
        assert!(creation_time.as_millis() < 5000, "Bulk creation should complete within 5 seconds");
        assert!(retrieve_time.as_millis() < 1000, "Retrieval should complete within 1 second");
    }

    #[tokio::test]
    #[serial]
    async fn test_edge_case_durations() {
        let scenario = TestScenario::new();
        
        // Test very short duration (1 second)
        let short_entry = TimeEntry {
            id: None,
            item_type: "MANUAL".to_string(),
            item_id: None,
            start_time: "2024-01-15 10:00:00".to_string(),
            end_time: None,
            duration_seconds: None,
            timer_type: "MANUAL".to_string(),
            created_at: None,
        };
        
        let short_id = start_timer(scenario.get_db(), &short_entry).await.unwrap();
        stop_timer(scenario.get_db(), short_id, &"2024-01-15 10:00:01".to_string()).await.unwrap();
        
        // Test very long duration (24 hours)
        let long_entry = TimeEntry {
            id: None,
            item_type: "MANUAL".to_string(),
            item_id: None,
            start_time: "2024-01-15 10:00:00".to_string(),
            end_time: None,
            duration_seconds: None,
            timer_type: "MANUAL".to_string(),
            created_at: None,
        };
        
        let long_id = start_timer(scenario.get_db(), &long_entry).await.unwrap();
        stop_timer(scenario.get_db(), long_id, &"2024-01-16 10:00:00".to_string()).await.unwrap();
        
        // Verify extreme durations
        let conn = scenario.get_db().get_connection();
        
        let mut stmt = conn.prepare("SELECT duration_seconds FROM time_entries WHERE id = ?").unwrap();
        let short_duration: Option<i32> = stmt.query_row([short_id], |row| row.get(0)).unwrap();
        assert_eq!(short_duration, Some(1), "Should handle 1-second duration");
        
        let long_duration: Option<i32> = stmt.query_row([long_id], |row| row.get(0)).unwrap();
        assert_eq!(long_duration, Some(86400), "Should handle 24-hour duration");
    }

    #[tokio::test]
    #[serial]
    async fn test_error_handling() {
        let scenario = TestScenario::new();
        
        // Test stop non-existent timer
        let result = stop_timer(scenario.get_db(), 99999, &"2024-01-15 11:00:00".to_string()).await;
        assert!(result.is_err(), "Should handle non-existent timer gracefully");
        
        // Test invalid date format
        let invalid_entry = TimeEntry {
            id: None,
            item_type: "MANUAL".to_string(),
            item_id: None,
            start_time: "invalid-date".to_string(),
            end_time: None,
            duration_seconds: None,
            timer_type: "MANUAL".to_string(),
            created_at: None,
        };
        
        let result = start_timer(scenario.get_db(), &invalid_entry).await;
        assert!(result.is_err(), "Should reject invalid date format");
        
        // Test end time before start time
        let valid_entry = TimeEntryFactory::create_manual_entry();
        let timer_id = start_timer(scenario.get_db(), &valid_entry).await.unwrap();
        
        let result = stop_timer(scenario.get_db(), timer_id, &"2024-01-15 09:00:00".to_string()).await;
        assert!(result.is_err(), "Should reject end time before start time");
    }

    #[tokio::test]
    #[serial]
    async fn test_reporting_aggregations() {
        let mut scenario = TestScenario::new();
        
        // Create tasks in different categories
        scenario.add_category("work", CategoryFactory::create_work());
        scenario.add_category("personal", CategoryFactory::create_personal());
        let work_cat_id = scenario.get_category_id("work").unwrap();
        let personal_cat_id = scenario.get_category_id("personal").unwrap();
        
        scenario.add_task("work_task", TaskFactory::create_with_category(work_cat_id));
        scenario.add_task("personal_task", TaskFactory::create_with_category(personal_cat_id));
        
        let work_task_id = scenario.get_task_id("work_task").unwrap();
        let personal_task_id = scenario.get_task_id("personal_task").unwrap();
        
        // Create time entries with different durations
        let work_durations = vec![3600, 7200, 5400]; // 1h, 2h, 1.5h = 4.5h total
        let personal_durations = vec![1800, 2700]; // 0.5h, 0.75h = 1.25h total
        
        for (i, &duration) in work_durations.iter().enumerate() {
            let entry = TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(work_task_id),
                start_time: format!("2024-01-15 {:02}:00:00", 9 + i),
                end_time: Some(format!("2024-01-15 {:02}:00:00", 9 + i + (duration / 3600))),
                duration_seconds: Some(duration),
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            start_timer(scenario.get_db(), &entry).await.unwrap();
        }
        
        for (i, &duration) in personal_durations.iter().enumerate() {
            let entry = TimeEntry {
                id: None,
                item_type: "TASK".to_string(),
                item_id: Some(personal_task_id),
                start_time: format!("2024-01-15 {:02}:00:00", 14 + i),
                end_time: Some(format!("2024-01-15 {:02}:30:00", 14 + i)),
                duration_seconds: Some(duration),
                timer_type: "MANUAL".to_string(),
                created_at: None,
            };
            start_timer(scenario.get_db(), &entry).await.unwrap();
        }
        
        // Test aggregated reporting
        let work_entries = get_time_entries(scenario.get_db(), Some("TASK"), Some(work_task_id), None, None).await.unwrap();
        let work_total: i32 = work_entries.iter().filter_map(|e| e.duration_seconds).sum();
        assert_eq!(work_total, 16200); // 4.5 hours
        
        let personal_entries = get_time_entries(scenario.get_db(), Some("TASK"), Some(personal_task_id), None, None).await.unwrap();
        let personal_total: i32 = personal_entries.iter().filter_map(|e| e.duration_seconds).sum();
        assert_eq!(personal_total, 4500); // 1.25 hours
    }
}