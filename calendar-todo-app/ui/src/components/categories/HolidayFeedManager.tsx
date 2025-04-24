import React, { useState, useEffect } from 'react';
import { HolidayFeed, holidayFeedService } from '../../services/holidayFeedService';
import './Categories.css'; // We'll reuse some of the category styles

interface HolidayFeedFormProps {
  feed?: HolidayFeed;
  onSubmit: (feed: HolidayFeed) => Promise<void>;
  onCancel: () => void;
}

const HolidayFeedForm: React.FC<HolidayFeedFormProps> = ({ feed, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<HolidayFeed>({
    name: feed?.name || '',
    url: feed?.url || '',
    is_visible: feed?.is_visible ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <div className="form-group">
        <label htmlFor="name">Feed Name *</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="url">ICS Feed URL *</label>
        <input
          type="url"
          id="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          placeholder="https://example.com/holidays.ics"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_visible}
            onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
          />
          Show in calendar
        </label>
      </div>

      <div className="form-actions">
        <button type="submit">{feed ? 'Update' : 'Add'} Feed</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export const HolidayFeedManager: React.FC = () => {
  const [feeds, setFeeds] = useState<HolidayFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<HolidayFeed | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const loadedFeeds = await holidayFeedService.getHolidayFeeds();
      setFeeds(loadedFeeds);
    } catch (error) {
      console.error('Failed to load holiday feeds:', error);
    }
  };

  const handleCreateFeed = async (feed: HolidayFeed) => {
    try {
      const feedId = await holidayFeedService.createHolidayFeed(feed);
      await handleSyncFeed(feedId);
      await loadFeeds();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create holiday feed:', error);
    }
  };

  const handleUpdateFeed = async (feed: HolidayFeed) => {
    try {
      await holidayFeedService.updateHolidayFeed(feed);
      if (feed.id) {
        await handleSyncFeed(feed.id);
      }
      await loadFeeds();
      setSelectedFeed(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update holiday feed:', error);
    }
  };

  const handleDeleteFeed = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this holiday feed?')) {
      try {
        await holidayFeedService.deleteHolidayFeed(id);
        await loadFeeds();
      } catch (error) {
        console.error('Failed to delete holiday feed:', error);
      }
    }
  };

  const handleSyncFeed = async (id: number) => {
    try {
      setSyncStatus({ ...syncStatus, [id]: true });
      await holidayFeedService.syncHolidayFeed(id);
      await loadFeeds();
    } catch (error) {
      console.error('Failed to sync holiday feed:', error);
    } finally {
      setSyncStatus({ ...syncStatus, [id]: false });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="category-manager">
      <div className="category-header">
        <h2>Holiday Calendars</h2>
        <div className="category-actions">
          <button onClick={() => setShowForm(true)}>Add Holiday Calendar</button>
        </div>
      </div>

      {showForm && (
        <div className="modal">
          <HolidayFeedForm
            feed={selectedFeed || undefined}
            onSubmit={selectedFeed ? handleUpdateFeed : handleCreateFeed}
            onCancel={() => {
              setShowForm(false);
              setSelectedFeed(null);
            }}
          />
        </div>
      )}

      <div className="categories-list">
        {feeds.map((feed) => (
          <div key={feed.id} className="category-item">
            <div className="feed-info">
              <div className="feed-header">
                <span className="feed-name">{feed.name}</span>
                <span className="feed-visibility">
                  {feed.is_visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="feed-url">{feed.url}</div>
              <div className="feed-sync-status">
                Last synced: {formatDate(feed.last_sync_time)}
                {feed.sync_error && (
                  <span className="feed-error">{feed.sync_error}</span>
                )}
              </div>
            </div>
            <div className="category-item-actions">
              <button
                onClick={() => feed.id && handleSyncFeed(feed.id)}
                disabled={syncStatus[feed.id || 0]}
              >
                {syncStatus[feed.id || 0] ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => {
                  setSelectedFeed(feed);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
              <button onClick={() => feed.id && handleDeleteFeed(feed.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
