import React from 'react';
import type { ChangeEvent } from 'react';
import { SearchResult, searchService } from '../../services/searchService';
import { categoryService, Category } from '../../services/categoryService';
import './Search.css';

interface SearchFilters {
  type?: 'EVENT' | 'TASK' | 'NOTE';
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: number;
}

export function Search(): JSX.Element {  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSearching, setIsSearching] = useState(false);  useEffect(() => {
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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let searchResults: SearchResult[];

      if (!filters.type) {
        searchResults = await searchService.searchAll(query);
      } else if (filters.type === 'EVENT') {
        searchResults = await searchService.searchEvents({
          query,
          startDate: filters.startDate,
          endDate: filters.endDate,
          categoryId: filters.categoryId,
        });
      } else if (filters.type === 'TASK') {
        searchResults = await searchService.searchTasks({
          query,
          dueDateStart: filters.startDate,
          dueDateEnd: filters.endDate,
          categoryId: filters.categoryId,
          status: filters.status,
          priority: filters.priority,
        });
      } else {
        searchResults = await searchService.searchNotes(query);
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters]);  useEffect(() => {
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const handleResultClick = (result: SearchResult) => {
    // We'll handle navigation in the parent component
    console.log('Selected result:', result);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev: SearchFilters) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search events, tasks, and notes..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
      </div>

      <div className="search-filters">
        <div className="filter-group">
          <select
            value={filters.type || ''}            onChange={(e: ChangeEvent<HTMLSelectElement>) => 
              handleFilterChange('type', e.target.value as SearchFilters['type'] || undefined)}
          >
            <option value="">All Types</option>
            <option value="EVENT">Events</option>
            <option value="TASK">Tasks</option>
            <option value="NOTE">Notes</option>
          </select>
        </div>

        {(filters.type === 'EVENT' || filters.type === 'TASK') && (
          <>
            <div className="filter-group">
              <select
                value={filters.categoryId?.toString() || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  handleFilterChange('categoryId', Number(e.target.value) || undefined)}
              >
                <option value="">All Categories</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  handleFilterChange('startDate', e.target.value)}
                placeholder="Start Date"
              />

              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  handleFilterChange('endDate', e.target.value)}
                placeholder="End Date"
              />
            </div>
          </>
        )}

        {filters.type === 'TASK' && (
          <>
            <div className="filter-group">
              <select
                value={filters.status || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={filters.priority?.toString() || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  handleFilterChange('priority', Number(e.target.value) || undefined)}
              >
                <option value="">All Priorities</option>
                <option value="1">Highest</option>
                <option value="2">High</option>
                <option value="3">Medium</option>
                <option value="4">Low</option>
                <option value="5">Lowest</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="search-results">
        {isSearching ? (
          <div className="no-results">Searching...</div>
        ) : results.length === 0 ? (
          <div className="no-results">
            {query.trim() ? 'No results found' : 'Enter a search term to begin'}
          </div>
        ) : (
          results.map((result: SearchResult) => (
            <div
              key={`${result.itemType}-${result.id}`}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="result-header">
                <div className="result-title">{result.title}</div>
                <div className={`result-type-badge type-${result.itemType.toLowerCase()}`}>
                  {result.itemType}
                </div>
              </div>
              {result.description && (
                <div className="result-description">{result.description}</div>
              )}
              <div className="result-meta">
                {result.date && (
                  <div>
                    {result.itemType === 'EVENT' ? 'Start: ' : 
                     result.itemType === 'TASK' ? 'Due: ' : 'Created: '}
                    {new Date(result.date).toLocaleString()}
                  </div>
                )}
                {result.status && <div> • Status: {result.status}</div>}
                {result.priority && <div> • Priority: {result.priority}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
