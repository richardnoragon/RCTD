use serde::{Deserialize, Serialize};
use rusqlite::Row;
use super::error::DbResult;

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: Option<i64>,
    pub name: String,
    pub color: String,
    pub symbol: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Category {
    pub fn from_row(row: &Row) -> DbResult<Self> {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            symbol: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Event {
    pub id: Option<i64>,
    pub title: String,
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub is_all_day: bool,
    pub location: Option<String>,
    pub priority: i32,
    pub category_id: Option<i64>,
    pub recurring_rule_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

impl Event {
    pub fn from_row(row: &Row) -> DbResult<Self> {
        Ok(Event {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            start_time: row.get(3)?,
            end_time: row.get(4)?,
            is_all_day: row.get(5)?,
            location: row.get(6)?,
            priority: row.get(7)?,
            category_id: row.get(8)?,
            recurring_rule_id: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: Option<i64>,
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
    pub created_at: String,
    pub updated_at: String,
}

impl Task {
    pub fn from_row(row: &Row) -> DbResult<Self> {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            due_date: row.get(3)?,
            priority: row.get(4)?,
            status: row.get(5)?,
            category_id: row.get(6)?,
            recurring_rule_id: row.get(7)?,
            kanban_column_id: row.get(8)?,
            kanban_order: row.get(9)?,
            completed_at: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecurringRule {
    pub id: Option<i64>,
    pub frequency: String,
    pub interval: i32,
    pub days_of_week: Option<String>,
    pub day_of_month: Option<i32>,
    pub month_of_year: Option<i32>,
    pub end_date: Option<String>,
    pub end_occurrences: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventException {
    pub id: Option<i64>,
    pub event_id: i64,
    pub original_date: String,
    pub is_cancelled: bool,
    pub modified_title: Option<String>,
    pub modified_description: Option<String>,
    pub modified_start_time: Option<String>,
    pub modified_end_time: Option<String>,
    pub modified_location: Option<String>,
    pub created_at: String,
}

impl EventException {
    pub fn from_row(row: &Row) -> DbResult<Self> {
        Ok(EventException {
            id: row.get(0)?,
            event_id: row.get(1)?,
            original_date: row.get(2)?,
            is_cancelled: row.get(3)?,
            modified_title: row.get(4)?,
            modified_description: row.get(5)?,
            modified_start_time: row.get(6)?,
            modified_end_time: row.get(7)?,
            modified_location: row.get(8)?,
            created_at: row.get(9)?,
        })
    }
}

impl RecurringRule {
    pub fn from_row(row: &Row) -> DbResult<Self> {
        Ok(RecurringRule {
            id: row.get(0)?,
            frequency: row.get(1)?,
            interval: row.get(2)?,
            days_of_week: row.get(3)?,
            day_of_month: row.get(4)?,
            month_of_year: row.get(5)?,
            end_date: row.get(6)?,
            end_occurrences: row.get(7)?,
            created_at: row.get(8)?,
        })
    }
}
