import React, { useState, useEffect } from 'react';
import { Participant, participantService } from '../../services/participantService';
import './Participants.css';

interface ParticipantFormProps {
  participant?: Participant;
  onSubmit: (participant: Participant) => Promise<void>;
  onCancel: () => void;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ participant, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Participant>({
    name: participant?.name || '',
    email: participant?.email || '',
    avatar_location: participant?.avatar_location || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="participant-form">
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="avatar">Avatar Location</label>
        <input
          type="text"
          id="avatar"
          value={formData.avatar_location || ''}
          onChange={(e) => setFormData({ ...formData, avatar_location: e.target.value })}
          placeholder="Path to avatar image"
        />
      </div>

      <div className="preview">
        {formData.avatar_location ? (
          <img
            src={formData.avatar_location}
            alt="Avatar preview"
            className="avatar-preview"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />
        ) : (
          <div className="avatar-placeholder">No Avatar</div>
        )}
        <div className="preview-info">
          <strong>{formData.name}</strong>
          {formData.email && <span>{formData.email}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit">{participant ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export const ParticipantManager: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const loadedParticipants = await participantService.getParticipants();
      setParticipants(loadedParticipants);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const handleCreateParticipant = async (participant: Participant) => {
    try {
      await participantService.createParticipant(participant);
      await loadParticipants();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create participant:', error);
    }
  };

  const handleUpdateParticipant = async (participant: Participant) => {
    try {
      await participantService.updateParticipant(participant);
      await loadParticipants();
      setSelectedParticipant(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update participant:', error);
    }
  };

  const handleDeleteParticipant = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this participant?')) {
      try {
        await participantService.deleteParticipant(id);
        await loadParticipants();
      } catch (error) {
        console.error('Failed to delete participant:', error);
      }
    }
  };

  const handleExportParticipants = async () => {
    try {
      const csvData = await participantService.exportParticipantsCsv();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'participants.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export participants:', error);
    }
  };

  const handleImportParticipants = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvData = await file.text();
      await participantService.importParticipantsCsv(csvData);
      await loadParticipants();
      setImportError(null);
    } catch (error) {
      console.error('Failed to import participants:', error);
      setImportError('Failed to import participants. Please check the CSV format.');
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="participant-manager">
      <div className="participant-header">
        <h2>Participants</h2>
        <div className="participant-actions">
          <button onClick={() => setShowForm(true)}>Add Participant</button>
          <button onClick={handleExportParticipants}>Export CSV</button>
          <label className="import-button">
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportParticipants}
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
          <ParticipantForm
            participant={selectedParticipant || undefined}
            onSubmit={selectedParticipant ? handleUpdateParticipant : handleCreateParticipant}
            onCancel={() => {
              setShowForm(false);
              setSelectedParticipant(null);
            }}
          />
        </div>
      )}

      <div className="participants-list">
        {participants.map((participant) => (
          <div key={participant.id} className="participant-item">
            {participant.avatar_location ? (
              <img
                src={participant.avatar_location}
                alt={`${participant.name}'s avatar`}
                className="participant-avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
            ) : (
              <div className="participant-avatar-placeholder">
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="participant-info">
              <span className="participant-name">{participant.name}</span>
              {participant.email && (
                <span className="participant-email">{participant.email}</span>
              )}
            </div>
            <div className="participant-item-actions">
              <button
                onClick={() => {
                  setSelectedParticipant(participant);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
              <button onClick={() => participant.id && handleDeleteParticipant(participant.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
