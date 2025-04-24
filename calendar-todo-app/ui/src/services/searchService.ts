import { invoke } from '@tauri-apps/api/tauri';

export interface SearchResult {
  id: number;
  title: string;
  description?: string;
  itemType: 'EVENT' | 'TASK' | 'NOTE';
  date?: string;
  categoryId?: number;
  priority?: number;
  status?: string;
}

export const searchService = {
  async searchAll(query: string): Promise<SearchResult[]> {
    const results: any[] = await invoke('search_all', { query });
    return results.map(r => ({
      ...r,
      itemType: r.item_type,
      categoryId: r.category_id,
    }));
  },

  async searchEvents(params: {
    query: string;
    startDate?: string;
    endDate?: string;
    categoryId?: number;
  }): Promise<SearchResult[]> {
    const results: any[] = await invoke('search_events', {
      query: params.query,
      startDate: params.startDate,
      endDate: params.endDate,
      categoryId: params.categoryId,
    });
    return results.map(r => ({
      ...r,
      itemType: r.item_type,
      categoryId: r.category_id,
    }));
  },

  async searchTasks(params: {
    query: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    categoryId?: number;
    status?: string;
    priority?: number;
  }): Promise<SearchResult[]> {
    const results: any[] = await invoke('search_tasks', {
      query: params.query,
      dueDateStart: params.dueDateStart,
      dueDateEnd: params.dueDateEnd,
      categoryId: params.categoryId,
      status: params.status,
      priority: params.priority,
    });
    return results.map(r => ({
      ...r,
      itemType: r.item_type,
      categoryId: r.category_id,
    }));
  },

  async searchNotes(query: string): Promise<SearchResult[]> {
    const results: any[] = await invoke('search_notes', { query });
    return results.map(r => ({
      ...r,
      itemType: r.item_type,
      categoryId: r.category_id,
    }));
  },
};
