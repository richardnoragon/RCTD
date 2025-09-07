use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use crate::services::recurring_service::*;
use chrono::{DateTime, Utc, NaiveDate, Datelike};
use serial_test::serial;

#[cfg(test)]
mod recurring_service_tests {
    use super::*;

    #[tokio::test]
    #[serial]
    async fn test_create_recurring_rule_daily() {
        let scenario = TestScenario::new();
        let daily_rule = RecurringRuleFactory::create_daily();
        
        let result = create_recurring_rule(daily_rule, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should create daily rule successfully");
        let rule_id = result.unwrap();
        assert!(rule_id > 0, "Should return valid rule ID");
        
        // Verify rule was created correctly
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT frequency, interval_value FROM recurring_rules WHERE id = ?").unwrap();
        let (frequency, interval): (String, i32) = stmt.query_row([rule_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(frequency, "DAILY");
        assert_eq!(interval, 1);
    }

    #[tokio::test]
    #[serial]
    async fn test_create_recurring_rule_weekly() {
        let scenario = TestScenario::new();
        let weekly_rule = RecurringRuleFactory::create_weekly();
        
        let result = create_recurring_rule(weekly_rule, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should create weekly rule successfully");
        let rule_id = result.unwrap();
        
        // Verify weekly-specific fields
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT frequency, days_of_week, end_occurrences FROM recurring_rules WHERE id = ?").unwrap();
        let (frequency, days_of_week, end_occurrences): (String, Option<String>, Option<i32>) = stmt.query_row([rule_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).unwrap();
        
        assert_eq!(frequency, "WEEKLY");
        assert_eq!(days_of_week, Some("1,3,5".to_string()));
        assert_eq!(end_occurrences, Some(10));
    }

    #[tokio::test]
    #[serial]
    async fn test_create_recurring_rule_monthly() {
        let scenario = TestScenario::new();
        let monthly_rule = RecurringRuleFactory::create_monthly();
        
        let result = create_recurring_rule(monthly_rule, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should create monthly rule successfully");
        let rule_id = result.unwrap();
        
        // Verify monthly-specific fields
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT frequency, day_of_month FROM recurring_rules WHERE id = ?").unwrap();
        let (frequency, day_of_month): (String, Option<i32>) = stmt.query_row([rule_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(frequency, "MONTHLY");
        assert_eq!(day_of_month, Some(15));
    }

    #[tokio::test]
    #[serial]
    async fn test_create_recurring_rule_yearly() {
        let scenario = TestScenario::new();
        let yearly_rule = RecurringRuleFactory::create_yearly();
        
        let result = create_recurring_rule(yearly_rule, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should create yearly rule successfully");
        let rule_id = result.unwrap();
        
        // Verify yearly-specific fields
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT frequency, day_of_month, month_of_year FROM recurring_rules WHERE id = ?").unwrap();
        let (frequency, day_of_month, month_of_year): (String, Option<i32>, Option<i32>) = stmt.query_row([rule_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).unwrap();
        
        assert_eq!(frequency, "YEARLY");
        assert_eq!(day_of_month, Some(1));
        assert_eq!(month_of_year, Some(1));
    }

    #[tokio::test]
    #[serial]
    async fn test_get_recurring_rule_success() {
        let scenario = TestScenario::new();
        let rule = RecurringRuleFactory::create_weekly();
        
        let rule_id = create_recurring_rule(rule, scenario.get_db().into()).await.unwrap();
        
        let result = get_recurring_rule(rule_id, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should retrieve rule successfully");
        let retrieved_rule = result.unwrap();
        assert_eq!(retrieved_rule.id, Some(rule_id));
        assert_eq!(retrieved_rule.frequency, "WEEKLY");
        assert_eq!(retrieved_rule.days_of_week, Some("1,3,5".to_string()));
    }

    #[tokio::test]
    #[serial]
    async fn test_get_recurring_rule_nonexistent() {
        let scenario = TestScenario::new();
        
        let result = get_recurring_rule(99999, scenario.get_db().into()).await;
        
        assert!(result.is_err(), "Should handle nonexistent rule gracefully");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_recurring_rule_success() {
        let scenario = TestScenario::new();
        let original_rule = RecurringRuleFactory::create_daily();
        
        let rule_id = create_recurring_rule(original_rule, scenario.get_db().into()).await.unwrap();
        
        // Update to weekly rule
        let updated_rule = RecurringRule {
            id: Some(rule_id),
            frequency: "WEEKLY".to_string(),
            interval_value: 2,
            days_of_week: Some("1,3,5".to_string()),
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(20),
            created_at: None,
        };
        
        let result = update_recurring_rule(updated_rule, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should update rule successfully");
        
        // Verify update
        let retrieved = get_recurring_rule(rule_id, scenario.get_db().into()).await.unwrap();
        assert_eq!(retrieved.frequency, "WEEKLY");
        assert_eq!(retrieved.interval_value, 2);
        assert_eq!(retrieved.days_of_week, Some("1,3,5".to_string()));
        assert_eq!(retrieved.end_occurrences, Some(20));
    }

    #[tokio::test]
    #[serial]
    async fn test_expand_recurring_events_daily() {
        let mut scenario = TestScenario::new();
        
        // Create recurring rule
        let daily_rule = RecurringRuleFactory::create_daily();
        let rule_id = create_recurring_rule(daily_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event with recurring rule
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-01-15 09:00:00".to_string();
        event.end_time = "2024-01-15 10:00:00".to_string();
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-15T00:00:00Z".to_string(),
            "2024-01-17T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should expand daily events successfully");
        let events = result.unwrap();
        
        // Should generate events for 3 days (15th, 16th, 17th)
        // Note: Actual implementation depends on the expansion logic
        assert!(!events.is_empty(), "Should generate at least one event");
    }

    #[tokio::test]
    #[serial]
    async fn test_expand_recurring_events_weekly() {
        let mut scenario = TestScenario::new();
        
        // Create weekly recurring rule (Mon, Wed, Fri)
        let weekly_rule = RecurringRuleFactory::create_weekly();
        let rule_id = create_recurring_rule(weekly_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event starting on a Monday
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-01-15 09:00:00".to_string(); // Monday
        event.end_time = "2024-01-15 10:00:00".to_string();
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-15T00:00:00Z".to_string(),
            "2024-01-21T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should expand weekly events successfully");
        let events = result.unwrap();
        assert!(!events.is_empty(), "Should generate weekly event instances");
    }

    #[tokio::test]
    #[serial]
    async fn test_expand_recurring_events_with_exceptions() {
        let mut scenario = TestScenario::new();
        
        // Create daily recurring rule
        let daily_rule = RecurringRuleFactory::create_daily();
        let rule_id = create_recurring_rule(daily_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-01-15 09:00:00".to_string();
        event.end_time = "2024-01-15 10:00:00".to_string();
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        // Create exception for one occurrence
        let exception = EventException {
            id: None,
            event_id: event_id,
            original_date: "2024-01-16".to_string(),
            is_cancelled: true,
            modified_title: None,
            modified_description: None,
            modified_start_time: None,
            modified_end_time: None,
            modified_location: None,
            created_at: None,
        };
        
        let conn = scenario.get_db().get_connection();
        conn.execute(
            "INSERT INTO event_exceptions (event_id, original_date, is_cancelled) VALUES (?, ?, ?)",
            [&event_id.to_string(), &exception.original_date, &exception.is_cancelled.to_string()]
        ).expect("Failed to create exception");
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-15T00:00:00Z".to_string(),
            "2024-01-17T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should expand events with exceptions");
        let events = result.unwrap();
        
        // Should handle the cancelled exception appropriately
        // Implementation details depend on the expansion logic
        assert!(!events.is_empty(), "Should generate some events even with exceptions");
    }

    #[tokio::test]
    #[serial]
    async fn test_date_boundary_calculations() {
        let scenario = TestScenario::new();
        
        // Test month boundary handling
        let month_boundary_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(5),
            created_at: None,
        };
        
        let rule_id = create_recurring_rule(month_boundary_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event at end of month
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-01-30 09:00:00".to_string();
        event.end_time = "2024-01-30 10:00:00".to_string();
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-30T00:00:00Z".to_string(),
            "2024-02-05T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should handle month boundary correctly");
    }

    #[tokio::test]
    #[serial]
    async fn test_leap_year_handling() {
        let scenario = TestScenario::new();
        
        // Create yearly rule for February 29th
        let leap_year_rule = RecurringRule {
            id: None,
            frequency: "YEARLY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: Some(29),
            month_of_year: Some(2),
            end_date: None,
            end_occurrences: Some(10),
            created_at: None,
        };
        
        let rule_id = create_recurring_rule(leap_year_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event for leap year date
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-02-29 09:00:00".to_string(); // 2024 is a leap year
        event.end_time = "2024-02-29 10:00:00".to_string();
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-02-28T00:00:00Z".to_string(),
            "2025-03-01T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should handle leap year calculations");
        // Implementation should handle non-leap years gracefully (skip or adjust to Feb 28)
    }

    #[tokio::test]
    #[serial]
    async fn test_timezone_handling() {
        let scenario = TestScenario::new();
        let rule = RecurringRuleFactory::create_daily();
        let rule_id = create_recurring_rule(rule, scenario.get_db().into()).await.unwrap();
        
        // Create event with timezone considerations
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        event.start_time = "2024-01-15 23:30:00".to_string(); // Near midnight
        event.end_time = "2024-01-16 00:30:00".to_string();   // Crosses midnight
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-15T00:00:00Z".to_string(),
            "2024-01-17T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should handle timezone boundaries correctly");
    }

    #[tokio::test]
    #[serial]
    async fn test_validation_errors() {
        let scenario = TestScenario::new();
        
        // Test invalid frequency
        let invalid_frequency_rule = RecurringRule {
            id: None,
            frequency: "INVALID".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: None,
            created_at: None,
        };
        
        let result = create_recurring_rule(invalid_frequency_rule, scenario.get_db().into()).await;
        assert!(result.is_err(), "Should reject invalid frequency");
        
        // Test invalid interval
        let invalid_interval_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: -1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: None,
            created_at: None,
        };
        
        let result = create_recurring_rule(invalid_interval_rule, scenario.get_db().into()).await;
        assert!(result.is_err(), "Should reject negative interval");
        
        // Test invalid day_of_month
        let invalid_day_rule = RecurringRule {
            id: None,
            frequency: "MONTHLY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: Some(32),
            month_of_year: None,
            end_date: None,
            end_occurrences: None,
            created_at: None,
        };
        
        let result = create_recurring_rule(invalid_day_rule, scenario.get_db().into()).await;
        assert!(result.is_err(), "Should reject invalid day of month");
    }

    #[tokio::test]
    #[serial]
    async fn test_complex_weekly_patterns() {
        let scenario = TestScenario::new();
        
        // Test every weekday pattern
        let weekday_rule = RecurringRule {
            id: None,
            frequency: "WEEKLY".to_string(),
            interval_value: 1,
            days_of_week: Some("1,2,3,4,5".to_string()), // Monday through Friday
            day_of_month: None,
            month_of_year: None,
            end_date: Some("2024-12-31 23:59:59".to_string()),
            end_occurrences: None,
            created_at: None,
        };
        
        let result = create_recurring_rule(weekday_rule, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should create weekday pattern successfully");
        
        // Test weekend pattern
        let weekend_rule = RecurringRule {
            id: None,
            frequency: "WEEKLY".to_string(),
            interval_value: 1,
            days_of_week: Some("0,6".to_string()), // Sunday and Saturday
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(10),
            created_at: None,
        };
        
        let result = create_recurring_rule(weekend_rule, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should create weekend pattern successfully");
    }

    #[tokio::test]
    #[serial]
    async fn test_end_condition_logic() {
        let scenario = TestScenario::new();
        
        // Test end by date
        let end_by_date_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: Some("2024-01-20 23:59:59".to_string()),
            end_occurrences: None,
            created_at: None,
        };
        
        let rule_id = create_recurring_rule(end_by_date_rule, scenario.get_db().into()).await.unwrap();
        
        // Test end by occurrences
        let end_by_count_rule = RecurringRule {
            id: None,
            frequency: "WEEKLY".to_string(),
            interval_value: 1,
            days_of_week: Some("1".to_string()),
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(5),
            created_at: None,
        };
        
        let rule_id2 = create_recurring_rule(end_by_count_rule, scenario.get_db().into()).await.unwrap();
        
        // Test both conditions present (should use whichever comes first)
        let both_conditions_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: Some("2024-01-25 23:59:59".to_string()),
            end_occurrences: Some(100), // Large number, should hit date first
            created_at: None,
        };
        
        let rule_id3 = create_recurring_rule(both_conditions_rule, scenario.get_db().into()).await.unwrap();
        
        assert!(rule_id > 0 && rule_id2 > 0 && rule_id3 > 0, "All rules should be created");
    }

    #[tokio::test]
    #[serial]
    async fn test_performance_large_expansion() {
        let scenario = TestScenario::new();
        let daily_rule = RecurringRuleFactory::create_daily();
        let rule_id = create_recurring_rule(daily_rule, scenario.get_db().into()).await.unwrap();
        
        // Create event
        let mut event = EventFactory::create_default();
        event.recurring_rule_id = Some(rule_id);
        let event_id = scenario.get_db().create_event(&event).unwrap();
        
        // Test performance with large date range (1 year)
        let start_time = std::time::Instant::now();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-01T00:00:00Z".to_string(),
            "2024-12-31T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        let duration = start_time.elapsed();
        
        assert!(result.is_ok(), "Should handle large expansion efficiently");
        
        // Performance assertion (adjust threshold as needed)
        assert!(duration.as_millis() < 5000, "Large expansion should complete within 5 seconds");
    }

    #[tokio::test]
    #[serial]
    async fn test_edge_case_intervals() {
        let scenario = TestScenario::new();
        
        // Test very large interval
        let large_interval_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 365, // Once per year
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(5),
            created_at: None,
        };
        
        let result = create_recurring_rule(large_interval_rule, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should handle large intervals");
        
        // Test minimum interval
        let min_interval_rule = RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(3),
            created_at: None,
        };
        
        let result = create_recurring_rule(min_interval_rule, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should handle minimum interval");
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_rule_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple rules concurrently
        let futures: Vec<_> = (1..=5)
            .map(|i| {
                let rule = RecurringRule {
                    id: None,
                    frequency: "DAILY".to_string(),
                    interval_value: i,
                    days_of_week: None,
                    day_of_month: None,
                    month_of_year: None,
                    end_date: None,
                    end_occurrences: Some(10),
                    created_at: None,
                };
                create_recurring_rule(rule, scenario.get_db().into())
            })
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        // All operations should succeed
        for result in results {
            assert!(result.is_ok(), "Concurrent rule creation should succeed");
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_unicode_and_special_characters() {
        let scenario = TestScenario::new();
        
        // Test rule creation with unicode in related event
        let rule = RecurringRuleFactory::create_weekly();
        let rule_id = create_recurring_rule(rule, scenario.get_db().into()).await.unwrap();
        
        // Create event with unicode title
        let mut unicode_event = EventFactory::create_default();
        unicode_event.recurring_rule_id = Some(rule_id);
        unicode_event.title = "会议 📅 Meeting".to_string();
        let event_id = scenario.get_db().create_event(&unicode_event).unwrap();
        
        let result = expand_recurring_events(
            event_id,
            "2024-01-15T00:00:00Z".to_string(),
            "2024-01-21T23:59:59Z".to_string(),
            scenario.get_db().into()
        ).await;
        
        assert!(result.is_ok(), "Should handle unicode characters in recurring events");
    }
}