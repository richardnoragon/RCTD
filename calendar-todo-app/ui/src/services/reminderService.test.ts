import { Reminder, reminderService } from './reminderService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Reminder Service', () => {
  beforeEach(() => {
    (globalThis as any).resetMocks();
  });

  describe('createReminder', () => {
    it('should create a new reminder for an event successfully', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      const mockReminderId = 1;
      (globalThis as any).setMockResponse('create_reminder', mockReminderId);

      const result = await reminderService.createReminder(mockReminder);

      expect(result).toBe(mockReminderId);
    });

    it('should create a new reminder for a task successfully', async () => {
      const mockReminder: Reminder = {
        item_type: 'TASK',
        item_id: 2,
        trigger_time: '2023-01-16 09:00:00',
        offset_description: 'At due time',
        is_dismissed: false
      };

      const mockReminderId = 2;
      (globalThis as any).setMockResponse('create_reminder', mockReminderId);

      const result = await reminderService.createReminder(mockReminder);

      expect(result).toBe(mockReminderId);
    });

    it('should create reminder with custom offset description', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 3,
        trigger_time: '2023-01-17 07:30:00',
        offset_description: '1 hour 30 minutes before',
        is_dismissed: false
      };

      const mockReminderId = 3;
      (globalThis as any).setMockResponse('create_reminder', mockReminderId);

      const result = await reminderService.createReminder(mockReminder);

      expect(result).toBe(mockReminderId);
    });

    it('should handle error when creating reminder fails', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Database error');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Database error');
    });

    it('should handle invalid item type error', async () => {
      const mockReminder: Reminder = {
        item_type: 'INVALID' as any,
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Invalid item type');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Invalid item type');
    });

    it('should handle foreign key constraint error', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 999,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Referenced item does not exist');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Referenced item does not exist');
    });

    it('should handle invalid trigger time format', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: 'invalid-datetime',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Invalid datetime format');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Invalid datetime format');
    });

    it('should handle duplicate reminder error', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Reminder already exists for this item');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Reminder already exists for this item');
    });
  });

  describe('getReminder', () => {
    it('should retrieve reminder for event successfully', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false,
        created_at: '2023-01-14 10:00:00'
      };

      (globalThis as any).setMockResponse('get_reminder', mockReminder);

      const result = await reminderService.getReminder('EVENT', 1);

      expect(result).toEqual(mockReminder);
      expect(result?.item_type).toBe('EVENT');
      expect(result?.item_id).toBe(1);
    });

    it('should retrieve reminder for task successfully', async () => {
      const mockReminder: Reminder = {
        id: 2,
        item_type: 'TASK',
        item_id: 2,
        trigger_time: '2023-01-16 09:00:00',
        offset_description: 'At due time',
        is_dismissed: true,
        created_at: '2023-01-15 12:00:00'
      };

      (globalThis as any).setMockResponse('get_reminder', mockReminder);

      const result = await reminderService.getReminder('TASK', 2);

      expect(result).toEqual(mockReminder);
      expect(result?.is_dismissed).toBe(true);
    });

    it('should return null when reminder not found', async () => {
      (globalThis as any).setMockResponse('get_reminder', null);

      const result = await reminderService.getReminder('EVENT', 999);

      expect(result).toBeNull();
    });

    it('should handle database connection error', async () => {
      (globalThis as any).setMockError('get_reminder', 'Database connection error');

      await expect(reminderService.getReminder('EVENT', 1))
        .rejects
        .toThrow('Database connection error');
    });

    it('should handle invalid item type during retrieval', async () => {
      (globalThis as any).setMockError('get_reminder', 'Invalid item type');

      await expect(reminderService.getReminder('INVALID' as any, 1))
        .rejects
        .toThrow('Invalid item type');
    });

    it('should handle invalid item ID during retrieval', async () => {
      (globalThis as any).setMockError('get_reminder', 'Invalid item ID');

      await expect(reminderService.getReminder('EVENT', -1))
        .rejects
        .toThrow('Invalid item ID');
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:30:00',
        offset_description: '30 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockResponse('update_reminder', undefined);

      await expect(reminderService.updateReminder(mockReminder))
        .resolves
        .toBeNull();
    });

    it('should update reminder to dismissed status', async () => {
      const mockReminder: Reminder = {
        id: 2,
        item_type: 'TASK',
        item_id: 2,
        trigger_time: '2023-01-16 09:00:00',
        offset_description: 'At due time',
        is_dismissed: true
      };

      (globalThis as any).setMockResponse('update_reminder', undefined);

      await expect(reminderService.updateReminder(mockReminder))
        .resolves
        .toBeNull();
    });

    it('should handle reminder not found error', async () => {
      const mockReminder: Reminder = {
        id: 999,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:30:00',
        offset_description: '30 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('update_reminder', 'Reminder not found');

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Reminder not found');
    });

    it('should handle invalid trigger time during update', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: 'invalid-datetime',
        offset_description: '30 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('update_reminder', 'Invalid datetime format');

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Invalid datetime format');
    });

    it('should handle concurrent modification error', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:30:00',
        offset_description: '30 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('update_reminder', 'Reminder was modified by another process');

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Reminder was modified by another process');
    });

    it('should handle past trigger time validation error', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2020-01-15 08:30:00',
        offset_description: '30 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('update_reminder', 'Trigger time cannot be in the past');

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Trigger time cannot be in the past');
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder for event successfully', async () => {
      (globalThis as any).setMockResponse('delete_reminder', undefined);

      await expect(reminderService.deleteReminder('EVENT', 1))
        .resolves
        .toBeNull();
    });

    it('should delete reminder for task successfully', async () => {
      (globalThis as any).setMockResponse('delete_reminder', undefined);

      await expect(reminderService.deleteReminder('TASK', 2))
        .resolves
        .toBeNull();
    });

    it('should handle reminder not found during deletion', async () => {
      (globalThis as any).setMockError('delete_reminder', 'Reminder not found');

      await expect(reminderService.deleteReminder('EVENT', 999))
        .rejects
        .toThrow('Reminder not found');
    });

    it('should handle invalid item type during deletion', async () => {
      (globalThis as any).setMockError('delete_reminder', 'Invalid item type');

      await expect(reminderService.deleteReminder('INVALID' as any, 1))
        .rejects
        .toThrow('Invalid item type');
    });

    it('should handle invalid item ID during deletion', async () => {
      (globalThis as any).setMockError('delete_reminder', 'Invalid item ID');

      await expect(reminderService.deleteReminder('EVENT', -1))
        .rejects
        .toThrow('Invalid item ID');
    });

    it('should handle database lock error during deletion', async () => {
      (globalThis as any).setMockError('delete_reminder', 'Database is locked');

      await expect(reminderService.deleteReminder('EVENT', 1))
        .rejects
        .toThrow('Database is locked');
    });
  });

  describe('getPendingReminders', () => {
    it('should retrieve pending reminders successfully', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 1,
          item_type: 'EVENT',
          item_id: 1,
          trigger_time: '2023-01-15 08:45:00',
          offset_description: '15 minutes before',
          is_dismissed: false,
          created_at: '2023-01-14 10:00:00'
        },
        {
          id: 2,
          item_type: 'TASK',
          item_id: 2,
          trigger_time: '2023-01-15 09:00:00',
          offset_description: 'At due time',
          is_dismissed: false,
          created_at: '2023-01-14 11:00:00'
        }
      ];

      (globalThis as any).setMockResponse('get_pending_reminders', mockReminders);

      const result = await reminderService.getPendingReminders();

      expect(result).toEqual(mockReminders);
      expect(result).toHaveLength(2);
      expect(result[0].is_dismissed).toBe(false);
      expect(result[1].is_dismissed).toBe(false);
    });

    it('should return empty array when no pending reminders exist', async () => {
      (globalThis as any).setMockResponse('get_pending_reminders', []);

      const result = await reminderService.getPendingReminders();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle large number of pending reminders efficiently', async () => {
      const largeReminderSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        item_type: i % 2 === 0 ? 'EVENT' : 'TASK' as 'EVENT' | 'TASK',
        item_id: i + 1,
        trigger_time: `2023-01-15 ${String(8 + Math.floor(i / 10)).padStart(2, '0')}:${String((i % 10) * 6).padStart(2, '0')}:00`,
        offset_description: '15 minutes before',
        is_dismissed: false,
        created_at: '2023-01-14 10:00:00'
      }));

      (globalThis as any).setMockResponse('get_pending_reminders', largeReminderSet);

      const result = await reminderService.getPendingReminders();

      expect(result).toHaveLength(100);
      expect(result[0].item_type).toBe('EVENT');
      expect(result[1].item_type).toBe('TASK');
    });

    it('should handle database error when fetching pending reminders', async () => {
      (globalThis as any).setMockError('get_pending_reminders', 'Database query failed');

      await expect(reminderService.getPendingReminders())
        .rejects
        .toThrow('Database query failed');
    });

    it('should handle timeout error when fetching pending reminders', async () => {
      (globalThis as any).setMockError('get_pending_reminders', 'Query timeout');

      await expect(reminderService.getPendingReminders())
        .rejects
        .toThrow('Query timeout');
    });

    it('should handle memory exhaustion with large dataset', async () => {
      (globalThis as any).setMockError('get_pending_reminders', 'Out of memory');

      await expect(reminderService.getPendingReminders())
        .rejects
        .toThrow('Out of memory');
    });
  });

  describe('Notification Management Workflows', () => {
    it('should handle notification scheduling validation', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Notification scheduling conflict');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Notification scheduling conflict');
    });

    it('should handle delivery confirmation timeout', async () => {
      (globalThis as any).setMockError('get_pending_reminders', 'Delivery confirmation timeout');

      await expect(reminderService.getPendingReminders())
        .rejects
        .toThrow('Delivery confirmation timeout');
    });

    it('should handle retry logic failure', async () => {
      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('update_reminder', 'Retry limit exceeded');

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Retry limit exceeded');
    });

    it('should handle user preference validation error', async () => {
      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 02:00:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      (globalThis as any).setMockError('create_reminder', 'Reminder time violates user preferences');

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Reminder time violates user preferences');
    });

    it('should handle notification queue overflow', async () => {
      (globalThis as any).setMockError('create_reminder', 'Notification queue is full');

      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Notification queue is full');
    });

    it('should handle permission denied for notification access', async () => {
      (globalThis as any).setMockError('create_reminder', 'Permission denied for notifications');

      const mockReminder: Reminder = {
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: false
      };

      await expect(reminderService.createReminder(mockReminder))
        .rejects
        .toThrow('Permission denied for notifications');
    });

    it('should handle system time synchronization error', async () => {
      (globalThis as any).setMockError('get_pending_reminders', 'System time not synchronized');

      await expect(reminderService.getPendingReminders())
        .rejects
        .toThrow('System time not synchronized');
    });

    it('should handle notification service unavailable', async () => {
      (globalThis as any).setMockError('update_reminder', 'Notification service temporarily unavailable');

      const mockReminder: Reminder = {
        id: 1,
        item_type: 'EVENT',
        item_id: 1,
        trigger_time: '2023-01-15 08:45:00',
        offset_description: '15 minutes before',
        is_dismissed: true
      };

      await expect(reminderService.updateReminder(mockReminder))
        .rejects
        .toThrow('Notification service temporarily unavailable');
    });
  });
});