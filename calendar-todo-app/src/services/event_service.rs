use crate::db::{Database, models::Event, error::DbResult};
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct EventResponse {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub is_all_day: bool,
    pub location: Option<String>,
    pub priority: i32,
    pub category_id: Option<i64>,
}

#[tauri::command]
pub async fn get_events_in_range(
    start: String,
    end: String,
    db: State<'_, Database>,
) -> Result<Vec<EventResponse>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, title, description, start_time, end_time, is_all_day, location, 
         priority, category_id, recurring_rule_id, created_at, updated_at 
         FROM events 
         WHERE (start_time BETWEEN ?1 AND ?2) OR (end_time BETWEEN ?1 AND ?2)"
    ).map_err(|e| e.to_string())?;
    
    let events = stmt
        .query_map([start, end], |row| Event::from_row(&row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(events.into_iter().map(|event| EventResponse {
        id: event.id.unwrap_or_default(),
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        location: event.location,
        priority: event.priority,
        category_id: event.category_id,
    }).collect())
}

#[tauri::command]
pub async fn create_event(
    event: Event,
    db: State<'_, Database>,
) -> Result<i64, String> {
    db.create_event(&event).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_event(
    event: Event,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.update_event(&event).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_event(
    id: i64,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.delete_event(id).map_err(|e| e.to_string())
}
