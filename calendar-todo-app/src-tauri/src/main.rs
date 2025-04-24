// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Define a basic Task struct for our mock data
#[derive(Clone, serde::Serialize)]
struct Task {
    id: Option<i32>,
    title: String,
    description: Option<String>,
    due_date: Option<String>,
    priority: i32,
    status: String,
    category_id: Option<i32>,
    recurring_rule_id: Option<i32>,
    kanban_column_id: Option<i32>,
    kanban_order: Option<i32>,
    completed_at: Option<String>,
}

// Get all tasks
#[tauri::command]
fn get_tasks() -> Vec<Task> {
    // Return some mock data for now
    vec![
        Task {
            id: Some(1),
            title: "Sample Task 1".into(),
            description: Some("This is a sample task".into()),
            due_date: Some("2025-04-15".into()),
            priority: 1,
            status: "Todo".into(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(1),
            kanban_order: Some(0),
            completed_at: None,
        },
        Task {
            id: Some(2),
            title: "Sample Task 2".into(),
            description: Some("Another sample task".into()),
            due_date: Some("2025-04-16".into()),
            priority: 2,
            status: "In Progress".into(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(2),
            kanban_order: Some(0),
            completed_at: None,
        }
    ]
}

#[tauri::command]
fn get_tasks_in_column(column_id: i32) -> Vec<Task> {
    // Filter mock tasks by column
    get_tasks().into_iter()
        .filter(|task| task.kanban_column_id == Some(column_id))
        .collect()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_tasks,
            get_tasks_in_column
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
