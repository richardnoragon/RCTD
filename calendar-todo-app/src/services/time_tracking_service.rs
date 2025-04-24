use crate::db::{Database, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeEntry {
    pub id: Option<i64>,
    pub item_type: String,
    pub item_id: Option<i64>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_seconds: Option<i32>,
    pub timer_type: String,
    pub created_at: Option<String>,
}

#[tauri::command]
pub async fn start_timer(
    entry: TimeEntry,
    db: State<'_, Database>
) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO time_tracking (item_type, item_id, start_time, timer_type) 
         VALUES (?1, ?2, ?3, ?4)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &entry.item_type,
        &entry.item_id.map(|id| id.to_string()).unwrap_or_default(),
        &entry.start_time,
        &entry.timer_type,
    ]).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn stop_timer(
    id: i64,
    end_time: String,
    db: State<'_, Database>
) -> Result<(), String> {
    let conn = db.get_connection();
    
    // Parse times to calculate duration
    let start_time: DateTime<Utc> = conn.query_row(
        "SELECT start_time FROM time_tracking WHERE id = ?",
        [id],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    let end_time: DateTime<Utc> = end_time.parse()
        .map_err(|e| e.to_string())?;
    
    let duration = end_time.signed_duration_since(start_time).num_seconds() as i32;
    
    conn.execute(
        "UPDATE time_tracking SET end_time = ?, duration_seconds = ? WHERE id = ?",
        [&end_time.to_string(), &duration.to_string(), &id.to_string()],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_active_timer(db: State<'_, Database>) -> Result<Option<TimeEntry>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, item_type, item_id, start_time, end_time, duration_seconds, timer_type, created_at
         FROM time_tracking 
         WHERE end_time IS NULL
         ORDER BY start_time DESC LIMIT 1"
    ).map_err(|e| e.to_string())?;
    
    let entry = stmt.query_row([], |row| {
        Ok(TimeEntry {
            id: Some(row.get(0)?),
            item_type: row.get(1)?,
            item_id: row.get(2)?,
            start_time: row.get(3)?,
            end_time: row.get(4)?,
            duration_seconds: row.get(5)?,
            timer_type: row.get(6)?,
            created_at: Some(row.get(7)?),
        })
    }).optional().map_err(|e| e.to_string())?;
    
    Ok(entry)
}

#[tauri::command]
pub async fn get_time_entries(
    item_type: Option<String>,
    item_id: Option<i64>,
    start_date: Option<String>,
    end_date: Option<String>,
    db: State<'_, Database>
) -> Result<Vec<TimeEntry>, String> {
    let conn = db.get_connection();
    
    let mut query = String::from(
        "SELECT id, item_type, item_id, start_time, end_time, duration_seconds, timer_type, created_at
         FROM time_tracking WHERE 1=1"
    );
    let mut params: Vec<String> = vec![];
    
    if let Some(type_str) = item_type {
        query.push_str(" AND item_type = ?");
        params.push(type_str);
    }
    
    if let Some(id) = item_id {
        query.push_str(" AND item_id = ?");
        params.push(id.to_string());
    }
    
    if let Some(start) = start_date {
        query.push_str(" AND start_time >= ?");
        params.push(start);
    }
    
    if let Some(end) = end_date {
        query.push_str(" AND start_time <= ?");
        params.push(end);
    }
    
    query.push_str(" ORDER BY start_time DESC");
    
    let mut stmt = conn.prepare(&query)
        .map_err(|e| e.to_string())?;
    
    let param_refs: Vec<&dyn rusqlite::ToSql> = params
        .iter()
        .map(|p| p as &dyn rusqlite::ToSql)
        .collect();
    
    let entries = stmt.query_map(rusqlite::params_from_iter(param_refs), |row| {
        Ok(TimeEntry {
            id: Some(row.get(0)?),
            item_type: row.get(1)?,
            item_id: row.get(2)?,
            start_time: row.get(3)?,
            end_time: row.get(4)?,
            duration_seconds: row.get(5)?,
            timer_type: row.get(6)?,
            created_at: Some(row.get(7)?),
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(entries)
}
