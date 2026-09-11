use crate::db::{Database, error::DbResult};
use chrono::Utc;
use serde::{Serialize, Deserialize};
use rusqlite::OptionalExtension;
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
        "INSERT INTO reminders (item_type, item_id, trigger_time, offset_description, is_dismissed) 
         VALUES (?1, ?2, ?3, ?4, ?5)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &reminder.item_type,
        &reminder.item_id.to_string(),
        &reminder.trigger_time,
        &reminder.offset_description,
        &reminder.is_dismissed.to_string(),
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

fn current_utc_timestamp() -> String {
    Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

fn reminder_delivery_key(reminder: &Reminder) -> String {
    format!(
        "{}:{}:{}",
        reminder.id.unwrap_or_default(),
        reminder.item_type,
        reminder.trigger_time
    )
}

fn load_due_reminders(conn: &rusqlite::Connection, now_utc: &str) -> Result<Vec<Reminder>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, item_type, item_id, trigger_time, offset_description, is_dismissed, created_at 
         FROM reminders 
         WHERE is_dismissed = 0 AND datetime(trigger_time) <= datetime(?1)
         ORDER BY datetime(trigger_time) ASC, id ASC"
    ).map_err(|e| e.to_string())?;

    let reminders = stmt.query_map([now_utc], |row| {
        Ok(Reminder {
            id: Some(row.get(0)?),
            item_type: row.get(1)?,
            item_id: row.get(2)?,
            trigger_time: row.get(3)?,
            offset_description: row.get(4)?,
            is_dismissed: row.get(5)?,
            created_at: Some(row.get(6)?),
        })
    }).map_err(|e| e.to_string())?;

    reminders
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn claim_due_reminders_internal(conn: &rusqlite::Connection, now_utc: &str) -> Result<Vec<Reminder>, String> {
    let due_reminders = load_due_reminders(conn, now_utc)?;
    let mut claimed_reminders = Vec::new();

    for reminder in due_reminders {
        let delivery_key = reminder_delivery_key(&reminder);
        let inserted = conn.execute(
            "INSERT OR IGNORE INTO reminder_delivery_log (reminder_id, delivery_key, claimed_at) 
             VALUES (?1, ?2, ?3)",
            [
                &reminder.id.unwrap_or_default().to_string(),
                &delivery_key,
                now_utc,
            ],
        ).map_err(|e| e.to_string())?;

        if inserted > 0 {
            claimed_reminders.push(reminder);
        }
    }

    Ok(claimed_reminders)
}

#[tauri::command]
pub async fn claim_due_reminders(now_utc: Option<String>, db: State<'_, Database>) -> Result<Vec<Reminder>, String> {
    let conn = db.get_connection();
    let now_utc = now_utc.unwrap_or_else(current_utc_timestamp);

    claim_due_reminders_internal(conn, &now_utc)
}

#[tauri::command]
pub async fn rehydrate_pending_reminders(db: State<'_, Database>) -> Result<Vec<Reminder>, String> {
    let conn = db.get_connection();
    let now_utc = current_utc_timestamp();

    claim_due_reminders_internal(conn, &now_utc)
}
