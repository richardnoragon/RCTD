import { participantService } from './participantService';

// Mock setup is handled in setupTests.ts
declare global {
  var mockTauriInvoke: jest.MockedFunction<any>;
  var setMockResponse: (command: string, response: any) => void;
  var setMockError: (command: string, error: string) => void;
  var resetMocks: () => void;
}

describe('Participant Service', () => {
  beforeEach(() => {
    globalThis.resetMocks();
  });

  describe('CRUD Operations', () => {
    describe('getParticipants', () => {
      it('should fetch participants successfully', async () => {
        const mockParticipants = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatar_location: '/avatars/john.jpg',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            created_at: '2024-01-16T09:00:00Z',
            updated_at: '2024-01-16T09:00:00Z'
          }
        ];

        globalThis.setMockResponse('get_participants', mockParticipants);

        const result = await participantService.getParticipants();
        expect(result).toEqual(mockParticipants);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_participants');
      });

      it('should handle empty participants list', async () => {
        globalThis.setMockResponse('get_participants', []);

        const result = await participantService.getParticipants();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle network errors', async () => {
        globalThis.setMockError('get_participants', 'Failed to fetch participants');

        await expect(participantService.getParticipants()).rejects.toThrow('Failed to fetch participants');
      });
    });

    describe('createParticipant', () => {
      it('should create a participant with all fields', async () => {
        const newParticipant = {
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          avatar_location: '/avatars/alice.jpg'
        };
        const mockId = 3;

        globalThis.setMockResponse('create_participant', mockId);

        const result = await participantService.createParticipant(newParticipant);
        expect(result).toBe(mockId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_participant', { participant: newParticipant });
      });

      it('should create a participant with minimal fields', async () => {
        const newParticipant = {
          name: 'Bob Wilson'
        };
        const mockId = 4;

        globalThis.setMockResponse('create_participant', mockId);

        const result = await participantService.createParticipant(newParticipant);
        expect(result).toBe(mockId);
      });

      it('should handle creation errors', async () => {
        const newParticipant = {
          name: '',
          email: 'invalid@email'
        };

        globalThis.setMockError('create_participant', 'Participant name cannot be empty');

        await expect(participantService.createParticipant(newParticipant)).rejects.toThrow('Participant name cannot be empty');
      });

      it('should handle duplicate email errors', async () => {
        const duplicateParticipant = {
          name: 'Duplicate User',
          email: 'existing@example.com'
        };

        globalThis.setMockError('create_participant', 'Email already exists');

        await expect(participantService.createParticipant(duplicateParticipant)).rejects.toThrow('Email already exists');
      });
    });

    describe('updateParticipant', () => {
      it('should update a participant successfully', async () => {
        const participantToUpdate = {
          id: 1,
          name: 'John Updated',
          email: 'john.updated@example.com',
          avatar_location: '/avatars/john_new.jpg',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        };

        globalThis.setMockResponse('update_participant', undefined);

        await participantService.updateParticipant(participantToUpdate);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_participant', { participant: participantToUpdate });
      });

      it('should handle update errors', async () => {
        const participantToUpdate = {
          id: 999,
          name: 'Non-existent User'
        };

        globalThis.setMockError('update_participant', 'Participant not found');

        await expect(participantService.updateParticipant(participantToUpdate)).rejects.toThrow('Participant not found');
      });
    });

    describe('deleteParticipant', () => {
      it('should delete a participant successfully', async () => {
        const participantId = 1;
        globalThis.setMockResponse('delete_participant', undefined);

        await participantService.deleteParticipant(participantId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('delete_participant', { id: participantId });
      });

      it('should handle deletion errors', async () => {
        const participantId = 999;
        globalThis.setMockError('delete_participant', 'Participant not found');

        await expect(participantService.deleteParticipant(participantId)).rejects.toThrow('Participant not found');
      });

      it('should handle foreign key constraint errors', async () => {
        const participantId = 1;
        globalThis.setMockError('delete_participant', 'Cannot delete participant: assigned to events');

        await expect(participantService.deleteParticipant(participantId)).rejects.toThrow('Cannot delete participant: assigned to events');
      });
    });
  });

  describe('Event Participation Management', () => {
    describe('getEventParticipants', () => {
      it('should fetch event participants successfully', async () => {
        const mockParticipants = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          }
        ];

        globalThis.setMockResponse('get_event_participants', mockParticipants);

        const result = await participantService.getEventParticipants(5);
        expect(result).toEqual(mockParticipants);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('get_event_participants', { eventId: 5 });
      });

      it('should handle events with no participants', async () => {
        globalThis.setMockResponse('get_event_participants', []);

        const result = await participantService.getEventParticipants(10);
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle non-existent event', async () => {
        globalThis.setMockError('get_event_participants', 'Event not found');

        await expect(participantService.getEventParticipants(999)).rejects.toThrow('Event not found');
      });
    });

    describe('addParticipantToEvent', () => {
      it('should add participant to event successfully', async () => {
        const eventId = 5;
        const participantId = 1;

        globalThis.setMockResponse('add_participant_to_event', undefined);

        await participantService.addParticipantToEvent(eventId, participantId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('add_participant_to_event', {
          eventId,
          participantId
        });
      });

      it('should handle duplicate participant assignment', async () => {
        const eventId = 5;
        const participantId = 1;

        globalThis.setMockError('add_participant_to_event', 'Participant already assigned to event');

        await expect(
          participantService.addParticipantToEvent(eventId, participantId)
        ).rejects.toThrow('Participant already assigned to event');
      });

      it('should handle invalid event or participant', async () => {
        globalThis.setMockError('add_participant_to_event', 'Event or participant not found');

        await expect(
          participantService.addParticipantToEvent(999, 999)
        ).rejects.toThrow('Event or participant not found');
      });
    });

    describe('removeParticipantFromEvent', () => {
      it('should remove participant from event successfully', async () => {
        const eventId = 5;
        const participantId = 1;

        globalThis.setMockResponse('remove_participant_from_event', undefined);

        await participantService.removeParticipantFromEvent(eventId, participantId);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('remove_participant_from_event', {
          eventId,
          participantId
        });
      });

      it('should handle non-existent assignment', async () => {
        globalThis.setMockError('remove_participant_from_event', 'Participant not assigned to event');

        await expect(
          participantService.removeParticipantFromEvent(5, 999)
        ).rejects.toThrow('Participant not assigned to event');
      });
    });
  });

  describe('Import/Export Functionality', () => {
    describe('importParticipantsCsv', () => {
      it('should import participants from CSV successfully', async () => {
        const csvData = `name,email,avatar_location
John Doe,john.doe@example.com,/avatars/john.jpg
Jane Smith,jane.smith@example.com,
Bob Wilson,bob.wilson@example.com,/avatars/bob.jpg`;

        globalThis.setMockResponse('import_participants_csv', undefined);

        await participantService.importParticipantsCsv(csvData);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('import_participants_csv', { csvData });
      });

      it('should handle malformed CSV data', async () => {
        const invalidCsv = 'invalid,csv,data\nwith,incomplete';

        globalThis.setMockError('import_participants_csv', 'Invalid CSV format');

        await expect(participantService.importParticipantsCsv(invalidCsv)).rejects.toThrow('Invalid CSV format');
      });

      it('should handle empty CSV import', async () => {
        const emptyCsv = 'name,email\n';

        globalThis.setMockResponse('import_participants_csv', undefined);

        await participantService.importParticipantsCsv(emptyCsv);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('import_participants_csv', { csvData: emptyCsv });
      });

      it('should handle CSV with invalid email addresses', async () => {
        const invalidEmailCsv = 'name,email\nJohn Doe,invalid-email-format';

        globalThis.setMockError('import_participants_csv', 'Invalid email format in CSV');

        await expect(participantService.importParticipantsCsv(invalidEmailCsv)).rejects.toThrow('Invalid email format in CSV');
      });
    });

    describe('exportParticipantsCsv', () => {
      it('should export participants as CSV successfully', async () => {
        const mockCsvData = `name,email,avatar_location,created_at,updated_at
John Doe,john.doe@example.com,/avatars/john.jpg,2024-01-15T10:00:00Z,2024-01-15T10:00:00Z
Jane Smith,jane.smith@example.com,,2024-01-16T09:00:00Z,2024-01-16T09:00:00Z`;

        globalThis.setMockResponse('export_participants_csv', mockCsvData);

        const result = await participantService.exportParticipantsCsv();
        expect(result).toBe(mockCsvData);
        expect(typeof result).toBe('string');
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('export_participants_csv');
      });

      it('should handle empty export', async () => {
        const emptyHeaderCsv = 'name,email,avatar_location,created_at,updated_at\n';

        globalThis.setMockResponse('export_participants_csv', emptyHeaderCsv);

        const result = await participantService.exportParticipantsCsv();
        expect(result).toBe(emptyHeaderCsv);
      });

      it('should handle export errors', async () => {
        globalThis.setMockError('export_participants_csv', 'Export failed');

        await expect(participantService.exportParticipantsCsv()).rejects.toThrow('Export failed');
      });
    });
  });

  describe('Data Validation', () => {
    describe('Name Validation', () => {
      it('should handle participants with special characters in names', async () => {
        const specialParticipant = {
          name: 'Jean-Pierre O\'Connor Jr.',
          email: 'jean.pierre@example.com'
        };

        globalThis.setMockResponse('create_participant', 10);

        const result = await participantService.createParticipant(specialParticipant);
        expect(result).toBe(10);
        expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('create_participant', { participant: specialParticipant });
      });

      it('should handle unicode names', async () => {
        const unicodeParticipant = {
          name: '张三 (Zhang San)',
          email: 'zhang.san@example.com'
        };

        globalThis.setMockResponse('create_participant', 11);

        const result = await participantService.createParticipant(unicodeParticipant);
        expect(result).toBe(11);
      });

      it('should handle very long names', async () => {
        const longNameParticipant = {
          name: 'A'.repeat(255),
          email: 'long.name@example.com'
        };

        globalThis.setMockResponse('create_participant', 12);

        const result = await participantService.createParticipant(longNameParticipant);
        expect(result).toBe(12);
      });

      it('should handle empty name validation', async () => {
        const emptyNameParticipant = {
          name: '',
          email: 'no.name@example.com'
        };

        globalThis.setMockError('create_participant', 'Participant name cannot be empty');

        await expect(participantService.createParticipant(emptyNameParticipant)).rejects.toThrow('Participant name cannot be empty');
      });
    });

    describe('Email Validation', () => {
      it('should handle valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.co.uk',
          'user+tag@example-domain.org',
          'user123@sub.example.com'
        ];
        
        for (let i = 0; i < validEmails.length; i++) {
          const participant = {
            name: `User ${i + 1}`,
            email: validEmails[i]
          };

          globalThis.setMockResponse('create_participant', i + 20);
          const result = await participantService.createParticipant(participant);
          expect(result).toBe(i + 20);
        }
      });

      it('should handle optional email field', async () => {
        const noEmailParticipant = {
          name: 'No Email User'
        };

        globalThis.setMockResponse('create_participant', 30);

        const result = await participantService.createParticipant(noEmailParticipant);
        expect(result).toBe(30);
      });

      it('should handle invalid email formats', async () => {
        const invalidEmailParticipant = {
          name: 'Invalid Email User',
          email: 'invalid-email-format'
        };

        globalThis.setMockError('create_participant', 'Invalid email format');

        await expect(participantService.createParticipant(invalidEmailParticipant)).rejects.toThrow('Invalid email format');
      });
    });
  });

  describe('Event Assignment Workflows', () => {
    it('should handle complete event assignment workflow', async () => {
      const eventId = 5;
      const participantIds = [1, 2, 3];

      // Add multiple participants to event
      globalThis.setMockResponse('add_participant_to_event', undefined);
      
      for (const participantId of participantIds) {
        await participantService.addParticipantToEvent(eventId, participantId);
      }

      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(3);

      // Get event participants
      const mockEventParticipants = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com' }
      ];
      globalThis.setMockResponse('get_event_participants', mockEventParticipants);

      const participants = await participantService.getEventParticipants(eventId);
      expect(participants).toEqual(mockEventParticipants);
      expect(participants).toHaveLength(3);

      // Remove one participant
      globalThis.setMockResponse('remove_participant_from_event', undefined);
      await participantService.removeParticipantFromEvent(eventId, participantIds[0]);

      // Verify removal
      const updatedParticipants = mockEventParticipants.slice(1);
      globalThis.setMockResponse('get_event_participants', updatedParticipants);
      const remainingParticipants = await participantService.getEventParticipants(eventId);
      expect(remainingParticipants).toHaveLength(2);
    });

    it('should handle bulk participant assignment', async () => {
      const eventId = 10;
      const participantIds = Array.from({ length: 50 }, (_, i) => i + 1);

      globalThis.setMockResponse('add_participant_to_event', undefined);

      // Add all participants
      for (const participantId of participantIds) {
        await participantService.addParticipantToEvent(eventId, participantId);
      }

      expect(globalThis.mockTauriInvoke).toHaveBeenCalledTimes(50);

      // Verify all assignments
      const bulkParticipants = participantIds.map(id => ({
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`
      }));
      globalThis.setMockResponse('get_event_participants', bulkParticipants);

      const result = await participantService.getEventParticipants(eventId);
      expect(result).toHaveLength(50);
    });
  });

  describe('Import/Export Performance', () => {
    it('should handle large CSV import efficiently', async () => {
      const largeCsv = 'name,email\n' + 
        Array.from({ length: 1000 }, (_, i) => `User ${i + 1},user${i + 1}@example.com`).join('\n');

      globalThis.setMockResponse('import_participants_csv', undefined);

      await participantService.importParticipantsCsv(largeCsv);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('import_participants_csv', { csvData: largeCsv });
    });

    it('should handle large CSV export efficiently', async () => {
      const largeCsv = 'name,email,avatar_location,created_at,updated_at\n' +
        Array.from({ length: 1000 }, (_, i) => 
          `User ${i + 1},user${i + 1}@example.com,,2024-01-15T10:00:00Z,2024-01-15T10:00:00Z`
        ).join('\n');

      globalThis.setMockResponse('export_participants_csv', largeCsv);

      const result = await participantService.exportParticipantsCsv();
      expect(result).toBe(largeCsv);
      expect(result.length).toBeGreaterThan(50000); // Ensure it's actually large
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce Participant interface compliance', async () => {
      const validParticipant = {
        name: 'Type Test User',
        email: 'type.test@example.com'
      };

      globalThis.setMockResponse('create_participant', 999);

      const result = await participantService.createParticipant(validParticipant);
      expect(typeof result).toBe('number');
      expect(result).toBe(999);
    });

    it('should handle optional fields correctly', async () => {
      const participantWithOptionalFields = {
        id: 1,
        name: 'Optional Fields Test',
        email: 'optional@example.com',
        avatar_location: '/avatars/optional.jpg',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      };

      globalThis.setMockResponse('update_participant', undefined);

      await participantService.updateParticipant(participantWithOptionalFields);
      expect(globalThis.mockTauriInvoke).toHaveBeenCalledWith('update_participant', { participant: participantWithOptionalFields });
    });
  });
});