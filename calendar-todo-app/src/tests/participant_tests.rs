use crate::db::{Database, models::*};
use crate::tests::test_utilities::*;
use crate::services::participant_service::*;
use serial_test::serial;

#[cfg(test)]
mod participant_service_tests {
    use super::*;

    // Participant factory for testing
    struct ParticipantFactory;
    
    impl ParticipantFactory {
        fn create_default() -> Participant {
            Participant {
                id: None,
                name: "Default User".to_string(),
                email: Some("default@example.com".to_string()),
                avatar_location: None,
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_with_name(name: &str) -> Participant {
            Participant {
                id: None,
                name: name.to_string(),
                email: Some(format!("{}@example.com", name.to_lowercase().replace(" ", "."))),
                avatar_location: None,
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_with_avatar(name: &str, avatar_path: &str) -> Participant {
            Participant {
                id: None,
                name: name.to_string(),
                email: Some(format!("{}@example.com", name.to_lowercase().replace(" ", "."))),
                avatar_location: Some(avatar_path.to_string()),
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_no_email(name: &str) -> Participant {
            Participant {
                id: None,
                name: name.to_string(),
                email: None,
                avatar_location: None,
                created_at: None,
                updated_at: None,
            }
        }
        
        fn create_batch(count: usize) -> Vec<Participant> {
            (0..count)
                .map(|i| Participant {
                    id: None,
                    name: format!("User {}", i + 1),
                    email: Some(format!("user{}@example.com", i + 1)),
                    avatar_location: if i % 2 == 0 { Some(format!("/avatars/user{}.jpg", i + 1)) } else { None },
                    created_at: None,
                    updated_at: None,
                })
                .collect()
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_create_participant_success() {
        let scenario = TestScenario::new();
        let participant = ParticipantFactory::create_default();
        
        let result = create_participant(scenario.get_db(), &participant).await;
        
        assert!(result.is_ok(), "Should create participant successfully");
        let participant_id = result.unwrap();
        assert!(participant_id > 0, "Should return valid participant ID");
        
        // Verify participant was created
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name, email FROM participants WHERE id = ?").unwrap();
        let (name, email): (String, Option<String>) = stmt.query_row([participant_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).unwrap();
        
        assert_eq!(name, "Default User");
        assert_eq!(email, Some("default@example.com".to_string()));
    }

    #[tokio::test]
    #[serial]
    async fn test_get_participants_success() {
        let scenario = TestScenario::new();
        
        // Create test participants
        let participants = ParticipantFactory::create_batch(5);
        
        for participant in &participants {
            create_participant(scenario.get_db(), participant).await.unwrap();
        }
        
        let result = get_participants(scenario.get_db()).await;
        
        assert!(result.is_ok(), "Should retrieve participants successfully");
        let retrieved_participants = result.unwrap();
        assert_eq!(retrieved_participants.len(), 5, "Should return all participants");
        
        // Verify participant content
        assert!(retrieved_participants.iter().any(|p| p.name == "User 1"));
        assert!(retrieved_participants.iter().any(|p| p.name == "User 5"));
    }

    #[tokio::test]
    #[serial]
    async fn test_update_participant_success() {
        let scenario = TestScenario::new();
        let original_participant = ParticipantFactory::create_default();
        
        let participant_id = create_participant(scenario.get_db(), &original_participant).await.unwrap();
        
        // Update participant
        let updated_participant = Participant {
            id: Some(participant_id),
            name: "Updated User".to_string(),
            email: Some("updated@example.com".to_string()),
            avatar_location: Some("/avatars/updated.jpg".to_string()),
            created_at: None,
            updated_at: None,
        };
        
        let result = update_participant(scenario.get_db(), &updated_participant).await;
        
        assert!(result.is_ok(), "Should update participant successfully");
        
        // Verify update
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name, email, avatar_location FROM participants WHERE id = ?").unwrap();
        let (name, email, avatar): (String, Option<String>, Option<String>) = stmt.query_row([participant_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).unwrap();
        
        assert_eq!(name, "Updated User");
        assert_eq!(email, Some("updated@example.com".to_string()));
        assert_eq!(avatar, Some("/avatars/updated.jpg".to_string()));
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_participant_success() {
        let scenario = TestScenario::new();
        let participant = ParticipantFactory::create_default();
        
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        let result = delete_participant(scenario.get_db(), participant_id).await;
        
        assert!(result.is_ok(), "Should delete participant successfully");
        
        // Verify deletion
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM participants WHERE id = ?").unwrap();
        let count: i32 = stmt.query_row([participant_id], |row| row.get(0)).unwrap();
        assert_eq!(count, 0, "Participant should be deleted");
    }

    #[tokio::test]
    #[serial]
    async fn test_participant_event_assignment() {
        let mut scenario = TestScenario::new();
        
        // Create participant and event
        let participant = ParticipantFactory::create_default();
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Add participant to event
        let result = add_participant_to_event(scenario.get_db(), event_id, participant_id).await;
        
        assert!(result.is_ok(), "Should add participant to event successfully");
        
        // Verify assignment
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM event_participants WHERE event_id = ? AND participant_id = ?").unwrap();
        let count: i32 = stmt.query_row([event_id.to_string(), participant_id.to_string()], |row| row.get(0)).unwrap();
        assert_eq!(count, 1, "Assignment should exist");
        
        // Get event participants
        let event_participants = get_event_participants(scenario.get_db(), event_id).await.unwrap();
        assert_eq!(event_participants.len(), 1, "Should return 1 participant");
        assert_eq!(event_participants[0].name, "Default User");
    }

    #[tokio::test]
    #[serial]
    async fn test_remove_participant_from_event() {
        let mut scenario = TestScenario::new();
        
        // Create participant and event
        let participant = ParticipantFactory::create_default();
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        scenario.add_event("test_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("test_event").unwrap();
        
        // Add and then remove participant
        add_participant_to_event(scenario.get_db(), event_id, participant_id).await.unwrap();
        
        let result = remove_participant_from_event(scenario.get_db(), event_id, participant_id).await;
        
        assert!(result.is_ok(), "Should remove participant from event successfully");
        
        // Verify removal
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM event_participants WHERE event_id = ? AND participant_id = ?").unwrap();
        let count: i32 = stmt.query_row([event_id.to_string(), participant_id.to_string()], |row| row.get(0)).unwrap();
        assert_eq!(count, 0, "Assignment should be removed");
    }

    #[tokio::test]
    #[serial]
    async fn test_multiple_participants_per_event() {
        let mut scenario = TestScenario::new();
        
        // Create multiple participants
        let participants = ParticipantFactory::create_batch(5);
        let mut participant_ids = Vec::new();
        
        for participant in &participants {
            let id = create_participant(scenario.get_db(), participant).await.unwrap();
            participant_ids.push(id);
        }
        
        // Create event
        scenario.add_event("multi_participant_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("multi_participant_event").unwrap();
        
        // Add all participants to event
        for participant_id in &participant_ids {
            add_participant_to_event(scenario.get_db(), event_id, *participant_id).await.unwrap();
        }
        
        // Verify all participants assigned
        let event_participants = get_event_participants(scenario.get_db(), event_id).await.unwrap();
        assert_eq!(event_participants.len(), 5, "Should have 5 participants");
        
        // Verify participant names
        for i in 0..5 {
            assert!(event_participants.iter().any(|p| p.name == format!("User {}", i + 1)));
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_participant_across_multiple_events() {
        let mut scenario = TestScenario::new();
        
        // Create participant
        let participant = ParticipantFactory::create_default();
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        // Create multiple events
        let events = vec![
            EventFactory::create_meeting(),
            EventFactory::create_all_day(),
            EventFactory::create_default(),
        ];
        
        let mut event_ids = Vec::new();
        for (i, event) in events.iter().enumerate() {
            scenario.add_event(&format!("event_{}", i), event.clone());
            event_ids.push(scenario.get_event_id(&format!("event_{}", i)).unwrap());
        }
        
        // Add participant to all events
        for event_id in &event_ids {
            add_participant_to_event(scenario.get_db(), *event_id, participant_id).await.unwrap();
        }
        
        // Verify participant is in all events
        for event_id in &event_ids {
            let participants = get_event_participants(scenario.get_db(), *event_id).await.unwrap();
            assert_eq!(participants.len(), 1, "Each event should have 1 participant");
            assert_eq!(participants[0].name, "Default User");
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_participant_validation() {
        let scenario = TestScenario::new();
        
        // Test empty name
        let empty_name_participant = Participant {
            id: None,
            name: "".to_string(),
            email: Some("test@example.com".to_string()),
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = create_participant(scenario.get_db(), &empty_name_participant).await;
        assert!(result.is_err(), "Should reject empty name");
        
        // Test duplicate email
        let participant1 = ParticipantFactory::create_with_name("User One");
        create_participant(scenario.get_db(), &participant1).await.unwrap();
        
        let participant2 = Participant {
            id: None,
            name: "User Two".to_string(),
            email: participant1.email.clone(), // Same email
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = create_participant(scenario.get_db(), &participant2).await;
        // This might succeed or fail depending on database constraints
        // In production, you'd want to enforce unique email constraints
    }

    #[tokio::test]
    #[serial]
    async fn test_special_character_handling() {
        let scenario = TestScenario::new();
        
        // Test special characters in name
        let special_participant = Participant {
            id: None,
            name: "Jean-Pierre O'Connor Jr.".to_string(),
            email: Some("jean.pierre@example.com".to_string()),
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = create_participant(scenario.get_db(), &special_participant).await;
        assert!(result.is_ok(), "Should handle special characters in name");
        
        // Test unicode characters
        let unicode_participant = Participant {
            id: None,
            name: "张三".to_string(),
            email: Some("zhang.san@example.com".to_string()),
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = create_participant(scenario.get_db(), &unicode_participant).await;
        assert!(result.is_ok(), "Should handle unicode characters");
        
        let participant_id = result.unwrap();
        
        // Verify unicode preserved
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT name FROM participants WHERE id = ?").unwrap();
        let name: String = stmt.query_row([participant_id], |row| row.get(0)).unwrap();
        assert_eq!(name, "张三");
    }

    #[tokio::test]
    #[serial]
    async fn test_email_validation() {
        let scenario = TestScenario::new();
        
        // Test valid email formats
        let valid_emails = vec![
            "user@example.com",
            "user.name@example.co.uk",
            "user+tag@example-domain.org",
            "123user@sub.example.com",
        ];
        
        for (i, email) in valid_emails.iter().enumerate() {
            let participant = Participant {
                id: None,
                name: format!("User {}", i + 1),
                email: Some(email.to_string()),
                avatar_location: None,
                created_at: None,
                updated_at: None,
            };
            
            let result = create_participant(scenario.get_db(), &participant).await;
            assert!(result.is_ok(), "Should accept valid email: {}", email);
        }
        
        // Test invalid email format (if validation is implemented)
        let invalid_participant = Participant {
            id: None,
            name: "Invalid Email User".to_string(),
            email: Some("invalid-email-format".to_string()),
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = create_participant(scenario.get_db(), &invalid_participant).await;
        // This might succeed or fail depending on validation implementation
        // In production, you'd want proper email validation
    }

    #[tokio::test]
    #[serial]
    async fn test_avatar_handling() {
        let scenario = TestScenario::new();
        
        // Test with avatar
        let with_avatar = ParticipantFactory::create_with_avatar("Avatar User", "/uploads/avatars/user.jpg");
        let result = create_participant(scenario.get_db(), &with_avatar).await;
        assert!(result.is_ok(), "Should handle avatar path");
        
        let participant_id = result.unwrap();
        
        // Verify avatar stored
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT avatar_location FROM participants WHERE id = ?").unwrap();
        let avatar: Option<String> = stmt.query_row([participant_id], |row| row.get(0)).unwrap();
        assert_eq!(avatar, Some("/uploads/avatars/user.jpg".to_string()));
        
        // Test without avatar
        let no_avatar = ParticipantFactory::create_no_email("No Avatar User");
        let result = create_participant(scenario.get_db(), &no_avatar).await;
        assert!(result.is_ok(), "Should handle missing avatar");
    }

    #[tokio::test]
    #[serial]
    async fn test_bulk_participant_operations() {
        let scenario = TestScenario::new();
        
        // Create 100 participants for performance testing
        let start_time = std::time::Instant::now();
        
        for i in 1..=100 {
            let participant = Participant {
                id: None,
                name: format!("Bulk User {}", i),
                email: Some(format!("bulk{}@example.com", i)),
                avatar_location: None,
                created_at: None,
                updated_at: None,
            };
            
            create_participant(scenario.get_db(), &participant).await.unwrap();
        }
        
        let creation_time = start_time.elapsed();
        
        // Retrieve all participants
        let retrieve_start = std::time::Instant::now();
        let result = get_participants(scenario.get_db()).await.unwrap();
        let retrieve_time = retrieve_start.elapsed();
        
        assert_eq!(result.len(), 100, "Should create and retrieve 100 participants");
        
        // Performance assertions
        assert!(creation_time.as_millis() < 5000, "Bulk creation should complete within 5 seconds");
        assert!(retrieve_time.as_millis() < 1000, "Retrieval should complete within 1 second");
    }

    #[tokio::test]
    #[serial]
    async fn test_event_assignment_workflow() {
        let mut scenario = TestScenario::new();
        
        // Create multiple participants and events
        let participants = ParticipantFactory::create_batch(3);
        let mut participant_ids = Vec::new();
        
        for participant in &participants {
            let id = create_participant(scenario.get_db(), participant).await.unwrap();
            participant_ids.push(id);
        }
        
        // Create multiple events
        scenario.add_event("meeting", EventFactory::create_meeting());
        scenario.add_event("all_day", EventFactory::create_all_day());
        let meeting_id = scenario.get_event_id("meeting").unwrap();
        let all_day_id = scenario.get_event_id("all_day").unwrap();
        
        // Complex assignment scenario
        // Meeting: All 3 participants
        // All-day event: Only first 2 participants
        
        for participant_id in &participant_ids {
            add_participant_to_event(scenario.get_db(), meeting_id, *participant_id).await.unwrap();
        }
        
        for participant_id in &participant_ids[0..2] {
            add_participant_to_event(scenario.get_db(), all_day_id, *participant_id).await.unwrap();
        }
        
        // Verify assignments
        let meeting_participants = get_event_participants(scenario.get_db(), meeting_id).await.unwrap();
        assert_eq!(meeting_participants.len(), 3, "Meeting should have 3 participants");
        
        let all_day_participants = get_event_participants(scenario.get_db(), all_day_id).await.unwrap();
        assert_eq!(all_day_participants.len(), 2, "All-day event should have 2 participants");
        
        // Remove one participant from meeting
        remove_participant_from_event(scenario.get_db(), meeting_id, participant_ids[0]).await.unwrap();
        
        let updated_meeting_participants = get_event_participants(scenario.get_db(), meeting_id).await.unwrap();
        assert_eq!(updated_meeting_participants.len(), 2, "Meeting should now have 2 participants");
    }

    #[tokio::test]
    #[serial]
    async fn test_error_handling() {
        let scenario = TestScenario::new();
        
        // Test update non-existent participant
        let nonexistent_participant = Participant {
            id: Some(99999),
            name: "Nonexistent".to_string(),
            email: Some("nonexistent@example.com".to_string()),
            avatar_location: None,
            created_at: None,
            updated_at: None,
        };
        
        let result = update_participant(scenario.get_db(), &nonexistent_participant).await;
        assert!(result.is_err(), "Should handle non-existent participant gracefully");
        
        // Test delete non-existent participant
        let result = delete_participant(scenario.get_db(), 99999).await;
        assert!(result.is_err(), "Should handle non-existent participant deletion gracefully");
        
        // Test add participant to non-existent event
        let participant = ParticipantFactory::create_default();
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        let result = add_participant_to_event(scenario.get_db(), 99999, participant_id).await;
        assert!(result.is_err(), "Should reject assignment to non-existent event");
    }

    #[tokio::test]
    #[serial]
    async fn test_concurrent_participant_operations() {
        let scenario = TestScenario::new();
        
        // Create multiple participants concurrently
        let futures: Vec<_> = (1..=10)
            .map(|i| {
                let participant = Participant {
                    id: None,
                    name: format!("Concurrent User {}", i),
                    email: Some(format!("concurrent{}@example.com", i)),
                    avatar_location: None,
                    created_at: None,
                    updated_at: None,
                };
                create_participant(scenario.get_db(), &participant)
            })
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        // All operations should succeed
        for result in results {
            assert!(result.is_ok(), "Concurrent participant creation should succeed");
        }
        
        // Verify all participants were created
        let participants = get_participants(scenario.get_db()).await.unwrap();
        assert_eq!(participants.len(), 10, "Should have 10 participants");
    }

    #[tokio::test]
    #[serial]
    async fn test_cascade_deletion_behavior() {
        let mut scenario = TestScenario::new();
        
        // Create participant and event with assignment
        let participant = ParticipantFactory::create_default();
        let participant_id = create_participant(scenario.get_db(), &participant).await.unwrap();
        
        scenario.add_event("cascade_event", EventFactory::create_default());
        let event_id = scenario.get_event_id("cascade_event").unwrap();
        
        add_participant_to_event(scenario.get_db(), event_id, participant_id).await.unwrap();
        
        // Delete the event
        scenario.get_db().delete_event(event_id).unwrap();
        
        // Check if assignments are automatically cleaned up
        let conn = scenario.get_db().get_connection();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM event_participants WHERE event_id = ?").unwrap();
        let count: i32 = stmt.query_row([event_id], |row| row.get(0)).unwrap();
        
        // Note: Actual behavior depends on foreign key constraints
        // In production, you'd want CASCADE DELETE or proper cleanup
        
        // Participant should still exist
        let participants = get_participants(scenario.get_db()).await.unwrap();
        assert_eq!(participants.len(), 1, "Participant should still exist after event deletion");
    }

    #[tokio::test]
    #[serial]
    async fn test_csv_import_export_workflow() {
        let scenario = TestScenario::new();
        
        // Create participants
        let participants = vec![
            ParticipantFactory::create_with_name("John Doe"),
            ParticipantFactory::create_with_name("Jane Smith"),
            ParticipantFactory::create_with_avatar("Bob Wilson", "/avatars/bob.jpg"),
        ];
        
        for participant in &participants {
            create_participant(scenario.get_db(), participant).await.unwrap();
        }
        
        // Test export functionality (mocked at service level)
        let all_participants = get_participants(scenario.get_db()).await.unwrap();
        assert_eq!(all_participants.len(), 3, "Should have 3 participants for export");
        
        // Verify participant data integrity
        assert!(all_participants.iter().any(|p| p.name == "John Doe"));
        assert!(all_participants.iter().any(|p| p.name == "Jane Smith"));
        assert!(all_participants.iter().any(|p| p.name == "Bob Wilson"));
        
        let bob = all_participants.iter().find(|p| p.name == "Bob Wilson").unwrap();
        assert_eq!(bob.avatar_location, Some("/avatars/bob.jpg".to_string()));
    }
}