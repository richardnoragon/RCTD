use crate::db::Database;
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub item_type: String,
    pub date: Option<String>,
    pub category_id: Option<i64>,
    pub priority: Option<i32>,
    pub status: Option<String>,
}

fn search_index_available(conn: &rusqlite::Connection) -> bool {
    conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'search_index' LIMIT 1",
        [],
        |row| row.get::<_, i32>(0),
    ).is_ok()
}

fn normalize_fts_query(raw_query: &str) -> String {
    raw_query
        .split_whitespace()
        .filter(|token| !token.trim().is_empty())
        .map(|token| {
            let trimmed = token
                .trim_matches(|c: char| c == '"' || c == '\'' || c == '(' || c == ')' || c == '*' || c == '%');
            trimmed.to_string()
        })
        .filter(|token| !token.is_empty())
        .map(|token| format!("\"{}\"", token))
        .collect::<Vec<_>>()
        .join(" ")
}

fn search_all_fts(conn: &rusqlite::Connection, query: &str) -> Option<Vec<SearchResult>> {
    if !search_index_available(conn) {
        return None;
    }

    let fts_query = normalize_fts_query(query);
    if fts_query.is_empty() {
        return Some(Vec::new());
    }

    let sql = r#"
        SELECT id, title, description, item_type, date, category_id, priority, status
        FROM (
            SELECT e.id, e.title, e.description, 'EVENT' AS item_type, e.start_time AS date, e.category_id, e.priority, NULL AS status
            FROM events e
            JOIN search_index s ON s.entity_type = 'EVENT' AND s.entity_id = e.id
            WHERE s MATCH ?1

            UNION ALL

            SELECT t.id, t.title, t.description, 'TASK' AS item_type, t.due_date AS date, t.category_id, t.priority, t.status
            FROM tasks t
            JOIN search_index s ON s.entity_type = 'TASK' AND s.entity_id = t.id
            WHERE s MATCH ?1

            UNION ALL

            SELECT n.id, n.title, n.content AS description, 'NOTE' AS item_type, n.created_at AS date, NULL AS category_id, NULL AS priority, NULL AS status
            FROM notes n
            JOIN search_index s ON s.entity_type = 'NOTE' AND s.entity_id = n.id
            WHERE s MATCH ?1
        )
        ORDER BY date DESC
    "#;

    let mut stmt = conn.prepare(sql).ok()?;
    let rows = stmt.query_map([fts_query], |row| {
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
    }).ok()?;

    Some(rows.filter_map(Result::ok).collect())
}

fn search_events_fts(conn: &rusqlite::Connection, query: &str, start_date: Option<&str>, end_date: Option<&str>, category_id: Option<i64>) -> Option<Vec<SearchResult>> {
    if !search_index_available(conn) {
        return None;
    }

    let fts_query = normalize_fts_query(query);
    if fts_query.is_empty() {
        return Some(Vec::new());
    }

    let sql = r#"
        SELECT e.id, e.title, e.description, e.start_time, e.category_id, e.priority
        FROM events e
        JOIN search_index s ON s.entity_type = 'EVENT' AND s.entity_id = e.id
        WHERE s MATCH ?1
          AND (?2 IS NULL OR e.start_time >= ?2)
          AND (?3 IS NULL OR e.start_time <= ?3)
          AND (?4 IS NULL OR e.category_id = ?4)
        ORDER BY e.start_time DESC
    "#;

    let mut stmt = conn.prepare(sql).ok()?;
    let rows = stmt.query_map(rusqlite::params![fts_query, start_date, end_date, category_id], |row| {
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
    }).ok()?;

    Some(rows.filter_map(Result::ok).collect())
}

fn search_tasks_fts(conn: &rusqlite::Connection, query: &str, due_date_start: Option<&str>, due_date_end: Option<&str>, category_id: Option<i64>, status: Option<&str>, priority: Option<i32>) -> Option<Vec<SearchResult>> {
    if !search_index_available(conn) {
        return None;
    }

    let fts_query = normalize_fts_query(query);
    if fts_query.is_empty() {
        return Some(Vec::new());
    }

    let sql = r#"
        SELECT t.id, t.title, t.description, t.due_date, t.category_id, t.priority, t.status
        FROM tasks t
        JOIN search_index s ON s.entity_type = 'TASK' AND s.entity_id = t.id
        WHERE s MATCH ?1
          AND (?2 IS NULL OR t.due_date >= ?2)
          AND (?3 IS NULL OR t.due_date <= ?3)
          AND (?4 IS NULL OR t.category_id = ?4)
          AND (?5 IS NULL OR t.status = ?5)
          AND (?6 IS NULL OR t.priority = ?6)
        ORDER BY t.due_date DESC, t.id DESC
    "#;

    let mut stmt = conn.prepare(sql).ok()?;
    let rows = stmt.query_map(rusqlite::params![fts_query, due_date_start, due_date_end, category_id, status, priority], |row| {
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
    }).ok()?;

    Some(rows.filter_map(Result::ok).collect())
}

fn search_notes_fts(conn: &rusqlite::Connection, query: &str) -> Option<Vec<SearchResult>> {
    if !search_index_available(conn) {
        return None;
    }

    let fts_query = normalize_fts_query(query);
    if fts_query.is_empty() {
        return Some(Vec::new());
    }

    let sql = r#"
        SELECT n.id, n.title, n.content, n.created_at
        FROM notes n
        JOIN search_index s ON s.entity_type = 'NOTE' AND s.entity_id = n.id
        WHERE s MATCH ?1
        ORDER BY n.created_at DESC
    "#;

    let mut stmt = conn.prepare(sql).ok()?;
    let rows = stmt.query_map([fts_query], |row| {
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
    }).ok()?;

    Some(rows.filter_map(Result::ok).collect())
}

fn like_search_all(conn: &rusqlite::Connection, query: &str) -> Result<Vec<SearchResult>, String> {
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
pub async fn search_all(
    query: String,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn = db.get_connection();

    if let Some(results) = search_all_fts(conn, &query) {
        return Ok(results);
    }

    like_search_all(conn, &query)
}

#[tauri::command]
pub async fn search_events(
    query: String,
    start_date: Option<String>,
    end_date: Option<String>,
    category_id: Option<i64>,
    db: State<'_, Database>
) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn = db.get_connection();

    if let Some(results) = search_events_fts(conn, &query, start_date.as_deref(), end_date.as_deref(), category_id) {
        return Ok(results);
    }

    let query_pattern = format!("%{}%", query);

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
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn = db.get_connection();

    if let Some(results) = search_tasks_fts(
        conn,
        &query,
        due_date_start.as_deref(),
        due_date_end.as_deref(),
        category_id,
        status.as_deref(),
        priority,
    ) {
        return Ok(results);
    }

    let query_pattern = format!("%{}%", query);
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
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn = db.get_connection();

    if let Some(results) = search_notes_fts(conn, &query) {
        return Ok(results);
    }

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
