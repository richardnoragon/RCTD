use crate::db::{Database, models::Task, error::DbResult};
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskResponse {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub priority: i32,
    pub status: String,
    pub category_id: Option<i64>,
    pub recurring_rule_id: Option<i64>,
    pub kanban_column_id: Option<i64>,
    pub kanban_order: Option<i32>,
    pub completed_at: Option<String>,
}

#[tauri::command]
pub async fn get_tasks_in_range(
    start: String,
    end: String,
    db: State<'_, Database>,
) -> Result<Vec<TaskResponse>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, priority, status, category_id,
                recurring_rule_id, kanban_column_id, kanban_order, completed_at,
                created_at, updated_at
         FROM tasks 
         WHERE (due_date BETWEEN ?1 AND ?2) OR (due_date IS NULL)"
    ).map_err(|e| e.to_string())?;
    
    let tasks = stmt
        .query_map([start, end], |row| Task::from_row(&row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks.into_iter().map(|task| TaskResponse {
        id: task.id.unwrap_or_default(),
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        category_id: task.category_id,
        recurring_rule_id: task.recurring_rule_id,
        kanban_column_id: task.kanban_column_id,
        kanban_order: task.kanban_order,
        completed_at: task.completed_at,
    }).collect())
}

#[tauri::command]
pub async fn get_tasks_by_status(
    status: String,
    db: State<'_, Database>,
) -> Result<Vec<TaskResponse>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, priority, status, category_id,
                recurring_rule_id, kanban_column_id, kanban_order, completed_at,
                created_at, updated_at
         FROM tasks 
         WHERE status = ?
         ORDER BY kanban_order ASC"
    ).map_err(|e| e.to_string())?;
    
    let tasks = stmt
        .query_map([status], |row| Task::from_row(&row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks.into_iter().map(|task| TaskResponse {
        id: task.id.unwrap_or_default(),
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        category_id: task.category_id,
        recurring_rule_id: task.recurring_rule_id,
        kanban_column_id: task.kanban_column_id,
        kanban_order: task.kanban_order,
        completed_at: task.completed_at,
    }).collect())
}

#[tauri::command]
pub async fn get_tasks(
    db: State<'_, Database>,
) -> Result<Vec<TaskResponse>, String> {
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, title, description, due_date, priority, status, category_id,
                recurring_rule_id, kanban_column_id, kanban_order, completed_at,
                created_at, updated_at
         FROM tasks 
         ORDER BY kanban_order ASC"
    ).map_err(|e| e.to_string())?;
    
    let tasks = stmt
        .query_map([], |row| Task::from_row(&row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks.into_iter().map(|task| TaskResponse {
        id: task.id.unwrap_or_default(),
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        category_id: task.category_id,
        recurring_rule_id: task.recurring_rule_id,
        kanban_column_id: task.kanban_column_id,
        kanban_order: task.kanban_order,
        completed_at: task.completed_at,
    }).collect())
}

#[tauri::command]
pub async fn update_task_status(
    id: i64,
    status: String,
    db: State<'_, Database>,
) -> Result<(), String> {
    let conn = db.get_connection();
    
    let completed_at = if status == "COMPLETED" {
        "datetime('now')"
    } else {
        "NULL"
    };
    
    conn.execute(
        &format!("UPDATE tasks SET status = ?, completed_at = {} WHERE id = ?", completed_at),
        [&status, &id.to_string()]
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn create_task(
    task: Task,
    db: State<'_, Database>,
) -> Result<i64, String> {
    db.create_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(
    task: Task,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(
    id: i64,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.delete_task(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reorder_task(
    task_id: i64,
    new_column_id: i64,
    new_order: i32,
    db: State<'_, Database>,
) -> Result<(), String> {
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE tasks 
         SET kanban_column_id = ?, kanban_order = ?, status = CASE
             WHEN ? = (SELECT id FROM kanban_columns WHERE name = 'Completed') THEN 'COMPLETED'
             ELSE 'IN_PROGRESS'
         END,
         completed_at = CASE
             WHEN ? = (SELECT id FROM kanban_columns WHERE name = 'Completed') THEN datetime('now')
             ELSE NULL
         END
         WHERE id = ?",
        [new_column_id, new_order, new_column_id, new_column_id, task_id]
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
