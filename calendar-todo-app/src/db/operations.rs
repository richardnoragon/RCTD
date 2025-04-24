use super::{Database, models::*, error::*};

impl Database {
    // Category operations
    pub fn create_category(&self, category: &Category) -> DbResult<i64> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO categories (name, color, symbol) VALUES (?1, ?2, ?3)"
        )?;
        
        stmt.execute([&category.name, &category.color, &category.symbol])?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_category(&self, id: i64) -> DbResult<Category> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, color, symbol, created_at, updated_at FROM categories WHERE id = ?"
        )?;
        
        let category = stmt.query_row([id], Category::from_row)?;
        Ok(category)
    }

    pub fn update_category(&self, category: &Category) -> DbResult<()> {
        let mut stmt = self.conn.prepare(
            "UPDATE categories SET name = ?1, color = ?2, symbol = ?3 WHERE id = ?4"
        )?;
        
        stmt.execute([
            &category.name,
            &category.color,
            &category.symbol,
            &category.id.ok_or_else(|| DatabaseError::Data("Category ID is required".to_string()))?
        ])?;
        Ok(())
    }

    pub fn delete_category(&self, id: i64) -> DbResult<()> {
        self.conn.execute("DELETE FROM categories WHERE id = ?", [id])?;
        Ok(())
    }

    // Event operations
    pub fn create_event(&self, event: &Event) -> DbResult<i64> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO events (title, description, start_time, end_time, is_all_day, location, 
             priority, category_id, recurring_rule_id) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )?;
        
        stmt.execute([
            &event.title,
            &event.description,
            &event.start_time,
            &event.end_time,
            &event.is_all_day,
            &event.location,
            &event.priority,
            &event.category_id,
            &event.recurring_rule_id,
        ])?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_event(&self, id: i64) -> DbResult<Event> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, description, start_time, end_time, is_all_day, location, 
             priority, category_id, recurring_rule_id, created_at, updated_at 
             FROM events WHERE id = ?"
        )?;
        
        let event = stmt.query_row([id], Event::from_row)?;
        Ok(event)
    }

    pub fn update_event(&self, event: &Event) -> DbResult<()> {
        let mut stmt = self.conn.prepare(
            "UPDATE events SET title = ?1, description = ?2, start_time = ?3, end_time = ?4, 
             is_all_day = ?5, location = ?6, priority = ?7, category_id = ?8, recurring_rule_id = ?9 
             WHERE id = ?10"
        )?;
        
        stmt.execute([
            &event.title,
            &event.description,
            &event.start_time,
            &event.end_time,
            &event.is_all_day,
            &event.location,
            &event.priority,
            &event.category_id,
            &event.recurring_rule_id,
            &event.id.ok_or_else(|| DatabaseError::Data("Event ID is required".to_string()))?
        ])?;
        Ok(())
    }

    pub fn delete_event(&self, id: i64) -> DbResult<()> {
        self.conn.execute("DELETE FROM events WHERE id = ?", [id])?;
        Ok(())
    }

    // Task operations
    pub fn create_task(&self, task: &Task) -> DbResult<i64> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO tasks (title, description, due_date, priority, status, category_id, 
             recurring_rule_id, kanban_column_id, kanban_order) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )?;
        
        stmt.execute([
            &task.title,
            &task.description,
            &task.due_date,
            &task.priority,
            &task.status,
            &task.category_id,
            &task.recurring_rule_id,
            &task.kanban_column_id,
            &task.kanban_order,
        ])?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_task(&self, id: i64) -> DbResult<Task> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, description, due_date, priority, status, category_id, 
             recurring_rule_id, kanban_column_id, kanban_order, completed_at, created_at, updated_at 
             FROM tasks WHERE id = ?"
        )?;
        
        let task = stmt.query_row([id], Task::from_row)?;
        Ok(task)
    }

    pub fn update_task(&self, task: &Task) -> DbResult<()> {
        let mut stmt = self.conn.prepare(
            "UPDATE tasks SET title = ?1, description = ?2, due_date = ?3, priority = ?4, 
             status = ?5, category_id = ?6, recurring_rule_id = ?7, kanban_column_id = ?8, 
             kanban_order = ?9, completed_at = ?10 WHERE id = ?11"
        )?;
        
        stmt.execute([
            &task.title,
            &task.description,
            &task.due_date,
            &task.priority,
            &task.status,
            &task.category_id,
            &task.recurring_rule_id,
            &task.kanban_column_id,
            &task.kanban_order,
            &task.completed_at,
            &task.id.ok_or_else(|| DatabaseError::Data("Task ID is required".to_string()))?
        ])?;
        Ok(())
    }

    pub fn delete_task(&self, id: i64) -> DbResult<()> {
        self.conn.execute("DELETE FROM tasks WHERE id = ?", [id])?;
        Ok(())
    }
}
