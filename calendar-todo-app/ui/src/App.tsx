import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Calendar } from './components/calendar/Calendar';
import './components/calendar/Calendar.css';
import { CalendarProvider } from './components/calendar/CalendarContext';
import CalendarControls from './components/calendar/CalendarControls';
import { Search } from './components/search/Search';
import KanbanBoard from './components/tasks/KanbanBoard';
import TaskCalendarView from './components/tasks/TaskCalendarView';
import TaskListView from './components/tasks/TaskListView';
import './components/tasks/Tasks.css';
import { Task, taskService } from './services/taskService';

type View = 'calendar' | 'tasks' | 'search';
type TaskView = 'kanban' | 'calendar' | 'list';

function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [currentTaskView, setCurrentTaskView] = useState<TaskView>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await taskService.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTaskUpdate = async (task: Task): Promise<void> => {
    try {
      if (task.id) {
        await taskService.updateTask(task);
      } else {
        await taskService.createTask(task);
      }
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  const handleTaskDelete = async (id: number): Promise<void> => {
    try {
      await taskService.deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Add useEffect to load tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const renderTasksView = (): JSX.Element | null => {
    switch (currentTaskView) {
      case 'kanban':
        return (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        );
      case 'calendar':
        return (
          <TaskCalendarView
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        );
      case 'list':
        return (
          <TaskListView
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        );
      default:
        return null;
    }
  };

  const renderCurrentView = (): JSX.Element => {
    if (currentView === 'calendar') {
      return (
        <>
          <CalendarControls />
          <Calendar />
        </>
      );
    }

    if (currentView === 'search') {
      return <Search />;
    }

    return renderTasksView();
  };

  return (
    <CalendarProvider>
      {isLoading ? (
        <div className="loading-container">
          <p>Loading application...</p>
        </div>
      ) : (
        <div className="app">
          <div className="app-header">
            <div className="view-selector">
              <button
                className={currentView === 'calendar' ? 'active' : ''}
                onClick={() => setCurrentView('calendar')}
              >
                Calendar
              </button>
              <button
                className={currentView === 'tasks' ? 'active' : ''}
                onClick={() => setCurrentView('tasks')}
              >
                Tasks
              </button>
              <button
                className={currentView === 'search' ? 'active' : ''}
                onClick={() => setCurrentView('search')}
              >
                Search
              </button>
            </div>

            {currentView === 'tasks' && (
              <div className="task-view-selector">
                <button
                  className={currentTaskView === 'kanban' ? 'active' : ''}
                  onClick={() => setCurrentTaskView('kanban')}
                >
                  Kanban Board
                </button>
                <button
                  className={currentTaskView === 'calendar' ? 'active' : ''}
                  onClick={() => setCurrentTaskView('calendar')}
                >
                  Calendar View
                </button>
                <button
                  className={currentTaskView === 'list' ? 'active' : ''}
                  onClick={() => setCurrentTaskView('list')}
                >
                  List View
                </button>
              </div>
            )}
          </div>

          {renderCurrentView()}
        </div>
      )}
    </CalendarProvider>
  );
}

export default App;
