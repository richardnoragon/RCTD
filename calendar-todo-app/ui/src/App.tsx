import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { CalendarProvider } from './components/calendar/CalendarContext';
import { Task, taskService } from './services/taskService';
import { markStartupPhase, measureStartupPhase, scheduleIdleTask } from './services/startupMetrics';

const Calendar = lazy(() => import('./components/calendar/Calendar'));
const CalendarControls = lazy(() => import('./components/calendar/CalendarControls'));
const Search = lazy(() =>
  import('./components/search/Search').then((module) => ({ default: module.Search }))
);
const KanbanBoard = lazy(() => import('./components/tasks/KanbanBoard'));
const TaskCalendarView = lazy(() => import('./components/tasks/TaskCalendarView'));
const TaskListView = lazy(() => import('./components/tasks/TaskListView'));

type View = 'calendar' | 'tasks' | 'search';
type TaskView = 'kanban' | 'calendar' | 'list';

function App(): JSX.Element {
  const renderLoadingState = (message: string): JSX.Element => (
    <div className="loading-container">
      <p>{message}</p>
    </div>
  );

  const startupPhaseRegistered = useRef(false);

  const [currentView, setCurrentView] = useState<View>('calendar');
  const [currentTaskView, setCurrentTaskView] = useState<TaskView>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState<boolean>(false);

  const loadTasks = useCallback(async () => {
    try {
      setIsTaskLoading(true);
      const loadedTasks = await taskService.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsTaskLoading(false);
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

  useEffect(() => {
    if (startupPhaseRegistered.current) {
      return;
    }

    startupPhaseRegistered.current = true;
    markStartupPhase('app_bootstrap_start');
    markStartupPhase('app_shell_rendered');
    measureStartupPhase('startup_shell_ready', 'app_bootstrap_start', 'app_shell_rendered');

    scheduleIdleTask(() => {
      markStartupPhase('task_bootstrap_start');
      void (async () => {
        setIsTaskLoading(true);
        try {
          await loadTasks();
          markStartupPhase('task_bootstrap_complete');
          measureStartupPhase(
            'startup_idle_task_load',
            'task_bootstrap_start',
            'task_bootstrap_complete'
          );
        } finally {
          setIsTaskLoading(false);
        }
      })();
    });
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
        <Suspense fallback={renderLoadingState('Loading calendar view...')}>
          <>
            <CalendarControls />
            <Calendar />
          </>
        </Suspense>
      );
    }

    if (currentView === 'search') {
      return (
        <Suspense fallback={renderLoadingState('Loading search view...')}>
          <Search />
        </Suspense>
      );
    }

    if (isTaskLoading) {
      return renderLoadingState('Loading tasks...');
    }

    return <Suspense fallback={renderLoadingState('Loading tasks view...')}>{renderTasksView()}</Suspense>;
  };

  return (
    <CalendarProvider>
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
    </CalendarProvider>
  );
}

export default App;
