import React, { useState } from 'react';
import { mapService } from '../../services/mapService';

const DeletePlotModal = ({ isOpen, onClose, plot, onPlotDeleted, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleArchive = async () => {
    if (!isAdmin) {
      setError('Only administrators can archive plots');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await mapService.archivePlot(plot.id);

      if (response.success) {
        onPlotDeleted(plot.id);
        onClose();
      } else {
        setError(response.message || 'Failed to archive plot');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'An error occurred while archiving the plot'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !plot) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        <h2 style={{ marginTop: 0, color: '#e67e22', textAlign: 'center' }}>
          Archive Plot?
        </h2>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#ffe6e6',
            color: '#e74c3c',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        <p style={{ marginBottom: '10px', color: '#333' }}>
          Are you sure you want to archive plot <strong>{plot.plot_number}</strong>?
        </p>

        {!isAdmin && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '0.9rem',
          }}>
            ⚠️ Only administrators can archive plots.
          </div>
        )}

        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          The plot will be hidden from the system but kept in the database. All associated burial records will remain in the system.
        </p>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              color: '#333',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={loading || !isAdmin}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isAdmin ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: '500',
              opacity: loading || !isAdmin ? 0.6 : 1,
            }}
          >
            {loading ? 'Archiving...' : 'Archive Plot'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePlotModal;
