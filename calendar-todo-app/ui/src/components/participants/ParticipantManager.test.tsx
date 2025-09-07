import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Participant } from '../../services/participantService';
import { participantService } from '../../services/participantService';
import { ParticipantManager } from './ParticipantManager';

// Mock the participantService
jest.mock('../../services/participantService');
const mockParticipantService = participantService as jest.Mocked<typeof participantService>;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and DOM methods
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    appendChild: mockAppendChild,
    click: mockClick,
    style: { display: '' }
  }))
});
Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true)
});

describe('ParticipantManager', () => {
  const mockParticipants: Participant[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar_location: '/avatars/john.png',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: 'Bob Wilson',
      avatar_location: '/avatars/bob.png',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockParticipantService.getParticipants.mockResolvedValue(mockParticipants);
    mockParticipantService.createParticipant.mockResolvedValue(1);
    mockParticipantService.updateParticipant.mockResolvedValue();
    mockParticipantService.deleteParticipant.mockResolvedValue();
    mockParticipantService.exportParticipantsCsv.mockResolvedValue('name,email\nJohn,john@example.com');
    mockParticipantService.importParticipantsCsv.mockResolvedValue();
  });

  describe('Component Rendering', () => {
    test('renders participant manager with header and actions', async () => {
      render(<ParticipantManager />);
      
      expect(screen.getByText('Participants')).toBeInTheDocument();
      expect(screen.getByText('Add Participant')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockParticipantService.getParticipants).toHaveBeenCalled();
      });
    });

    test('renders participants list after loading', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });

    test('displays participant avatars correctly', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const avatarImages = screen.getAllByRole('img');
        expect(avatarImages).toHaveLength(2); // John and Bob have avatars
        
        const johnAvatar = screen.getByAltText("John Doe's avatar");
        const bobAvatar = screen.getByAltText("Bob Wilson's avatar");
        
        expect(johnAvatar).toHaveAttribute('src', '/avatars/john.png');
        expect(bobAvatar).toHaveAttribute('src', '/avatars/bob.png');
      });
    });

    test('displays avatar placeholder for participants without avatars', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const placeholder = document.querySelector('.participant-avatar-placeholder');
        expect(placeholder).toBeInTheDocument();
        expect(placeholder).toHaveTextContent('J'); // First letter of Jane
      });
    });

    test('renders edit and delete buttons for each participant', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
      });
    });

    test('handles missing email gracefully', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        // Bob Wilson has no email, so it shouldn't be displayed
        expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('Participant CRUD Operations', () => {
    test('opens create participant form when Add Participant button is clicked', async () => {
      render(<ParticipantManager />);
      
      const addButton = screen.getByText('Add Participant');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Avatar Location')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('creates new participant with valid data', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Fill form
      const nameInput = screen.getByLabelText('Name *');
      const emailInput = screen.getByLabelText('Email');
      const avatarInput = screen.getByLabelText('Avatar Location');
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(avatarInput, '/avatars/test.png');
      
      // Submit form
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockParticipantService.createParticipant).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          avatar_location: '/avatars/test.png'
        });
      });
    });

    test('creates participant with minimal data (name only)', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Fill only required field
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'Minimal User');
      
      // Submit form
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockParticipantService.createParticipant).toHaveBeenCalledWith({
          name: 'Minimal User',
          email: '',
          avatar_location: ''
        });
      });
    });

    test('updates existing participant', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Click edit on first participant
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Modify form
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');
      
      // Submit form
      const updateButton = screen.getByText('Update');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockParticipantService.updateParticipant).toHaveBeenCalledWith({
          name: 'John Updated',
          email: 'john@example.com',
          avatar_location: '/avatars/john.png'
        });
      });
    });

    test('deletes participant with confirmation', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Click delete on first participant
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this participant?');
        expect(mockParticipantService.deleteParticipant).toHaveBeenCalledWith(1);
      });
    });

    test('cancels participant creation', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Form should be hidden
      expect(screen.queryByLabelText('Name *')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation and Inputs', () => {
    test('requires name field for participant creation', async () => {
      render(<ParticipantManager />);
      
      const addButton = screen.getByText('Add Participant');
      fireEvent.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      expect(nameInput).toHaveAttribute('required');
    });

    test('email input has correct type', async () => {
      render(<ParticipantManager />);
      
      const addButton = screen.getByText('Add Participant');
      fireEvent.click(addButton);
      
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('avatar input has correct placeholder', async () => {
      render(<ParticipantManager />);
      
      const addButton = screen.getByText('Add Participant');
      fireEvent.click(addButton);
      
      const avatarInput = screen.getByPlaceholderText('Path to avatar image');
      expect(avatarInput).toBeInTheDocument();
    });

    test('displays form preview with participant data', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Fill form
      const nameInput = screen.getByLabelText('Name *');
      const emailInput = screen.getByLabelText('Email');
      const avatarInput = screen.getByLabelText('Avatar Location');
      
      await user.type(nameInput, 'Preview User');
      await user.type(emailInput, 'preview@example.com');
      await user.type(avatarInput, '/test-avatar.png');
      
      // Check preview
      expect(screen.getByText('Preview User')).toBeInTheDocument();
      expect(screen.getByText('preview@example.com')).toBeInTheDocument();
      expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', '/test-avatar.png');
    });

    test('shows avatar placeholder in preview when no avatar provided', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Fill only name
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'No Avatar User');
      
      // Check preview shows placeholder
      expect(screen.getByText('No Avatar')).toBeInTheDocument();
    });

    test('handles avatar loading error in preview', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open create form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Fill avatar with invalid path
      const avatarInput = screen.getByLabelText('Avatar Location');
      await user.type(avatarInput, '/invalid-avatar.png');
      
      // Trigger error
      const avatarImg = screen.getByAltText('Avatar preview') as HTMLImageElement;
      fireEvent.error(avatarImg);
      
      expect(avatarImg.src).toContain('/default-avatar.png');
    });

    test('pre-fills form with existing participant data for editing', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Click edit on first participant
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('/avatars/john.png')).toBeInTheDocument();
    });

    test('handles empty email field correctly', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
      
      // Edit participant without email
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[2]); // Bob Wilson
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });
  });

  describe('Avatar Handling', () => {
    test('handles avatar loading errors in participant list', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const johnAvatar = screen.getByAltText("John Doe's avatar") as HTMLImageElement;
        fireEvent.error(johnAvatar);
        expect(johnAvatar.src).toContain('/default-avatar.png');
      });
    });

    test('displays first letter of name in avatar placeholder', async () => {
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const placeholder = document.querySelector('.participant-avatar-placeholder');
        expect(placeholder).toHaveTextContent('J'); // Jane Smith
      });
    });

    test('uses uppercase for avatar placeholder letter', async () => {
      const participantsWithLowercase = [{
        id: 1,
        name: 'alice cooper',
        email: 'alice@example.com'
      }];
      
      mockParticipantService.getParticipants.mockResolvedValue(participantsWithLowercase);
      
      render(<ParticipantManager />);
      
      await waitFor(() => {
        const placeholder = document.querySelector('.participant-avatar-placeholder');
        expect(placeholder).toHaveTextContent('A');
      });
    });
  });

  describe('Import/Export Functionality', () => {
    test('exports participants as CSV file', async () => {
      const user = userEvent.setup();
      mockParticipantService.exportParticipantsCsv.mockResolvedValue('name,email\nJohn,john@example.com');
      
      render(<ParticipantManager />);
      
      const exportButton = screen.getByText('Export CSV');
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(mockParticipantService.exportParticipantsCsv).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });

    test('imports participants from CSV file', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      const fileInput = screen.getByDisplayValue('');
      const file = new File(['name,email\nNewUser,new@example.com'], 'participants.csv', {
        type: 'text/csv'
      });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockParticipantService.importParticipantsCsv).toHaveBeenCalledWith('name,email\nNewUser,new@example.com');
      });
    });

    test('handles import errors gracefully', async () => {
      const user = userEvent.setup();
      mockParticipantService.importParticipantsCsv.mockRejectedValue(new Error('Import failed'));
      
      render(<ParticipantManager />);
      
      const fileInput = screen.getByDisplayValue('');
      const file = new File(['invalid csv'], 'participants.csv', { type: 'text/csv' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to import participants. Please check the CSV format.')).toBeInTheDocument();
      });
    });

    test('clears import error on successful import', async () => {
      const user = userEvent.setup();
      
      // First, cause an error
      mockParticipantService.importParticipantsCsv.mockRejectedValueOnce(new Error('Import failed'));
      
      render(<ParticipantManager />);
      
      const fileInput = screen.getByDisplayValue('');
      let file = new File(['invalid'], 'participants.csv', { type: 'text/csv' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to import participants. Please check the CSV format.')).toBeInTheDocument();
      });
      
      // Then succeed
      mockParticipantService.importParticipantsCsv.mockResolvedValue();
      file = new File(['name,email\nValid,valid@example.com'], 'participants.csv', { type: 'text/csv' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.queryByText('Failed to import participants. Please check the CSV format.')).not.toBeInTheDocument();
      });
    });

    test('resets file input after import attempt', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
      const file = new File(['name,email'], 'participants.csv', { type: 'text/csv' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });

    test('accepts only CSV files for import', async () => {
      render(<ParticipantManager />);
      
      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toHaveAttribute('accept', '.csv');
    });
  });

  describe('Error Handling', () => {
    test('handles participant loading errors', async () => {
      mockParticipantService.getParticipants.mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load participants:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles participant creation errors', async () => {
      const user = userEvent.setup();
      mockParticipantService.createParticipant.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParticipantManager />);
      
      // Open create form and submit
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'Test');
      
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create participant:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles participant update errors', async () => {
      const user = userEvent.setup();
      mockParticipantService.updateParticipant.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Edit participant
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update participant:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles participant deletion errors', async () => {
      const user = userEvent.setup();
      mockParticipantService.deleteParticipant.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Delete participant
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete participant:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('handles export errors', async () => {
      const user = userEvent.setup();
      mockParticipantService.exportParticipantsCsv.mockRejectedValue(new Error('Export failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParticipantManager />);
      
      const exportButton = screen.getByText('Export CSV');
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to export participants:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('skips deletion when user cancels confirmation', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Try to delete participant
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockParticipantService.deleteParticipant).not.toHaveBeenCalled();
    });
  });

  describe('Modal Behavior', () => {
    test('shows modal when form is open', async () => {
      render(<ParticipantManager />);
      
      const addButton = screen.getByText('Add Participant');
      fireEvent.click(addButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).toBeInTheDocument();
    });

    test('hides modal when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      // Open form
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      const modal = document.querySelector('.modal');
      expect(modal).not.toBeInTheDocument();
    });

    test('resets selected participant when form is cancelled', async () => {
      const user = userEvent.setup();
      render(<ParticipantManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Edit participant
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      // Cancel edit
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Open create form - should be empty, not pre-filled
      const addButton = screen.getByText('Add Participant');
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});