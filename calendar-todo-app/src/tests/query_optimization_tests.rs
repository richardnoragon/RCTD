use super::setup_test_db;

fn explain_query_plan_details(conn: &rusqlite::Connection, sql: &str) -> Vec<String> {
    let mut stmt = conn.prepare(sql).expect("failed to prepare explain query");
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(3))
        .expect("failed to execute explain query");

    rows.filter_map(Result::ok).collect()
}

#[test]
fn event_range_query_uses_time_window_index() {
    let db = setup_test_db();
    let conn = db.get_connection();

    let plan = explain_query_plan_details(
        conn,
        "EXPLAIN QUERY PLAN
         SELECT id, title
         FROM events
         WHERE start_time <= '2026-12-31T23:59:59Z' AND end_time >= '2026-01-01T00:00:00Z'
         ORDER BY start_time ASC",
    );

    let plan_text = plan.join(" | ");
    assert!(
        plan_text.contains("idx_events_time_window") || plan_text.contains("idx_events_start_time"),
        "Expected event range query to use a time index, got plan: {plan_text}"
    );
}

#[test]
fn task_status_query_uses_status_order_index() {
    let db = setup_test_db();
    let conn = db.get_connection();

    let plan = explain_query_plan_details(
        conn,
        "EXPLAIN QUERY PLAN
         SELECT id, title
         FROM tasks
         WHERE status = 'IN_PROGRESS'
         ORDER BY kanban_order ASC, id ASC",
    );

    let plan_text = plan.join(" | ");
    assert!(
        plan_text.contains("idx_tasks_status_order") || plan_text.contains("idx_tasks_status"),
        "Expected task status query to use a status index, got plan: {plan_text}"
    );
}

#[test]
fn task_board_query_uses_column_order_index() {
    let db = setup_test_db();
    let conn = db.get_connection();

    let plan = explain_query_plan_details(
        conn,
        "EXPLAIN QUERY PLAN
         SELECT id, title
         FROM tasks
         ORDER BY kanban_column_id ASC, kanban_order ASC, id ASC",
    );

    let plan_text = plan.join(" | ");
    assert!(
        plan_text.contains("idx_tasks_column_order") || plan_text.contains("idx_tasks_kanban_column"),
        "Expected task board query to use a kanban ordering index, got plan: {plan_text}"
    );
}
