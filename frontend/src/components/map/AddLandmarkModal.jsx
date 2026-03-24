import React, { useState, useEffect } from 'react';
import { mapService } from '../../services/mapService';

const LANDMARK_NAMES = [
  'Main Gate',
  'Chapel',
  'Admin Office',
  'Parking Area',
  'Comfort Room',
  'Information Booth',
  'Entrance',
  'Exit',
  'Food Stall',
  'Cultural Heritage',
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'under maintenance', label: 'Under Maintenance' },
  { value: 'n/a', label: 'N/A' },
];

const AddLandmarkModal = ({
  isOpen,
  onClose,
  onLandmarkAdded,
  onLandmarkUpdated,
  initialData,
  center,
  selectedCoordinates,
  addLandmarkMode,
  toggleMapClickMode,
}) => {
  const isEditMode = !!initialData;
  const DEFAULT_COORDINATES = { latitude: 14.682462, longitude: 121.0530409 };

  const getDefaultCoordinates = () => ({
    latitude: center ? center[0] : DEFAULT_COORDINATES.latitude,
    longitude: center ? center[1] : DEFAULT_COORDINATES.longitude,
  });

  const getInitialFormData = () => {
    if (initialData) {
      return {
        name: initialData.name || 'Main Gate',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        status: initialData.status || 'open',
        notes: initialData.notes || '',
      };
    }
    const coords = getDefaultCoordinates();
    return {
      name: 'Main Gate',
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: 'open',
      notes: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Single combined effect: handles modal open, edit mode, and map-click coordinates
  useEffect(() => {
    if (!isOpen) return;

    if (selectedCoordinates) {
      // Map-click picked coordinates — update lat/lng only, preserve other fields
      setFormData(prev => ({
        ...prev,
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude,
      }));
    } else if (initialData) {
      // Edit mode opening fresh (no map-click coords)
      setFormData({
        name: initialData.name || 'Main Gate',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        status: initialData.status || 'open',
        notes: initialData.notes || '',
      });
    } else {
      // Add mode without coordinates
      const coords = getDefaultCoordinates();
      setFormData({
        name: 'Main Gate',
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: 'open',
        notes: '',
      });
    }
    setError('');
    setSuccess('');
    setValidationErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, selectedCoordinates]);

  // Real-time field validation
  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Landmark name is required';
        break;
      case 'latitude': {
        const lat = parseFloat(value);
        if (value !== '' && isNaN(lat)) error = 'Latitude must be a valid number (e.g., 14.682462)';
        else if (!isNaN(lat) && (lat < 14.6796 || lat > 14.6858)) error = 'Latitude must be inside Himlayang area (14.679600 to 14.685800)';
        break;
      }
      case 'longitude': {
        const lng = parseFloat(value);
        if (value !== '' && isNaN(lng)) error = 'Longitude must be a valid number (e.g., 121.0530409)';
        else if (!isNaN(lng) && (lng < 121.05 || lng > 121.0552)) error = 'Longitude must be inside Himlayang area (121.050000 to 121.055200)';
        break;
      }
      default:
        break;
    }
    setValidationErrors(prev => {
      const updated = { ...prev };
      if (error) { updated[name] = error; } else { delete updated[name]; }
      return updated;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Landmark name is required';
    }

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat)) {
      newErrors.latitude = 'Latitude must be a valid number (e.g., 14.682462)';
    } else if (lat < 14.6796 || lat > 14.6858) {
      newErrors.latitude = 'Latitude must be inside Himlayang area (14.679600 to 14.685800)';
    }

    const lng = parseFloat(formData.longitude);
    if (isNaN(lng)) {
      newErrors.longitude = 'Longitude must be a valid number (e.g., 121.0530409)';
    } else if (lng < 121.05 || lng > 121.0552) {
      newErrors.longitude = 'Longitude must be inside Himlayang area (121.050000 to 121.055200)';
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      const landmarkData = {
        name: formData.name,
        latitude: lat,
        longitude: lng,
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      let response;
      if (isEditMode) {
        const numericId = String(initialData.id).replace('lm_', '');
        response = await mapService.updateLandmark(numericId, landmarkData);
      } else {
        response = await mapService.createLandmark(landmarkData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Landmark updated successfully!' : 'Landmark created successfully!');
        setTimeout(() => {
          if (isEditMode && onLandmarkUpdated) {
            onLandmarkUpdated(response.data);
          } else if (!isEditMode && onLandmarkAdded) {
            onLandmarkAdded(response.data);
          }
          handleClose();
        }, 1200);
      } else {
        setError(response.message || (isEditMode ? 'Failed to update landmark' : 'Failed to create landmark'));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'An error occurred while creating the landmark'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    const defaults = getDefaultCoordinates();
    setFormData({
      name: 'Main Gate',
      latitude: defaults.latitude,
      longitude: defaults.longitude,
      status: 'open',
      notes: '',
    });
    setError('');
    setSuccess('');
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px',
    border: `1px solid ${hasError ? '#e74c3c' : '#ddd'}`,
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#333',
  };

  const fieldStyle = { marginBottom: '15px' };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
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
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ marginTop: 0, color: '#1a1a2e' }}>{isEditMode ? 'Edit Landmark' : 'Add Landmark'}</h2>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#ffe6e6', color: '#e74c3c', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', backgroundColor: '#e6ffe6', color: '#27ae60', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>
            ✓ {success}
          </div>
        )}

        {selectedCoordinates && (
          <div style={{ padding: '12px', backgroundColor: '#e6f3ff', color: '#27ae60', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span>
            <span>Location selected: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}</span>
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
              backgroundColor: addLandmarkMode ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
            }}
          >
            {addLandmarkMode ? '✕ Disable Map Mode' : '📍 Click on Map to Set Location'}
          </button>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>
            {addLandmarkMode
              ? 'This form will close. Click a location on the map to select coordinates.'
              : 'Or enter coordinates manually below.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Landmark Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Landmark Name <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <select
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              style={inputStyle(validationErrors.name)}
            >
              {LANDMARK_NAMES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {validationErrors.name && (
              <small style={{ color: '#e74c3c' }}>{validationErrors.name}</small>
            )}
          </div>

          {/* Latitude & Longitude */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>
                Latitude <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.0000001"
                disabled={loading}
                style={inputStyle(validationErrors.latitude)}
              />
              {validationErrors.latitude && (
                <small style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{validationErrors.latitude}</small>
              )}
            </div>
            <div>
              <label style={labelStyle}>
                Longitude <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.0000001"
                disabled={loading}
                style={inputStyle(validationErrors.longitude)}
              />
              {validationErrors.longitude && (
                <small style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{validationErrors.longitude}</small>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
              style={inputStyle(false)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information about this landmark"
              disabled={loading}
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#1a472a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
              }}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Landmark')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLandmarkModal;
