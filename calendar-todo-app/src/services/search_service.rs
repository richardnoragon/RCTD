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
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn = db.get_connection();
    let query_pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, title, description, item_type, date, category_id, priority, status
         FROM (
           SELECT id, title, description, 'EVENT' AS item_type, start_time AS date, category_id, priority, NULL AS status
           FROM events
           WHERE title LIKE ?1 OR description LIKE ?1 OR location LIKE ?1

           UNION ALL

           SELECT id, title, description, 'TASK' AS item_type, due_date AS date, category_id, priority, status
           FROM tasks
           WHERE title LIKE ?1 OR description LIKE ?1

           UNION ALL

           SELECT id, title, content AS description, 'NOTE' AS item_type, created_at AS date, NULL AS category_id, NULL AS priority, NULL AS status
           FROM notes
           WHERE title LIKE ?1 OR content LIKE ?1
         )
         ORDER BY date DESC"
    ).map_err(|e| e.to_string())?;

    let results = stmt.query_map([&query_pattern], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            item_type: row.get(3)?,
            date: row.get(4)?,
            category_id: row.get(5)?,
            priority: row.get(6)?,
            status: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    Ok(results.filter_map(|r| r.ok()).collect())
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
    let query_pattern = if query.trim().is_empty() {
        "%".to_string()
    } else {
        format!("%{}%", query)
    };

    let mut stmt = conn.prepare(
        "SELECT id, title, description, start_time, category_id, priority
         FROM events 
         WHERE (title LIKE ?1 OR description LIKE ?1 OR location LIKE ?1)
           AND (?2 IS NULL OR start_time >= ?2)
           AND (?3 IS NULL OR start_time <= ?3)
           AND (?4 IS NULL OR category_id = ?4)
         ORDER BY start_time DESC"
    ).map_err(|e| e.to_string())?;

    let results = stmt.query_map(
        rusqlite::params![query_pattern, start_date, end_date, category_id],
        |row| {
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
    let query_pattern = if query.trim().is_empty() {
        "%".to_string()
    } else {
        format!("%{}%", query)
    };

    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, category_id, priority, status
         FROM tasks 
         WHERE (title LIKE ?1 OR description LIKE ?1)
           AND (?2 IS NULL OR due_date >= ?2)
           AND (?3 IS NULL OR due_date <= ?3)
           AND (?4 IS NULL OR category_id = ?4)
           AND (?5 IS NULL OR status = ?5)
           AND (?6 IS NULL OR priority = ?6)
         ORDER BY due_date DESC, id DESC"
    ).map_err(|e| e.to_string())?;

    let results = stmt.query_map(
        rusqlite::params![query_pattern, due_date_start, due_date_end, category_id, status, priority],
        |row| {
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
