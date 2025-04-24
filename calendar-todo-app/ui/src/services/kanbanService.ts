import { invoke } from '@tauri-apps/api/tauri';

export interface KanbanColumn {
  id?: number;
  name: string;
  column_order: number;
}

export const kanbanService = {
  async getColumns(): Promise<KanbanColumn[]> {
    return invoke('get_kanban_columns');
  },

  async createColumn(column: KanbanColumn): Promise<number> {
    return invoke('create_kanban_column', { column });
  },

  async updateColumn(column: KanbanColumn): Promise<void> {
    return invoke('update_kanban_column', { column });
  },

  async deleteColumn(id: number): Promise<void> {
    return invoke('delete_kanban_column', { id });
  },
};
