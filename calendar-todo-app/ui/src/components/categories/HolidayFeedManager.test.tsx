import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HolidayFeed } from '../../services/holidayFeedService';
import { holidayFeedService } from '../../services/holidayFeedService';
import { HolidayFeedManager } from './HolidayFeedManager';

// Mock the holidayFeedService
jest.mock('../../services/holidayFeedService');
const mockHolidayFeedService = holidayFeedService as jest.Mocked<typeof holidayFeedService>;

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true)
});

describe('HolidayFeedManager', () => {
  const mockFeeds: HolidayFeed[] = [
    {
      id: 1,
      name: 'US Holidays',
      url: 'https://example.com/us-holidays.ics',
      is_visible: true,
      last_sync_time: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'UK Holidays',
      url: 'https://example.com/uk-holidays.ics',
      is_visible: false,
      last_sync_time: '2024-01-02T12:00:00Z',
      sync_error: 'Failed to fetch data',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockHolidayFeedService.getHolidayFeeds.mockResolvedValue(mockFeeds);
    mockHolidayFeedService.createHolidayFeed.mockResolvedValue(1);
    mockHolidayFeedService.updateHolidayFeed.mockResolvedValue();
    mockHolidayFeedService.deleteHolidayFeed.mockResolvedValue();
    mockHolidayFeedService.syncHolidayFeed.mockResolvedValue();
  });

  describe('Component Rendering', () => {
    test('renders holiday feed manager with header and actions', async () => {
      render(<HolidayFeedManager />);
      
      expect(screen.getByText('Holiday Calendars')).toBeInTheDocument();
      expect(screen.getByText('Add Holiday Calendar')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockHolidayFeedService.getHolidayFeeds).toHaveBeenCalled();
      });
    });

    test('renders holiday feeds list after loading', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
        expect(screen.getByText('UK Holidays')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/us-holidays.ics')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/uk-holidays.ics')).toBeInTheDocument();
      });
    });

    test('displays feed visibility status correctly', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Visible')).toBeInTheDocument();
        expect(screen.getByText('Hidden')).toBeInTheDocument();
      });
    });

    test('displays last sync time correctly', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last synced: 1\/1\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/Last synced: 1\/2\/2024/)).toBeInTheDocument();
      });
    });

    test('displays sync errors when present', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
      });
    });

    test('renders action buttons for each feed', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        const syncButtons = screen.getAllByText('Sync Now');
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        
        expect(syncButtons).toHaveLength(2);
        expect(editButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);
      });
    });
  });

  describe('Feed CRUD Operations', () => {
    test('opens create feed form when Add Holiday Calendar button is clicked', async () => {
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Feed Name *')).toBeInTheDocument();
      expect(screen.getByText('ICS Feed URL *')).toBeInTheDocument();
      expect(screen.getByText('Show in calendar')).toBeInTheDocument();
      expect(screen.getByText('Add Feed')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('creates new holiday feed with valid data', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      // Fill form
      const nameInput = screen.getByLabelText('Feed Name *');
      const urlInput = screen.getByLabelText('ICS Feed URL *');
      
      await user.type(nameInput, 'Test Holiday Feed');
      await user.type(urlInput, 'https://test.com/holidays.ics');
      
      // Submit form
      const submitButton = screen.getByText('Add Feed');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockHolidayFeedService.createHolidayFeed).toHaveBeenCalledWith({
          name: 'Test Holiday Feed',
          url: 'https://test.com/holidays.ics',
          is_visible: true
        });
      });
    });

    test('syncs feed after creation', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      // Open and submit create form
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      await user.type(screen.getByLabelText('Feed Name *'), 'Test Feed');
      await user.type(screen.getByLabelText('ICS Feed URL *'), 'https://test.com/feed.ics');
      
      const submitButton = screen.getByText('Add Feed');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockHolidayFeedService.syncHolidayFeed).toHaveBeenCalledWith(1);
      });
    });

    test('updates existing holiday feed', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click edit on first feed
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Modify form
      const nameInput = screen.getByDisplayValue('US Holidays');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated US Holidays');
      
      // Submit form
      const updateButton = screen.getByText('Update Feed');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockHolidayFeedService.updateHolidayFeed).toHaveBeenCalledWith({
          name: 'Updated US Holidays',
          url: 'https://example.com/us-holidays.ics',
          is_visible: true
        });
      });
    });

    test('syncs feed after update', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Edit and update feed
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update Feed');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockHolidayFeedService.syncHolidayFeed).toHaveBeenCalledWith(1);
      });
    });

    test('deletes holiday feed with confirmation', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click delete on first feed
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this holiday feed?');
        expect(mockHolidayFeedService.deleteHolidayFeed).toHaveBeenCalledWith(1);
      });
    });

    test('cancels feed creation', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Form should be hidden
      expect(screen.queryByLabelText('Feed Name *')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation and Inputs', () => {
    test('requires name and URL fields', async () => {
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      fireEvent.click(addButton);
      
      const nameInput = screen.getByLabelText('Feed Name *');
      const urlInput = screen.getByLabelText('ICS Feed URL *');
      
      expect(nameInput).toHaveAttribute('required');
      expect(urlInput).toHaveAttribute('required');
      expect(urlInput).toHaveAttribute('type', 'url');
    });

    test('has correct URL input placeholder', async () => {
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      fireEvent.click(addButton);
      
      const urlInput = screen.getByPlaceholderText('https://example.com/holidays.ics');
      expect(urlInput).toBeInTheDocument();
    });

    test('visibility checkbox is checked by default', async () => {
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      fireEvent.click(addButton);
      
      const visibilityCheckbox = screen.getByRole('checkbox');
      expect(visibilityCheckbox).toBeChecked();
    });

    test('can toggle visibility checkbox', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      const visibilityCheckbox = screen.getByRole('checkbox');
      await user.click(visibilityCheckbox);
      
      expect(visibilityCheckbox).not.toBeChecked();
    });

    test('pre-fills form with existing feed data for editing', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click edit on first feed
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      expect(screen.getByDisplayValue('US Holidays')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/us-holidays.ics')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    test('pre-fills form with hidden feed data correctly', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('UK Holidays')).toBeInTheDocument();
      });
      
      // Click edit on second feed (hidden one)
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[1]);
      
      expect(screen.getByDisplayValue('UK Holidays')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/uk-holidays.ics')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('Sync Functionality', () => {
    test('handles manual sync for individual feed', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click sync on first feed
      const syncButtons = screen.getAllByText('Sync Now');
      await user.click(syncButtons[0]);
      
      await waitFor(() => {
        expect(mockHolidayFeedService.syncHolidayFeed).toHaveBeenCalledWith(1);
      });
    });

    test('shows syncing state during manual sync', async () => {
      const user = userEvent.setup();
      let resolveSyncPromise: () => void;
      const syncPromise = new Promise<void>((resolve) => {
        resolveSyncPromise = resolve;
      });
      mockHolidayFeedService.syncHolidayFeed.mockReturnValue(syncPromise);
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click sync
      const syncButtons = screen.getAllByText('Sync Now');
      await user.click(syncButtons[0]);
      
      // Check syncing state
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
      
      // Resolve sync
      resolveSyncPromise!();
      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });
    });

    test('disables sync button while syncing', async () => {
      const user = userEvent.setup();
      let resolveSyncPromise: () => void;
      const syncPromise = new Promise<void>((resolve) => {
        resolveSyncPromise = resolve;
      });
      mockHolidayFeedService.syncHolidayFeed.mockReturnValue(syncPromise);
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Click sync
      const syncButtons = screen.getAllByText('Sync Now');
      await user.click(syncButtons[0]);
      
      // Button should be disabled
      const syncingButton = screen.getByText('Syncing...');
      expect(syncingButton).toBeDisabled();
      
      // Resolve sync
      resolveSyncPromise!();
      await waitFor(() => {
        const syncButton = screen.getByText('Sync Now');
        expect(syncButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles feed loading errors', async () => {
      mockHolidayFeedService.getHolidayFeeds.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load holiday feeds:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles feed creation errors', async () => {
      const user = userEvent.setup();
      mockHolidayFeedService.createHolidayFeed.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HolidayFeedManager />);
      
      // Open create form and submit
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      await user.type(screen.getByLabelText('Feed Name *'), 'Test');
      await user.type(screen.getByLabelText('ICS Feed URL *'), 'https://test.com/feed.ics');
      
      const submitButton = screen.getByText('Add Feed');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create holiday feed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles feed update errors', async () => {
      const user = userEvent.setup();
      mockHolidayFeedService.updateHolidayFeed.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Edit feed
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update Feed');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update holiday feed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles feed deletion errors', async () => {
      const user = userEvent.setup();
      mockHolidayFeedService.deleteHolidayFeed.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Delete feed
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete holiday feed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles sync errors', async () => {
      const user = userEvent.setup();
      mockHolidayFeedService.syncHolidayFeed.mockRejectedValue(new Error('Sync failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Sync feed
      const syncButtons = screen.getAllByText('Sync Now');
      await user.click(syncButtons[0]);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to sync holiday feed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('skips deletion when user cancels confirmation', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Try to delete feed
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockHolidayFeedService.deleteHolidayFeed).not.toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    test('formats date strings correctly', async () => {
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        // Check for formatted dates (exact format depends on locale)
        expect(screen.getByText(/Last synced: 1\/1\/2024/)).toBeInTheDocument();
      });
    });

    test('displays "Never" for missing last sync time', async () => {
      const feedsWithoutSync = [{
        id: 1,
        name: 'Never Synced Feed',
        url: 'https://example.com/feed.ics',
        is_visible: true
      }];
      
      mockHolidayFeedService.getHolidayFeeds.mockResolvedValue(feedsWithoutSync);
      
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Last synced: Never')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    test('shows modal when form is open', async () => {
      render(<HolidayFeedManager />);
      
      const addButton = screen.getByText('Add Holiday Calendar');
      fireEvent.click(addButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).toBeInTheDocument();
    });

    test('hides modal when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      // Open form
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).not.toBeInTheDocument();
    });

    test('resets selected feed when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<HolidayFeedManager />);
      
      await waitFor(() => {
        expect(screen.getByText('US Holidays')).toBeInTheDocument();
      });
      
      // Edit feed
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Cancel edit
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Open create form - should be empty, not pre-filled
      const addButton = screen.getByText('Add Holiday Calendar');
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Feed Name *') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});