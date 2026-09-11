// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Instant;

use serde::Deserialize;
use serde_json::json;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
}

impl LogLevel {
    fn as_str(self) -> &'static str {
        match self {
            LogLevel::Error => "ERROR",
            LogLevel::Warn => "WARN",
            LogLevel::Info => "INFO",
            LogLevel::Debug => "DEBUG",
        }
    }

    fn from_str(value: &str) -> Option<Self> {
        match value.to_ascii_lowercase().as_str() {
            "error" => Some(LogLevel::Error),
            "warn" | "warning" => Some(LogLevel::Warn),
            "info" => Some(LogLevel::Info),
            "debug" => Some(LogLevel::Debug),
            _ => None,
        }
    }
}

fn default_log_level() -> LogLevel {
    if cfg!(test) {
        LogLevel::Warn
    } else if cfg!(debug_assertions) {
        LogLevel::Debug
    } else {
        LogLevel::Info
    }
}

fn configured_log_level() -> LogLevel {
    std::env::var("RCTD_OBSERVABILITY_LEVEL")
        .ok()
        .and_then(|value| LogLevel::from_str(&value))
        .unwrap_or_else(default_log_level)
}

fn should_log(level: LogLevel) -> bool {
    level <= configured_log_level()
}

fn emit_log(level: LogLevel, payload: serde_json::Value) {
    if !should_log(level) {
        return;
    }

    let line = json!({
        "level": level.as_str(),
        "payload": payload,
    })
    .to_string();

    if level <= LogLevel::Warn {
        eprintln!("{line}");
    } else {
        println!("{line}");
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TraceContext {
    trace_id: Option<String>,
    ui_action: Option<String>,
}

fn extract_trace_id(trace_context: &Option<TraceContext>) -> Option<String> {
    trace_context
        .as_ref()
        .and_then(|ctx| ctx.trace_id.as_ref().or(ctx.ui_action.as_ref()))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn timed_command<T>(
    command: &str,
    trace_id: Option<&str>,
    metadata: serde_json::Value,
    operation: impl FnOnce() -> T,
) -> T {
    let started = Instant::now();

    emit_log(
        LogLevel::Debug,
        json!({
            "event": "tauri_command_start",
            "command": command,
            "trace_id": trace_id,
            "metadata": metadata,
        }),
    );

    let result = operation();
    let elapsed = started.elapsed();

    emit_log(
        LogLevel::Info,
        json!({
            "event": "tauri_command_timing",
            "command": command,
            "trace_id": trace_id,
            "duration_ms": elapsed.as_secs_f64() * 1000.0,
            "metadata": metadata,
        }),
    );

    result
}

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
fn get_tasks(trace_context: Option<TraceContext>) -> Vec<Task> {
    let trace_id = extract_trace_id(&trace_context);

    timed_command(
        "get_tasks",
        trace_id.as_deref(),
        json!({
            "source": "task_service",
        }),
        || {
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
                },
            ]
        },
    )
}

#[tauri::command]
fn get_tasks_in_column(column_id: i32, trace_context: Option<TraceContext>) -> Vec<Task> {
    let trace_id = extract_trace_id(&trace_context);

    timed_command(
        "get_tasks_in_column",
        trace_id.as_deref(),
        json!({
            "column_id": column_id,
            "source": "task_service",
        }),
        || {
            // Filter mock tasks by column
            get_tasks(trace_context)
                .into_iter()
                .filter(|task| task.kanban_column_id == Some(column_id))
                .collect()
        },
    )
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
