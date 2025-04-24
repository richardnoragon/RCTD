use crate::db::{Database, models::RecurringRule, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct RecurringRuleResponse {
    pub id: i64,
    pub frequency: String,
    pub interval: i32,
    pub days_of_week: Option<String>,
    pub day_of_month: Option<i32>,
    pub month_of_year: Option<i32>,
    pub end_date: Option<String>,
    pub end_occurrences: Option<i32>,
}

#[tauri::command]
pub async fn create_recurring_rule(
    rule: RecurringRule,
    db: State<'_, Database>,
) -> Result<i64, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "INSERT INTO recurring_rules (frequency, interval, days_of_week, day_of_month, month_of_year, end_date, end_occurrences)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &rule.frequency,
        &rule.interval,
        &rule.days_of_week,
        &rule.day_of_month,
        &rule.month_of_year,
        &rule.end_date,
        &rule.end_occurrences,
    ]).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn get_recurring_rule(
    id: i64,
    db: State<'_, Database>,
) -> Result<RecurringRule, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, frequency, interval, days_of_week, day_of_month, month_of_year, end_date, end_occurrences, created_at
         FROM recurring_rules WHERE id = ?"
    ).map_err(|e| e.to_string())?;
    
    let rule = stmt.query_row([id], RecurringRule::from_row)
        .map_err(|e| e.to_string())?;
    
    Ok(rule)
}

#[tauri::command]
pub async fn update_recurring_rule(
    rule: RecurringRule,
    db: State<'_, Database>,
) -> Result<(), String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "UPDATE recurring_rules 
         SET frequency = ?1, interval = ?2, days_of_week = ?3, day_of_month = ?4,
             month_of_year = ?5, end_date = ?6, end_occurrences = ?7
         WHERE id = ?8"
    ).map_err(|e| e.to_string())?;
    
    stmt.execute([
        &rule.frequency,
        &rule.interval,
        &rule.days_of_week,
        &rule.day_of_month,
        &rule.month_of_year,
        &rule.end_date,
        &rule.end_occurrences,
        &rule.id.ok_or("Rule ID is required".to_string())?,
    ]).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn expand_recurring_events(
    event_id: i64,
    start_date: String,
    end_date: String,
    db: State<'_, Database>,
) -> Result<Vec<EventResponse>, String> {
    let conn = db.get_connection();
    
    // First get the event and its recurring rule
    let mut stmt = conn.prepare(
        "SELECT e.*, r.* FROM events e
         JOIN recurring_rules r ON e.recurring_rule_id = r.id
         WHERE e.id = ?"
    ).map_err(|e| e.to_string())?;
      // Get any exceptions for this event
    let mut exceptions = conn.prepare(
        "SELECT original_date, is_cancelled, modified_title, modified_description,
                modified_start_time, modified_end_time, modified_location
         FROM event_exceptions
         WHERE event_id = ?"
    ).map_err(|e| e.to_string())?;

    let exceptions_map: std::collections::HashMap<String, EventException> = exceptions
        .query_map([event_id], |row| {
            Ok(EventException {
                original_date: row.get(0)?,
                is_cancelled: row.get(1)?,
                modified_title: row.get(2)?,
                modified_description: row.get(3)?,
                modified_start_time: row.get(4)?,
                modified_end_time: row.get(5)?,
                modified_location: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<std::collections::HashMap<_, _>, _>>()
        .map_err(|e| e.to_string())?;

    // TODO: Implement full recurrence expansion based on the rule
    // For now, return a basic weekly recurrence
    let mut expanded_events = Vec::new();
    let start = chrono::DateTime::parse_from_rfc3339(&start_date)
        .map_err(|e| e.to_string())?;
    let end = chrono::DateTime::parse_from_rfc3339(&end_date)
        .map_err(|e| e.to_string())?;
    
    let mut current = start;
    while current <= end {
        let date_key = current.date_naive().to_string();
        
        // Check if this instance has an exception
        if let Some(exception) = exceptions_map.get(&date_key) {
            if !exception.is_cancelled {
                // Add the modified instance
                expanded_events.push(EventResponse {
                    id: event_id,
                    title: exception.modified_title.clone().unwrap_or(event.title.clone()),
                    description: exception.modified_description.clone(),
                    start_time: exception.modified_start_time.clone().unwrap_or(current.to_rfc3339()),
                    end_time: exception.modified_end_time.clone().unwrap_or(current.to_rfc3339()),
                    is_all_day: event.is_all_day,
                    location: exception.modified_location.clone(),
                    priority: event.priority,
                    category_id: event.category_id,
                });
            }
        } else {
            // Add the regular instance
            expanded_events.push(EventResponse {
                id: event_id,
                title: event.title.clone(),
                description: event.description.clone(),
                start_time: current.to_rfc3339(),
                end_time: current.to_rfc3339(),
                is_all_day: event.is_all_day,
                location: event.location.clone(),
                priority: event.priority,
                category_id: event.category_id,
            });
        }
        
        current = current + chrono::Duration::days(7);
    }
    
    Ok(expanded_events)
}
