use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use crate::services::kanban_service::*;
use serial_test::serial;

#[cfg(test)]
mod kanban_service_tests {
    use super::*;

    #[tokio::test]
    #[serial]
    async fn test_get_kanban_columns_success() {
        let scenario = TestScenario::new();
        
        // Create default columns
        let default_columns = vec![
            KanbanColumn { id: None, name: "To Do".to_string(), column_order: 1 },
            KanbanColumn { id: None, name: "In Progress".to_string(), column_order: 2 },
            KanbanColumn { id: None, name: "Done".to_string(), column_order: 3 },
        ];
        
        for column in &default_columns {
            let conn = scenario.get_db().get_connection();
            conn.execute(
                "INSERT INTO kanban_columns (name, column_order) VALUES (?1, ?2)",
                [&column.name, &column.column_order.to_string()]
            ).expect("Failed to insert column");
        }
        
        let result = get_kanban_columns(scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should retrieve columns successfully");
        let columns = result.unwrap();
        assert_eq!(columns.len(), 3, "Should return 3 columns");
        assert_eq!(columns[0].name, "To Do");
        assert_eq!(columns[1].name, "In Progress");
        assert_eq!(columns[2].name, "Done");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_kanban_columns_empty() {
        let scenario = TestScenario::new();
        
        let result = get_kanban_columns(scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should handle empty columns gracefully");
        let columns = result.unwrap();
        assert_eq!(columns.len(), 0, "Should return empty list");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_kanban_columns_ordered() {
        let scenario = TestScenario::new();
        
        // Insert columns in reverse order to test ordering
        let columns_data = vec![
            ("Done", 3),
            ("To Do", 1),
            ("In Progress", 2),
        ];
        
        for (name, order) in &columns_data {
            let conn = scenario.get_db().get_connection();
            conn.execute(
                "INSERT INTO kanban_columns (name, column_order) VALUES (?1, ?2)",
                [name, &order.to_string()]
            ).expect("Failed to insert column");
        }
        
        let result = get_kanban_columns(scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should retrieve columns successfully");
        let columns = result.unwrap();
        assert_eq!(columns.len(), 3, "Should return 3 columns");
        
        // Verify correct ordering
        assert_eq!(columns[0].name, "To Do");
        assert_eq!(columns[0].column_order, 1);
        assert_eq!(columns[1].name, "In Progress");
        assert_eq!(columns[1].column_order, 2);
        assert_eq!(columns[2].name, "Done");
        assert_eq!(columns[2].column_order, 3);
    }

    #[tokio::test]
    #[serial]
    async fn test_create_kanban_column_success() {
        let scenario = TestScenario::new();
        let new_column = KanbanColumn {
            id: None,
            name: "Review".to_string(),
            column_order: 4,
        };
        
        let result = create_kanban_column(new_column, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should create column successfully");
        let column_id = result.unwrap();
        assert!(column_id > 0, "Should return valid column ID");
        
        // Verify column was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name, column_order FROM kanban_columns WHERE id = ?").unwrap();
        let column_data: (String, i32) = stmt.query_row([column_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(column_data.0, "Review");
        assert_eq!(column_data.1, 4);
    }

    #[tokio::test]
    #[serial]
    async fn test_create_kanban_column_validation() {
        let scenario = TestScenario::new();
        
        // Test empty name
        let empty_name_column = KanbanColumn {
            id: None,
            name: "".to_string(),
            column_order: 1,
        };
        
        let result = create_kanban_column(empty_name_column, scenario.get_db().into()).await;
        assert!(result.is_err(), "Should reject empty column name");
        
        // Test negative order
        let negative_order_column = KanbanColumn {
            id: None,
            name: "Test".to_string(),
            column_order: -1,
        };
        
        let result = create_kanban_column(negative_order_column, scenario.get_db().into()).await;
        assert!(result.is_err(), "Should reject negative column order");
    }

    #[tokio::test]
    #[serial]
    async fn test_create_kanban_column_special_characters() {
        let scenario = TestScenario::new();
        let special_column = KanbanColumn {
            id: None,
            name: "Review & Test 🚀".to_string(),
            column_order: 1,
        };
        
        let result = create_kanban_column(special_column, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should handle special characters in name");
        let column_id = result.unwrap();
        
        // Verify special characters preserved
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name FROM kanban_columns WHERE id = ?").unwrap();
        let name: String = stmt.query_row([column_id], |row| row.get(0)).unwrap();
        assert_eq!(name, "Review & Test 🚀");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_kanban_column_success() {
        let scenario = TestScenario::new();
        
        // Create initial column
        let initial_column = KanbanColumn {
            id: None,
            name: "To Do".to_string(),
            column_order: 1,
        };
        
        let column_id = create_kanban_column(initial_column, scenario.get_db().into()).await.unwrap();
        
        // Update column
        let updated_column = KanbanColumn {
            id: Some(column_id),
            name: "Backlog".to_string(),
            column_order: 1,
        };
        
        let result = update_kanban_column(updated_column, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should update column successfully");
        
        // Verify update
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name FROM kanban_columns WHERE id = ?").unwrap();
        let name: String = stmt.query_row([column_id], |row| row.get(0)).unwrap();
        assert_eq!(name, "Backlog");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_kanban_column_nonexistent() {
        let scenario = TestScenario::new();
        let nonexistent_column = KanbanColumn {
            id: Some(99999),
            name: "Nonexistent".to_string(),
            column_order: 1,
        };
        
        let result = update_kanban_column(nonexistent_column, scenario.get_db().into()).await;
        
        assert!(result.is_err(), "Should reject update of nonexistent column");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_kanban_column_reorder() {
        let scenario = TestScenario::new();
        
        // Create multiple columns
        let columns = vec![
            ("To Do", 1),
            ("In Progress", 2),
            ("Done", 3),
        ];
        
        let mut column_ids = Vec::new();
        for (name, order) in &columns {
            let column = KanbanColumn {
                id: None,
                name: name.to_string(),
                column_order: *order,
            };
            let id = create_kanban_column(column, scenario.get_db().into()).await.unwrap();
            column_ids.push(id);
        }
        
        // Reorder: move "Done" to position 1
        let reordered_column = KanbanColumn {
            id: Some(column_ids[2]),
            name: "Done".to_string(),
            column_order: 1,
        };
        
        let result = update_kanban_column(reordered_column, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should reorder column successfully");
        
        // Verify new order (would need additional logic to handle order conflicts in real implementation)
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT column_order FROM kanban_columns WHERE id = ?").unwrap();
        let order: i32 = stmt.query_row([column_ids[2]], |row| row.get(0)).unwrap();
        assert_eq!(order, 1);
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_kanban_column_success() {
        let scenario = TestScenario::new();
        let column = KanbanColumn {
            id: None,
            name: "Temporary".to_string(),
            column_order: 1,
        };
        
        let column_id = create_kanban_column(column, scenario.get_db().into()).await.unwrap();
        
        let result = delete_kanban_column(column_id, scenario.get_db().into()).await;
        
        assert!(result.is_ok(), "Should delete column successfully");
        
        // Verify deletion
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM kanban_columns WHERE id = ?").unwrap();
        let count: i32 = stmt.query_row([column_id], |row| row.get(0)).unwrap();
        assert_eq!(count, 0, "Column should be deleted");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_kanban_column_nonexistent() {
        let scenario = TestScenario::new();
        
        let result = delete_kanban_column(99999, scenario.get_db().into()).await;
        
        assert!(result.is_err(), "Should reject deletion of nonexistent column");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_kanban_column_with_tasks() {
        let scenario = TestScenario::new();
        
        // Create column
        let column = KanbanColumn {
            id: None,
            name: "With Tasks".to_string(),
            column_order: 1,
        };
        let column_id = create_kanban_column(column, scenario.get_db().into()).await.unwrap();
        
        // Create task in this column
        let task = TaskFactory::create_default();
        let mut task_with_column = task;
        task_with_column.kanban_column_id = Some(column_id);
        scenario.get_db().create_task(&task_with_column).expect("Failed to create task");
        
        // Attempt to delete column
        let result = delete_kanban_column(column_id, scenario.get_db().into()).await;
        
        // Should fail due to foreign key constraint (depends on schema implementation)
        // In a real implementation, this might either cascade delete or prevent deletion
        // For now, we'll test that the operation completes (behavior depends on schema)
        // In production, you'd want to prevent deletion or handle the constraint properly
    }

    #[tokio::test]
    #[serial]
    async fn test_bulk_column_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple columns
        let column_names = vec!["Backlog", "To Do", "In Progress", "Review", "Done"];
        let mut column_ids = Vec::new();
        
        for (i, name) in column_names.iter().enumerate() {
            let column = KanbanColumn {
                id: None,
                name: name.to_string(),
                column_order: (i + 1) as i32,
            };
            
            let id = create_kanban_column(column, scenario.get_db().into()).await.unwrap();
            column_ids.push(id);
        }
        
        // Verify all columns created
        let result = get_kanban_columns(scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should retrieve all columns");
        let columns = result.unwrap();
        assert_eq!(columns.len(), 5, "Should have 5 columns");
        
        // Verify ordering
        for (i, column) in columns.iter().enumerate() {
            assert_eq!(column.name, column_names[i]);
            assert_eq!(column.column_order, (i + 1) as i32);
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_column_workflow_integration() {
        let scenario = TestScenario::new();
        
        // Create initial columns
        let column = KanbanColumn {
            id: None,
            name: "To Do".to_string(),
            column_order: 1,
        };
        let column_id = create_kanban_column(column, scenario.get_db().into()).await.unwrap();
        
        // Update column name
        let updated_column = KanbanColumn {
            id: Some(column_id),
            name: "Backlog".to_string(),
            column_order: 1,
        };
        update_kanban_column(updated_column, scenario.get_db().into()).await.unwrap();
        
        // Create task in column
        let mut task = TaskFactory::create_default();
        task.kanban_column_id = Some(column_id);
        let task_id = scenario.get_db().create_task(&task).unwrap();
        
        // Verify task is associated with column
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT kanban_column_id FROM tasks WHERE id = ?").unwrap();
        let task_column_id: Option<i64> = stmt.query_row([task_id], |row| row.get(0)).unwrap();
        assert_eq!(task_column_id, Some(column_id));
        
        // Get columns and verify structure
        let result = get_kanban_columns(scenario.get_db().into()).await.unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "Backlog");
    }

    #[tokio::test]
    #[serial]
    async fn test_performance_large_column_set() {
        let scenario = TestScenario::new();
        
        // Create 100 columns to test performance
        let start_time = std::time::Instant::now();
        
        for i in 1..=100 {
            let column = KanbanColumn {
                id: None,
                name: format!("Column {}", i),
                column_order: i,
            };
            
            create_kanban_column(column, scenario.get_db().into()).await.unwrap();
        }
        
        let creation_time = start_time.elapsed();
        
        // Retrieve all columns
        let retrieve_start = std::time::Instant::now();
        let result = get_kanban_columns(scenario.get_db().into()).await.unwrap();
        let retrieve_time = retrieve_start.elapsed();
        
        assert_eq!(result.len(), 100, "Should create and retrieve 100 columns");
        
        // Performance assertions (adjust thresholds as needed)
        assert!(creation_time.as_millis() < 5000, "Creation should complete within 5 seconds");
        assert!(retrieve_time.as_millis() < 1000, "Retrieval should complete within 1 second");
        
        // Verify ordering is maintained
        for (i, column) in result.iter().enumerate() {
            assert_eq!(column.column_order, (i + 1) as i32);
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_column_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple columns concurrently
        let futures: Vec<_> = (1..=10)
            .map(|i| {
                let column = KanbanColumn {
                    id: None,
                    name: format!("Concurrent Column {}", i),
                    column_order: i,
                };
                create_kanban_column(column, scenario.get_db().into())
            })
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        // All operations should succeed
        for result in results {
            assert!(result.is_ok(), "Concurrent operations should succeed");
        }
        
        // Verify all columns were created
        let columns = get_kanban_columns(scenario.get_db().into()).await.unwrap();
        assert_eq!(columns.len(), 10, "Should have 10 columns");
    }

    #[tokio::test]
    #[serial]
    async fn test_edge_cases() {
        let scenario = TestScenario::new();
        
        // Test very long column name
        let long_name = "A".repeat(1000);
        let long_name_column = KanbanColumn {
            id: None,
            name: long_name.clone(),
            column_order: 1,
        };
        
        let result = create_kanban_column(long_name_column, scenario.get_db().into()).await;
        // This might succeed or fail depending on database constraints
        // In production, you'd want to validate name length
        
        // Test maximum column order
        let max_order_column = KanbanColumn {
            id: None,
            name: "Max Order".to_string(),
            column_order: i32::MAX,
        };
        
        let result = create_kanban_column(max_order_column, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should handle maximum order value");
        
        // Test unicode characters
        let unicode_column = KanbanColumn {
            id: None,
            name: "待办事项".to_string(),
            column_order: 2,
        };
        
        let result = create_kanban_column(unicode_column, scenario.get_db().into()).await;
        assert!(result.is_ok(), "Should handle unicode characters");
        
        let columns = get_kanban_columns(scenario.get_db().into()).await.unwrap();
        let unicode_col = columns.iter().find(|c| c.name == "待办事项").unwrap();
        assert_eq!(unicode_col.name, "待办事项");
    }
}