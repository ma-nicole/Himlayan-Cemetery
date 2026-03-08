import React, { useState, useEffect } from 'react';
import { mapService } from '../../services/mapService';

const AddPlotModal = ({ isOpen, onClose, onPlotAdded, center, selectedCoordinates, addPlotMode, toggleMapClickMode, onMapClick }) => {
  const [formData, setFormData] = useState({
    plot_number: '',
    section: '',
    row_number: '',
    column_number: '',
    latitude: center ? center[0] : 14.5547,
    longitude: center ? center[1] : 121.0244,
    status: 'available',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form data when selectedCoordinates changes
  useEffect(() => {
    if (selectedCoordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude,
      }));
    }
  }, [selectedCoordinates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.plot_number.trim()) {
      setError('Plot number is required');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Latitude and longitude are required');
      return;
    }

    setLoading(true);

    try {
      // Remove empty fields
      const plotData = {
        plot_number: formData.plot_number,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        status: formData.status,
      };

      if (formData.section.trim()) plotData.section = formData.section;
      if (formData.row_number) plotData.row_number = parseInt(formData.row_number);
      if (formData.column_number) plotData.column_number = parseInt(formData.column_number);
      if (formData.notes.trim()) plotData.notes = formData.notes;

      const response = await mapService.createPlot(plotData);

      if (response.success) {
        setSuccess('Plot created successfully!');
        setTimeout(() => {
          onPlotAdded(response.data);
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to create plot');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'An error occurred while creating the plot'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      plot_number: '',
      section: '',
      row_number: '',
      column_number: '',
      latitude: center ? center[0] : 14.5547,
      longitude: center ? center[1] : 121.0244,
      status: 'available',
      notes: '',
    });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

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
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        <h2 style={{ marginTop: 0, color: '#1a1a2e' }}>Add New Plot</h2>
        
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

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: '#e6ffe6',
            color: '#27ae60',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '0.9rem',
          }}>
            ✓ {success}
          </div>
        )}

        {selectedCoordinates && (
          <div style={{
            padding: '12px',
            backgroundColor: '#e6f3ff',
            color: '#27ae60',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>✓</span>
            <span>Location selected from map: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}</span>
          </div>
        )}

        {/* Map Click Mode Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={toggleMapClickMode}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: addPlotMode ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'background-color 0.3s',
            }}
          >
            {addPlotMode ? '✕ Disable Map Mode' : '📍 Click on Map to Set Location'}
          </button>
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.85rem',
            marginTop: '8px',
            fontWeight: '500',
          }}>
            {addPlotMode 
              ? 'This form will close. Click a location on the map to select coordinates.' 
              : 'Or enter coordinates manually below.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Plot Number */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Plot Number <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              name="plot_number"
              value={formData.plot_number}
              onChange={handleInputChange}
              placeholder="e.g., PLT-0001"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Section */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Section
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              placeholder="e.g., D"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Row and Column */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Row
              </label>
              <input
                type="number"
                name="row_number"
                value={formData.row_number}
                onChange={handleInputChange}
                placeholder="e.g., 4"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Column
              </label>
              <input
                type="number"
                name="column_number"
                value={formData.column_number}
                onChange={handleInputChange}
                placeholder="e.g., 4"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Latitude and Longitude */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Latitude <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.000001"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Longitude <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.000001"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information about this plot"
              disabled={loading}
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={handleClose}
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
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Plot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlotModal;
