import React from 'react';
import { render, screen } from '@testing-library/react';
import { Search } from './Search';
import { searchService } from '../../services/searchService';

jest.mock('../../services/searchService');

describe('Search Component Performance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces search input', () => {
    const mockSearchAll = jest.spyOn(searchService, 'searchAll').mockResolvedValue([]);
    render(<Search />);
    
    const t0 = performance.now();
    const searchInput = screen.getByPlaceholderText(/search events, tasks, and notes/i);
    
    // Type "test" rapidly
    'test'.split('').forEach((char) => {
      searchInput.textContent = char;
      jest.advanceTimersByTime(50); // Simulate typing each character 50ms apart
    });

    const t1 = performance.now();
    
    // Should only make one API call after debounce
    jest.advanceTimersByTime(300);
    expect(mockSearchAll).toHaveBeenCalledTimes(1);
    
    // Ensure rendering is performant
    expect(t1 - t0).toBeLessThan(100); // Should render updates in less than 100ms
  });
});
