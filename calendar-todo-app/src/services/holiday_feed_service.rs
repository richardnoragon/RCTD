use crate::db::{Database, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct HolidayFeed {
    pub id: Option<i64>,
    pub url: String,
    pub name: String,
    pub is_visible: bool,
    pub last_sync_time: Option<String>,
    pub sync_error: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn get_holiday_feeds(db: State<'_, Database>) -> Result<Vec<HolidayFeed>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, url, name, is_visible, last_sync_time, sync_error, created_at, updated_at 
         FROM holiday_feeds ORDER BY name"
    ).map_err(|e| e.to_string())?;
    
    let feeds = stmt.query_map([], |row| {
        Ok(HolidayFeed {
            id: Some(row.get(0)?),
            url: row.get(1)?,
            name: row.get(2)?,
            is_visible: row.get(3)?,
            last_sync_time: row.get(4)?,
            sync_error: row.get(5)?,
            created_at: Some(row.get(6)?),
            updated_at: Some(row.get(7)?),
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(feeds)
}

#[tauri::command]
pub async fn create_holiday_feed(feed: HolidayFeed, db: State<'_, Database>) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO holiday_feeds (url, name, is_visible) VALUES (?1, ?2, ?3)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &feed.url,
        &feed.name,
        &feed.is_visible.to_string(),
    ]).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn update_holiday_feed(feed: HolidayFeed, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE holiday_feeds SET url = ?1, name = ?2, is_visible = ?3 WHERE id = ?4",
        [
            &feed.url,
            &feed.name,
            &feed.is_visible.to_string(),
            &feed.id.ok_or("Feed ID is required")?.to_string(),
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_holiday_feed(id: i64, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    conn.execute("DELETE FROM holiday_feeds WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn sync_holiday_feed(id: i64, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    let feed = conn.query_row(
        "SELECT url FROM holiday_feeds WHERE id = ?",
        [id],
        |row| row.get::<_, String>(0)
    ).map_err(|e| e.to_string())?;
    
    // Download and parse the ICS feed
    let response = reqwest::get(&feed).await
        .map_err(|e| format!("Failed to download feed: {}", e))?;
    let ics_content = response.text().await
        .map_err(|e| format!("Failed to read feed content: {}", e))?;
    
    // Parse and import the ICS data using the ical crate
    let calendar = ical::parser::read_calendar(&ics_content)
        .map_err(|e| format!("Failed to parse ICS data: {}", e))?;
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Clear existing events for this feed
    tx.execute(
        "DELETE FROM events WHERE category_id = (SELECT id FROM categories WHERE name = 'Holidays')",
        [],
    ).map_err(|e| e.to_string())?;
    
    // Ensure we have a Holidays category
    let holiday_category_id = tx.query_row(
        "SELECT id FROM categories WHERE name = 'Holidays'",
        [],
        |row| row.get::<_, i64>(0)
    ).unwrap_or_else(|_| {
        tx.execute(
            "INSERT INTO categories (name, color, symbol) VALUES ('Holidays', '#FF0000', 'star')",
            [],
        ).unwrap();
        tx.last_insert_rowid()
    });
    
    // Import events
    for event in calendar {
        if let Ok(event) = event {
            if let Some(summary) = event.get_first_property("SUMMARY") {
                if let Some(dtstart) = event.get_first_property("DTSTART") {
                    if let Some(dtend) = event.get_first_property("DTEND") {
                        tx.execute(
                            "INSERT INTO events (title, start_time, end_time, is_all_day, category_id) 
                             VALUES (?1, ?2, ?3, 1, ?4)",
                            [
                                &summary.get_value().unwrap_or_default(),
                                &dtstart.get_value().unwrap_or_default(),
                                &dtend.get_value().unwrap_or_default(),
                                &holiday_category_id.to_string(),
                            ],
                        ).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }
    
    // Update sync status
    tx.execute(
        "UPDATE holiday_feeds SET last_sync_time = datetime('now'), sync_error = NULL WHERE id = ?",
        [id],
    ).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
