use crate::db::{Database, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Participant {
    pub id: Option<i64>,
    pub name: String,
    pub email: Option<String>,
    pub avatar_location: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn get_participants(db: State<'_, Database>) -> Result<Vec<Participant>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, name, email, avatar_location, created_at, updated_at 
         FROM participants ORDER BY name"
    ).map_err(|e| e.to_string())?;
    
    let participants = stmt.query_map([], |row| {
        Ok(Participant {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            email: row.get(2)?,
            avatar_location: row.get(3)?,
            created_at: Some(row.get(4)?),
            updated_at: Some(row.get(5)?),
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(participants)
}

#[tauri::command]
pub async fn create_participant(participant: Participant, db: State<'_, Database>) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO participants (name, email, avatar_location) VALUES (?1, ?2, ?3)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &participant.name,
        &participant.email,
        &participant.avatar_location,
    ]).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn update_participant(participant: Participant, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE participants SET name = ?1, email = ?2, avatar_location = ?3 WHERE id = ?4",
        [
            &participant.name,
            &participant.email,
            &participant.avatar_location,
            &participant.id.ok_or("Participant ID is required")?.to_string(),
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_participant(id: i64, db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection();
    conn.execute("DELETE FROM participants WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_event_participants(event_id: i64, db: State<'_, Database>) -> Result<Vec<Participant>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.email, p.avatar_location, p.created_at, p.updated_at 
         FROM participants p
         JOIN event_participants ep ON p.id = ep.participant_id
         WHERE ep.event_id = ?
         ORDER BY p.name"
    ).map_err(|e| e.to_string())?;
    
    let participants = stmt.query_map([event_id], |row| {
        Ok(Participant {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            email: row.get(2)?,
            avatar_location: row.get(3)?,
            created_at: Some(row.get(4)?),
            updated_at: Some(row.get(5)?),
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(participants)
}

#[tauri::command]
pub async fn add_participant_to_event(
    event_id: i64,
    participant_id: i64,
    db: State<'_, Database>
) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "INSERT INTO event_participants (event_id, participant_id) VALUES (?1, ?2)",
        [event_id, participant_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn remove_participant_from_event(
    event_id: i64,
    participant_id: i64,
    db: State<'_, Database>
) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "DELETE FROM event_participants WHERE event_id = ?1 AND participant_id = ?2",
        [event_id, participant_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn import_participants_csv(csv_data: String, db: State<'_, Database>) -> Result<(), String> {
    let mut reader = csv::Reader::from_reader(csv_data.as_bytes());
    let conn = db.get_connection();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        if record.len() < 2 {
            continue; // Skip invalid rows
        }
        
        tx.execute(
            "INSERT INTO participants (name, email) VALUES (?1, ?2)",
            [&record[0], &record[1]],
        ).map_err(|e| e.to_string())?;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn export_participants_csv(db: State<'_, Database>) -> Result<String, String> {
    let participants = get_participants(db).await?;
    let mut wtr = csv::Writer::from_writer(vec![]);
    
    for participant in participants {
        wtr.write_record(&[
            participant.name,
            participant.email.unwrap_or_default(),
        ]).map_err(|e| e.to_string())?;
    }
    
    let data = String::from_utf8(wtr.into_inner().map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    
    Ok(data)
}
