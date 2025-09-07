import React, { useEffect, useState } from 'react';
import { Reminder, reminderService } from '../../services/reminderService';
import './Reminders.css';

interface ReminderManagerProps {
  itemType?: 'EVENT' | 'TASK';
  itemId?: number;
  defaultReminder?: boolean;
  onClose?: () => void;
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({
  itemType,
  itemId,
  defaultReminder = false,
  onClose,
}) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (itemType && itemId) {
      loadReminder();
    }
    const interval = setInterval(checkPendingReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [itemType, itemId]);

  const loadReminder = async () => {
    if (itemType && itemId) {
      try {
        const existingReminder = await reminderService.getReminder(itemType, itemId);
        if (existingReminder || !defaultReminder) {
          setReminder(existingReminder);
        } else {
          // Create default reminder if requested and none exists
          const defaultTime = new Date();
          defaultTime.setMinutes(defaultTime.getMinutes() + 15);
          const newReminder: Reminder = {
            item_type: itemType,
            item_id: itemId,
            trigger_time: defaultTime.toISOString(),
            offset_description: '15 minutes before',
            is_dismissed: false,
          };
          await reminderService.createReminder(newReminder);
          setReminder(newReminder);
        }
      } catch (error) {
        console.error('Failed to load reminder:', error);
      }
    }
  };

  const checkPendingReminders = async () => {
    try {
      const reminders = await reminderService.getPendingReminders();
      if (reminders.length > 0) {
        setPendingReminders(reminders);
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Failed to check reminders:', error);
    }
  };

  const handleSaveReminder = async (e: any) => {
    e.preventDefault();
    if (!reminder || !itemType || !itemId) return;

    try {
      if (reminder.id) {
        await reminderService.updateReminder(reminder);
      } else {
        await reminderService.createReminder(reminder);
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save reminder:', error);
    }
  };

  const handleDeleteReminder = async () => {
    if (!itemType || !itemId) return;

    try {
      await reminderService.deleteReminder(itemType, itemId);
      setReminder(null);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const handleDismissReminder = async (reminderId: number) => {
    const reminderToDismiss = pendingReminders.find(r => r.id === reminderId);
    if (!reminderToDismiss) return;

    try {
      await reminderService.updateReminder({
        ...reminderToDismiss,
        is_dismissed: true
      });
      setPendingReminders(pendingReminders.filter(r => r.id !== reminderId));
      if (pendingReminders.length <= 1) {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const handleOffsetChange = (e: any) => {
    if (!reminder) return;
    const minutes = parseInt(e.target.value);
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    setReminder({
      ...reminder,
      trigger_time: now.toISOString(),
      offset_description: `${minutes} minutes before`
    });
  };

  return (
    <div className="reminder-manager">
      {itemType && itemId ? (
        <form onSubmit={handleSaveReminder} className="reminder-form">
          <h3>Reminder Settings</h3>
          <div className="form-group">
            <label htmlFor="offset-select">
              Remind me:
              <select
                id="offset-select"
                value={reminder?.offset_description || '15 minutes before'}
                onChange={handleOffsetChange}
              >
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Save</button>
            {reminder?.id && (
              <button type="button" onClick={handleDeleteReminder}>
                Delete Reminder
              </button>
            )}
          </div>
        </form>
      ) : null}

      {showNotification && (
        <div className="reminder-notifications">
          <h3>Reminders</h3>
          <div className="reminder-list">
            {pendingReminders.map((r) => (
              <div key={r.id} className="reminder-item">
                <div className="reminder-content">
                  <span>{r.item_type === 'EVENT' ? 'Event' : 'Task'}</span>
                  <span>{r.offset_description}</span>
                </div>
                <button onClick={() => r.id && handleDismissReminder(r.id)}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
