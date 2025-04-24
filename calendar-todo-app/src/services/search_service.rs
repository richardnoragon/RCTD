use crate::db::Database;
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub item_type: String, // "EVENT", "TASK", or "NOTE"
    pub date: Option<String>, // start_time for events, due_date for tasks, created_at for notes
    pub category_id: Option<i64>,
    pub priority: Option<i32>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn search_all(
    query: String,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    let conn = db.get_connection();
    let mut results = Vec::new();
    let query_pattern = format!("%{}%", query);

    // Search events
    let mut stmt = conn.prepare(
        "SELECT id, title, description, start_time, category_id, priority
         FROM events 
         WHERE title LIKE ?1 
         OR description LIKE ?1 
         OR location LIKE ?1
         ORDER BY start_time DESC"
    ).map_err(|e| e.to_string())?;

    let events = stmt.query_map([&query_pattern], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            item_type: "EVENT".to_string(),
            date: Some(row.get(3)?),
            category_id: row.get(4)?,
            priority: Some(row.get(5)?),
            status: None,
        })
    }).map_err(|e| e.to_string())?;

    results.extend(events.filter_map(|r| r.ok()));

    // Search tasks
    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, category_id, priority, status
         FROM tasks 
         WHERE title LIKE ?1 
         OR description LIKE ?1
         ORDER BY due_date DESC"
    ).map_err(|e| e.to_string())?;

    let tasks = stmt.query_map([&query_pattern], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            item_type: "TASK".to_string(),
            date: row.get(3)?,
            category_id: row.get(4)?,
            priority: Some(row.get(5)?),
            status: Some(row.get(6)?),
        })
    }).map_err(|e| e.to_string())?;

    results.extend(tasks.filter_map(|r| r.ok()));

    // Search notes
    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at
         FROM notes 
         WHERE title LIKE ?1 
         OR content LIKE ?1
         ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let notes = stmt.query_map([&query_pattern], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: Some(row.get(2)?),
            item_type: "NOTE".to_string(),
            date: Some(row.get(3)?),
            category_id: None,
            priority: None,
            status: None,
        })
    }).map_err(|e| e.to_string())?;

    results.extend(notes.filter_map(|r| r.ok()));

    Ok(results)
}

#[tauri::command]
pub async fn search_events(
    query: String,
    start_date: Option<String>,
    end_date: Option<String>,
    category_id: Option<i64>,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    let conn = db.get_connection();
    let query_pattern = format!("%{}%", query);
    let mut params: Vec<String> = vec![query_pattern];
    
    let mut sql = String::from(
        "SELECT id, title, description, start_time, category_id, priority
         FROM events 
         WHERE (title LIKE ?1 OR description LIKE ?1 OR location LIKE ?1)"
    );

    if let Some(start) = start_date {
        sql.push_str(" AND start_time >= ?");
        params.push(start);
    }

    if let Some(end) = end_date {
        sql.push_str(" AND start_time <= ?");
        params.push(end);
    }

    if let Some(cat_id) = category_id {
        sql.push_str(" AND category_id = ?");
        params.push(cat_id.to_string());
    }

    sql.push_str(" ORDER BY start_time DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as _).collect();

    let results = stmt.query_map(rusqlite::params_from_iter(param_refs), |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            item_type: "EVENT".to_string(),
            date: Some(row.get(3)?),
            category_id: row.get(4)?,
            priority: Some(row.get(5)?),
            status: None,
        })
    }).map_err(|e| e.to_string())?;

    Ok(results.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn search_tasks(
    query: String,
    due_date_start: Option<String>,
    due_date_end: Option<String>,
    category_id: Option<i64>,
    status: Option<String>,
    priority: Option<i32>,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    let conn = db.get_connection();
    let query_pattern = format!("%{}%", query);
    let mut params: Vec<String> = vec![query_pattern];
    
    let mut sql = String::from(
        "SELECT id, title, description, due_date, category_id, priority, status
         FROM tasks 
         WHERE (title LIKE ?1 OR description LIKE ?1)"
    );

    if let Some(start) = due_date_start {
        sql.push_str(" AND due_date >= ?");
        params.push(start);
    }

    if let Some(end) = due_date_end {
        sql.push_str(" AND due_date <= ?");
        params.push(end);
    }

    if let Some(cat_id) = category_id {
        sql.push_str(" AND category_id = ?");
        params.push(cat_id.to_string());
    }

    if let Some(stat) = status {
        sql.push_str(" AND status = ?");
        params.push(stat);
    }

    if let Some(prio) = priority {
        sql.push_str(" AND priority = ?");
        params.push(prio.to_string());
    }

    sql.push_str(" ORDER BY due_date DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as _).collect();

    let results = stmt.query_map(rusqlite::params_from_iter(param_refs), |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            item_type: "TASK".to_string(),
            date: row.get(3)?,
            category_id: row.get(4)?,
            priority: Some(row.get(5)?),
            status: Some(row.get(6)?),
        })
    }).map_err(|e| e.to_string())?;

    Ok(results.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn search_notes(
    query: String,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    let conn = db.get_connection();
    let query_pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at
         FROM notes 
         WHERE title LIKE ?1 
         OR content LIKE ?1
         ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let results = stmt.query_map([query_pattern], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: Some(row.get(2)?),
            item_type: "NOTE".to_string(),
            date: Some(row.get(3)?),
            category_id: None,
            priority: None,
            status: None,
        })
    }).map_err(|e| e.to_string())?;

    Ok(results.filter_map(|r| r.ok()).collect())
}
