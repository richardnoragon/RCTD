import React, { useState } from 'react';
import { EventException } from '../../services/eventExceptionService';
import { Event } from '../../services/eventService';

interface ExceptionFormProps {
  event: Event;
  date: string;
  onSubmit: (exception: EventException) => Promise<void>;
  onCancel: () => void;
}

export const ExceptionForm = ({
  event,
  date,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<EventException>({
    event_id: event.id!,
    original_date: date,
    is_cancelled: false,
    modified_title: event.title,
    modified_description: event.description,
    modified_start_time: event.start_time,
    modified_end_time: event.end_time,
    modified_location: event.location,
  });

  const [action, setAction] = useState<'modify' | 'cancel'>('modify');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'cancel') {
      await onSubmit({
        ...formData,
        is_cancelled: true,
      });
    } else {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="exception-form">
      <h3>Modify Event Instance</h3>
      <p>Date: {new Date(date).toLocaleDateString()}</p>

      <div className="form-group">
        <label>
          <input
            type="radio"
            checked={action === 'modify'}
            onChange={() => setAction('modify')}
          />
          Modify this instance
        </label>
        <label>
          <input
            type="radio"
            checked={action === 'cancel'}
            onChange={() => setAction('cancel')}
          />
          Cancel this instance
        </label>
      </div>

      {action === 'modify' && (
        <>
          <div className="form-group">
            <label htmlFor="modified_title">Title</label>
            <input
              type="text"
              id="modified_title"
              value={formData.modified_title || ''}
              onChange={(e) => setFormData({ ...formData, modified_title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modified_description">Description</label>
            <textarea
              id="modified_description"
              value={formData.modified_description || ''}
              onChange={(e) => setFormData({ ...formData, modified_description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modified_start_time">Start Time</label>
            <input
              type="datetime-local"
              id="modified_start_time"
              value={(formData.modified_start_time || '').slice(0, 16)}
              onChange={(e) => setFormData({
                ...formData,
                modified_start_time: new Date(e.target.value).toISOString()
              })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modified_end_time">End Time</label>
            <input
              type="datetime-local"
              id="modified_end_time"
              value={(formData.modified_end_time || '').slice(0, 16)}
              onChange={(e) => setFormData({
                ...formData,
                modified_end_time: new Date(e.target.value).toISOString()
              })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modified_location">Location</label>
            <input
              type="text"
              id="modified_location"
              value={formData.modified_location || ''}
              onChange={(e) => setFormData({ ...formData, modified_location: e.target.value })}
            />
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="submit">
          {action === 'cancel' ? 'Cancel This Instance' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}>
          Close
        </button>
      </div>
    </form>
  );
};
