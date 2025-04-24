import React, { useState } from 'react';
import { Task, taskService } from '../../services/taskService';
import { TaskForm } from './TaskForm';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
}) => {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id!);
    }
  };

  const handleStatusToggle = async () => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await taskService.updateTaskStatus(task.id!, newStatus);
      await onUpdate({ ...task, status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const priorityColors: Record<number, string> = {
    1: '#ff4444', // Highest - Red
    2: '#ff8800', // High - Orange
    3: '#ffbb33', // Medium - Yellow
    4: '#00C851', // Low - Light Green
    5: '#33b5e5', // Lowest - Blue
  };

  if (showEditForm) {
    return (
      <div className="task-card-edit-overlay">
        <TaskForm
          task={task}
          onSubmit={async (updatedTask: Task) => {
            await onUpdate(updatedTask);
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="task-card" style={{ borderLeft: `4px solid ${priorityColors[task.priority]}` }}>
      <div className="task-card-header">
        <div className="task-card-title">
          <input
            type="checkbox"
            checked={task.status === 'COMPLETED'}
            onChange={handleStatusToggle}
            className="task-status-checkbox"
          />
          <h3 style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
            {task.title}
          </h3>
        </div>
        <div className="task-card-actions">
          <button onClick={handleEdit} className="edit-button">Edit</button>
          <button onClick={handleDelete} className="delete-button">Delete</button>
        </div>
      </div>
      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}
      {task.due_date && (
        <div className="task-card-due-date">
          Due: {new Date(task.due_date).toLocaleDateString()}
        </div>
      )}
      <div className="task-card-footer">
        <span className="task-priority">Priority: {task.priority}</span>
        <span className="task-status">{task.status}</span>
      </div>
    </div>
  );
};
