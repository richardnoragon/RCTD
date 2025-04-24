import React, { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Category, AVAILABLE_SYMBOLS, categoryService } from '../../services/categoryService';
import './Categories.css';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (category: Category) => Promise<void>;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Category>({
    name: category?.name || '',
    color: category?.color || '#808080',
    symbol: category?.symbol || 'circle'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="color">Color</label>
        <div className="color-input">
          <input
            type="color"
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
          <span>{formData.color}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="symbol">Symbol</label>
        <select
          id="symbol"
          value={formData.symbol}
          onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
        >
          {AVAILABLE_SYMBOLS.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol.charAt(0).toUpperCase() + symbol.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="preview">
        <div
          className="category-symbol"
          style={{
            backgroundColor: formData.color,
            WebkitMaskImage: `url(/symbols/${formData.symbol}.svg)`,
            maskImage: `url(/symbols/${formData.symbol}.svg)`
          }}
        />
        <span>{formData.name}</span>
      </div>

      <div className="form-actions">
        <button type="submit">{category ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const loadedCategories = await categoryService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreateCategory = async (category: Category) => {
    try {
      await categoryService.createCategory(category);
      await loadCategories();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      await categoryService.updateCategory(category);
      await loadCategories();
      setSelectedCategory(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleExportCategories = async () => {
    try {
      const jsonData = await categoryService.exportCategories();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'categories.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export categories:', error);
    }
  };

  const handleImportCategories = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const jsonData = await file.text();
      await categoryService.importCategories(jsonData);
      await loadCategories();
      setImportError(null);
    } catch (error) {
      console.error('Failed to import categories:', error);
      setImportError('Failed to import categories. Please check the file format.');
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="category-manager">
      <div className="category-header">
        <h2>Categories</h2>
        <div className="category-actions">
          <button onClick={() => setShowForm(true)}>Create Category</button>
          <button onClick={handleExportCategories}>Export</button>
          <label className="import-button">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportCategories}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="error-message">{importError}</div>
      )}

      {showForm && (
        <div className="modal">
          <CategoryForm
            category={selectedCategory || undefined}
            onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
            onCancel={() => {
              setShowForm(false);
              setSelectedCategory(null);
            }}
          />
        </div>
      )}

      <div className="categories-list">
        {categories.map((category) => (
          <div key={category.id} className="category-item">
            <div
              className="category-symbol"
              style={{
                backgroundColor: category.color,
                WebkitMaskImage: `url(/symbols/${category.symbol}.svg)`,
                maskImage: `url(/symbols/${category.symbol}.svg)`
              }}
            />
            <span className="category-name">{category.name}</span>
            <div className="category-item-actions">
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
              <button onClick={() => category.id && handleDeleteCategory(category.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
