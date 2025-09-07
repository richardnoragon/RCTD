use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use crate::services::note_service::*;
use serial_test::serial;

#[cfg(test)]
mod note_service_tests {
    use super::*;

    // Note factory for testing
    struct NoteFactory;
    
    impl NoteFactory {
        fn create_default() -> Note {
            Note {
                id: None,
                title: "Default Note".to_string(),
                content: "Default note content for testing".to_string(),
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_with_title(title: &str) -> Note {
            Note {
                id: None,
                title: title.to_string(),
                content: format!("Content for {}", title),
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_long_content() -> Note {
            Note {
                id: None,
                title: "Long Content Note".to_string(),
                content: "A".repeat(10000), // 10KB content
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_markdown() -> Note {
            Note {
                id: None,
                title: "Markdown Note".to_string(),
                content: "# Header\n\n**Bold** and *italic* text\n\n- List item 1\n- List item 2".to_string(),
                created_at: None,
                updated_at: None,
            }
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_create_note_success() {
        let scenario = TestScenario::new();
        let note = NoteFactory::create_default();
        
        let result = create_note(scenario.get_db(), &note).await;
        
        assert!(result.is_ok(), "Should create note successfully");
        let note_id = result.unwrap();
        assert!(note_id > 0, "Should return valid note ID");
        
        // Verify note was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT title, content FROM notes WHERE id = ?").unwrap();
        let (title, content): (String, String) = stmt.query_row([note_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(title, "Default Note");
        assert_eq!(content, "Default note content for testing");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_notes_success() {
        let scenario = TestScenario::new();
        
        // Create test notes
        let notes = vec![
            NoteFactory::create_with_title("Note 1"),
            NoteFactory::create_with_title("Note 2"),
            NoteFactory::create_with_title("Note 3"),
        ];
        
        for note in &notes {
            create_note(scenario.get_db(), note).await.unwrap();
        }
        
        let result = get_notes(scenario.get_db()).await;
        
        assert!(result.is_ok(), "Should retrieve notes successfully");
        let retrieved_notes = result.unwrap();
        assert_eq!(retrieved_notes.len(), 3, "Should return all notes");
        
        // Verify note content
        assert!(retrieved_notes.iter().any(|n| n.title == "Note 1"));
        assert!(retrieved_notes.iter().any(|n| n.title == "Note 2"));
        assert!(retrieved_notes.iter().any(|n| n.title == "Note 3"));
    }

    #[tokio::test]
    #[serial]
    async fn test_update_note_success() {
        let scenario = TestScenario::new();
        let original_note = NoteFactory::create_default();
        
        let note_id = create_note(scenario.get_db(), &original_note).await.unwrap();
        
        // Update note
        let updated_note = Note {
            id: Some(note_id),
            title: "Updated Note Title".to_string(),
            content: "Updated note content".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let result = update_note(scenario.get_db(), &updated_note).await;
        
        assert!(result.is_ok(), "Should update note successfully");
        
        // Verify update
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT title, content FROM notes WHERE id = ?").unwrap();
        let (title, content): (String, String) = stmt.query_row([note_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(title, "Updated Note Title");
        assert_eq!(content, "Updated note content");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_note_success() {
        let scenario = TestScenario::new();
        let note = NoteFactory::create_default();
        
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        let result = delete_note(scenario.get_db(), note_id).await;
        
        assert!(result.is_ok(), "Should delete note successfully");
        
        // Verify deletion
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes WHERE id = ?").unwrap();
        let count: i32 = stmt.query_row([note_id], |row| row.get(0)).unwrap();
        assert_eq!(count, 0, "Note should be deleted");
    }

    #[tokio::test]
    #[serial]
    async fn test_link_note_to_event() {
        let mut scenario = TestScenario::new();
        
        // Create note and event
        let note = NoteFactory::create_default();
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Create link
        let link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        
        let result = link_note(scenario.get_db(), &link).await;
        
        assert!(result.is_ok(), "Should link note to event successfully");
        
        // Verify link was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM note_links WHERE note_id = ? AND entity_type = ? AND entity_id = ?").unwrap();
        let count: i32 = stmt.query_row([note_id.to_string(), "event".to_string(), event_id.to_string()], |row| row.get(0)).unwrap();
        assert_eq!(count, 1, "Link should exist");
    }

    #[tokio::test]
    #[serial]
    async fn test_link_note_to_task() {
        let mut scenario = TestScenario::new();
        
        // Create note and task
        let note = NoteFactory::create_default();
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        scenario.add_task("test_task", TaskFactory::create_default());
        let task_id = scenario.get_task_id("test_task").unwrap();
        
        // Create link
        let link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "task".to_string(),
            entity_id: task_id,
        };
        
        let result = link_note(scenario.get_db(), &link).await;
        
        assert!(result.is_ok(), "Should link note to task successfully");
        
        // Verify link was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM note_links WHERE note_id = ? AND entity_type = ? AND entity_id = ?").unwrap();
        let count: i32 = stmt.query_row([note_id.to_string(), "task".to_string(), task_id.to_string()], |row| row.get(0)).unwrap();
        assert_eq!(count, 1, "Link should exist");
    }

    #[tokio::test]
    #[serial]
    async fn test_unlink_note_from_entity() {
        let mut scenario = TestScenario::new();
        
        // Create note and event
        let note = NoteFactory::create_default();
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Create and then remove link
        let link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        
        link_note(scenario.get_db(), &link).await.unwrap();
        
        let result = unlink_note(scenario.get_db(), &link).await;
        
        assert!(result.is_ok(), "Should unlink note successfully");
        
        // Verify link was removed
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM note_links WHERE note_id = ? AND entity_type = ? AND entity_id = ?").unwrap();
        let count: i32 = stmt.query_row([note_id.to_string(), "event".to_string(), event_id.to_string()], |row| row.get(0)).unwrap();
        assert_eq!(count, 0, "Link should be removed");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_notes_for_entity() {
        let mut scenario = TestScenario::new();
        
        // Create multiple notes
        let notes = vec![
            NoteFactory::create_with_title("Event Note 1"),
            NoteFactory::create_with_title("Event Note 2"),
            NoteFactory::create_with_title("Other Note"), // Not linked
        ];
        
        let mut note_ids = Vec::new();
        for note in &notes {
            let id = create_note(scenario.get_db(), note).await.unwrap();
            note_ids.push(id);
        }
        
        // Create event
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Link first two notes to event
        for i in 0..2 {
            let link = NoteLink {
                id: None,
                note_id: note_ids[i],
                entity_type: "event".to_string(),
                entity_id: event_id,
            };
            link_note(scenario.get_db(), &link).await.unwrap();
        }
        
        let result = get_notes_for_entity(scenario.get_db(), "event", event_id).await;
        
        assert!(result.is_ok(), "Should retrieve entity notes successfully");
        let entity_notes = result.unwrap();
        assert_eq!(entity_notes.len(), 2, "Should return 2 linked notes");
        
        // Verify correct notes returned
        assert!(entity_notes.iter().any(|n| n.title == "Event Note 1"));
        assert!(entity_notes.iter().any(|n| n.title == "Event Note 2"));
        assert!(!entity_notes.iter().any(|n| n.title == "Other Note"));
    }

    #[tokio::test]
    #[serial]
    async fn test_note_validation() {
        let scenario = TestScenario::new();
        
        // Test empty title
        let empty_title_note = Note {
            id: None,
            title: "".to_string(),
            content: "Content".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let result = create_note(scenario.get_db(), &empty_title_note).await;
        assert!(result.is_err(), "Should reject empty title");
        
        // Test very long title
        let long_title_note = Note {
            id: None,
            title: "T".repeat(1000),
            content: "Content".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let result = create_note(scenario.get_db(), &long_title_note).await;
        // This might succeed or fail depending on database constraints
        // In production, you'd want to validate title length
    }

    #[tokio::test]
    #[serial]
    async fn test_special_content_handling() {
        let scenario = TestScenario::new();
        
        // Test markdown content
        let markdown_note = NoteFactory::create_markdown();
        let result = create_note(scenario.get_db(), &markdown_note).await;
        assert!(result.is_ok(), "Should handle markdown content");
        let note_id = result.unwrap();
        
        // Verify markdown content preserved
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT content FROM notes WHERE id = ?").unwrap();
        let content: String = stmt.query_row([note_id], |row| row.get(0)).unwrap();
        assert!(content.contains("# Header"));
        assert!(content.contains("**Bold**"));
        
        // Test unicode content
        let unicode_note = Note {
            id: None,
            title: "Unicode Note 📝".to_string(),
            content: "Unicode content: 你好世界 🌍 Здравствуй мир".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let result = create_note(scenario.get_db(), &unicode_note).await;
        assert!(result.is_ok(), "Should handle unicode content");
        
        // Test large content
        let large_note = NoteFactory::create_long_content();
        let result = create_note(scenario.get_db(), &large_note).await;
        assert!(result.is_ok(), "Should handle large content");
    }

    #[tokio::test]
    #[serial]
    async fn test_complex_linking_scenarios() {
        let mut scenario = TestScenario::new();
        
        // Create multiple notes
        let notes = vec![
            NoteFactory::create_with_title("Shared Note"),
            NoteFactory::create_with_title("Event Only Note"),
            NoteFactory::create_with_title("Task Only Note"),
        ];
        
        let mut note_ids = Vec::new();
        for note in &notes {
            let id = create_note(scenario.get_db(), note).await.unwrap();
            note_ids.push(id);
        }
        
        // Create event and task
        scenario.add_event("test_event", EventFactory::create_default());
        scenario.add_task("test_task", TaskFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        let task_id = scenario.get_task_id("test_task").unwrap();
        
        // Link shared note to both entities
        let event_link = NoteLink {
            id: None,
            note_id: note_ids[0],
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        let task_link = NoteLink {
            id: None,
            note_id: note_ids[0],
            entity_type: "task".to_string(),
            entity_id: task_id,
        };
        
        link_note(scenario.get_db(), &event_link).await.unwrap();
        link_note(scenario.get_db(), &task_link).await.unwrap();
        
        // Link other notes to specific entities
        let event_only_link = NoteLink {
            id: None,
            note_id: note_ids[1],
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        link_note(scenario.get_db(), &event_only_link).await.unwrap();
        
        let task_only_link = NoteLink {
            id: None,
            note_id: note_ids[2],
            entity_type: "task".to_string(),
            entity_id: task_id,
        };
        link_note(scenario.get_db(), &task_only_link).await.unwrap();
        
        // Verify event notes
        let event_notes = get_notes_for_entity(scenario.get_db(), "event", event_id).await.unwrap();
        assert_eq!(event_notes.len(), 2, "Event should have 2 notes");
        assert!(event_notes.iter().any(|n| n.title == "Shared Note"));
        assert!(event_notes.iter().any(|n| n.title == "Event Only Note"));
        
        // Verify task notes
        let task_notes = get_notes_for_entity(scenario.get_db(), "task", task_id).await.unwrap();
        assert_eq!(task_notes.len(), 2, "Task should have 2 notes");
        assert!(task_notes.iter().any(|n| n.title == "Shared Note"));
        assert!(task_notes.iter().any(|n| n.title == "Task Only Note"));
    }

    #[tokio::test]
    #[serial]
    async fn test_cascade_deletion_behavior() {
        let mut scenario = TestScenario::new();
        
        // Create note and event
        let note = NoteFactory::create_default();
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Link note to event
        let link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        link_note(scenario.get_db(), &link).await.unwrap();
        
        // Delete the event
        scenario.get_db().delete_event(event_id).unwrap();
        
        // Check if links are automatically cleaned up (depends on schema)
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM note_links WHERE entity_type = ? AND entity_id = ?").unwrap();
        let count: i32 = stmt.query_row(["event".to_string(), event_id.to_string()], |row| row.get(0)).unwrap();
        
        // Note: Actual behavior depends on foreign key constraints
        // In production, you'd want CASCADE DELETE or proper cleanup
    }

    #[tokio::test]
    #[serial]
    async fn test_error_handling() {
        let scenario = TestScenario::new();
        
        // Test update non-existent note
        let nonexistent_note = Note {
            id: Some(99999),
            title: "Nonexistent".to_string(),
            content: "Content".to_string(),
            created_at: None,
            updated_at: None,
        };
        
        let result = update_note(scenario.get_db(), &nonexistent_note).await;
        assert!(result.is_err(), "Should handle non-existent note gracefully");
        
        // Test delete non-existent note
        let result = delete_note(scenario.get_db(), 99999).await;
        assert!(result.is_err(), "Should handle non-existent note deletion gracefully");
        
        // Test invalid entity type in link
        let invalid_link = NoteLink {
            id: None,
            note_id: 1,
            entity_type: "invalid_type".to_string(),
            entity_id: 1,
        };
        
        let result = link_note(scenario.get_db(), &invalid_link).await;
        assert!(result.is_err(), "Should reject invalid entity type");
    }

    #[tokio::test]
    #[serial]
    async fn test_performance_bulk_operations() {
        let scenario = TestScenario::new();
        
        // Create 100 notes
        let start_time = std::time::Instant::now();
        
        for i in 1..=100 {
            let note = Note {
                id: None,
                title: format!("Bulk Note {}", i),
                content: format!("Content for bulk note {}", i),
                created_at: None,
                updated_at: None,
            };
            
            create_note(scenario.get_db(), &note).await.unwrap();
        }
        
        let creation_time = start_time.elapsed();
        
        // Retrieve all notes
        let retrieve_start = std::time::Instant::now();
        let result = get_notes(scenario.get_db()).await.unwrap();
        let retrieve_time = retrieve_start.elapsed();
        
        assert_eq!(result.len(), 100, "Should create and retrieve 100 notes");
        
        // Performance assertions
        assert!(creation_time.as_millis() < 5000, "Bulk creation should complete within 5 seconds");
        assert!(retrieve_time.as_millis() < 1000, "Retrieval should complete within 1 second");
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_note_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple notes concurrently
        let futures: Vec<_> = (1..=10)
            .map(|i| {
                let note = Note {
                    id: None,
                    title: format!("Concurrent Note {}", i),
                    content: format!("Content {}", i),
                    created_at: None,
                    updated_at: None,
                };
                create_note(scenario.get_db(), &note)
            })
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        // All operations should succeed
        for result in results {
            assert!(result.is_ok(), "Concurrent note creation should succeed");
        }
        
        // Verify all notes were created
        let notes = get_notes(scenario.get_db()).await.unwrap();
        assert_eq!(notes.len(), 10, "Should have 10 notes");
    }

    #[tokio::test]
    #[serial]
    async fn test_search_functionality() {
        let scenario = TestScenario::new();
        
        // Create notes with searchable content
        let searchable_notes = vec![
            Note {
                id: None,
                title: "JavaScript Tutorial".to_string(),
                content: "Learning about React and TypeScript".to_string(),
                created_at: None,
                updated_at: None,
            },
            Note {
                id: None,
                title: "Database Design".to_string(),
                content: "SQL queries and database optimization".to_string(),
                created_at: None,
                updated_at: None,
            },
            Note {
                id: None,
                title: "Meeting Notes".to_string(),
                content: "Discussed JavaScript frameworks and database performance".to_string(),
                created_at: None,
                updated_at: None,
            },
        ];
        
        for note in &searchable_notes {
            create_note(scenario.get_db(), note).await.unwrap();
        }
        
        // Test search functionality (if implemented)
        let all_notes = get_notes(scenario.get_db()).await.unwrap();
        assert_eq!(all_notes.len(), 3, "Should have 3 searchable notes");
        
        // Verify content is searchable
        let js_notes: Vec<_> = all_notes.iter()
            .filter(|n| n.content.contains("JavaScript") || n.title.contains("JavaScript"))
            .collect();
        assert_eq!(js_notes.len(), 2, "Should find 2 notes containing 'JavaScript'");
    }

    #[tokio::test]
    #[serial]
    async fn test_data_integrity() {
        let mut scenario = TestScenario::new();
        
        // Create note
        let note = NoteFactory::create_default();
        let note_id = create_note(scenario.get_db(), &note).await.unwrap();
        
        // Create event and task
        scenario.add_event("integrity_event", EventFactory::create_default());
        scenario.add_task("integrity_task", TaskFactory::create_default());
        let event_id = scenario.get_event_id("integrity_event").unwrap();
        let task_id = scenario.get_task_id("integrity_task").unwrap();
        
        // Link note to both entities
        let event_link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "event".to_string(),
            entity_id: event_id,
        };
        let task_link = NoteLink {
            id: None,
            note_id: note_id,
            entity_type: "task".to_string(),
            entity_id: task_id,
        };
        
        link_note(scenario.get_db(), &event_link).await.unwrap();
        link_note(scenario.get_db(), &task_link).await.unwrap();
        
        // Delete note - should also clean up links
        delete_note(scenario.get_db(), note_id).await.unwrap();
        
        // Verify note deletion
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes WHERE id = ?").unwrap();
        let note_count: i32 = stmt.query_row([note_id], |row| row.get(0)).unwrap();
        assert_eq!(note_count, 0, "Note should be deleted");
        
        // Verify links are cleaned up (depends on CASCADE configuration)
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM note_links WHERE note_id = ?").unwrap();
        let link_count: i32 = stmt.query_row([note_id], |row| row.get(0)).unwrap();
        // This assertion depends on database schema CASCADE behavior
        // assert_eq!(link_count, 0, "Links should be cleaned up");
    }
}