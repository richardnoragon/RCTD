import React, { ReactElement } from 'react';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { useCalendar } from './CalendarContext';

interface CalendarControlsProps {
  onNavigate?: (direction: 'prev' | 'next' | 'today') => void;
}

export const CalendarControls = ({ onNavigate }: CalendarControlsProps): JSX.Element => {
  const { currentView, currentDate, setView, setDate } = useCalendar();

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;
    
    switch (direction) {
      case 'prev':
        switch (currentView) {
          case 'dayGridMonth':
            newDate = addMonths(currentDate, -1);
            break;
          case 'timeGridWeek':
            newDate = addWeeks(currentDate, -1);
            break;
          case 'timeGridDay':
          case 'listWeek':
            newDate = addDays(currentDate, -1);
            break;
        }
        break;
      case 'next':
        switch (currentView) {
          case 'dayGridMonth':
            newDate = addMonths(currentDate, 1);
            break;
          case 'timeGridWeek':
            newDate = addWeeks(currentDate, 1);
            break;
          case 'timeGridDay':
          case 'listWeek':
            newDate = addDays(currentDate, 1);
            break;
        }
        break;
      case 'today':
        newDate = new Date();
        break;
    }

    setDate(newDate);
    onNavigate?.(direction);
  };

  const viewButtons = [
    { label: 'Month', view: 'dayGridMonth' },
    { label: 'Week', view: 'timeGridWeek' },
    { label: 'Day', view: 'timeGridDay' },
    { label: 'Agenda', view: 'listWeek' },
  ] as const;

  return (
    <div className="calendar-controls">
      <div className="navigation-controls">
        <button onClick={() => navigate('prev')}>Previous</button>
        <button onClick={() => navigate('today')}>Today</button>
        <button onClick={() => navigate('next')}>Next</button>
      </div>
      <div className="current-date">
        {format(currentDate, currentView === 'dayGridMonth' ? 'MMMM yyyy' : 'MMM d, yyyy')}
      </div>
      <div className="view-controls">
        {viewButtons.map(({ label, view }) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={currentView === view ? 'active' : ''}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
