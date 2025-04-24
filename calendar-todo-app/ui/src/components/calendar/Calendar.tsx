import * as React from 'react';
const { useState, useEffect } = React;
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { Event, eventService } from '../../services/eventService';
import { EventForm } from './EventForm';
import { eventExceptionService } from '@/services/eventExceptionService';
import { recurringService, RecurringRule } from '@/services/recurringService';
import { ExceptionForm } from './ExceptionForm';

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Extended type for events with recurring properties
interface ExtendedEvent extends Event {
  recurring_rule_id?: number;
  recurring_rule?: RecurringRule;
}

interface CalendarProps {
  events?: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    color?: string;
    location?: string;
  }>;
  onEventClick?: (event: EventClickArg) => void;
  onDateSelect?: (start: Date, end: Date, allDay: boolean) => void;
}

// Using simple function declaration with proper return type
export const Calendar = (props: CalendarProps): JSX.Element => {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date, end: Date, allDay: boolean } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);
  const loadEvents = async () => {
    try {
      // Load events for the next 3 months by default
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        // First, load regular events
      const loadedEvents = await eventService.getEventsInRange(start, end) as ExtendedEvent[];
      
      // Then, for each recurring event, load its occurrences
      const allEvents = [...loadedEvents];
      for (const event of loadedEvents) {
        if (event.recurring_rule_id) {
          const recurringInstances = await recurringService.expandRecurringEvents(
            event.id!,
            start,
            end
          );
          allEvents.push(...recurringInstances);
        }
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === parseInt(clickInfo.event.id));
    if (event) {
      if (event.recurring_rule_id) {
        // For recurring events, show the exception form
        setSelectedEvent(event);
        setSelectedDate(clickInfo.event.startStr);
        setShowExceptionForm(true);
      } else {
        // For regular events, show the normal edit form
        setSelectedEvent(event);
        setIsNewEvent(false);
        setShowEventForm(true);
      }
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setIsNewEvent(true);
    setShowEventForm(true);
  };

  const handleEventSubmit = async (eventData: Event) => {
    try {
      if (isNewEvent) {
        await eventService.createEvent(eventData);
      } else {
        await eventService.updateEvent(eventData);
      }
      await loadEvents();
      setShowEventForm(false);
      setSelectedEvent(null);
      setSelectedDates(null);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleEventDelete = async (id: number) => {
    try {
      await eventService.deleteEvent(id);
      await loadEvents();
      setShowEventForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events.map(event => ({
          id: event.id?.toString(),
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          allDay: event.is_all_day,
          extendedProps: {
            description: event.description,
            location: event.location,
            priority: event.priority
          }
        }))}
        eventClick={handleEventClick}
        select={handleDateSelect}
        height="auto"
      />      {showEventForm && (
        <div className="event-form-modal">
          <EventForm
            event={isNewEvent ? {
              title: '',
              start_time: selectedDates?.start.toISOString() || new Date().toISOString(),
              end_time: selectedDates?.end.toISOString() || new Date().toISOString(),
              is_all_day: selectedDates?.allDay || false,
              priority: 3
            } : selectedEvent || undefined}
            onSubmit={handleEventSubmit}
            onCancel={() => {
              setShowEventForm(false);
              setSelectedEvent(null);
              setSelectedDates(null);
            }}
          />
        </div>
      )}

      {showExceptionForm && selectedEvent && selectedDate && (
        <div className="event-form-modal">
          <ExceptionForm
            event={selectedEvent}
            date={selectedDate}
            onSubmit={async (exception) => {
              try {
                await eventExceptionService.createException(exception);
                await loadEvents(); // Reload events to show the exception
                setShowExceptionForm(false);
                setSelectedEvent(null);
                setSelectedDate(null);
              } catch (error) {
                console.error('Failed to create event exception:', error);
              }
            }}
            onCancel={() => {
              setShowExceptionForm(false);
              setSelectedEvent(null);
              setSelectedDate(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Calendar;
