use crate::db::{Database, models::Note};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteLink {
    pub id: Option<i64>,
    pub note_id: i64,
    pub entity_type: String,
    pub entity_id: i64,
}

#[tauri::command]
pub async fn get_notes(db: State<'_, Database>) -> Result<Vec<Note>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at, updated_at FROM notes"
    ).map_err(|e| e.to_string())?;
    
    let notes = stmt.query_map([], |row| {
        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
pub async fn create_note(note: Note, db: State<'_, Database>) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO notes (title, content) VALUES (?1, ?2)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([&note.title, &note.content])
        .map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn update_note(note: Note, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2 WHERE id = ?3",
        [
            &note.title,
            &note.content,
            &note.id.ok_or("Note ID is required")?.to_string(),
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_note(id: i64, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    conn.execute("DELETE FROM notes WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn link_note(link: NoteLink, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    let table_name = match link.entity_type.as_str() {
        "event" => "event_notes",
        "task" => "task_notes",
        _ => return Err("Invalid entity type".to_string()),
    };
    
    let query = format!(
        "INSERT INTO {} ({}_id, note_id) VALUES (?1, ?2)",
        table_name,
        link.entity_type
    );
    
    conn.execute(&query, [&link.entity_id, &link.note_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn unlink_note(link: NoteLink, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    let table_name = match link.entity_type.as_str() {
        "event" => "event_notes",
        "task" => "task_notes",
        _ => return Err("Invalid entity type".to_string()),
    };
    
    let query = format!(
        "DELETE FROM {} WHERE {}_id = ? AND note_id = ?",
        table_name,
        link.entity_type
    );
    
    conn.execute(&query, [&link.entity_id, &link.note_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_notes_for_entity(
    entity_type: String,
    entity_id: i64,
    db: State<'_, Database>
) -> Result<Vec<Note>, String> {
    let conn = db.get_connection();
    let table_name = match entity_type.as_str() {
        "event" => "event_notes",
        "task" => "task_notes",
        _ => return Err("Invalid entity type".to_string()),
    };
    
    let query = format!(
        "SELECT n.id, n.title, n.content, n.created_at, n.updated_at
         FROM notes n
         JOIN {} en ON n.id = en.note_id
         WHERE en.{}_id = ?",
        table_name,
        entity_type
    );
    
    let mut stmt = conn.prepare(&query)
        .map_err(|e| e.to_string())?;
    
    let notes = stmt.query_map([entity_id], |row| {
        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(notes)
}
