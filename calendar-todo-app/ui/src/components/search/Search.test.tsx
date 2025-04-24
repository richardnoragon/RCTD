import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Search } from './Search';
import { searchService } from '../../services/searchService';

jest.mock('../../services/searchService');

describe('Search Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input', () => {
    render(<Search />);
    expect(screen.getByPlaceholderText(/search events, tasks, and notes/i)).toBeInTheDocument();
  });

  test('shows loading state while searching', async () => {
    const mockSearchAll = jest.spyOn(searchService, 'searchAll').mockResolvedValue([]);
    render(<Search />);
    
    const searchInput = screen.getByPlaceholderText(/search events, tasks, and notes/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(await screen.findByText('Searching...')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSearchAll).toHaveBeenCalledWith('test');
    });
  });

  test('displays search results', async () => {
    const mockResults = [
      { id: 1, title: 'Test Event', itemType: 'EVENT', description: 'Test Description' }
    ];
    jest.spyOn(searchService, 'searchAll').mockResolvedValue(mockResults);
    
    render(<Search />);
    const searchInput = screen.getByPlaceholderText(/search events, tasks, and notes/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
