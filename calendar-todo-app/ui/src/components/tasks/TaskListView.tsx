import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Task, taskService } from '../../services/taskService';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import './Tasks.css';

const VIRTUALIZED_TASK_ROW_HEIGHT = 120;
const VIRTUALIZED_TASK_OVERSCAN = 4;
const VIRTUALIZATION_THRESHOLD = 40;

interface TaskListViewProps {
  onTaskUpdate: (task: Task) => Promise<void>;
  onTaskDelete: (id: number) => Promise<void>;
}

interface TaskFilter {
  status?: string;
  priority?: number;
  searchTerm?: string;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const loadedTasks = await taskService.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleCreateTask = async (task: Task) => {
    try {
      await taskService.createTask(task);
      await loadTasks();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchTerm: e.target.value });
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, status: e.target.value || undefined });
  };

  const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, priority: Number(e.target.value) || undefined });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    } else if (a.due_date) {
      return -1;
    } else if (b.due_date) {
      return 1;
    }
    return a.priority - b.priority;
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const shouldUseVirtualization = sortedTasks.length > VIRTUALIZATION_THRESHOLD;

  const virtualizedWindow = useMemo(() => {
    const maxIndex = sortedTasks.length;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / VIRTUALIZED_TASK_ROW_HEIGHT) - VIRTUALIZED_TASK_OVERSCAN
    );
    const endIndex = Math.min(
      maxIndex,
      Math.ceil((scrollTop + (listRef.current?.clientHeight ?? 420)) / VIRTUALIZED_TASK_ROW_HEIGHT) +
        VIRTUALIZED_TASK_OVERSCAN
    );

    return {
      startIndex,
      endIndex,
      visibleTasks: sortedTasks.slice(startIndex, endIndex),
      totalHeight: sortedTasks.length * VIRTUALIZED_TASK_ROW_HEIGHT,
      offsetY: startIndex * VIRTUALIZED_TASK_ROW_HEIGHT,
    };
  }, [sortedTasks, scrollTop]);

  return (
    <div className="task-list-view">
      <div className="task-list-header">
        <div className="task-list-filters">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter.searchTerm || ''}
            onChange={handleSearchChange}
            className="search-input"
          />
          <select
            value={filter.status || ''}
            onChange={handleStatusChange}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={filter.priority || ''}
            onChange={handlePriorityChange}
            className="priority-filter"
          >
            <option value="">All Priorities</option>
            <option value="1">Highest</option>
            <option value="2">High</option>
            <option value="3">Medium</option>
            <option value="4">Low</option>
            <option value="5">Lowest</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="create-task-button">
          Create Task
        </button>
      </div>

      <div
        ref={listRef}
        className="task-list"
        role="list"
        aria-label="Task list"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {sortedTasks.length === 0 ? (
          <div className="no-tasks">
            {filter.searchTerm || filter.status || filter.priority
              ? 'No tasks match your filters'
              : 'No tasks yet. Create one!'}
          </div>
        ) : shouldUseVirtualization ? (
          <div className="task-virtualizer" style={{ height: virtualizedWindow.totalHeight }}>
            {virtualizedWindow.visibleTasks.map((task, index) => (
              <div
                key={task.id}
                className="task-row"
                role="listitem"
                aria-label={`Task ${task.title}`}
                style={{
                  position: 'absolute',
                  top: (virtualizedWindow.startIndex + index) * VIRTUALIZED_TASK_ROW_HEIGHT,
                  left: 0,
                  right: 0,
                  height: VIRTUALIZED_TASK_ROW_HEIGHT,
                }}
              >
                <TaskCard
                  task={task}
                  onUpdate={onTaskUpdate}
                  onDelete={onTaskDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))
        )}
      </div>

      {showForm && (
        <div className="task-form-modal">
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TaskListView;
