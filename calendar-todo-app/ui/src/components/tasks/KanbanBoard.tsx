import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Task } from '../../services/taskService';
import { KanbanColumn, kanbanService } from '../../services/kanbanService';
import { TaskCard } from './TaskCard';
import './Tasks.css';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => Promise<void>;
  onTaskDelete: (id: number) => Promise<void>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  useEffect(() => {
    loadColumns();
  }, []);

  const loadColumns = async () => {
    try {
      const loadedColumns = await kanbanService.getColumns();
      setColumns(loadedColumns);
    } catch (error) {
      console.error('Failed to load Kanban columns:', error);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    
    try {
      const newColumn: KanbanColumn = {
        name: newColumnName.trim(),
        column_order: columns.length
      };
      
      await kanbanService.createColumn(newColumn);
      await loadColumns();
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;
    
    try {
      await kanbanService.deleteColumn(columnId);
      await loadColumns();
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId.replace('task-', ''));
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      kanban_column_id: parseInt(destination.droppableId),
      kanban_order: destination.index
    };

    await onTaskUpdate(updatedTask);
  };

  const getTasksForColumn = (columnId: number) => {
    return tasks
      .filter(task => task.kanban_column_id === columnId)
      .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
  };

  return (
    <div className="kanban-board">
      <div className="kanban-controls">
        {!isAddingColumn ? (
          <button onClick={() => setIsAddingColumn(true)}>Add Column</button>
        ) : (
          <div className="add-column-form">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
            />
            <button onClick={handleAddColumn}>Save</button>
            <button onClick={() => setIsAddingColumn(false)}>Cancel</button>
          </div>
        )}
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns">
          {columns.map((column) => (
            <div key={column.id} className="kanban-column">
              <div className="column-header">
                <h3>{column.name}</h3>
                <button 
                  onClick={() => handleDeleteColumn(column.id!)}
                  className="delete-column-button"
                >
                  ×
                </button>
              </div>
              <Droppable droppableId={column.id!.toString()}>
                {(provided) => (
                  <div
                    className="column-content"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {getTasksForColumn(column.id!).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={`task-${task.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onUpdate={onTaskUpdate}
                              onDelete={onTaskDelete}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
