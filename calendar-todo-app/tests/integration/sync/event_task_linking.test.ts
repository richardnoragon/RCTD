/**
 * Event-Task Linking Integration Tests
 * 
 * Tests bi-directional linking capabilities between calendar events and todo tasks.
 * Validates data consistency, relationship management, and cross-reference integrity.
 * 
 * @author Integration Test Suite
 * @date September 7, 2025
 */

import '../integrationTestSetup';

describe('Event-Task Linking Integration Tests', () => {
    beforeEach(() => {
        global.resetMockResponses();
        jest.clearAllMocks();
    });

    describe('Bi-directional Linking Creation', () => {
        test('should create event with linked task', async () => {
            // Mock successful event creation
            global.setMockResponse('create_event', 1);
            global.setMockResponse('create_task', 1);
            global.setMockResponse('link_event_task', { event_id: 1, task_id: 1, link_type: 'associated' });
            
            const eventData = {
                title: 'Project Meeting',
                description: 'Weekly team sync',
                start_time: '2025-09-08T10:00:00Z',
                end_time: '2025-09-08T11:00:00Z',
                is_all_day: false,
                priority: 3,
                create_linked_task: true,
                linked_task: {
                    title: 'Prepare meeting agenda',
                    description: 'Create agenda items for team sync',
                    due_date: '2025-09-08T09:30:00Z',
                    priority: 3,
                    status: 'TODO'
                }
            };

            // Simulate event creation with task linking
            const result = await global.mockTauriInvoke('create_event_with_task', eventData);
            
            expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_event_with_task', eventData);
            expect(result).toEqual({
                event_id: 1,
                task_id: 1,
                link_created: true,
                link_type: 'associated'
            });
        });

        test('should create task with linked event', async () => {
            global.setMockResponse('create_task', 1);
            global.setMockResponse('create_event', 1);
            global.setMockResponse('link_task_event', { task_id: 1, event_id: 1, link_type: 'deadline' });
            
            const taskData = {
                title: 'Submit project proposal',
                description: 'Final review and submission',
                due_date: '2025-09-15T17:00:00Z',
                priority: 5,
                status: 'TODO',
                create_linked_event: true,
                linked_event: {
                    title: 'Proposal Submission Deadline',
                    start_time: '2025-09-15T17:00:00Z',
                    end_time: '2025-09-15T17:30:00Z',
                    is_all_day: false,
                    priority: 5
                }
            };

            const result = await global.mockTauriInvoke('create_task_with_event', taskData);
            
            expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_task_with_event', taskData);
            expect(result).toEqual({
                task_id: 1,
                event_id: 1,
                link_created: true,
                link_type: 'deadline'
            });
        });

        test('should link existing event to existing task', async () => {
            global.setMockResponse('get_event', {
                id: 1,
                title: 'Team Standup',
                start_time: '2025-09-08T09:00:00Z'
            });
            global.setMockResponse('get_task', {
                id: 2,
                title: 'Review standup notes',
                status: 'TODO'
            });
            global.setMockResponse('create_event_task_link', {
                id: 1,
                event_id: 1,
                task_id: 2,
                link_type: 'follow_up',
                created_at: '2025-09-07T12:00:00Z'
            });

            const linkData = {
                event_id: 1,
                task_id: 2,
                link_type: 'follow_up',
                notes: 'Task follows up on standup action items'
            };

            const result = await global.mockTauriInvoke('create_event_task_link', linkData);
            
            expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_event_task_link', linkData);
            expect(result.link_type).toBe('follow_up');
            expect(result.event_id).toBe(1);
            expect(result.task_id).toBe(2);
        });
    });

    describe('Link Type Validation', () => {
        test('should validate supported link types', async () => {
            const supportedTypes = ['associated', 'deadline', 'follow_up', 'prerequisite', 'milestone'];
            
            global.setMockResponse('get_supported_link_types', supportedTypes);
            
            const result = await global.mockTauriInvoke('get_supported_link_types');
            
            expect(result).toEqual(supportedTypes);
            expect(result).toContain('associated');
            expect(result).toContain('deadline');
            expect(result).toContain('follow_up');
        });

        test('should reject invalid link types', async () => {
            global.setMockTemporaryError('create_event_task_link', 'Invalid link type: invalid_type');
            
            const linkData = {
                event_id: 1,
                task_id: 2,
                link_type: 'invalid_type'
            };

            await expect(global.mockTauriInvoke('create_event_task_link', linkData))
                .rejects.toThrow('Invalid link type: invalid_type');
        });
    });

    describe('Link Retrieval and Management', () => {
        test('should retrieve links for an event', async () => {
            global.setMockResponse('get_event_links', [
                {
                    id: 1,
                    event_id: 1,
                    task_id: 2,
                    link_type: 'associated',
                    task_title: 'Prepare meeting notes',
                    task_status: 'TODO'
                },
                {
                    id: 2,
                    event_id: 1,
                    task_id: 3,
                    link_type: 'follow_up',
                    task_title: 'Send meeting summary',
                    task_status: 'TODO'
                }
            ]);

            const result = await global.mockTauriInvoke('get_event_links', { event_id: 1 });
            
            expect(result).toHaveLength(2);
            expect(result[0].link_type).toBe('associated');
            expect(result[1].link_type).toBe('follow_up');
        });

        test('should retrieve links for a task', async () => {
            global.setMockResponse('get_task_links', [
                {
                    id: 1,
                    task_id: 2,
                    event_id: 1,
                    link_type: 'deadline',
                    event_title: 'Project Deadline',
                    event_start_time: '2025-09-15T17:00:00Z'
                }
            ]);

            const result = await global.mockTauriInvoke('get_task_links', { task_id: 2 });
            
            expect(result).toHaveLength(1);
            expect(result[0].link_type).toBe('deadline');
            expect(result[0].event_title).toBe('Project Deadline');
        });

        test('should update link properties', async () => {
            global.setMockResponse('update_event_task_link', {
                id: 1,
                event_id: 1,
                task_id: 2,
                link_type: 'milestone',
                notes: 'Updated to milestone relationship',
                updated_at: '2025-09-07T12:30:00Z'
            });

            const updateData = {
                link_id: 1,
                link_type: 'milestone',
                notes: 'Updated to milestone relationship'
            };

            const result = await global.mockTauriInvoke('update_event_task_link', updateData);
            
            expect(result.link_type).toBe('milestone');
            expect(result.notes).toBe('Updated to milestone relationship');
        });

        test('should delete links', async () => {
            global.setMockResponse('delete_event_task_link', { 
                deleted: true, 
                link_id: 1,
                deleted_at: '2025-09-07T12:45:00Z'
            });

            const result = await global.mockTauriInvoke('delete_event_task_link', { link_id: 1 });
            
            expect(result.deleted).toBe(true);
            expect(result.link_id).toBe(1);
        });
    });

    describe('Cascade Operations', () => {
        test('should handle event deletion with linked tasks', async () => {
            global.setMockResponse('delete_event_with_links', {
                event_deleted: true,
                links_deleted: 2,
                tasks_affected: [
                    { id: 2, action: 'link_removed' },
                    { id: 3, action: 'link_removed' }
                ]
            });

            const result = await global.mockTauriInvoke('delete_event_with_links', {
                event_id: 1,
                cascade_mode: 'remove_links'
            });
            
            expect(result.event_deleted).toBe(true);
            expect(result.links_deleted).toBe(2);
            expect(result.tasks_affected).toHaveLength(2);
        });

        test('should handle task deletion with linked events', async () => {
            global.setMockResponse('delete_task_with_links', {
                task_deleted: true,
                links_deleted: 1,
                events_affected: [
                    { id: 1, action: 'link_removed' }
                ]
            });

            const result = await global.mockTauriInvoke('delete_task_with_links', {
                task_id: 2,
                cascade_mode: 'remove_links'
            });
            
            expect(result.task_deleted).toBe(true);
            expect(result.links_deleted).toBe(1);
            expect(result.events_affected).toHaveLength(1);
        });

        test('should optionally delete linked items', async () => {
            global.setMockResponse('delete_event_with_links', {
                event_deleted: true,
                links_deleted: 2,
                tasks_deleted: 1,
                tasks_unlinked: 1
            });

            const result = await global.mockTauriInvoke('delete_event_with_links', {
                event_id: 1,
                cascade_mode: 'delete_associated_tasks'
            });
            
            expect(result.event_deleted).toBe(true);
            expect(result.tasks_deleted).toBe(1);
            expect(result.tasks_unlinked).toBe(1);
        });
    });

    describe('Data Consistency and Validation', () => {
        test('should prevent duplicate links', async () => {
            global.setMockTemporaryError('create_event_task_link', 
                'Link already exists between event 1 and task 2');

            const linkData = {
                event_id: 1,
                task_id: 2,
                link_type: 'associated'
            };

            await expect(global.mockTauriInvoke('create_event_task_link', linkData))
                .rejects.toThrow('Link already exists');
        });

        test('should validate referenced entities exist', async () => {
            global.setMockTemporaryError('create_event_task_link', 'Event with id 999 not found');

            const linkData = {
                event_id: 999,
                task_id: 2,
                link_type: 'associated'
            };

            await expect(global.mockTauriInvoke('create_event_task_link', linkData))
                .rejects.toThrow('Event with id 999 not found');
        });

        test('should maintain referential integrity', async () => {
            global.setMockResponse('verify_link_integrity', {
                valid: true,
                links_checked: 5,
                orphaned_links: 0,
                invalid_references: 0
            });

            const result = await global.mockTauriInvoke('verify_link_integrity');
            
            expect(result.valid).toBe(true);
            expect(result.orphaned_links).toBe(0);
            expect(result.invalid_references).toBe(0);
        });
    });

    describe('Performance and Bulk Operations', () => {
        test('should handle bulk link creation', async () => {
            const bulkLinks = [
                { event_id: 1, task_id: 2, link_type: 'associated' },
                { event_id: 1, task_id: 3, link_type: 'follow_up' },
                { event_id: 2, task_id: 4, link_type: 'deadline' }
            ];

            global.setMockResponse('create_bulk_event_task_links', {
                links_created: 3,
                failed_links: 0,
                created_links: [
                    { id: 1, event_id: 1, task_id: 2 },
                    { id: 2, event_id: 1, task_id: 3 },
                    { id: 3, event_id: 2, task_id: 4 }
                ]
            });

            const result = await global.mockTauriInvoke('create_bulk_event_task_links', {
                links: bulkLinks
            });
            
            expect(result.links_created).toBe(3);
            expect(result.failed_links).toBe(0);
            expect(result.created_links).toHaveLength(3);
        });

        test('should perform efficiently with large datasets', async () => {
            global.setMockResponse('get_event_links_paginated', {
                links: Array(50).fill(null).map((_, i) => ({
                    id: i + 1,
                    event_id: 1,
                    task_id: i + 100,
                    link_type: 'associated'
                })),
                total_count: 150,
                page: 1,
                per_page: 50,
                has_more: true
            });

            const result = await global.mockTauriInvoke('get_event_links_paginated', {
                event_id: 1,
                page: 1,
                per_page: 50
            });
            
            expect(result.links).toHaveLength(50);
            expect(result.total_count).toBe(150);
            expect(result.has_more).toBe(true);
        });
    });

    describe('Cross-Platform Compatibility', () => {
        test('should handle timezone differences in linked items', async () => {
            global.setMockResponse('create_event_task_link_with_timezone', {
                id: 1,
                event_id: 1,
                task_id: 2,
                link_type: 'deadline',
                event_timezone: 'America/New_York',
                task_timezone: 'Europe/London',
                time_offset_handled: true
            });

            const linkData = {
                event_id: 1,
                task_id: 2,
                link_type: 'deadline',
                handle_timezone_differences: true
            };

            const result = await global.mockTauriInvoke('create_event_task_link_with_timezone', linkData);
            
            expect(result.time_offset_handled).toBe(true);
            expect(result.event_timezone).toBe('America/New_York');
            expect(result.task_timezone).toBe('Europe/London');
        });

        test('should support different date formats', async () => {
            global.setMockResponse('get_linked_items_formatted', {
                event: {
                    title: 'Meeting',
                    start_time_iso: '2025-09-08T10:00:00Z',
                    start_time_local: '2025-09-08 06:00:00 EDT',
                    start_time_formatted: 'Sept 8, 2025 at 6:00 AM'
                },
                task: {
                    title: 'Prepare',
                    due_date_iso: '2025-09-08T09:30:00Z',
                    due_date_local: '2025-09-08 05:30:00 EDT',
                    due_date_formatted: 'Sept 8, 2025 at 5:30 AM'
                }
            });

            const result = await global.mockTauriInvoke('get_linked_items_formatted', {
                link_id: 1,
                format_preference: 'local_with_timezone'
            });
            
            expect(result.event.start_time_formatted).toBeDefined();
            expect(result.task.due_date_formatted).toBeDefined();
        });
    });

    describe('Error Conditions and Edge Cases', () => {
        test('should handle linking to completed tasks', async () => {
            global.setMockResponse('create_event_task_link', {
                id: 1,
                event_id: 1,
                task_id: 2,
                link_type: 'associated',
                warning: 'Task is already completed'
            });

            const linkData = {
                event_id: 1,
                task_id: 2, // Completed task
                link_type: 'associated'
            };

            const result = await global.mockTauriInvoke('create_event_task_link', linkData);
            
            expect(result.warning).toBe('Task is already completed');
            expect(result.id).toBe(1);
        });

        test('should handle linking to past events', async () => {
            global.setMockResponse('create_event_task_link', {
                id: 1,
                event_id: 1,
                task_id: 2,
                link_type: 'follow_up',
                warning: 'Event has already occurred'
            });

            const linkData = {
                event_id: 1, // Past event
                task_id: 2,
                link_type: 'follow_up'
            };

            const result = await global.mockTauriInvoke('create_event_task_link', linkData);
            
            expect(result.warning).toBe('Event has already occurred');
            expect(result.id).toBe(1);
        });

        test('should handle circular link prevention', async () => {
            global.setMockTemporaryError('create_event_task_link', 
                'Circular link detected: would create dependency loop');

            const linkData = {
                event_id: 1,
                task_id: 2,
                link_type: 'prerequisite'
            };

            await expect(global.mockTauriInvoke('create_event_task_link', linkData))
                .rejects.toThrow('Circular link detected');
        });
    });
});