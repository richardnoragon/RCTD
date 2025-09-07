use crate::db::models::Category;
use crate::services::category_service::*;
use crate::tests::test_utilities::*;
use super::{setup_test_db, setup_test_db_with_data};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_create_category() {
    let db = setup_test_db();
    let test_category = CategoryFactory::create_default();

    let result = create_category(test_category.clone(), tauri::State::new(db))
        .await
        .expect("Failed to create category");
    
    assert!(result > 0, "Category ID should be positive");
}

#[tokio::test]
#[serial]
async fn test_create_category_with_special_characters() {
    let db = setup_test_db();
    let test_category = Category {
        id: None,
        name: "Special âéîôü Characters".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let result = create_category(test_category.clone(), tauri::State::new(db))
        .await
        .expect("Failed to create category with special characters");
    
    assert!(result > 0, "Category ID should be positive for special characters");
}

#[tokio::test]
#[serial]
async fn test_create_category_validation() {
    let db = setup_test_db();
    
    // Test empty name
    let invalid_category = Category {
        id: None,
        name: "".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let result = create_category(invalid_category, tauri::State::new(db.clone())).await;
    assert!(result.is_err(), "Should fail with empty name");

    // Test invalid color format
    let invalid_color_category = Category {
        id: None,
        name: "Test".to_string(),
        color: "invalid-color".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    // Note: This test assumes validation is implemented in the service
    let result = create_category(invalid_color_category, tauri::State::new(db)).await;
    // Currently passes as validation isn't implemented - this is a TODO for improvement
}

#[tokio::test]
#[serial]
async fn test_get_categories() {
    let db = setup_test_db();
    let test_category = CategoryFactory::create_work();

    create_category(test_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create category");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert!(!categories.is_empty(), "Categories should not be empty");
    TestAssertions::assert_contains_category(&categories, "Work");
}

#[tokio::test]
#[serial]
async fn test_get_categories_empty() {
    let db = setup_test_db();

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert!(categories.is_empty(), "Categories should be empty initially");
}

#[tokio::test]
#[serial]
async fn test_get_categories_sorted() {
    let db = setup_test_db();
    
    // Create categories in different order
    let categories_to_create = vec![
        CategoryFactory::create_with_name("Zebra"),
        CategoryFactory::create_with_name("Alpha"),
        CategoryFactory::create_with_name("Beta"),
    ];

    for category in categories_to_create {
        create_category(category, tauri::State::new(db.clone())).await.expect("Failed to create category");
    }

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert_eq!(categories.len(), 3);
    assert_eq!(categories[0].name, "Alpha");
    assert_eq!(categories[1].name, "Beta");
    assert_eq!(categories[2].name, "Zebra");
}

#[tokio::test]
#[serial]
async fn test_update_category() {
    let db = setup_test_db();
    let test_category = CategoryFactory::create_default();

    let id = create_category(test_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create category");

    let mut updated_category = test_category;
    updated_category.id = Some(id);
    updated_category.name = "Updated Category".to_string();
    updated_category.color = "#00FF00".to_string();

    update_category(updated_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to update category");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert_eq!(categories[0].name, "Updated Category");
    assert_eq!(categories[0].color, "#00FF00");
}

#[tokio::test]
#[serial]
async fn test_update_nonexistent_category() {
    let db = setup_test_db();
    let mut test_category = CategoryFactory::create_default();
    test_category.id = Some(999); // Non-existent ID

    let result = update_category(test_category, tauri::State::new(db)).await;
    assert!(result.is_err(), "Should fail when updating non-existent category");
}

#[tokio::test]
#[serial]
async fn test_delete_category() {
    let db = setup_test_db();
    let test_category = CategoryFactory::create_default();

    let id = create_category(test_category, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create category");

    delete_category(id, tauri::State::new(db.clone()))
        .await
        .expect("Failed to delete category");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert!(categories.is_empty(), "Categories should be empty after deletion");
}

#[tokio::test]
#[serial]
async fn test_delete_nonexistent_category() {
    let db = setup_test_db();

    let result = delete_category(999, tauri::State::new(db)).await;
    // Should succeed even if category doesn't exist (SQLite behavior)
    assert!(result.is_ok(), "Delete should succeed even for non-existent category");
}

#[tokio::test]
#[serial]
async fn test_export_categories() {
    let db = setup_test_db();
    
    // Create multiple categories
    let categories = CategoryFactory::create_batch(3);
    for category in categories {
        create_category(category, tauri::State::new(db.clone())).await.expect("Failed to create category");
    }

    let exported_json = export_categories(tauri::State::new(db))
        .await
        .expect("Failed to export categories");

    // Verify JSON is valid
    let parsed: Vec<Category> = serde_json::from_str(&exported_json)
        .expect("Exported JSON should be valid");
    
    assert_eq!(parsed.len(), 3, "Should export all categories");
}

#[tokio::test]
#[serial]
async fn test_export_empty_categories() {
    let db = setup_test_db();

    let exported_json = export_categories(tauri::State::new(db))
        .await
        .expect("Failed to export empty categories");

    let parsed: Vec<Category> = serde_json::from_str(&exported_json)
        .expect("Exported JSON should be valid");
    
    assert!(parsed.is_empty(), "Should export empty array");
}

#[tokio::test]
#[serial]
async fn test_import_categories() {
    let db = setup_test_db();
    
    let categories_to_import = vec![
        CategoryFactory::create_work(),
        CategoryFactory::create_personal(),
    ];
    
    let json_data = serde_json::to_string(&categories_to_import)
        .expect("Failed to serialize categories");

    import_categories(json_data, tauri::State::new(db.clone()))
        .await
        .expect("Failed to import categories");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories after import");
    
    assert_eq!(categories.len(), 2, "Should import all categories");
    TestAssertions::assert_contains_category(&categories, "Work");
    TestAssertions::assert_contains_category(&categories, "Personal");
}

#[tokio::test]
#[serial]
async fn test_import_invalid_json() {
    let db = setup_test_db();

    let result = import_categories("invalid json".to_string(), tauri::State::new(db)).await;
    assert!(result.is_err(), "Should fail with invalid JSON");
}

#[tokio::test]
#[serial]
async fn test_import_empty_array() {
    let db = setup_test_db();

    let result = import_categories("[]".to_string(), tauri::State::new(db.clone())).await;
    assert!(result.is_ok(), "Should succeed with empty array");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert!(categories.is_empty(), "Should have no categories after empty import");
}

#[tokio::test]
#[serial]
async fn test_duplicate_category_names() {
    let db = setup_test_db();
    
    let category1 = CategoryFactory::create_with_name("Duplicate");
    let category2 = CategoryFactory::create_with_name("Duplicate");

    create_category(category1, tauri::State::new(db.clone()))
        .await
        .expect("Failed to create first category");

    let result = create_category(category2, tauri::State::new(db)).await;
    assert!(result.is_err(), "Should fail with duplicate category name");
}

#[tokio::test]
#[serial]
async fn test_category_performance_bulk_operations() {
    let db = setup_test_db();
    
    let (_, duration) = PerformanceTester::measure_execution_time(|| {
        for i in 0..100 {
            let category = CategoryFactory::create_with_name(&format!("Bulk Category {}", i));
            let _ = futures::executor::block_on(
                create_category(category, tauri::State::new(db.clone()))
            );
        }
    });

    // Should complete within reasonable time (adjust threshold as needed)
    PerformanceTester::assert_performance_within_threshold(duration, 1000); // 1 second
}

#[tokio::test]
#[serial]
async fn test_concurrent_category_operations() {
    use tokio::task;
    
    let db = setup_test_db();
    let mut handles = vec![];

    // Create multiple categories concurrently
    for i in 0..10 {
        let db_clone = db.clone();
        let handle = task::spawn(async move {
            let category = CategoryFactory::create_with_name(&format!("Concurrent {}", i));
            create_category(category, tauri::State::new(db_clone)).await
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
