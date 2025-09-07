import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CalendarProvider, useCalendar } from './CalendarContext';

// Test component to access and manipulate calendar context
function TestComponent() {
  const { currentView, currentDate, setView, setDate } = useCalendar();
  
  return (
    <div>
      <div data-testid="current-view">{currentView}</div>
      <div data-testid="current-date">{currentDate.toISOString()}</div>
      <button 
        data-testid="set-day-view" 
        onClick={() => setView('timeGridDay')}
      >
        Set Day View
      </button>
      <button 
        data-testid="set-week-view" 
        onClick={() => setView('timeGridWeek')}
      >
        Set Week View
      </button>
      <button 
        data-testid="set-month-view" 
        onClick={() => setView('dayGridMonth')}
      >
        Set Month View
      </button>
      <button 
        data-testid="set-list-view" 
        onClick={() => setView('listWeek')}
      >
        Set List View
      </button>
      <button 
        data-testid="set-specific-date" 
        onClick={() => setDate(new Date('2023-06-15T10:00:00.000Z'))}
      >
        Set Specific Date
      </button>
      <button 
        data-testid="set-current-date" 
        onClick={() => setDate(new Date())}
      >
        Set Current Date
      </button>
    </div>
  );
}

// Component for testing hook outside provider
function TestComponentOutsideProvider() {
  try {
    useCalendar();
    return <div data-testid="hook-success">Hook succeeded</div>;
  } catch (error) {
    return <div data-testid="hook-error">{(error as Error).message}</div>;
  }
}

describe('CalendarContext', () => {
  beforeEach(() => {
    // Reset any global state or mocks if needed
    jest.clearAllMocks();
  });

  describe('CalendarProvider', () => {
    describe('Initial State', () => {
      it('should provide default view as timeGridWeek', () => {
        render(
          <CalendarProvider>
            <TestComponent />
          </CalendarProvider>
        );

        expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridWeek');
      });

      it('should provide current date as initial date', () => {
        const beforeRender = new Date();
        
        render(
          <CalendarProvider>
            <TestComponent />
          </CalendarProvider>
        );

        const displayedDate = new Date(screen.getByTestId('current-date').textContent!);
        const afterRender = new Date();
        
        // Allow for small time difference during test execution
        expect(displayedDate.getTime()).toBeGreaterThanOrEqual(beforeRender.getTime() - 1000);
        expect(displayedDate.getTime()).toBeLessThanOrEqual(afterRender.getTime() + 1000);
      });

      it('should render children correctly', () => {
        const testContent = 'Test Content';
        
        render(
          <CalendarProvider>
            <div data-testid="child-content">{testContent}</div>
          </CalendarProvider>
        );

        expect(screen.getByTestId('child-content')).toHaveTextContent(testContent);
      });
    });

    describe('State Management', () => {
      describe('View State Management', () => {
        it('should update view to timeGridDay', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridWeek');
          
          fireEvent.click(screen.getByTestId('set-day-view'));
          
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridDay');
          });
        });

        it('should update view to dayGridMonth', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          fireEvent.click(screen.getByTestId('set-month-view'));
          
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('dayGridMonth');
          });
        });

        it('should update view to listWeek', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          fireEvent.click(screen.getByTestId('set-list-view'));
          
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('listWeek');
          });
        });

        it('should handle multiple view changes correctly', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          // Start with week view
          expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridWeek');
          
          // Change to day view
          fireEvent.click(screen.getByTestId('set-day-view'));
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridDay');
          });
          
          // Change to month view
          fireEvent.click(screen.getByTestId('set-month-view'));
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('dayGridMonth');
          });
          
          // Change back to week view
          fireEvent.click(screen.getByTestId('set-week-view'));
          await waitFor(() => {
            expect(screen.getByTestId('current-view')).toHaveTextContent('timeGridWeek');
          });
        });
      });

      describe('Date State Management', () => {
        it('should update date to specific date', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          fireEvent.click(screen.getByTestId('set-specific-date'));
          
          await waitFor(() => {
            const displayedDate = screen.getByTestId('current-date').textContent;
            expect(displayedDate).toBe('2023-06-15T10:00:00.000Z');
          });
        });

        it('should update date to current date', async () => {
          render(
            <CalendarProvider>
              <TestComponent />
            </CalendarProvider>
          );

          // First set to a specific date
          fireEvent.click(screen.getByTestId('set-specific-date'));
          await waitFor(() => {
            expect(screen.getByTestId('current-date')).toHaveTextContent('2023-06-15T10:00:00.000Z');
          });

          // Then update to current date
          const beforeUpdate = new Date();
          fireEvent.click(screen.getByTestId('set-current-date'));
          
          await waitFor(() => {
            const displayedDate = new Date(screen.getByTestId('current-date').textContent!);
            const afterUpdate = new Date();
            
            expect(displayedDate.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 1000);
            expect(displayedDate.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 1000);
          });
        });

        it('should handle date objects correctly', async () => {
          function TestDateComponent() {
            const { currentDate, setDate } = useCalendar();
            
            const handleDateUpdate = () => {
              const newDate = new Date('2024-12-25T00:00:00.000Z');
              setDate(newDate);
            };
            
            return (
              <div>
                <div data-testid="date-display">{currentDate.toDateString()}</div>
                <button data-testid="update-date" onClick={handleDateUpdate}>
                  Update Date
                </button>
              </div>
            );
          }

          render(
            <CalendarProvider>
              <TestDateComponent />
            </CalendarProvider>
          );

          fireEvent.click(screen.getByTestId('update-date'));
          
          await waitFor(() => {
            expect(screen.getByTestId('date-display')).toHaveTextContent('Mon Dec 25 2024');
          });
        });
      });

      describe('Combined State Updates', () => {
        it('should handle simultaneous view and date updates', async () => {
          function CombinedTestComponent() {
            const { currentView, currentDate, setView, setDate } = useCalendar();
            
            const handleCombinedUpdate = () => {
              setView('dayGridMonth');
              setDate(new Date('2024-01-01T00:00:00.000Z'));
            };
            
            return (
              <div>
                <div data-testid="view-date-combo">
                  {currentView} - {currentDate.toISOString()}
                </div>
                <button data-testid="combined-update" onClick={handleCombinedUpdate}>
                  Update Both
                </button>
              </div>
            );
          }

          render(
            <CalendarProvider>
              <CombinedTestComponent />
            </CalendarProvider>
          );

          fireEvent.click(screen.getByTestId('combined-update'));
          
          await waitFor(() => {
            expect(screen.getByTestId('view-date-combo')).toHaveTextContent(
              'dayGridMonth - 2024-01-01T00:00:00.000Z'
            );
          });
        });
      });
    });
  });

  describe('useCalendar Hook', () => {
    describe('Context Usage', () => {
      it('should provide context values when used within provider', () => {
        render(
          <CalendarProvider>
            <TestComponent />
          </CalendarProvider>
        );

        expect(screen.getByTestId('current-view')).toBeInTheDocument();
        expect(screen.getByTestId('current-date')).toBeInTheDocument();
        expect(screen.getByTestId('set-day-view')).toBeInTheDocument();
        expect(screen.getByTestId('set-specific-date')).toBeInTheDocument();
      });

      it('should throw error when used outside provider', () => {
        render(<TestComponentOutsideProvider />);

        expect(screen.getByTestId('hook-error')).toHaveTextContent(
          'useCalendar must be used within a CalendarProvider'
        );
      });

      it('should provide stable function references', () => {
        let firstRenderSetView: any;
        let firstRenderSetDate: any;
        
        function StabilityTestComponent() {
          const { setView, setDate } = useCalendar();
          
          if (!firstRenderSetView) {
            firstRenderSetView = setView;
            firstRenderSetDate = setDate;
          }
          
          return (
            <div>
              <div data-testid="set-view-stable">
                {setView === firstRenderSetView ? 'stable' : 'unstable'}
              </div>
              <div data-testid="set-date-stable">
                {setDate === firstRenderSetDate ? 'stable' : 'unstable'}
              </div>
              <button data-testid="trigger-rerender" onClick={() => setView('timeGridDay')}>
                Trigger Rerender
              </button>
            </div>
          );
        }

        render(
          <CalendarProvider>
            <StabilityTestComponent />
          </CalendarProvider>
        );

        expect(screen.getByTestId('set-view-stable')).toHaveTextContent('stable');
        expect(screen.getByTestId('set-date-stable')).toHaveTextContent('stable');
        
        // Trigger rerender
        fireEvent.click(screen.getByTestId('trigger-rerender'));
        
        expect(screen.getByTestId('set-view-stable')).toHaveTextContent('stable');
        expect(screen.getByTestId('set-date-stable')).toHaveTextContent('stable');
      });
    });

    describe('Type Safety', () => {
      it('should enforce correct view types', async () => {
        function TypeTestComponent() {
          const { setView } = useCalendar();
          
          return (
            <div>
              <button 
                data-testid="valid-view-1" 
                onClick={() => setView('timeGridDay')}
              >
                Valid View 1
              </button>
              <button 
                data-testid="valid-view-2" 
                onClick={() => setView('timeGridWeek')}
              >
                Valid View 2
              </button>
              <button 
                data-testid="valid-view-3" 
                onClick={() => setView('dayGridMonth')}
              >
                Valid View 3
              </button>
              <button 
                data-testid="valid-view-4" 
                onClick={() => setView('listWeek')}
              >
                Valid View 4
              </button>
            </div>
          );
        }

        render(
          <CalendarProvider>
            <TypeTestComponent />
          </CalendarProvider>
        );

        // All buttons should render without TypeScript errors
        expect(screen.getByTestId('valid-view-1')).toBeInTheDocument();
        expect(screen.getByTestId('valid-view-2')).toBeInTheDocument();
        expect(screen.getByTestId('valid-view-3')).toBeInTheDocument();
        expect(screen.getByTestId('valid-view-4')).toBeInTheDocument();
      });

      it('should handle Date objects correctly', async () => {
        function DateTypeTestComponent() {
          const { currentDate, setDate } = useCalendar();
          
          return (
            <div>
              <div data-testid="date-is-date">
                {currentDate instanceof Date ? 'true' : 'false'}
              </div>
              <button 
                data-testid="set-valid-date" 
                onClick={() => setDate(new Date('2025-01-01'))}
              >
                Set Valid Date
              </button>
            </div>
          );
        }

        render(
          <CalendarProvider>
            <DateTypeTestComponent />
          </CalendarProvider>
        );

        expect(screen.getByTestId('date-is-date')).toHaveTextContent('true');
        
        fireEvent.click(screen.getByTestId('set-valid-date'));
        
        await waitFor(() => {
          expect(screen.getByTestId('date-is-date')).toHaveTextContent('true');
        });
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple child components with context', () => {
      function ChildComponent1() {
        const { currentView } = useCalendar();
        return <div data-testid="child1-view">{currentView}</div>;
      }

      function ChildComponent2() {
        const { currentDate } = useCalendar();
        return <div data-testid="child2-date">{currentDate.getFullYear()}</div>;
      }

      function ChildComponent3() {
        const { setView } = useCalendar();
        return (
          <button data-testid="child3-button" onClick={() => setView('dayGridMonth')}>
            Update View
          </button>
        );
      }

      render(
        <CalendarProvider>
          <ChildComponent1 />
          <ChildComponent2 />
          <ChildComponent3 />
        </CalendarProvider>
      );

      expect(screen.getByTestId('child1-view')).toHaveTextContent('timeGridWeek');
      expect(screen.getByTestId('child2-date')).toBeInTheDocument();
      expect(screen.getByTestId('child3-button')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('child3-button'));
      
      expect(screen.getByTestId('child1-view')).toHaveTextContent('dayGridMonth');
    });

    it('should handle rapid state updates', async () => {
      function RapidUpdateComponent() {
        const { currentView, setView } = useCalendar();
        
        const handleRapidUpdates = () => {
          setView('timeGridDay');
          setView('dayGridMonth');
          setView('listWeek');
          setView('timeGridWeek');
        };
        
        return (
          <div>
            <div data-testid="rapid-view">{currentView}</div>
            <button data-testid="rapid-updates" onClick={handleRapidUpdates}>
              Rapid Updates
            </button>
          </div>
        );
      }

      render(
        <CalendarProvider>
          <RapidUpdateComponent />
        </CalendarProvider>
      );

      fireEvent.click(screen.getByTestId('rapid-updates'));
      
      await waitFor(() => {
        expect(screen.getByTestId('rapid-view')).toHaveTextContent('timeGridWeek');
      });
    });

    it('should handle nested providers correctly', () => {
      render(
        <CalendarProvider>
          <CalendarProvider>
            <TestComponentOutsideProvider />
          </CalendarProvider>
        </CalendarProvider>
      );

      // Inner provider should work, not throw error
      expect(screen.queryByTestId('hook-error')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date gracefully', async () => {
      function EdgeCaseComponent() {
        const { currentDate, setDate } = useCalendar();
        
        return (
          <div>
            <div data-testid="edge-date">{currentDate.toString()}</div>
            <button 
              data-testid="set-edge-date" 
              onClick={() => setDate(new Date('invalid-date'))}
            >
              Set Invalid Date
            </button>
          </div>
        );
      }

      render(
        <CalendarProvider>
          <EdgeCaseComponent />
        </CalendarProvider>
      );

      fireEvent.click(screen.getByTestId('set-edge-date'));
      
      await waitFor(() => {
        const dateText = screen.getByTestId('edge-date').textContent;
        expect(dateText).toContain('Invalid Date');
      });
    });

    it('should handle provider unmounting gracefully', () => {
      const { unmount } = render(
        <CalendarProvider>
          <TestComponent />
        </CalendarProvider>
      );

      expect(screen.getByTestId('current-view')).toBeInTheDocument();
      
      unmount();
      
      // Should unmount without errors
      expect(screen.queryByTestId('current-view')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary rerenders', () => {
      let renderCount = 0;
      
      function PerformanceTestComponent() {
        renderCount++;
        const { currentView, setView } = useCalendar();
        
        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="perf-view">{currentView}</div>
            <button data-testid="perf-update" onClick={() => setView('dayGridMonth')}>
              Update View
            </button>
          </div>
        );
      }

      render(
        <CalendarProvider>
          <PerformanceTestComponent />
        </CalendarProvider>
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
      
      fireEvent.click(screen.getByTestId('perf-update'));
      
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
      expect(screen.getByTestId('perf-view')).toHaveTextContent('dayGridMonth');
    });
  });
});