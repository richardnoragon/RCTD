use crate::db::{Database, models::Category};
use serde::{Serialize, Deserialize};
use tauri::State;

#[tauri::command]
pub async fn get_categories(db: State<'_, Database>) -> Result<Vec<Category>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, name, color, symbol, created_at, updated_at FROM categories ORDER BY name"
    ).map_err(|e| e.to_string())?;
    
    let categories = stmt.query_map([], |row| {
        Ok(Category {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            color: row.get(2)?,
            symbol: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(categories)
}

#[tauri::command]
pub async fn create_category(category: Category, db: State<'_, Database>) -> Result<i64, String> {
    db.create_category(&category).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_category(category: Category, db: State<'_, Database>) -> Result<(), String> {
    db.update_category(&category).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_category(id: i64, db: State<'_, Database>) -> Result<(), String> {
    db.delete_category(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_categories(db: State<'_, Database>) -> Result<String, String> {
    let categories = get_categories(db).await?;
    serde_json::to_string(&categories).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_categories(json_data: String, db: State<'_, Database>) -> Result<(), String> {
    let categories: Vec<Category> = serde_json::from_str(&json_data)
        .map_err(|e| e.to_string())?;
    
    let conn = db.get_connection();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    for category in categories {
        tx.execute(
            "INSERT INTO categories (name, color, symbol) VALUES (?1, ?2, ?3)",
            [&category.name, &category.color, &category.symbol],
        ).map_err(|e| e.to_string())?;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
