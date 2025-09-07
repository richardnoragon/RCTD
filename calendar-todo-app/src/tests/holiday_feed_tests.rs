use crate::services::holiday_feed_service::*;
use crate::tests::test_utilities::*;
use super::{setup_test_db, setup_test_db_with_data};
use serial_test::serial;

/// Data factory for creating test holiday feeds
pub struct HolidayFeedFactory;

impl HolidayFeedFactory {
    pub fn create_default() -> HolidayFeed {
        HolidayFeed {
            id: None,
            url: "https://example.com/holidays.ics".to_string(),
            name: "Default Holiday Feed".to_string(),
            is_visible: true,
            last_sync_time: None,
            sync_error: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_us_holidays() -> HolidayFeed {
        HolidayFeed {
            id: None,
            url: "https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics".to_string(),
            name: "US Holidays".to_string(),
            is_visible: true,
            last_sync_time: None,
            sync_error: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_international_holidays() -> HolidayFeed {
        HolidayFeed {
            id: None,
            url: "https://example.com/international-holidays.ics".to_string(),
            name: "International Holidays".to_string(),
            is_visible: false,
            last_sync_time: Some("2023-01-15 10:00:00".to_string()),
            sync_error: Some("Connection timeout".to_string()),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_with_sync_error() -> HolidayFeed {
        HolidayFeed {
            id: None,
            url: "https://unreachable.com/feed.ics".to_string(),
            name: "Unreachable Feed".to_string(),
            is_visible: true,
            last_sync_time: None,
            sync_error: Some("Failed to download feed: Connection refused".to_string()),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_custom(url: &str, name: &str, is_visible: bool) -> HolidayFeed {
        HolidayFeed {
            id: None,
            url: url.to_string(),
            name: name.to_string(),
            is_visible,
            last_sync_time: None,
            sync_error: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_batch_feeds(count: usize) -> Vec<HolidayFeed> {
        (0..count)
            .map(|i| HolidayFeed {
                id: None,
                url: format!("https://example.com/feed{}.ics", i + 1),
                name: format!("Holiday Feed {}", i + 1),
                is_visible: i % 2 == 0,
                last_sync_time: if i % 3 == 0 { 
                    Some("2023-01-15 10:00:00".to_string()) 
                } else { 
                    None 
                },
                sync_error: if i % 5 == 0 { 
                    Some("Test error".to_string()) 
                } else { 
                    None 
                },
                created_at: None,
                updated_at: None,
            })
            .collect()
    }
}

#[tokio::test]
#[serial]
async fn test_create_holiday_feed_basic() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_default();

    let result = create_holiday_feed(feed, tauri::State::new(db))
        .await
        .expect("Failed to create holiday feed");
    
    assert!(result > 0, "Holiday feed ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_us_holidays_feed() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_us_holidays();

    let result = create_holiday_feed(feed, tauri::State::new(db))
        .await
        .expect("Failed to create US holidays feed");
    
    assert!(result > 0, "US holidays feed ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_feed_with_long_url() {
    let db = setup_test_db();
    let long_url = format!("https://example.com/{}.ics", "a".repeat(500));
    let feed = HolidayFeedFactory::create_custom(&long_url, "Long URL Feed", true);

    let result = create_holiday_feed(feed, tauri::State::new(db))
        .await
        .expect("Failed to create feed with long URL");
    
    assert!(result > 0, "Long URL feed ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_get_holiday_feeds_empty() {
    let db = setup_test_db();

    let result = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get holiday feeds");
    
    assert_eq!(result.len(), 0, "Should return empty list when no feeds exist");
}

#[tokio::test]
#[serial]
async fn test_get_holiday_feeds_with_data() {
    let db = setup_test_db();
    
    // Create multiple feeds
    let feed1 = HolidayFeedFactory::create_us_holidays();
    let feed2 = HolidayFeedFactory::create_international_holidays();

    create_holiday_feed(feed1, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create feed 1");
    create_holiday_feed(feed2, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create feed 2");

    let result = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get holiday feeds");
    
    assert_eq!(result.len(), 2, "Should return two holiday feeds");
    assert_eq!(result[0].name, "International Holidays"); // Sorted by name
    assert_eq!(result[1].name, "US Holidays");
}

#[tokio::test]
#[serial]
async fn test_update_holiday_feed_success() {
    let db = setup_test_db();
    let mut feed = HolidayFeedFactory::create_default();

    // Create feed first
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Update feed
    feed.id = Some(feed_id);
    feed.name = "Updated Holiday Feed".to_string();
    feed.is_visible = false;

    let result = update_holiday_feed(feed, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Holiday feed update should succeed");
}

#[tokio::test]
#[serial]
async fn test_update_holiday_feed_not_found() {
    let db = setup_test_db();
    let mut feed = HolidayFeedFactory::create_default();
    feed.id = Some(999);

    let result = update_holiday_feed(feed, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Update should not fail even if no rows affected");
}

#[tokio::test]
#[serial]
async fn test_delete_holiday_feed_success() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_default();

    // Create feed first
    let feed_id = create_holiday_feed(feed, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Delete feed
    let result = delete_holiday_feed(feed_id, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Holiday feed deletion should succeed");
}

#[tokio::test]
#[serial]
async fn test_delete_holiday_feed_not_found() {
    let db = setup_test_db();

    let result = delete_holiday_feed(999, tauri::State::new(db))
        .await;

    assert!(result.is_ok(), "Delete should not fail even if feed not found");
}

#[tokio::test]
#[serial]
async fn test_sync_holiday_feed_basic() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_default();

    // Create feed first
    let feed_id = create_holiday_feed(feed, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Note: This will fail due to network call, but tests the function structure
    let result = sync_holiday_feed(feed_id, tauri::State::new(db))
        .await;

    // Expected to fail due to network call in test environment
    assert!(result.is_err(), "Sync should fail in test environment due to network call");
}

#[tokio::test]
#[serial]
async fn test_sync_holiday_feed_not_found() {
    let db = setup_test_db();

    let result = sync_holiday_feed(999, tauri::State::new(db))
        .await;

    assert!(result.is_err(), "Sync should fail when feed not found");
}

#[tokio::test]
#[serial]
async fn test_feed_data_persistence() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_us_holidays();

    // Create feed
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Verify persistence by retrieving
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to retrieve holiday feeds");

    assert_eq!(feeds.len(), 1, "Should find one persisted feed");
    let persisted_feed = &feeds[0];
    assert_eq!(persisted_feed.name, feed.name);
    assert_eq!(persisted_feed.url, feed.url);
    assert_eq!(persisted_feed.is_visible, feed.is_visible);
    assert!(persisted_feed.id.is_some(), "Persisted feed should have an ID");
}

#[tokio::test]
#[serial]
async fn test_feed_ingestion_workflow() {
    let db = setup_test_db();
    
    // Create feed
    let feed = HolidayFeedFactory::create_default();
    let feed_id = create_holiday_feed(feed, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Test parsing accuracy would require mock HTTP responses
    // Here we test the database structure is ready for feed processing
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get feeds");

    assert_eq!(feeds.len(), 1, "Feed should be ready for processing");
    assert!(feeds[0].last_sync_time.is_none(), "Initial sync time should be None");
    assert!(feeds[0].sync_error.is_none(), "Initial sync error should be None");
}

#[tokio::test]
#[serial]
async fn test_feed_synchronization_state_management() {
    let db = setup_test_db();
    let mut feed = HolidayFeedFactory::create_international_holidays();

    // Create feed with sync state
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Update sync state
    feed.id = Some(feed_id);
    feed.last_sync_time = Some("2023-01-16 12:00:00".to_string());
    feed.sync_error = None;

    let result = update_holiday_feed(feed, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Sync state update should succeed");

    // Verify updated state
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get updated feeds");

    assert_eq!(feeds.len(), 1, "Should have one feed");
    assert!(feeds[0].last_sync_time.is_some(), "Last sync time should be updated");
}

#[tokio::test]
#[serial]
async fn test_bulk_feed_operations() {
    let db = setup_test_db();
    let feeds = HolidayFeedFactory::create_batch_feeds(20);

    // Create multiple feeds
    for feed in feeds {
        let result = create_holiday_feed(feed, tauri::State::new(db.clone()))
            .await;
        assert!(result.is_ok(), "Bulk feed creation should succeed");
    }

    // Verify all were created
    let all_feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get all feeds");

    assert_eq!(all_feeds.len(), 20, "All 20 feeds should be created");
}

#[tokio::test]
#[serial]
async fn test_feed_processing_edge_cases() {
    let db = setup_test_db();

    // Test with empty URL
    let empty_url_feed = HolidayFeedFactory::create_custom("", "Empty URL", true);
    let result = create_holiday_feed(empty_url_feed, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Should handle empty URL");

    // Test with empty name
    let empty_name_feed = HolidayFeedFactory::create_custom("https://example.com/feed.ics", "", true);
    let result = create_holiday_feed(empty_name_feed, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Should handle empty name");

    // Test with special characters in name
    let special_char_feed = HolidayFeedFactory::create_custom(
        "https://example.com/feed.ics", 
        "Feed with Special Chars: !@#$%^&*()_+", 
        true
    );
    let result = create_holiday_feed(special_char_feed, tauri::State::new(db))
        .await;
    assert!(result.is_ok(), "Should handle special characters in name");
}

#[tokio::test]
#[serial]
async fn test_feed_url_validation_patterns() {
    let db = setup_test_db();

    // Test various URL patterns
    let url_patterns = vec![
        "https://example.com/feed.ics",
        "http://calendar.example.org/holidays.ics",
        "https://subdomain.example.com/path/to/feed.ics",
        "https://example.com/feed.ics?param=value&other=test",
        "https://example.com:8080/secure/feed.ics",
    ];

    for (i, url) in url_patterns.iter().enumerate() {
        let feed = HolidayFeedFactory::create_custom(url, &format!("Feed {}", i + 1), true);
        let result = create_holiday_feed(feed, tauri::State::new(db.clone()))
            .await;
        assert!(result.is_ok(), "Should handle URL pattern: {}", url);
    }
}

#[tokio::test]
#[serial]
async fn test_feed_error_handling_and_recovery() {
    let db = setup_test_db();
    let mut feed = HolidayFeedFactory::create_with_sync_error();

    // Create feed with error state
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create feed with error");

    // Simulate error recovery
    feed.id = Some(feed_id);
    feed.sync_error = None;
    feed.last_sync_time = Some("2023-01-16 14:00:00".to_string());

    let result = update_holiday_feed(feed, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Error recovery update should succeed");

    // Verify error was cleared
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get feeds after recovery");

    assert_eq!(feeds.len(), 1, "Should have one feed");
    assert!(feeds[0].sync_error.is_none(), "Sync error should be cleared");
    assert!(feeds[0].last_sync_time.is_some(), "Should have successful sync time");
}

#[tokio::test]
#[serial]
async fn test_feed_performance_benchmarks() {
    let db = setup_test_db();
    let start_time = std::time::Instant::now();

    // Create 50 feeds
    for i in 0..50 {
        let feed = HolidayFeedFactory::create_custom(
            &format!("https://example.com/feed{}.ics", i + 1),
            &format!("Performance Feed {}", i + 1),
            i % 2 == 0
        );

        create_holiday_feed(feed, tauri::State::new(db.clone()))
            .await
            .expect("Failed to create feed in performance test");
    }

    let creation_time = start_time.elapsed();
    assert!(creation_time.as_millis() < 3000, "50 feed creations should complete within 3 seconds");

    // Test retrieval performance
    let start_time = std::time::Instant::now();
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get feeds");

    let retrieval_time = start_time.elapsed();
    assert!(retrieval_time.as_millis() < 500, "Retrieving 50 feeds should complete within 500ms");
    assert_eq!(feeds.len(), 50, "Should retrieve all 50 feeds");
}

#[tokio::test]
#[serial]
async fn test_feed_data_integrity() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_us_holidays();

    // Create feed
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Test update with same data
    let mut updated_feed = feed.clone();
    updated_feed.id = Some(feed_id);

    let result = update_holiday_feed(updated_feed, tauri::State::new(db.clone()))
        .await;
    assert!(result.is_ok(), "Update with same data should succeed");

    // Verify data integrity
    let feeds = get_holiday_feeds(tauri::State::new(db))
        .await
        .expect("Failed to get feeds");

    assert_eq!(feeds.len(), 1, "Should have one feed");
    assert_eq!(feeds[0].name, feed.name, "Name should be preserved");
    assert_eq!(feeds[0].url, feed.url, "URL should be preserved");
    assert_eq!(feeds[0].is_visible, feed.is_visible, "Visibility should be preserved");
}

#[tokio::test]
#[serial]
async fn test_feed_concurrent_operations() {
    let db = setup_test_db();
    let feed = HolidayFeedFactory::create_default();

    // Create feed
    let feed_id = create_holiday_feed(feed.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create holiday feed");

    // Simulate concurrent updates
    let mut feed1 = feed.clone();
    feed1.id = Some(feed_id);
    feed1.name = "Concurrent Update 1".to_string();

    let mut feed2 = feed.clone();
    feed2.id = Some(feed_id);
    feed2.name = "Concurrent Update 2".to_string();

    // Both updates should succeed (last one wins)
    let result1 = update_holiday_feed(feed1, tauri::State::new(db.clone())).await;
    let result2 = update_holiday_feed(feed2, tauri::State::new(db)).await;

    assert!(result1.is_ok(), "First concurrent update should succeed");
    assert!(result2.is_ok(), "Second concurrent update should succeed");
}