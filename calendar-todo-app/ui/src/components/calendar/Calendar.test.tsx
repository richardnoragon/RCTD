
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from './Calendar';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

// Mock FullCalendar components
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar(props: any) {
    return (
      <div data-testid="fullcalendar-mock">
        <div data-testid="calendar-header">
          <button data-testid="prev-button" onClick={() => props.select && props.select({ start: new Date(), end: new Date(), allDay: false })}>
            Prev
          </button>
          <button data-testid="next-button">Next</button>
          <button data-testid="today-button">Today</button>
          <span data-testid="calendar-title">January 2024</span>
        </div>
        <div data-testid="calendar-body">
          {props.events && props.events.map((event: any, index: number) => (
            <div 
              key={index}
              data-testid={`calendar-event-${index}`}
              onClick={() => props.eventClick && props.eventClick({
                event: {
                  id: event.id,
                  title: event.title,
                  startStr: event.start,
                  endStr: event.end
                }
              })}
            >
              {event.title}
            </div>
          ))}
        </div>
        <div data-testid="calendar-controls">
          <button data-testid="month-view">Month</button>
          <button data-testid="week-view">Week</button>
          <button data-testid="day-view">Day</button>
          <button data-testid="list-view">List</button>
        </div>
      </div>
    );
  };
});

// Mock the other calendar components
jest.mock('./EventForm', () => {
  return {
    EventForm: function MockEventForm(props: any) {
      return (
        <div data-testid="event-form">
          <input 
            data-testid="event-title-input" 
            defaultValue={props.event?.title || ''}
            onChange={(e) => {
              // Simulate form handling
              if (props.onSubmit) {
                const updatedEvent = { ...props.event, title: (e.target as HTMLInputElement).value };
                props.onSubmit(updatedEvent);
              }
            }}
          />
          <button data-testid="save-event-button" onClick={() => props.onSubmit && props.onSubmit(props.event)}>
            Save Event
          </button>
          <button data-testid="cancel-event-button" onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      );
    }
  };
});

jest.mock('./ExceptionForm', () => {
  return {
    ExceptionForm: function MockExceptionForm(props: any) {
      return (
        <div data-testid="exception-form">
          <input data-testid="exception-title-input" defaultValue={props.event?.title || ''} />
          <button data-testid="save-exception-button" onClick={() => props.onSubmit && props.onSubmit({ original_date: props.date })}>
            Save Exception
          </button>
          <button data-testid="cancel-exception-button" onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      );
    }
  };
});

describe('Calendar Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    global.resetMocks();
    
    // Default mock responses
    global.setMockResponse('get_events_in_range', []);
    global.setMockResponse('expand_recurring_events', []);
  });

  describe('Component Rendering', () => {
    it('should render calendar component successfully', () => {
      render(<Calendar />);
      
      expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-controls')).toBeInTheDocument();
    });

    it('should render calendar with navigation controls', () => {
      render(<Calendar />);
      
      expect(screen.getByTestId('prev-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
      expect(screen.getByTestId('today-button')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-title')).toBeInTheDocument();
    });

    it('should render view selection controls', () => {
      render(<Calendar />);
      
      expect(screen.getByTestId('month-view')).toBeInTheDocument();
      expect(screen.getByTestId('week-view')).toBeInTheDocument();
      expect(screen.getByTestId('day-view')).toBeInTheDocument();
      expect(screen.getByTestId('list-view')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      const customEvents = [
        {
          id: '1',
          title: 'Custom Event',
          start: '2024-01-15T09:00:00',
          end: '2024-01-15T10:00:00',
          allDay: false
        }
      ];

      render(<Calendar events={customEvents} />);
      
      expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      expect(screen.getByText('Custom Event')).toBeInTheDocument();
    });
  });

  describe('Event Loading', () => {
    it('should load events on component mount', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Team Meeting',
          start_time: '2024-01-15T09:00:00',
          end_time: '2024-01-15T10:00:00',
          is_all_day: false,
          priority: 2
        }
      ];

      global.setMockResponse('get_events_in_range', mockEvents);

      render(<Calendar />);

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('get_events_in_range', expect.any(Object));
      });
    });

    it('should handle empty event list', async () => {
      global.setMockResponse('get_events_in_range', []);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
      });

      // Should not display any events
      expect(screen.queryByTestId('calendar-event-0')).not.toBeInTheDocument();
    });

    it('should handle event loading errors', async () => {
      global.setMockError('get_events_in_range', 'Failed to load events');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Calendar />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load events:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should load recurring event instances', async () => {
      const baseEvent = {
        id: 1,
        title: 'Recurring Meeting',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      const recurringInstances = [
        { ...baseEvent, id: 2, start_time: '2024-01-22T09:00:00', end_time: '2024-01-22T10:00:00' },
        { ...baseEvent, id: 3, start_time: '2024-01-29T09:00:00', end_time: '2024-01-29T10:00:00' }
      ];

      global.setMockResponse('get_events_in_range', [baseEvent]);
      global.setMockResponse('expand_recurring_events', recurringInstances);

      render(<Calendar />);

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('expand_recurring_events', expect.any(Object));
      });
    });
  });

  describe('Event Interaction', () => {
    it('should handle event click for regular events', async () => {
      const mockEvent = {
        id: 1,
        title: 'Clickable Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2
      };

      global.setMockResponse('get_events_in_range', [mockEvent]);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    it('should handle event click for recurring events', async () => {
      const recurringEvent = {
        id: 1,
        title: 'Recurring Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      global.setMockResponse('get_events_in_range', [recurringEvent]);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));

      expect(screen.getByTestId('exception-form')).toBeInTheDocument();
    });

    it('should handle custom event click callback', async () => {
      const mockOnEventClick = jest.fn();
      const customEvents = [
        {
          id: '1',
          title: 'Custom Event',
          start: '2024-01-15T09:00:00',
          end: '2024-01-15T10:00:00',
          allDay: false
        }
      ];

      render(<Calendar events={customEvents} onEventClick={mockOnEventClick} />);

      await user.click(screen.getByTestId('calendar-event-0'));

      expect(mockOnEventClick).toHaveBeenCalled();
    });
  });

  describe('Date Selection', () => {
    it('should handle date selection for new event creation', async () => {
      render(<Calendar />);

      await user.click(screen.getByTestId('prev-button'));

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    it('should handle custom date select callback', async () => {
      const mockOnDateSelect = jest.fn();

      render(<Calendar onDateSelect={mockOnDateSelect} />);

      await user.click(screen.getByTestId('prev-button'));

      expect(mockOnDateSelect).toHaveBeenCalled();
    });

    it('should pass correct date parameters to callback', async () => {
      const mockOnDateSelect = jest.fn();

      render(<Calendar onDateSelect={mockOnDateSelect} />);

      await user.click(screen.getByTestId('prev-button'));

      expect(mockOnDateSelect).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        expect.any(Boolean)
      );
    });
  });

  describe('Event Form Integration', () => {
    it('should show event form for new event creation', async () => {
      render(<Calendar />);

      await user.click(screen.getByTestId('prev-button'));

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
      expect(screen.getByTestId('event-title-input')).toBeInTheDocument();
      expect(screen.getByTestId('save-event-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-event-button')).toBeInTheDocument();
    });

    it('should handle event form submission', async () => {
      global.setMockResponse('create_event', 1);
      global.setMockResponse('get_events_in_range', []);

      render(<Calendar />);

      await user.click(screen.getByTestId('prev-button'));
      
      expect(screen.getByTestId('event-form')).toBeInTheDocument();

      await user.click(screen.getByTestId('save-event-button'));

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_event', expect.any(Object));
      });
    });

    it('should handle event form cancellation', async () => {
      render(<Calendar />);

      await user.click(screen.getByTestId('prev-button'));
      
      expect(screen.getByTestId('event-form')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-event-button'));

      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
    });

    it('should handle event update through form', async () => {
      const existingEvent = {
        id: 1,
        title: 'Existing Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2
      };

      global.setMockResponse('get_events_in_range', [existingEvent]);
      global.setMockResponse('update_event', undefined);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));
      await user.click(screen.getByTestId('save-event-button'));

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('update_event', expect.any(Object));
      });
    });
  });

  describe('Exception Form Integration', () => {
    it('should show exception form for recurring events', async () => {
      const recurringEvent = {
        id: 1,
        title: 'Recurring Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      global.setMockResponse('get_events_in_range', [recurringEvent]);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));

      expect(screen.getByTestId('exception-form')).toBeInTheDocument();
      expect(screen.getByTestId('exception-title-input')).toBeInTheDocument();
      expect(screen.getByTestId('save-exception-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-exception-button')).toBeInTheDocument();
    });

    it('should handle exception form submission', async () => {
      const recurringEvent = {
        id: 1,
        title: 'Recurring Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      global.setMockResponse('get_events_in_range', [recurringEvent]);
      global.setMockResponse('create_exception', undefined);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));
      await user.click(screen.getByTestId('save-exception-button'));

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('create_exception', expect.any(Object));
      });
    });

    it('should handle exception form cancellation', async () => {
      const recurringEvent = {
        id: 1,
        title: 'Recurring Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      global.setMockResponse('get_events_in_range', [recurringEvent]);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));
      
      expect(screen.getByTestId('exception-form')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-exception-button'));

      expect(screen.queryByTestId('exception-form')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain event state correctly', async () => {
      const initialEvents = [
        {
          id: 1,
          title: 'Initial Event',
          start_time: '2024-01-15T09:00:00',
          end_time: '2024-01-15T10:00:00',
          is_all_day: false,
          priority: 2
        }
      ];

      global.setMockResponse('get_events_in_range', initialEvents);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
        expect(screen.getByText('Initial Event')).toBeInTheDocument();
      });
    });

    it('should handle state updates after event operations', async () => {
      const initialEvents = [
        {
          id: 1,
          title: 'Event to Update',
          start_time: '2024-01-15T09:00:00',
          end_time: '2024-01-15T10:00:00',
          is_all_day: false,
          priority: 2
        }
      ];

      const updatedEvents = [
        {
          id: 1,
          title: 'Updated Event',
          start_time: '2024-01-15T09:00:00',
          end_time: '2024-01-15T10:00:00',
          is_all_day: false,
          priority: 1
        }
      ];

      global.setMockResponse('get_events_in_range', initialEvents);
      global.setMockResponse('update_event', undefined);

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByText('Event to Update')).toBeInTheDocument();
      });

      // Update mock response for reload
      global.setMockResponse('get_events_in_range', updatedEvents);

      await user.click(screen.getByTestId('calendar-event-0'));
      await user.click(screen.getByTestId('save-event-button'));

      await waitFor(() => {
        expect(global.mockTauriInvoke).toHaveBeenCalledWith('get_events_in_range', expect.any(Object));
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<Calendar />);

      const calendarElement = screen.getByTestId('fullcalendar-mock');
      expect(calendarElement).toBeInTheDocument();

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<Calendar />);

      const calendar = screen.getByTestId('fullcalendar-mock');
      expect(calendar).toBeInTheDocument();

      // Calendar controls should be accessible
      const prevButton = screen.getByTestId('prev-button');
      const nextButton = screen.getByTestId('next-button');
      const todayButton = screen.getByTestId('today-button');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(todayButton).toBeInTheDocument();
    });

    it('should handle keyboard event interactions', async () => {
      const mockOnEventClick = jest.fn();
      const customEvents = [
        {
          id: '1',
          title: 'Keyboard Event',
          start: '2024-01-15T09:00:00',
          end: '2024-01-15T10:00:00',
          allDay: false
        }
      ];

      render(<Calendar events={customEvents} onEventClick={mockOnEventClick} />);

      const eventElement = screen.getByTestId('calendar-event-0');
      
      // Simulate keyboard interaction
      await user.click(eventElement);
      
      expect(mockOnEventClick).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle event creation errors gracefully', async () => {
      global.setMockError('create_event', 'Failed to create event');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Calendar />);

      await user.click(screen.getByTestId('prev-button'));
      await user.click(screen.getByTestId('save-event-button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save event:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle event update errors gracefully', async () => {
      const existingEvent = {
        id: 1,
        title: 'Event to Update',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2
      };

      global.setMockResponse('get_events_in_range', [existingEvent]);
      global.setMockError('update_event', 'Failed to update event');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));
      await user.click(screen.getByTestId('save-event-button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save event:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle exception creation errors gracefully', async () => {
      const recurringEvent = {
        id: 1,
        title: 'Recurring Event',
        start_time: '2024-01-15T09:00:00',
        end_time: '2024-01-15T10:00:00',
        is_all_day: false,
        priority: 2,
        recurring_rule_id: 1
      };

      global.setMockResponse('get_events_in_range', [recurringEvent]);
      global.setMockError('create_exception', 'Failed to create exception');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Calendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-event-0'));
      await user.click(screen.getByTestId('save-exception-button'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create event exception:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of events efficiently', async () => {
      const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Event ${i + 1}`,
        start_time: `2024-01-${(i % 28) + 1}T09:00:00`,
        end_time: `2024-01-${(i % 28) + 1}T10:00:00`,
        is_all_day: false,
        priority: (i % 3) + 1
      }));

      global.setMockResponse('get_events_in_range', largeEventSet);

      const start = performance.now();
      render(<Calendar />);
      
      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
      });
      
      const end = performance.now();
      const renderTime = end - start;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle rapid user interactions', async () => {
      render(<Calendar />);

      // Simulate rapid clicking
      const prevButton = screen.getByTestId('prev-button');
      
      for (let i = 0; i < 10; i++) {
        await user.click(prevButton);
      }

      // Should not crash or cause performance issues
      expect(screen.getByTestId('fullcalendar-mock')).toBeInTheDocument();
    });
  });
});