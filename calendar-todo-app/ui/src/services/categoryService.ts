import { invoke } from '@tauri-apps/api/tauri';

export interface Category {
  id?: number;
  name: string;
  color: string;
  symbol: string;
  created_at?: string;
  updated_at?: string;
}

export const AVAILABLE_SYMBOLS = [
  'circle',
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'octagon'
] as const;

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    return invoke('get_categories');
  },

  async createCategory(category: Category): Promise<number> {
    return invoke('create_category', { category });
  },

  async updateCategory(category: Category): Promise<void> {
    return invoke('update_category', { category });
  },

  async deleteCategory(id: number): Promise<void> {
    return invoke('delete_category', { id });
  },

  async exportCategories(): Promise<string> {
    return invoke('export_categories');
  },

  async importCategories(jsonData: string): Promise<void> {
    return invoke('import_categories', { jsonData });
  }
};
