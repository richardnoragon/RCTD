use crate::db::{Database, models::*};
use chrono::{DateTime, Utc, NaiveDateTime};
use std::collections::HashMap;

/// Data factory for creating test categories
pub struct CategoryFactory;

impl CategoryFactory {
    pub fn create_default() -> Category {
        Category {
            id: None,
            name: "Default Category".to_string(),
            color: "#FF0000".to_string(),
            symbol: "circle".to_string(),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_work() -> Category {
        Category {
            id: None,
            name: "Work".to_string(),
            color: "#1E88E5".to_string(),
            symbol: "square".to_string(),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_personal() -> Category {
        Category {
            id: None,
            name: "Personal".to_string(),
            color: "#4CAF50".to_string(),
            symbol: "triangle".to_string(),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_with_name(name: &str) -> Category {
        Category {
            id: None,
            name: name.to_string(),
            color: "#9C27B0".to_string(),
            symbol: "hexagon".to_string(),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_batch(count: usize) -> Vec<Category> {
        (0..count)
            .map(|i| Category {
                id: None,
                name: format!("Category {}", i + 1),
                color: format!("#{:06X}", (i * 0x123456) % 0xFFFFFF),
                symbol: match i % 4 {
                    0 => "circle",
                    1 => "square", 
                    2 => "triangle",
                    _ => "hexagon",
                }.to_string(),
                created_at: None,
                updated_at: None,
            })
            .collect()
    }
}

/// Data factory for creating test events
pub struct EventFactory;

impl EventFactory {
    pub fn create_default() -> Event {
        Event {
            id: None,
            title: "Default Event".to_string(),
            description: Some("Default event description".to_string()),
            start_time: "2023-01-15 09:00:00".to_string(),
            end_time: "2023-01-15 10:00:00".to_string(),
            is_all_day: false,
            location: Some("Default Location".to_string()),
            priority: 3,
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_meeting() -> Event {
        Event {
            id: None,
            title: "Team Meeting".to_string(),
            description: Some("Weekly team sync meeting".to_string()),
            start_time: "2023-01-16 14:00:00".to_string(),
            end_time: "2023-01-16 15:00:00".to_string(),
            is_all_day: false,
            location: Some("Conference Room A".to_string()),
            priority: 2,
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_all_day() -> Event {
        Event {
            id: None,
            title: "Holiday".to_string(),
            description: Some("National holiday".to_string()),
            start_time: "2023-01-17 00:00:00".to_string(),
            end_time: "2023-01-17 23:59:59".to_string(),
            is_all_day: true,
            location: None,
            priority: 3,
            category_id: None,
            recurring_rule_id: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_with_category(category_id: i64) -> Event {
        let mut event = Self::create_default();
        event.category_id = Some(category_id);
        event
    }

    pub fn create_batch(count: usize) -> Vec<Event> {
        (0..count)
            .map(|i| Event {
                id: None,
                title: format!("Event {}", i + 1),
                description: Some(format!("Description for event {}", i + 1)),
                start_time: format!("2023-01-{:02} 09:00:00", 15 + i),
                end_time: format!("2023-01-{:02} 10:00:00", 15 + i),
                is_all_day: i % 3 == 0,
                location: if i % 2 == 0 { Some(format!("Location {}", i + 1)) } else { None },
                priority: (i % 3) as i32 + 1,
                category_id: None,
                recurring_rule_id: None,
                created_at: None,
                updated_at: None,
            })
            .collect()
    }
}

/// Data factory for creating test tasks
pub struct TaskFactory;

impl TaskFactory {
    pub fn create_default() -> Task {
        Task {
            id: None,
            title: "Default Task".to_string(),
            description: Some("Default task description".to_string()),
            due_date: Some("2023-01-31 17:00:00".to_string()),
            priority: 3,
            status: "TODO".to_string(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(1),
            kanban_order: Some(1),
            completed_at: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_urgent() -> Task {
        Task {
            id: None,
            title: "Urgent Task".to_string(),
            description: Some("High priority urgent task".to_string()),
            due_date: Some("2023-01-16 17:00:00".to_string()),
            priority: 1,
            status: "TODO".to_string(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(1),
            kanban_order: Some(1),
            completed_at: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_completed() -> Task {
        Task {
            id: None,
            title: "Completed Task".to_string(),
            description: Some("This task is already completed".to_string()),
            due_date: Some("2023-01-14 17:00:00".to_string()),
            priority: 2,
            status: "COMPLETED".to_string(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(3),
            kanban_order: Some(1),
            completed_at: Some("2023-01-14 16:30:00".to_string()),
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_in_progress() -> Task {
        Task {
            id: None,
            title: "In Progress Task".to_string(),
            description: Some("Task currently being worked on".to_string()),
            due_date: Some("2023-01-20 17:00:00".to_string()),
            priority: 2,
            status: "IN_PROGRESS".to_string(),
            category_id: None,
            recurring_rule_id: None,
            kanban_column_id: Some(2),
            kanban_order: Some(1),
            completed_at: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn create_with_category(category_id: i64) -> Task {
        let mut task = Self::create_default();
        task.category_id = Some(category_id);
        task
    }

    pub fn create_batch(count: usize) -> Vec<Task> {
        (0..count)
            .map(|i| Task {
                id: None,
                title: format!("Task {}", i + 1),
                description: Some(format!("Description for task {}", i + 1)),
                due_date: if i % 2 == 0 { Some(format!("2023-01-{:02} 17:00:00", 20 + i)) } else { None },
                priority: (i % 3) as i32 + 1,
                status: match i % 4 {
                    0 => "TODO",
                    1 => "IN_PROGRESS",
                    2 => "COMPLETED",
                    _ => "TODO",
                }.to_string(),
                category_id: None,
                recurring_rule_id: None,
                kanban_column_id: Some(((i % 3) + 1) as i64),
                kanban_order: Some((i + 1) as i32),
                completed_at: if i % 4 == 2 { Some(format!("2023-01-{:02} 16:00:00", 18 + i)) } else { None },
                created_at: None,
                updated_at: None,
            })
            .collect()
    }
}

/// Data factory for creating test recurring rules
pub struct RecurringRuleFactory;

impl RecurringRuleFactory {
    pub fn create_daily() -> RecurringRule {
        RecurringRule {
            id: None,
            frequency: "DAILY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: None,
            month_of_year: None,
            end_date: Some("2023-12-31 23:59:59".to_string()),
            end_occurrences: None,
            created_at: None,
        }
    }

    pub fn create_weekly() -> RecurringRule {
        RecurringRule {
            id: None,
            frequency: "WEEKLY".to_string(),
            interval_value: 1,
            days_of_week: Some("1,3,5".to_string()), // Mon, Wed, Fri
            day_of_month: None,
            month_of_year: None,
            end_date: None,
            end_occurrences: Some(10),
            created_at: None,
        }
    }

    pub fn create_monthly() -> RecurringRule {
        RecurringRule {
            id: None,
            frequency: "MONTHLY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: Some(15),
            month_of_year: None,
            end_date: Some("2024-01-15 23:59:59".to_string()),
            end_occurrences: None,
            created_at: None,
        }
    }

    pub fn create_yearly() -> RecurringRule {
        RecurringRule {
            id: None,
            frequency: "YEARLY".to_string(),
            interval_value: 1,
            days_of_week: None,
            day_of_month: Some(1),
            month_of_year: Some(1), // January 1st
            end_date: None,
            end_occurrences: None,
            created_at: None,
        }
    }
}

/// Test database scenario builder
pub struct TestScenario {
    db: Database,
    category_ids: HashMap<String, i64>,
    event_ids: HashMap<String, i64>,
    task_ids: HashMap<String, i64>,
    rule_ids: HashMap<String, i64>,
}

impl TestScenario {
    pub fn new() -> Self {
        let db = Database::new_in_memory().expect("Failed to create test database");
        TestScenario {
            db,
            category_ids: HashMap::new(),
            event_ids: HashMap::new(),
            task_ids: HashMap::new(),
            rule_ids: HashMap::new(),
        }
    }

    pub fn add_category(&mut self, key: &str, category: Category) -> &mut Self {
        let id = self.db.create_category(&category).expect("Failed to create category");
        self.category_ids.insert(key.to_string(), id);
        self
    }

    pub fn add_event(&mut self, key: &str, mut event: Event) -> &mut Self {
        let id = self.db.create_event(&event).expect("Failed to create event");
        self.event_ids.insert(key.to_string(), id);
        self
    }

    pub fn add_task(&mut self, key: &str, task: Task) -> &mut Self {
        let id = self.db.create_task(&task).expect("Failed to create task");
        self.task_ids.insert(key.to_string(), id);
        self
    }

    pub fn get_db(&self) -> &Database {
        &self.db
    }

    pub fn get_category_id(&self, key: &str) -> Option<i64> {
        self.category_ids.get(key).copied()
    }

    pub fn get_event_id(&self, key: &str) -> Option<i64> {
        self.event_ids.get(key).copied()
    }

    pub fn get_task_id(&self, key: &str) -> Option<i64> {
        self.task_ids.get(key).copied()
    }

    /// Create a basic work scenario with categories, events, and tasks
    pub fn create_work_scenario() -> Self {
        let mut scenario = Self::new();
        
        // Add categories
        scenario.add_category("work", CategoryFactory::create_work());
        scenario.add_category("personal", CategoryFactory::create_personal());
        
        // Add events
        let work_category_id = scenario.get_category_id("work").unwrap();
        let mut meeting = EventFactory::create_meeting();
        meeting.category_id = Some(work_category_id);
        scenario.add_event("meeting", meeting);
        
        // Add tasks
        let mut urgent_task = TaskFactory::create_urgent();
        urgent_task.category_id = Some(work_category_id);
        scenario.add_task("urgent", urgent_task);
        
        scenario.add_task("personal", TaskFactory::create_with_category(
            scenario.get_category_id("personal").unwrap()
        ));
        
        scenario
    }
}

/// Test assertion helpers
pub struct TestAssertions;

impl TestAssertions {
    pub fn assert_category_equals(actual: &Category, expected: &Category) {
        assert_eq!(actual.name, expected.name, "Category names should match");
        assert_eq!(actual.color, expected.color, "Category colors should match");
        assert_eq!(actual.symbol, expected.symbol, "Category symbols should match");
    }

    pub fn assert_event_equals(actual: &Event, expected: &Event) {
        assert_eq!(actual.title, expected.title, "Event titles should match");
        assert_eq!(actual.description, expected.description, "Event descriptions should match");
        assert_eq!(actual.start_time, expected.start_time, "Event start times should match");
        assert_eq!(actual.end_time, expected.end_time, "Event end times should match");
        assert_eq!(actual.is_all_day, expected.is_all_day, "Event all-day flags should match");
        assert_eq!(actual.priority, expected.priority, "Event priorities should match");
    }

    pub fn assert_task_equals(actual: &Task, expected: &Task) {
        assert_eq!(actual.title, expected.title, "Task titles should match");
        assert_eq!(actual.description, expected.description, "Task descriptions should match");
        assert_eq!(actual.due_date, expected.due_date, "Task due dates should match");
        assert_eq!(actual.priority, expected.priority, "Task priorities should match");
        assert_eq!(actual.status, expected.status, "Task statuses should match");
    }

    pub fn assert_contains_category(categories: &[Category], name: &str) {
        assert!(
            categories.iter().any(|c| c.name == name),
            "Categories should contain category with name '{}'",
            name
        );
    }

    pub fn assert_contains_event(events: &[Event], title: &str) {
        assert!(
            events.iter().any(|e| e.title == title),
            "Events should contain event with title '{}'",
            title
        );
    }

    pub fn assert_contains_task(tasks: &[Task], title: &str) {
        assert!(
            tasks.iter().any(|t| t.title == title),
            "Tasks should contain task with title '{}'",
            title
        );
    }
}

/// Performance testing utilities
pub struct PerformanceTester;

impl PerformanceTester {
    pub fn measure_execution_time<F, R>(operation: F) -> (R, std::time::Duration)
    where
        F: FnOnce() -> R,
    {
        let start = std::time::Instant::now();
        let result = operation();
        let duration = start.elapsed();
        (result, duration)
    }

    pub fn benchmark_database_operations(db: &Database, operation_count: usize) -> std::time::Duration {
        let start = std::time::Instant::now();
        
        for i in 0..operation_count {
            let category = CategoryFactory::create_with_name(&format!("Benchmark {}", i));
            let _ = db.create_category(&category);
        }
        
        start.elapsed()
    }

    pub fn assert_performance_within_threshold(duration: std::time::Duration, threshold_ms: u64) {
        assert!(
            duration.as_millis() <= threshold_ms as u128,
            "Operation took {}ms, expected <= {}ms",
            duration.as_millis(),
            threshold_ms
        );
    }
}