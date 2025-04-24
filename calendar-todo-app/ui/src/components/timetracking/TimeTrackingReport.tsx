import React, { useState, useEffect, useCallback } from 'react';
import { TimeEntry, timeTrackingService } from '../../services/timeTrackingService';
import './TimeTracking.css';

interface TimeTrackingReportProps {
  itemType?: 'EVENT' | 'TASK' | 'CATEGORY' | 'MANUAL';
  itemId?: number;
  startDate?: string;
  endDate?: string;
}

export const TimeTrackingReport: React.FC<TimeTrackingReportProps> = ({
  itemType,
  itemId,
  startDate,
  endDate,
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalDuration, setTotalDuration] = useState<number>(0);  const [groupedDurations, setGroupedDurations] = useState<{[key: string]: number}>({});
    const loadTimeEntries = useCallback(async () => {
    try {
      const timeEntries = await timeTrackingService.getTimeEntries({
        item_type: itemType,
        item_id: itemId,
        start_date: startDate,
        end_date: endDate,
      });
      setEntries(timeEntries);
      calculateDurations(timeEntries);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    }
  }, [itemType, itemId, startDate, endDate]);

  useEffect(() => {
    loadTimeEntries();
  }, [loadTimeEntries]);

  const calculateDurations = (timeEntries: TimeEntry[]) => {
    let total = 0;
    const grouped: {[key: string]: number} = {};

    timeEntries.forEach(entry => {
      const duration = entry.duration_seconds || 0;
      total += duration;

      // Group by type
      grouped[entry.timer_type] = (grouped[entry.timer_type] || 0) + duration;
    });

    setTotalDuration(total);
    setGroupedDurations(grouped);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="time-tracking-report">
      <div className="report-summary">
        <h3>Time Tracking Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <label>Total Time:</label>
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="stat-breakdown">
            {Object.entries(groupedDurations).map(([type, duration]) => (
              <div key={type} className="stat-item">
                <label>{type}:</label>
                <span>{formatDuration(duration)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="entries-list">
        <h4>Time Entries</h4>
        {entries.map(entry => (
          <div key={entry.id} className="entry-item">
            <div className="entry-header">
              <span className="entry-type">{entry.timer_type}</span>
              <span className="entry-duration">
                {entry.duration_seconds ? formatDuration(entry.duration_seconds) : 'In Progress'}
              </span>
            </div>
            <div className="entry-details">
              <span>{formatDate(entry.start_time)}</span>
              {entry.end_time && (
                <span>to {formatDate(entry.end_time)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
