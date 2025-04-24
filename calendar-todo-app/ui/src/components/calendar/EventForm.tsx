import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Event } from '../../services/eventService';

import { RecurringForm } from './RecurringForm';
import { RecurringRule } from '../../services/recurringService';

interface EventFormProps {
  event?: Event & { recurring_rule?: RecurringRule };
  onSubmit: (event: Event, recurringRule?: RecurringRule) => Promise<void>;
  onCancel: () => void;
}

export const EventForm = ({
  event,
  onSubmit,
  onCancel,
}: EventFormProps): JSX.Element => {
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    is_all_day: false,
    location: '',
    priority: 3,
    ...event,
  });
  
  const [recurringRule, setRecurringRule] = useState<RecurringRule | undefined>(
    event?.recurring_rule
  );
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData, recurringRule);
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_all_day}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_all_day: e.target.checked })}
          />
          All Day Event
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="start_time">Start Time *</label>
        <input
          type="datetime-local"
          id="start_time"
          value={formData.start_time.slice(0, 16)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_time: new Date(e.target.value).toISOString() })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="end_time">End Time *</label>
        <input
          type="datetime-local"
          id="end_time"
          value={formData.end_time.slice(0, 16)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_time: new Date(e.target.value).toISOString() })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          value={formData.location || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
        >
          <option value={1}>Highest</option>
          <option value={2}>High</option>
          <option value={3}>Medium</option>
          <option value={4}>Low</option>
          <option value={5}>Lowest</option>
        </select>
      </div>

      <div className="form-group">
        <RecurringForm
          initialRule={event?.recurring_rule}
          onChange={setRecurringRule}
        />
      </div>

      <div className="form-actions">
        <button type="submit">{event ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
