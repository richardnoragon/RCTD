import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import { CalendarProvider, useCalendar } from './CalendarContext';
import { CalendarControls } from './CalendarControls';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
  var mockTauriInvoke: jest.MockedFunction<any>;
}

// Mock date-fns to have predictable testing
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn(),
    addMonths: jest.fn(),
    addWeeks: jest.fn(),
    addDays: jest.fn(),
  };
});

const mockFormat = format as jest.MockedFunction<typeof format>;
const mockAddMonths = addMonths as jest.MockedFunction<typeof addMonths>;
const mockAddWeeks = addWeeks as jest.MockedFunction<typeof addWeeks>;
const mockAddDays = addDays as jest.MockedFunction<typeof addDays>;

describe('CalendarControls Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    (globalThis as any).resetMocks();
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockFormat.mockImplementation((date, formatStr) => {
      if (formatStr === 'MMMM yyyy') return 'January 2024';
      if (formatStr === 'MMM d, yyyy') return 'Jan 15, 2024';
      return 'Formatted Date';
    });
    
    mockAddMonths.mockImplementation((date, months) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    });
    
    mockAddWeeks.mockImplementation((date, weeks) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + (weeks * 7));
      return newDate;
    });
    
    mockAddDays.mockImplementation((date, days) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  });

  const renderWithProvider = (props = {}) => {
    return render(
      <CalendarProvider>
        <CalendarControls {...props} />
      </CalendarProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render calendar controls successfully', () => {
      renderWithProvider();
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should render navigation controls with proper structure', () => {
      renderWithProvider();
      
      const navigationControls = screen.getByText('Previous').parentElement;
      expect(navigationControls).toHaveClass('navigation-controls');
      
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render view controls', () => {
      renderWithProvider();
      
      expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /agenda/i })).toBeInTheDocument();
    });

    it('should display current date formatted correctly', () => {
      renderWithProvider();
      
      expect(mockFormat).toHaveBeenCalled();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should render with custom onNavigate prop', () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    it('should have proper CSS classes', () => {
      renderWithProvider();
      
      const calendarControls = screen.getByText('Previous').closest('.calendar-controls');
      expect(calendarControls).toBeInTheDocument();
      
      const viewControls = screen.getByText('Month').parentElement;
      expect(viewControls).toHaveClass('view-controls');
      
      const currentDate = screen.getByText('Jan 15, 2024');
      expect(currentDate.parentElement).toHaveClass('current-date');
    });
  });

  describe('Navigation Controls', () => {
    describe('Previous Navigation', () => {
      it('should navigate to previous month in month view', async () => {
        renderWithProvider();
        
        // Set to month view first
        await user.click(screen.getByRole('button', { name: /month/i }));
        await user.click(screen.getByRole('button', { name: /previous/i }));
        
        await waitFor(() => {
          expect(mockAddMonths).toHaveBeenCalledWith(expect.any(Date), -1);
        });
      });

      it('should navigate to previous week in week view', async () => {
        renderWithProvider();
        
        // Week view is default, so just click previous
        await user.click(screen.getByRole('button', { name: /previous/i }));
        
        await waitFor(() => {
          expect(mockAddWeeks).toHaveBeenCalledWith(expect.any(Date), -1);
        });
      });

      it('should navigate to previous day in day view', async () => {
        renderWithProvider();
        
        await user.click(screen.getByText('Day'));
        await user.click(screen.getByRole('button', { name: /previous/i }));
        
        await waitFor(() => {
          expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), -1);
        });
      });

      it('should navigate to previous day in list view', async () => {
        renderWithProvider();
        
        await user.click(screen.getByRole('button', { name: /agenda/i }));
        await user.click(screen.getByRole('button', { name: /previous/i }));
        
        await waitFor(() => {
          expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), -1);
        });
      });

      it('should call onNavigate callback with prev direction', async () => {
        const mockOnNavigate = jest.fn();
        renderWithProvider({ onNavigate: mockOnNavigate });
        
        await user.click(screen.getByRole('button', { name: /previous/i }));
        
        expect(mockOnNavigate).toHaveBeenCalledWith('prev');
      });
    });

    describe('Next Navigation', () => {
      it('should navigate to next month in month view', async () => {
        renderWithProvider();
        
        await user.click(screen.getByRole('button', { name: /month/i }));
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() => {
          expect(mockAddMonths).toHaveBeenCalledWith(expect.any(Date), 1);
        });
      });

      it('should navigate to next week in week view', async () => {
        renderWithProvider();
        
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() => {
          expect(mockAddWeeks).toHaveBeenCalledWith(expect.any(Date), 1);
        });
      });

      it('should navigate to next day in day view', async () => {
        renderWithProvider();
        
        await user.click(screen.getByText('Day'));
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() => {
          expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), 1);
        });
      });

      it('should call onNavigate callback with next direction', async () => {
        const mockOnNavigate = jest.fn();
        renderWithProvider({ onNavigate: mockOnNavigate });
        
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        expect(mockOnNavigate).toHaveBeenCalledWith('next');
      });
    });

    describe('Today Navigation', () => {
      it('should navigate to current date', async () => {
        const mockOnNavigate = jest.fn();
        renderWithProvider({ onNavigate: mockOnNavigate });
        
        await user.click(screen.getByRole('button', { name: /today/i }));
        
        expect(mockOnNavigate).toHaveBeenCalledWith('today');
      });

      it('should work from any view', async () => {
        const mockOnNavigate = jest.fn();
        renderWithProvider({ onNavigate: mockOnNavigate });
        
        // Test from month view
        await user.click(screen.getByRole('button', { name: /month/i }));
        await user.click(screen.getByRole('button', { name: /today/i }));
        expect(mockOnNavigate).toHaveBeenCalledWith('today');
        
        // Reset mock count
        mockOnNavigate.mockClear();
        
        // Test from day view
        await user.click(screen.getByText('Day'));
        await user.click(screen.getByRole('button', { name: /today/i }));
        expect(mockOnNavigate).toHaveBeenCalledWith('today');
      });
    });
  });

  describe('View Controls', () => {
    it('should switch to month view', async () => {
      renderWithProvider();
      
      await user.click(screen.getByRole('button', { name: /month/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /month/i })).toHaveClass('active');
      });
    });

    it('should switch to week view', async () => {
      renderWithProvider();
      
      // First switch away from week view
      await user.click(screen.getByRole('button', { name: /month/i }));
      
      // Then switch back to week view
      await user.click(screen.getByRole('button', { name: /week/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /week/i })).toHaveClass('active');
      });
    });

    it('should switch to day view', async () => {
      renderWithProvider();
      
      await user.click(screen.getByText('Day'));
      
      await waitFor(() => {
        expect(screen.getByText('Day')).toHaveClass('active');
      });
    });

    it('should switch to agenda view', async () => {
      renderWithProvider();
      
      await user.click(screen.getByRole('button', { name: /agenda/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /agenda/i })).toHaveClass('active');
      });
    });

    it('should only have one active view at a time', async () => {
      renderWithProvider();
      
      // Initially week view should be active
      expect(screen.getByRole('button', { name: /week/i })).toHaveClass('active');
      expect(screen.getByRole('button', { name: /month/i })).not.toHaveClass('active');
      
      // Switch to month view
      await user.click(screen.getByRole('button', { name: /month/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /month/i })).toHaveClass('active');
        expect(screen.getByRole('button', { name: /week/i })).not.toHaveClass('active');
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format date for month view', async () => {
      renderWithProvider();
      
      await user.click(screen.getByRole('button', { name: /month/i }));
      
      await waitFor(() => {
        expect(mockFormat).toHaveBeenCalledWith(expect.any(Date), 'MMMM yyyy');
      });
    });

    it('should format date for non-month views', async () => {
      renderWithProvider();
      
      const nonMonthViews = [
        { name: /day/i },
        { name: /agenda/i }
      ];
      
      await user.click(screen.getByText('Day'));
      await waitFor(() => {
        expect(mockFormat).toHaveBeenCalledWith(expect.any(Date), 'MMM d, yyyy');
      });
      
      await user.click(screen.getByText('Agenda'));
      await waitFor(() => {
        expect(mockFormat).toHaveBeenCalledWith(expect.any(Date), 'MMM d, yyyy');
      });
    });

    it('should update date display when navigation occurs', async () => {
      renderWithProvider();
      
      // Clear previous calls
      mockFormat.mockClear();
      
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        expect(mockFormat).toHaveBeenCalled();
      });
    });
  });

  describe('Integration with CalendarContext', () => {
    it('should use calendar context for current view', () => {
      renderWithProvider();
      
      // Week view should be active by default (from context)
      expect(screen.getByRole('button', { name: /week/i })).toHaveClass('active');
    });

    it('should update context when view changes', async () => {
      renderWithProvider();
      
      await user.click(screen.getByRole('button', { name: /month/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /month/i })).toHaveClass('active');
      });
    });

    it('should update context when date changes via navigation', async () => {
      renderWithProvider();
      
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        expect(mockAddWeeks).toHaveBeenCalled();
      });
    });
  });

  describe('Callback Handling', () => {
    it('should call onNavigate with correct direction', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      await user.click(screen.getByRole('button', { name: /previous/i }));
      expect(mockOnNavigate).toHaveBeenCalledWith('prev');
      
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
      
      await user.click(screen.getByRole('button', { name: /today/i }));
      expect(mockOnNavigate).toHaveBeenCalledWith('today');
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
    });

    it('should not fail when onNavigate is not provided', async () => {
      renderWithProvider(); // No onNavigate prop
      
      await user.click(screen.getByRole('button', { name: /previous/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /today/i }));
      
      // Should not throw errors
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });

    it('should handle multiple rapid navigation calls', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      // Rapid clicking
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /previous/i }));
      await user.click(screen.getByRole('button', { name: /today/i }));
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(4);
      expect(mockOnNavigate).toHaveBeenNthCalledWith(1, 'next');
      expect(mockOnNavigate).toHaveBeenNthCalledWith(2, 'next');
      expect(mockOnNavigate).toHaveBeenNthCalledWith(3, 'prev');
      expect(mockOnNavigate).toHaveBeenNthCalledWith(4, 'today');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      renderWithProvider();
      
      // Tab through controls
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /previous/i }));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /today/i }));
      
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /next/i }));
    });

    it('should support keyboard activation', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      const todayButton = screen.getByRole('button', { name: /today/i });
      todayButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnNavigate).toHaveBeenCalledWith('today');
    });

    it('should have accessible button labels', () => {
      renderWithProvider();
      
      // Navigation buttons
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      
      // View buttons
      expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /agenda/i })).toBeInTheDocument();
    });

    it('should indicate active view for screen readers', () => {
      renderWithProvider();
      
      const weekButton = screen.getByRole('button', { name: /week/i });
      expect(weekButton).toHaveClass('active');
      
      const monthButton = screen.getByRole('button', { name: /month/i });
      expect(monthButton).not.toHaveClass('active');
    });
  });

  describe('Error Handling', () => {
    it('should handle context errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<CalendarControls />);
      }).toThrow('useCalendar must be used within a CalendarProvider');
      
      consoleError.mockRestore();
    });

    it('should handle malformed dates in context', async () => {
      function TestComponentWithInvalidDate() {
        const { setDate } = useCalendar();
        
        return (
          <div>
            <CalendarControls />
            <button 
              data-testid="set-invalid-date" 
              onClick={() => setDate(new Date('invalid-date'))}
            >
              Set Invalid Date
            </button>
          </div>
        );
      }

      render(
        <CalendarProvider>
          <TestComponentWithInvalidDate />
        </CalendarProvider>
      );
      
      await user.click(screen.getByTestId('set-invalid-date'));
      
      // Component should handle invalid dates without crashing
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle rapid view switching efficiently', async () => {
      renderWithProvider();
      
      const start = performance.now();
      
      // Rapid view switching
      await user.click(screen.getByRole('button', { name: /month/i }));
      await user.click(screen.getByRole('button', { name: /week/i }));
      await user.click(screen.getByText('Day'));
      await user.click(screen.getByText('Agenda'));
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(500); // 500ms
    });

    it('should handle rapid navigation efficiently', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      const start = performance.now();
      
      // Rapid navigation
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // 1 second
      expect(mockOnNavigate).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle date manipulation at year boundaries', async () => {
      renderWithProvider();
      
      // Mock return dates for year boundary scenarios
      mockAddMonths.mockReturnValue(new Date('2025-01-01'));
      
      await user.click(screen.getByRole('button', { name: /month/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      expect(mockAddMonths).toHaveBeenCalledWith(expect.any(Date), 1);
    });

    it('should handle leap year navigation', async () => {
      renderWithProvider();
      
      // Mock leap year date
      mockAddDays.mockReturnValue(new Date('2024-02-29'));
      
      await user.click(screen.getByText('Day'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), 1);
    });

    it('should handle month overflow correctly', async () => {
      renderWithProvider();
      
      // Mock date that would overflow to next year
      mockAddMonths.mockReturnValue(new Date('2025-01-15'));
      
      await user.click(screen.getByRole('button', { name: /month/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      expect(mockAddMonths).toHaveBeenCalledWith(expect.any(Date), 1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly with navigation workflows', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      // Test complete workflow: view change + navigation + today
      await user.click(screen.getByRole('button', { name: /month/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /today/i }));
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(2); // next + today
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
      expect(mockOnNavigate).toHaveBeenCalledWith('today');
    });

    it('should maintain state consistency across operations', async () => {
      renderWithProvider();
      
      // Switch views and navigate
      await user.click(screen.getByText('Day'));
      expect(screen.getByText('Day')).toHaveClass('active');
      
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText('Day')).toHaveClass('active');
      
      await user.click(screen.getByRole('button', { name: /week/i }));
      expect(screen.getByRole('button', { name: /week/i })).toHaveClass('active');
      expect(screen.getByText('Day')).not.toHaveClass('active');
    });

    it('should handle complex navigation sequences', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      // Complex sequence: month view -> prev -> day view -> next -> today
      await user.click(screen.getByRole('button', { name: /month/i }));
      await user.click(screen.getByRole('button', { name: /previous/i }));
      await user.click(screen.getByText('Day'));
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /today/i }));
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
      expect(mockAddMonths).toHaveBeenCalledWith(expect.any(Date), -1);
      expect(mockAddDays).toHaveBeenCalledWith(expect.any(Date), 1);
    });
  });

  describe('User Experience', () => {
    it('should provide visual feedback for active view', () => {
      renderWithProvider();
      
      const weekButton = screen.getByRole('button', { name: /week/i });
      const monthButton = screen.getByRole('button', { name: /month/i });
      
      expect(weekButton).toHaveClass('active');
      expect(monthButton).not.toHaveClass('active');
    });

    it('should handle double-clicks gracefully', async () => {
      const mockOnNavigate = jest.fn();
      renderWithProvider({ onNavigate: mockOnNavigate });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      // Double click
      await user.dblClick(nextButton);
      
      // Should handle double clicks without issues
      expect(mockOnNavigate).toHaveBeenCalledTimes(2);
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
    });

    it('should provide consistent button behavior', async () => {
      renderWithProvider();
      
      const buttons = [
        screen.getByRole('button', { name: /previous/i }),
        screen.getByRole('button', { name: /today/i }),
        screen.getByRole('button', { name: /next/i }),
        screen.getByRole('button', { name: /month/i }),
        screen.getByRole('button', { name: /week/i }),
        screen.getByText('Day'),
        screen.getByRole('button', { name: /agenda/i }),
      ];
      
      // All buttons should be clickable
      for (const button of buttons) {
        expect(button).toBeEnabled();
        expect(button.tagName).toBe('BUTTON');
      }
    });
  });
});