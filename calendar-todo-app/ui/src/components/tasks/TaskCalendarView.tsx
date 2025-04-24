import React, { useState, useEffect } from 'react';
import { Task, taskService } from '../../services/taskService';
import { TaskForm } from './TaskForm';
import './Tasks.css';

interface TaskCalendarViewProps {
  onTaskUpdate: (task: Task) => Promise<void>;
  onTaskDelete: (id: number) => Promise<void>;
}

interface DayCell {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedTask({
      title: '',
      due_date: date.toISOString().split('T')[0],
      priority: 3,
      status: 'PENDING'
    });
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (taskData: Task) => {
    try {
      if (!taskData.id) {
        await taskService.createTask(taskData);
      } else {
        await taskService.updateTask(taskData);
      }
      await loadTasks();
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const getDaysInMonth = (date: Date): DayCell[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DayCell[] = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        tasks: tasks.filter(task => task.due_date === date.toISOString().split('T')[0]),
        isCurrentMonth: false
      });
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        tasks: tasks.filter(task => task.due_date === date.toISOString().split('T')[0]),
        isCurrentMonth: true
      });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        tasks: tasks.filter(task => task.due_date === date.toISOString().split('T')[0]),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return '#ff4444'; // Highest - Red
      case 2: return '#ff8800'; // High - Orange
      case 3: return '#ffbb33'; // Medium - Yellow
      case 4: return '#00C851'; // Low - Light Green
      case 5: return '#33b5e5'; // Lowest - Blue
      default: return '#808080'; // Default - Gray
    }
  };

  const monthDays = getDaysInMonth(currentDate);

  return (
    <div className="task-calendar-view">
      <div className="calendar-header">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
          Previous Month
        </button>
        <h2>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
          Next Month
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {monthDays.map((dayCell, index) => (
            <div
              key={index}
              className={`calendar-day ${dayCell.isCurrentMonth ? 'current-month' : 'other-month'}`}
              onClick={() => handleDateClick(dayCell.date)}
            >
              <div className="day-number">{dayCell.date.getDate()}</div>
              <div className="day-tasks">
                {dayCell.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`task-indicator ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTaskForm && (
        <div className="task-form-modal">
          <TaskForm
            task={selectedTask || undefined}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setShowTaskForm(false);
              setSelectedTask(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
