import { invoke } from '@tauri-apps/api/tauri';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: number;
  status: string;
  category_id?: number;
  recurring_rule_id?: number;
  kanban_column_id?: number;
  kanban_order?: number;
  completed_at?: string;
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    return invoke('get_tasks');
  },

  async getTasksInColumn(columnId: number): Promise<Task[]> {
    return invoke('get_tasks_in_column', { columnId });
  },

  async createTask(task: Task): Promise<number> {
    return invoke('create_task', { task });
  },

  async updateTask(task: Task): Promise<void> {
    return invoke('update_task', { task });
  },

  async deleteTask(id: number): Promise<void> {
    return invoke('delete_task', { id });
  },

  async updateTaskStatus(id: number, status: string): Promise<void> {
    return invoke('update_task_status', { id, status });
  },

  async updateTaskOrder(id: number, columnId: number, order: number): Promise<void> {
    return invoke('update_task_order', { id, columnId, order });
  }
};
