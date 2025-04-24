use crate::db::{Database, models::Task};
use tauri::State;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct KanbanColumn {
    pub id: Option<i64>,
    pub name: String,
    pub column_order: i32,
}

#[tauri::command]
pub async fn get_kanban_columns(
    db: State<'_, Database>,
) -> Result<Vec<KanbanColumn>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, name, column_order FROM kanban_columns ORDER BY column_order ASC"
    ).map_err(|e| e.to_string())?;
    
    let columns = stmt
        .query_map([], |row| {
            Ok(KanbanColumn {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                column_order: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(columns)
}

#[tauri::command]
pub async fn create_kanban_column(
    column: KanbanColumn,
    db: State<'_, Database>,
) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let id = conn.execute(
        "INSERT INTO kanban_columns (name, column_order) VALUES (?, ?)",
        [&column.name, &column.column_order.to_string()]
    ).map_err(|e| e.to_string())?;
    
    Ok(id as i64)
}

#[tauri::command]
pub async fn update_kanban_column(
    column: KanbanColumn,
    db: State<'_, Database>,
) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE kanban_columns SET name = ?, column_order = ? WHERE id = ?",
        [&column.name, &column.column_order.to_string(), &column.id.unwrap().to_string()]
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_kanban_column(
    id: i64,
    db: State<'_, Database>,
) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "DELETE FROM kanban_columns WHERE id = ?",
        [id.to_string()]
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
