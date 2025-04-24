use crate::db::{Database, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Reminder {
    pub id: Option<i64>,
    pub item_type: String,
    pub item_id: i64,
    pub trigger_time: String,
    pub offset_description: String,
    pub is_dismissed: bool,
    pub created_at: Option<String>,
}

#[tauri::command]
pub async fn create_reminder(reminder: Reminder, db: State<'_, Database>) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO reminders (item_type, item_id, trigger_time, offset_description) 
         VALUES (?1, ?2, ?3, ?4)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &reminder.item_type,
        &reminder.item_id.to_string(),
        &reminder.trigger_time,
        &reminder.offset_description,
    ]).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn get_reminder(item_type: String, item_id: i64, db: State<'_, Database>) -> Result<Option<Reminder>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, item_type, item_id, trigger_time, offset_description, is_dismissed, created_at 
         FROM reminders WHERE item_type = ? AND item_id = ?"
    ).map_err(|e| e.to_string())?;
    
    let reminder = stmt.query_row([item_type, item_id.to_string()], |row| {
        Ok(Reminder {
            id: Some(row.get(0)?),
            item_type: row.get(1)?,
            item_id: row.get(2)?,
            trigger_time: row.get(3)?,
            offset_description: row.get(4)?,
            is_dismissed: row.get(5)?,
            created_at: Some(row.get(6)?),
        })
    }).optional().map_err(|e| e.to_string())?;
    
    Ok(reminder)
}

#[tauri::command]
pub async fn update_reminder(reminder: Reminder, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE reminders SET trigger_time = ?1, offset_description = ?2, is_dismissed = ?3 
         WHERE id = ?4",
        [
            &reminder.trigger_time,
            &reminder.offset_description,
            &reminder.is_dismissed.to_string(),
            &reminder.id.ok_or("Reminder ID is required")?.to_string(),
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_reminder(item_type: String, item_id: i64, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "DELETE FROM reminders WHERE item_type = ? AND item_id = ?",
        [item_type, item_id.to_string()],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_pending_reminders(db: State<'_, Database>) -> Result<Vec<Reminder>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, item_type, item_id, trigger_time, offset_description, is_dismissed, created_at 
         FROM reminders 
         WHERE is_dismissed = 0 AND trigger_time <= datetime('now')
         ORDER BY trigger_time ASC"
    ).map_err(|e| e.to_string())?;
    
    let reminders = stmt.query_map([], |row| {
        Ok(Reminder {
            id: Some(row.get(0)?),
            item_type: row.get(1)?,
            item_id: row.get(2)?,
            trigger_time: row.get(3)?,
            offset_description: row.get(4)?,
            is_dismissed: row.get(5)?,
            created_at: Some(row.get(6)?),
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(reminders)
}
