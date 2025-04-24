use crate::db::models::Category;
use crate::services::category_service::*;
use super::setup_test_db;

#[tokio::test]
async fn test_create_category() {
    let db = setup_test_db();
    let test_category = Category {
        id: None,
        name: "Test Category".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let result = create_category(test_category.clone(), tauri::State::new(db))
        .await
        .expect("Failed to create category");
    
    assert!(result > 0, "Category ID should be positive");
}

#[tokio::test]
async fn test_get_categories() {
    let db = setup_test_db();
    let test_category = Category {
        id: None,
        name: "Test Category".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    create_category(test_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create category");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert!(!categories.is_empty(), "Categories should not be empty");
    assert_eq!(categories[0].name, "Test Category");
}

#[tokio::test]
async fn test_update_category() {
    let db = setup_test_db();
    let test_category = Category {
        id: None,
        name: "Test Category".to_string(),
        color: "#FF0000".to_string(),
        symbol: "circle".to_string(),
        created_at: None,
        updated_at: None,
    };

    let id = create_category(test_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to create category");

    let mut updated_category = test_category;
    updated_category.id = Some(id);
    updated_category.name = "Updated Category".to_string();

    update_category(updated_category.clone(), tauri::State::new(db.clone()))
        .await
        .expect("Failed to update category");

    let categories = get_categories(tauri::State::new(db))
        .await
        .expect("Failed to get categories");
    
    assert_eq!(categories[0].name, "Updated Category");
}
