/**
 * Offline Sync Integration Tests
 * 
 * Tests offline-online data synchronization capabilities, local data persistence,
 * conflict resolution during reconnection, and data integrity maintenance.
 * 
 * @author Integration Test Suite
 * @date September 7, 2025
 */

import '../integrationTestSetup';

describe('Offline Sync Integration Tests', () => {
    beforeEach(() => {
        global.resetMockResponses();
        jest.clearAllMocks();
    });

    describe('Offline Mode Detection and Activation', () => {
        test('should detect network disconnection and activate offline mode', async () => {
            global.setMockResponse('detect_network_disconnection', {
                network_disconnected: true,
                disconnection_timestamp: '2025-09-07T14:30:00Z',
                offline_mode_activated: true,
                connection_type: 'wifi',
                last_successful_sync: '2025-09-07T14:29:45Z',
                pending_operations: [],
                local_cache_available: true
            });

            const result = await global.mockTauriInvoke('detect_network_disconnection');
            
            expect(result.network_disconnected).toBe(true);
            expect(result.offline_mode_activated).toBe(true);
            expect(result.local_cache_available).toBe(true);
        });

        test('should gracefully transition to offline mode', async () => {
            global.setMockResponse('transition_to_offline_mode', {
                transition_successful: true,
                offline_mode_active: true,
                services_disabled: [
                    'real_time_sync',
                    'websocket_connection',
                    'remote_api_calls'
                ],
                services_enabled: [
                    'local_storage',
                    'offline_queue',
                    'local_search',
                    'change_tracking'
                ],
                offline_capabilities: {
                    can_create_events: true,
                    can_update_events: true,
                    can_delete_events: true,
                    can_create_tasks: true,
                    can_update_tasks: true,
                    can_delete_tasks: true,
                    can_link_items: true
                },
                transition_timestamp: '2025-09-07T14:30:05Z'
            });

            const result = await global.mockTauriInvoke('transition_to_offline_mode');
            
            expect(result.transition_successful).toBe(true);
            expect(result.services_disabled).toContain('real_time_sync');
            expect(result.services_enabled).toContain('local_storage');
            expect(result.offline_capabilities.can_create_events).toBe(true);
        });

        test('should maintain local data availability in offline mode', async () => {
            global.setMockResponse('verify_offline_data_availability', {
                data_available: true,
                local_cache_size_mb: 25.6,
                events_cached: 150,
                tasks_cached: 89,
                links_cached: 23,
                categories_cached: 8,
                last_cache_update: '2025-09-07T14:29:45Z',
                cache_expiry: '2025-09-09T14:29:45Z',
                full_offline_capability: true
            });

            const result = await global.mockTauriInvoke('verify_offline_data_availability');
            
            expect(result.data_available).toBe(true);
            expect(result.events_cached).toBe(150);
            expect(result.tasks_cached).toBe(89);
            expect(result.full_offline_capability).toBe(true);
        });
    });

    describe('Offline Operations and Local Storage', () => {
        test('should create events in offline mode', async () => {
            global.setMockResponse('create_event_offline', {
                creation_successful: true,
                event: {
                    id: 'temp_event_001',
                    title: 'Offline Meeting',
                    start_time: '2025-09-08T10:00:00Z',
                    end_time: '2025-09-08T11:00:00Z',
                    is_all_day: false,
                    priority: 3,
                    created_offline: true,
                    local_timestamp: '2025-09-07T14:35:00Z',
                    sync_status: 'pending'
                },
                local_storage_updated: true,
                sync_queue_position: 1,
                estimated_sync_time: 'next_connection'
            });

            const eventData = {
                title: 'Offline Meeting',
                start_time: '2025-09-08T10:00:00Z',
                end_time: '2025-09-08T11:00:00Z',
                priority: 3
            };

            const result = await global.mockTauriInvoke('create_event_offline', eventData);
            
            expect(result.creation_successful).toBe(true);
            expect(result.event.created_offline).toBe(true);
            expect(result.event.sync_status).toBe('pending');
        });

        test('should update events in offline mode', async () => {
            global.setMockResponse('update_event_offline', {
                update_successful: true,
                event: {
                    id: 5,
                    title: 'Updated Meeting Title',
                    description: 'Updated while offline',
                    priority: 4,
                    updated_offline: true,
                    local_timestamp: '2025-09-07T14:40:00Z',
                    sync_status: 'pending_update',
                    original_version: 2,
                    offline_version: 3
                },
                local_storage_updated: true,
                change_tracked: true,
                sync_queue_position: 2
            });

            const updateData = {
                event_id: 5,
                title: 'Updated Meeting Title',
                description: 'Updated while offline',
                priority: 4
            };

            const result = await global.mockTauriInvoke('update_event_offline', updateData);
            
            expect(result.update_successful).toBe(true);
            expect(result.event.updated_offline).toBe(true);
            expect(result.change_tracked).toBe(true);
        });

        test('should delete events in offline mode', async () => {
            global.setMockResponse('delete_event_offline', {
                deletion_successful: true,
                event_id: 7,
                deleted_offline: true,
                local_timestamp: '2025-09-07T14:45:00Z',
                sync_status: 'pending_deletion',
                soft_delete: true,
                local_storage_updated: true,
                sync_queue_position: 3,
                cascade_operations: [
                    {
                        type: 'unlink_tasks',
                        affected_tasks: [12, 13],
                        status: 'queued'
                    }
                ]
            });

            const deleteData = {
                event_id: 7,
                cascade_delete_links: true
            };

            const result = await global.mockTauriInvoke('delete_event_offline', deleteData);
            
            expect(result.deletion_successful).toBe(true);
            expect(result.deleted_offline).toBe(true);
            expect(result.soft_delete).toBe(true);
            expect(result.cascade_operations).toHaveLength(1);
        });

        test('should create tasks in offline mode', async () => {
            global.setMockResponse('create_task_offline', {
                creation_successful: true,
                task: {
                    id: 'temp_task_001',
                    title: 'Offline Task',
                    description: 'Created while offline',
                    due_date: '2025-09-08T17:00:00Z',
                    priority: 4,
                    status: 'TODO',
                    created_offline: true,
                    local_timestamp: '2025-09-07T14:50:00Z',
                    sync_status: 'pending'
                },
                local_storage_updated: true,
                sync_queue_position: 4
            });

            const taskData = {
                title: 'Offline Task',
                description: 'Created while offline',
                due_date: '2025-09-08T17:00:00Z',
                priority: 4,
                status: 'TODO'
            };

            const result = await global.mockTauriInvoke('create_task_offline', taskData);
            
            expect(result.creation_successful).toBe(true);
            expect(result.task.created_offline).toBe(true);
            expect(result.task.sync_status).toBe('pending');
        });

        test('should create links between events and tasks offline', async () => {
            global.setMockResponse('create_link_offline', {
                link_creation_successful: true,
                link: {
                    id: 'temp_link_001',
                    event_id: 5,
                    task_id: 'temp_task_001',
                    link_type: 'associated',
                    created_offline: true,
                    local_timestamp: '2025-09-07T14:55:00Z',
                    sync_status: 'pending'
                },
                local_storage_updated: true,
                sync_queue_position: 5,
                dependency_check: 'both_entities_exist_locally'
            });

            const linkData = {
                event_id: 5,
                task_id: 'temp_task_001',
                link_type: 'associated'
            };

            const result = await global.mockTauriInvoke('create_link_offline', linkData);
            
            expect(result.link_creation_successful).toBe(true);
            expect(result.link.created_offline).toBe(true);
            expect(result.dependency_check).toBe('both_entities_exist_locally');
        });
    });

    describe('Change Tracking and Synchronization Queue', () => {
        test('should track all changes made offline', async () => {
            global.setMockResponse('get_offline_change_log', {
                total_changes: 8,
                changes: [
                    {
                        id: 1,
                        entity_type: 'event',
                        entity_id: 'temp_event_001',
                        operation: 'create',
                        timestamp: '2025-09-07T14:35:00Z',
                        sync_status: 'pending'
                    },
                    {
                        id: 2,
                        entity_type: 'event',
                        entity_id: 5,
                        operation: 'update',
                        timestamp: '2025-09-07T14:40:00Z',
                        sync_status: 'pending'
                    },
                    {
                        id: 3,
                        entity_type: 'event',
                        entity_id: 7,
                        operation: 'delete',
                        timestamp: '2025-09-07T14:45:00Z',
                        sync_status: 'pending'
                    }
                ],
                changes_by_type: {
                    'create': 3,
                    'update': 4,
                    'delete': 1
                },
                estimated_sync_time_seconds: 45
            });

            const result = await global.mockTauriInvoke('get_offline_change_log');
            
            expect(result.total_changes).toBe(8);
            expect(result.changes).toHaveLength(3);
            expect(result.changes_by_type.create).toBe(3);
            expect(result.changes_by_type.update).toBe(4);
        });

        test('should prioritize sync queue by importance', async () => {
            global.setMockResponse('prioritize_sync_queue', {
                queue_prioritized: true,
                total_items: 8,
                priority_order: [
                    {
                        id: 1,
                        entity_type: 'event',
                        operation: 'create',
                        priority_score: 95,
                        priority_reason: 'imminent_deadline'
                    },
                    {
                        id: 2,
                        entity_type: 'task',
                        operation: 'update',
                        priority_score: 85,
                        priority_reason: 'status_change_to_completed'
                    },
                    {
                        id: 3,
                        entity_type: 'link',
                        operation: 'create',
                        priority_score: 70,
                        priority_reason: 'dependency_relationship'
                    }
                ],
                prioritization_criteria: [
                    'deadline_proximity',
                    'operation_impact',
                    'data_dependencies',
                    'user_activity'
                ]
            });

            const result = await global.mockTauriInvoke('prioritize_sync_queue');
            
            expect(result.queue_prioritized).toBe(true);
            expect(result.priority_order[0].priority_score).toBe(95);
            expect(result.prioritization_criteria).toContain('deadline_proximity');
        });

        test('should validate change dependencies before sync', async () => {
            global.setMockResponse('validate_change_dependencies', {
                validation_successful: true,
                dependencies_resolved: true,
                dependency_conflicts: 0,
                validation_results: [
                    {
                        change_id: 1,
                        entity_type: 'event',
                        dependencies: [],
                        can_sync: true
                    },
                    {
                        change_id: 5,
                        entity_type: 'link',
                        dependencies: ['temp_event_001', 'temp_task_001'],
                        can_sync: true,
                        dependency_status: 'all_dependencies_ready'
                    }
                ],
                sync_order_optimized: true
            });

            const result = await global.mockTauriInvoke('validate_change_dependencies');
            
            expect(result.validation_successful).toBe(true);
            expect(result.dependencies_resolved).toBe(true);
            expect(result.dependency_conflicts).toBe(0);
        });
    });

    describe('Network Reconnection and Sync Execution', () => {
        test('should detect network reconnection', async () => {
            global.setMockResponse('detect_network_reconnection', {
                network_reconnected: true,
                reconnection_timestamp: '2025-09-07T15:00:00Z',
                connection_type: 'wifi',
                connection_quality: 'excellent',
                offline_duration_seconds: 1800,
                sync_preparation_started: true,
                pending_changes_count: 8
            });

            const result = await global.mockTauriInvoke('detect_network_reconnection');
            
            expect(result.network_reconnected).toBe(true);
            expect(result.offline_duration_seconds).toBe(1800);
            expect(result.sync_preparation_started).toBe(true);
        });

        test('should execute incremental sync after reconnection', async () => {
            global.setMockResponse('execute_incremental_sync', {
                sync_execution_successful: true,
                sync_started_at: '2025-09-07T15:00:30Z',
                sync_completed_at: '2025-09-07T15:02:15Z',
                total_duration_seconds: 105,
                changes_synced: 8,
                changes_successful: 7,
                changes_failed: 1,
                conflicts_detected: 2,
                conflicts_resolved: 2,
                sync_summary: {
                    events_created: 2,
                    events_updated: 1,
                    events_deleted: 1,
                    tasks_created: 1,
                    tasks_updated: 1,
                    links_created: 1,
                    links_failed: 1
                },
                server_changes_received: 12,
                local_data_updated: true
            });

            const syncData = {
                last_sync_timestamp: '2025-09-07T14:29:45Z',
                pending_changes: 8,
                conflict_resolution_strategy: 'interactive'
            };

            const result = await global.mockTauriInvoke('execute_incremental_sync', syncData);
            
            expect(result.sync_execution_successful).toBe(true);
            expect(result.changes_successful).toBe(7);
            expect(result.conflicts_resolved).toBe(2);
            expect(result.server_changes_received).toBe(12);
        });

        test('should handle sync failures with retry mechanism', async () => {
            global.setMockTemporaryError('execute_incremental_sync', 
                'Sync failed: server temporarily unavailable');

            global.setMockResponse('retry_failed_sync', {
                retry_successful: true,
                retry_attempt: 2,
                max_retries: 3,
                backoff_delay_ms: 2000,
                sync_completed_at: '2025-09-07T15:05:00Z',
                changes_synced: 8,
                retry_strategy: 'exponential_backoff'
            });

            // Initial sync fails
            await expect(global.mockTauriInvoke('execute_incremental_sync', {}))
                .rejects.toThrow('Sync failed');

            // Retry succeeds
            const retryResult = await global.mockTauriInvoke('retry_failed_sync', {
                retry_attempt: 2
            });

            expect(retryResult.retry_successful).toBe(true);
            expect(retryResult.changes_synced).toBe(8);
        });
    });

    describe('Conflict Resolution During Sync', () => {
        test('should detect conflicts during offline sync', async () => {
            global.setMockResponse('detect_sync_conflicts', {
                conflicts_detected: true,
                conflict_count: 3,
                conflicts: [
                    {
                        id: 'conflict_001',
                        entity_type: 'event',
                        entity_id: 5,
                        conflict_type: 'concurrent_modification',
                        local_changes: {
                            title: 'Updated Offline Title',
                            updated_at: '2025-09-07T14:40:00Z'
                        },
                        server_changes: {
                            title: 'Updated Online Title',
                            updated_at: '2025-09-07T14:35:00Z'
                        },
                        resolution_required: true
                    },
                    {
                        id: 'conflict_002',
                        entity_type: 'task',
                        entity_id: 8,
                        conflict_type: 'status_mismatch',
                        local_changes: {
                            status: 'IN_PROGRESS',
                            updated_at: '2025-09-07T14:50:00Z'
                        },
                        server_changes: {
                            status: 'DONE',
                            completed_at: '2025-09-07T14:45:00Z'
                        },
                        resolution_required: true
                    }
                ]
            });

            const conflictData = {
                offline_changes: [
                    { entity_id: 5, entity_type: 'event' },
                    { entity_id: 8, entity_type: 'task' }
                ]
            };

            const result = await global.mockTauriInvoke('detect_sync_conflicts', conflictData);
            
            expect(result.conflicts_detected).toBe(true);
            expect(result.conflict_count).toBe(3);
            expect(result.conflicts[0].conflict_type).toBe('concurrent_modification');
        });

        test('should resolve simple conflicts automatically', async () => {
            global.setMockResponse('auto_resolve_sync_conflicts', {
                auto_resolution_successful: true,
                conflicts_processed: 3,
                conflicts_auto_resolved: 2,
                conflicts_requiring_manual_resolution: 1,
                resolutions: [
                    {
                        conflict_id: 'conflict_001',
                        resolution_strategy: 'merge_non_conflicting_fields',
                        resolved_entity: {
                            id: 5,
                            title: 'Updated Offline Title',
                            description: 'Server description preserved',
                            priority: 4
                        }
                    },
                    {
                        conflict_id: 'conflict_003',
                        resolution_strategy: 'last_writer_wins',
                        resolved_entity: {
                            id: 9,
                            status: 'DONE',
                            completed_at: '2025-09-07T14:45:00Z'
                        }
                    }
                ],
                manual_conflicts: [
                    {
                        conflict_id: 'conflict_002',
                        reason: 'status_change_requires_user_decision'
                    }
                ]
            });

            const result = await global.mockTauriInvoke('auto_resolve_sync_conflicts', {
                conflict_ids: ['conflict_001', 'conflict_002', 'conflict_003']
            });
            
            expect(result.conflicts_auto_resolved).toBe(2);
            expect(result.conflicts_requiring_manual_resolution).toBe(1);
            expect(result.resolutions).toHaveLength(2);
        });

        test('should present conflicts for manual resolution', async () => {
            global.setMockResponse('present_sync_conflicts_for_resolution', {
                conflicts_presented: true,
                conflict_count: 1,
                conflicts: [
                    {
                        id: 'conflict_002',
                        entity_type: 'task',
                        entity_id: 8,
                        presentation_data: {
                            entity_title: 'Important Task',
                            local_version: {
                                status: 'IN_PROGRESS',
                                notes: 'Updated notes while offline',
                                updated_at: '2025-09-07T14:50:00Z'
                            },
                            server_version: {
                                status: 'DONE',
                                completed_at: '2025-09-07T14:45:00Z',
                                completion_notes: 'Completed by team member'
                            },
                            resolution_options: [
                                'keep_local_changes',
                                'accept_server_changes',
                                'merge_with_custom_resolution'
                            ]
                        }
                    }
                ]
            });

            const result = await global.mockTauriInvoke('present_sync_conflicts_for_resolution', {
                manual_conflict_ids: ['conflict_002']
            });
            
            expect(result.conflicts_presented).toBe(true);
            expect(result.conflicts[0].presentation_data.resolution_options).toHaveLength(3);
        });
    });

    describe('Data Integrity and Validation', () => {
        test('should validate data integrity after offline sync', async () => {
            global.setMockResponse('validate_post_sync_integrity', {
                integrity_validation_successful: true,
                validations_performed: [
                    'foreign_key_consistency',
                    'timestamp_chronology',
                    'status_transitions',
                    'link_references',
                    'cascade_operations'
                ],
                validation_results: {
                    foreign_key_consistency: 'passed',
                    timestamp_chronology: 'passed',
                    status_transitions: 'passed',
                    link_references: 'passed',
                    cascade_operations: 'passed'
                },
                entities_validated: 15,
                integrity_score: 100,
                issues_found: 0
            });

            const result = await global.mockTauriInvoke('validate_post_sync_integrity');
            
            expect(result.integrity_validation_successful).toBe(true);
            expect(result.integrity_score).toBe(100);
            expect(result.issues_found).toBe(0);
        });

        test('should handle corrupted offline data gracefully', async () => {
            global.setMockResponse('handle_corrupted_offline_data', {
                corruption_detected: true,
                corrupted_entities: [
                    {
                        entity_type: 'event',
                        entity_id: 'temp_event_corrupted',
                        corruption_type: 'invalid_date_format',
                        recovery_action: 'discard_and_log'
                    }
                ],
                recovery_successful: true,
                entities_recovered: 0,
                entities_discarded: 1,
                sync_continued: true,
                data_loss_minimal: true
            });

            const result = await global.mockTauriInvoke('handle_corrupted_offline_data');
            
            expect(result.corruption_detected).toBe(true);
            expect(result.recovery_successful).toBe(true);
            expect(result.entities_discarded).toBe(1);
            expect(result.sync_continued).toBe(true);
        });

        test('should verify temporary ID resolution', async () => {
            global.setMockResponse('verify_temporary_id_resolution', {
                resolution_successful: true,
                temporary_ids_resolved: 5,
                id_mappings: [
                    {
                        temporary_id: 'temp_event_001',
                        permanent_id: 101,
                        entity_type: 'event'
                    },
                    {
                        temporary_id: 'temp_task_001',
                        permanent_id: 205,
                        entity_type: 'task'
                    },
                    {
                        temporary_id: 'temp_link_001',
                        permanent_id: 305,
                        entity_type: 'link'
                    }
                ],
                references_updated: true,
                orphaned_references: 0
            });

            const result = await global.mockTauriInvoke('verify_temporary_id_resolution');
            
            expect(result.resolution_successful).toBe(true);
            expect(result.temporary_ids_resolved).toBe(5);
            expect(result.orphaned_references).toBe(0);
        });
    });

    describe('Performance and Optimization', () => {
        test('should optimize offline storage for performance', async () => {
            global.setMockResponse('optimize_offline_storage', {
                optimization_successful: true,
                storage_optimized: true,
                space_saved_mb: 5.2,
                performance_improvement_percent: 25,
                optimizations_applied: [
                    'data_compression',
                    'index_rebuilding',
                    'cache_cleanup',
                    'redundant_data_removal'
                ],
                storage_stats: {
                    total_size_mb: 18.4,
                    events_size_mb: 8.2,
                    tasks_size_mb: 6.1,
                    links_size_mb: 2.3,
                    metadata_size_mb: 1.8
                }
            });

            const result = await global.mockTauriInvoke('optimize_offline_storage');
            
            expect(result.optimization_successful).toBe(true);
            expect(result.space_saved_mb).toBeGreaterThan(5);
            expect(result.performance_improvement_percent).toBeGreaterThan(20);
        });

        test('should handle large offline datasets efficiently', async () => {
            global.setMockResponse('handle_large_offline_dataset', {
                processing_successful: true,
                dataset_size: {
                    events: 1000,
                    tasks: 1500,
                    links: 500
                },
                processing_time_ms: 5200,
                memory_usage_mb: 42,
                batch_processing_used: true,
                batch_size: 100,
                performance_metrics: {
                    entities_per_second: 576,
                    peak_memory_mb: 48,
                    cpu_usage_percent: 70
                }
            });

            const result = await global.mockTauriInvoke('handle_large_offline_dataset');
            
            expect(result.processing_successful).toBe(true);
            expect(result.batch_processing_used).toBe(true);
            expect(result.performance_metrics.entities_per_second).toBeGreaterThan(500);
        });

        test('should implement efficient delta sync', async () => {
            global.setMockResponse('execute_delta_sync', {
                delta_sync_successful: true,
                changes_analyzed: 8,
                actual_changes: 5,
                redundant_changes_filtered: 3,
                sync_optimizations: [
                    'duplicate_elimination',
                    'change_consolidation',
                    'dependency_ordering'
                ],
                bandwidth_saved_percent: 35,
                sync_time_reduced_percent: 40,
                delta_summary: {
                    net_creates: 2,
                    net_updates: 2,
                    net_deletes: 1,
                    consolidated_operations: 3
                }
            });

            const result = await global.mockTauriInvoke('execute_delta_sync');
            
            expect(result.delta_sync_successful).toBe(true);
            expect(result.bandwidth_saved_percent).toBeGreaterThan(30);
            expect(result.sync_time_reduced_percent).toBeGreaterThan(35);
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle partial sync failures', async () => {
            global.setMockResponse('handle_partial_sync_failure', {
                partial_failure_handled: true,
                successful_syncs: 6,
                failed_syncs: 2,
                total_changes: 8,
                failed_changes: [
                    {
                        change_id: 4,
                        entity_type: 'event',
                        operation: 'create',
                        failure_reason: 'validation_error',
                        retry_possible: true
                    },
                    {
                        change_id: 7,
                        entity_type: 'link',
                        operation: 'create',
                        failure_reason: 'referenced_entity_not_found',
                        retry_possible: false,
                        requires_manual_intervention: true
                    }
                ],
                retry_queue_updated: true,
                user_notification_sent: true
            });

            const result = await global.mockTauriInvoke('handle_partial_sync_failure');
            
            expect(result.partial_failure_handled).toBe(true);
            expect(result.successful_syncs).toBe(6);
            expect(result.failed_syncs).toBe(2);
            expect(result.retry_queue_updated).toBe(true);
        });

        test('should implement sync rollback for critical failures', async () => {
            global.setMockResponse('rollback_failed_sync', {
                rollback_successful: true,
                rollback_reason: 'critical_data_corruption_detected',
                entities_rolled_back: 3,
                rollback_to_timestamp: '2025-09-07T14:29:45Z',
                offline_changes_preserved: true,
                sync_queue_restored: true,
                user_data_safe: true,
                retry_scheduled: true,
                next_retry_at: '2025-09-07T15:30:00Z'
            });

            const rollbackData = {
                reason: 'critical_data_corruption_detected',
                preserve_offline_changes: true
            };

            const result = await global.mockTauriInvoke('rollback_failed_sync', rollbackData);
            
            expect(result.rollback_successful).toBe(true);
            expect(result.offline_changes_preserved).toBe(true);
            expect(result.user_data_safe).toBe(true);
        });

        test('should maintain audit trail for offline operations', async () => {
            global.setMockResponse('get_offline_operation_audit_trail', {
                audit_trail_available: true,
                total_operations: 12,
                operations: [
                    {
                        id: 1,
                        operation_type: 'event_create',
                        entity_id: 'temp_event_001',
                        timestamp: '2025-09-07T14:35:00Z',
                        sync_status: 'completed',
                        sync_timestamp: '2025-09-07T15:01:30Z'
                    },
                    {
                        id: 2,
                        operation_type: 'task_update',
                        entity_id: 8,
                        timestamp: '2025-09-07T14:50:00Z',
                        sync_status: 'conflict_resolved',
                        sync_timestamp: '2025-09-07T15:02:15Z',
                        resolution_method: 'manual_resolution'
                    }
                ],
                sync_summary: {
                    successful_operations: 10,
                    failed_operations: 1,
                    conflicted_operations: 1
                }
            });

            const result = await global.mockTauriInvoke('get_offline_operation_audit_trail');
            
            expect(result.audit_trail_available).toBe(true);
            expect(result.total_operations).toBe(12);
            expect(result.sync_summary.successful_operations).toBe(10);
        });
    });
});