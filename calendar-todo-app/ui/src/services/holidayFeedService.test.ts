import { HolidayFeed, holidayFeedService } from './holidayFeedService';

// Mock setup is handled in setupTests.ts
declare global {
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Holiday Feed Service', () => {
  beforeEach(() => {
    (globalThis as any).resetMocks();
  });

  describe('getHolidayFeeds', () => {
    it('should fetch holiday feeds successfully', async () => {
      const mockFeeds: HolidayFeed[] = [
        {
          id: 1,
          url: 'https://example.com/holidays.ics',
          name: 'US Holidays',
          is_visible: true,
          last_sync_time: '2023-01-15 10:00:00',
          sync_error: null,
          created_at: '2023-01-01 00:00:00',
          updated_at: '2023-01-15 10:00:00'
        },
        {
          id: 2,
          url: 'https://example.com/international.ics',
          name: 'International Holidays',
          is_visible: false,
          last_sync_time: null,
          sync_error: 'Connection timeout',
          created_at: '2023-01-02 00:00:00',
          updated_at: '2023-01-02 00:00:00'
        }
      ];

      (globalThis as any).setMockResponse('get_holiday_feeds', mockFeeds);

      const result = await holidayFeedService.getHolidayFeeds();

      expect(result).toEqual(mockFeeds);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('US Holidays');
      expect(result[1].sync_error).toBe('Connection timeout');
    });

    it('should return empty array when no feeds exist', async () => {
      (globalThis as any).setMockResponse('get_holiday_feeds', []);

      const result = await holidayFeedService.getHolidayFeeds();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database connection error', async () => {
      (globalThis as any).setMockError('get_holiday_feeds', 'Database connection failed');

      await expect(holidayFeedService.getHolidayFeeds())
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle timeout error', async () => {
      (globalThis as any).setMockError('get_holiday_feeds', 'Request timeout');

      await expect(holidayFeedService.getHolidayFeeds())
        .rejects
        .toThrow('Request timeout');
    });

    it('should handle large dataset efficiently', async () => {
      const largeFeedSet = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        url: `https://example.com/feed${i + 1}.ics`,
        name: `Holiday Feed ${i + 1}`,
        is_visible: i % 2 === 0,
        last_sync_time: '2023-01-15 10:00:00',
        sync_error: null,
        created_at: '2023-01-01 00:00:00',
        updated_at: '2023-01-15 10:00:00'
      }));

      (globalThis as any).setMockResponse('get_holiday_feeds', largeFeedSet);

      const result = await holidayFeedService.getHolidayFeeds();

      expect(result).toHaveLength(50);
      expect(result[0].name).toBe('Holiday Feed 1');
      expect(result[49].name).toBe('Holiday Feed 50');
    });
  });

  describe('createHolidayFeed', () => {
    it('should create a new holiday feed successfully', async () => {
      const mockFeed: HolidayFeed = {
        url: 'https://example.com/new-feed.ics',
        name: 'New Holiday Feed',
        is_visible: true
      };

      const mockFeedId = 1;
      (globalThis as any).setMockResponse('create_holiday_feed', mockFeedId);

      const result = await holidayFeedService.createHolidayFeed(mockFeed);

      expect(result).toBe(mockFeedId);
    });

    it('should create feed with minimal data', async () => {
      const mockFeed: HolidayFeed = {
        url: 'https://minimal.com/feed.ics',
        name: 'Minimal Feed',
        is_visible: false
      };

      const mockFeedId = 2;
      (globalThis as any).setMockResponse('create_holiday_feed', mockFeedId);

      const result = await holidayFeedService.createHolidayFeed(mockFeed);

      expect(result).toBe(mockFeedId);
    });

    it('should handle invalid URL error', async () => {
      const mockFeed: HolidayFeed = {
        url: 'invalid-url',
        name: 'Invalid Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('create_holiday_feed', 'Invalid URL format');

      await expect(holidayFeedService.createHolidayFeed(mockFeed))
        .rejects
        .toThrow('Invalid URL format');
    });

    it('should handle duplicate feed name error', async () => {
      const mockFeed: HolidayFeed = {
        url: 'https://example.com/duplicate.ics',
        name: 'Duplicate Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('create_holiday_feed', 'Feed name already exists');

      await expect(holidayFeedService.createHolidayFeed(mockFeed))
        .rejects
        .toThrow('Feed name already exists');
    });

    it('should handle network validation error', async () => {
      const mockFeed: HolidayFeed = {
        url: 'https://unreachable.com/feed.ics',
        name: 'Unreachable Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('create_holiday_feed', 'URL is not accessible');

      await expect(holidayFeedService.createHolidayFeed(mockFeed))
        .rejects
        .toThrow('URL is not accessible');
    });
  });

  describe('updateHolidayFeed', () => {
    it('should update holiday feed successfully', async () => {
      const mockFeed: HolidayFeed = {
        id: 1,
        url: 'https://example.com/updated-feed.ics',
        name: 'Updated Holiday Feed',
        is_visible: false
      };

      (globalThis as any).setMockResponse('update_holiday_feed', undefined);

      await expect(holidayFeedService.updateHolidayFeed(mockFeed))
        .resolves
        .toBeNull();
    });

    it('should update only visibility status', async () => {
      const mockFeed: HolidayFeed = {
        id: 1,
        url: 'https://example.com/feed.ics',
        name: 'Existing Feed',
        is_visible: true
      };

      (globalThis as any).setMockResponse('update_holiday_feed', undefined);

      await expect(holidayFeedService.updateHolidayFeed(mockFeed))
        .resolves
        .toBeNull();
    });

    it('should handle feed not found error', async () => {
      const mockFeed: HolidayFeed = {
        id: 999,
        url: 'https://example.com/feed.ics',
        name: 'Non-existent Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('update_holiday_feed', 'Feed not found');

      await expect(holidayFeedService.updateHolidayFeed(mockFeed))
        .rejects
        .toThrow('Feed not found');
    });

    it('should handle URL validation error', async () => {
      const mockFeed: HolidayFeed = {
        id: 1,
        url: 'invalid-updated-url',
        name: 'Updated Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('update_holiday_feed', 'Invalid URL format');

      await expect(holidayFeedService.updateHolidayFeed(mockFeed))
        .rejects
        .toThrow('Invalid URL format');
    });

    it('should handle concurrent modification error', async () => {
      const mockFeed: HolidayFeed = {
        id: 1,
        url: 'https://example.com/feed.ics',
        name: 'Concurrent Feed',
        is_visible: true
      };

      (globalThis as any).setMockError('update_holiday_feed', 'Feed was modified by another user');

      await expect(holidayFeedService.updateHolidayFeed(mockFeed))
        .rejects
        .toThrow('Feed was modified by another user');
    });
  });

  describe('deleteHolidayFeed', () => {
    it('should delete holiday feed successfully', async () => {
      (globalThis as any).setMockResponse('delete_holiday_feed', undefined);

      await expect(holidayFeedService.deleteHolidayFeed(1))
        .resolves
        .toBeNull();
    });

    it('should handle feed not found error', async () => {
      (globalThis as any).setMockError('delete_holiday_feed', 'Feed not found');

      await expect(holidayFeedService.deleteHolidayFeed(999))
        .rejects
        .toThrow('Feed not found');
    });

    it('should handle foreign key constraint error', async () => {
      (globalThis as any).setMockError('delete_holiday_feed', 'Cannot delete feed with active events');

      await expect(holidayFeedService.deleteHolidayFeed(1))
        .rejects
        .toThrow('Cannot delete feed with active events');
    });

    it('should handle database lock error', async () => {
      (globalThis as any).setMockError('delete_holiday_feed', 'Database is locked');

      await expect(holidayFeedService.deleteHolidayFeed(1))
        .rejects
        .toThrow('Database is locked');
    });

    it('should handle invalid feed ID', async () => {
      (globalThis as any).setMockError('delete_holiday_feed', 'Invalid feed ID');

      await expect(holidayFeedService.deleteHolidayFeed(-1))
        .rejects
        .toThrow('Invalid feed ID');
    });
  });

  describe('syncHolidayFeed', () => {
    it('should sync holiday feed successfully', async () => {
      (globalThis as any).setMockResponse('sync_holiday_feed', undefined);

      await expect(holidayFeedService.syncHolidayFeed(1))
        .resolves
        .toBeNull();
    });

    it('should handle feed not found during sync', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Feed not found');

      await expect(holidayFeedService.syncHolidayFeed(999))
        .rejects
        .toThrow('Feed not found');
    });

    it('should handle network connection error during sync', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Failed to download feed: Connection refused');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Failed to download feed: Connection refused');
    });

    it('should handle invalid ICS format error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Failed to parse ICS data: Invalid format');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Failed to parse ICS data: Invalid format');
    });

    it('should handle HTTP timeout error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Request timeout while downloading feed');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Request timeout while downloading feed');
    });

    it('should handle HTTP 404 error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Feed URL returned 404 Not Found');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Feed URL returned 404 Not Found');
    });

    it('should handle HTTP 403 forbidden error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Access denied to feed URL');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Access denied to feed URL');
    });

    it('should handle large feed processing error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Feed too large to process');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Feed too large to process');
    });

    it('should handle malformed calendar data', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Calendar data contains invalid events');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Calendar data contains invalid events');
    });

    it('should handle SSL certificate error', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'SSL certificate verification failed');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('SSL certificate verification failed');
    });

    it('should handle database transaction failure', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Failed to save imported events');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Failed to save imported events');
    });
  });

  describe('API Integration and Error Recovery', () => {
    it('should handle service temporarily unavailable', async () => {
      (globalThis as any).setMockError('get_holiday_feeds', 'Service temporarily unavailable');

      await expect(holidayFeedService.getHolidayFeeds())
        .rejects
        .toThrow('Service temporarily unavailable');
    });

    it('should handle memory exhaustion during processing', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Out of memory while processing feed');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Out of memory while processing feed');
    });

    it('should handle invalid feed ID format', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Invalid feed ID format');

      await expect(holidayFeedService.syncHolidayFeed(0))
        .rejects
        .toThrow('Invalid feed ID format');
    });

    it('should handle corrupted feed data', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Feed contains corrupted data');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Feed contains corrupted data');
    });

    it('should handle permission denied for file operations', async () => {
      (globalThis as any).setMockError('create_holiday_feed', 'Permission denied for database write');

      const mockFeed: HolidayFeed = {
        url: 'https://example.com/feed.ics',
        name: 'Test Feed',
        is_visible: true
      };

      await expect(holidayFeedService.createHolidayFeed(mockFeed))
        .rejects
        .toThrow('Permission denied for database write');
    });

    it('should handle API rate limiting during sync', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Rate limit exceeded for feed provider');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Rate limit exceeded for feed provider');
    });

    it('should handle disk space exhaustion', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Insufficient disk space');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Insufficient disk space');
    });

    it('should handle encoding issues in feed data', async () => {
      (globalThis as any).setMockError('sync_holiday_feed', 'Feed encoding not supported');

      await expect(holidayFeedService.syncHolidayFeed(1))
        .rejects
        .toThrow('Feed encoding not supported');
    });
  });
});