import React, { useState, useEffect } from 'react';
import { mapService } from '../../services/mapService';
import plotService from '../../services/plotService';

const SECTION_OPTIONS = [
  'LA-3000 A','LA-3000 B','LA-3000 C','LA-3000 E','LA-3000 F',
  'LA-6000 A','LA-6000 B','LA-6000 D','LA-6000 C',
  'LA-4000','LA-7000',
  'LA-5000 A','LA-5000 B','LA-5000 C','LA-5000 D','LA-5000 E','LA-5000 F',
  'CM-4C','CM-8D','CM-12',
  'FM-3A','FM-4A','FM-5A','FM-6A','FM-3B',
  'JM-41','JM-411',
  'LA-1000 A','LA-1000 B','LA-1000 C','LA-1000 D','LA-1000 E','LA-1000 F',
  'JM-12','JM-8',
  'LA-9000','LA-12000',
  'LA-1100 A','LA-1100 B',
  'FE-16 A','FE-24','FE-16 B',
  'LA-2000 A','LA-2000 B',
  'MT-40','MT-30',
  'M4-K6','M4-K7',
];

const AddPlotModal = ({ isOpen, onClose, onPlotAdded, center, selectedCoordinates, addPlotMode, toggleMapClickMode, onMapClick }) => {
  const DEFAULT_COORDINATES = {
    latitude: 14.682462,
    longitude: 121.0530409,
  };

  const getDefaultCoordinates = () => ({
    latitude: center ? center[0] : DEFAULT_COORDINATES.latitude,
    longitude: center ? center[1] : DEFAULT_COORDINATES.longitude,
  });

  const [formData, setFormData] = useState({
    plot_number: '',
    section: '',
    row_number: '',
    column_number: '',
    latitude: getDefaultCoordinates().latitude,
    longitude: getDefaultCoordinates().longitude,
    status: 'available',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [allPlots, setAllPlots] = useState([]);

  const generateNextPlotNumber = async () => {
    try {
      const response = await plotService.getNextNumber();
      const nextPlotNumber = response?.data?.plot_number;

      if (response?.success && nextPlotNumber) {
        setFormData((prev) => ({ ...prev, plot_number: nextPlotNumber }));
      } else {
        setFormData((prev) => ({ ...prev, plot_number: '' }));
      }
    } catch (err) {
      console.error('Error generating plot number:', err);
      setFormData((prev) => ({ ...prev, plot_number: '' }));
    }
  };

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

  // Ensure latitude/longitude always start from default coordinates when modal opens.
  useEffect(() => {
    if (!isOpen || selectedCoordinates) {
      return;
    }

    const defaults = getDefaultCoordinates();
    setFormData(prev => ({
      ...prev,
      latitude: defaults.latitude,
      longitude: defaults.longitude,
    }));
  }, [isOpen, selectedCoordinates, center]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    generateNextPlotNumber();

    const loadAllPlots = async () => {
      try {
        const res = await plotService.getAll({ per_page: 9999 });
        if (res.success) setAllPlots(res.data?.data ?? []);
      } catch (_) {
        // non-critical; duplicate check will just be skipped
      }
    };
    loadAllPlots();
  }, [isOpen]);

  // Real-time field validation
  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'section':
        if (!value.trim()) error = 'Section is required';
        break;
      case 'row_number':
        if (value === '' || value === null || value === undefined) error = 'Row number is required';
        else if (parseInt(value) < 1) error = 'Row number must be at least 1';
        break;
      case 'column_number':
        if (value === '' || value === null || value === undefined) error = 'Column number is required';
        else if (parseInt(value) < 1) error = 'Column number must be at least 1';
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
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    validateField(name, value);

    if (['section', 'row_number', 'column_number'].includes(name)) {
      const { section, row_number, column_number } = newData;
      if (section && row_number && column_number) {
        const isDup = allPlots.some(
          p =>
            p.section === section &&
            parseInt(p.row_number) === parseInt(row_number) &&
            parseInt(p.column_number) === parseInt(column_number)
        );
        setValidationErrors(prev => {
          const updated = { ...prev };
          if (isDup) {
            updated.duplicate = `Row ${row_number}, Column ${column_number} already exists in section "${section}".`;
          } else {
            delete updated.duplicate;
          }
          return updated;
        });
      } else {
        setValidationErrors(prev => { const u = { ...prev }; delete u.duplicate; return u; });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const newErrors = {};

    // Validation

    if (!formData.section || !formData.section.trim()) {
      newErrors.section = 'Section is required';
    }

    if (formData.row_number === '' || formData.row_number === null || formData.row_number === undefined) {
      newErrors.row_number = 'Row number is required';
    } else if (parseInt(formData.row_number) < 1) {
      newErrors.row_number = 'Row number must be at least 1';
    }

    if (formData.column_number === '' || formData.column_number === null || formData.column_number === undefined) {
      newErrors.column_number = 'Column number is required';
    } else if (parseInt(formData.column_number) < 1) {
      newErrors.column_number = 'Column number must be at least 1';
    }


    if (!formData.latitude && formData.latitude !== 0) {
      newErrors.latitude = 'Latitude is required';
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat)) {
        newErrors.latitude = 'Latitude must be a valid number (e.g., 14.682462)';
      } else if (lat < 14.6796 || lat > 14.6858) {
        newErrors.latitude = 'Latitude must be inside Himlayang area (14.679600 to 14.685800)';
      }
    }

    if (!formData.longitude && formData.longitude !== 0) {
      newErrors.longitude = 'Longitude is required';
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng)) {
        newErrors.longitude = 'Longitude must be a valid number (e.g., 121.0530409)';
      } else if (lng < 121.05 || lng > 121.0552) {
        newErrors.longitude = 'Longitude must be inside Himlayang area (121.050000 to 121.055200)';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    if (validationErrors.duplicate) {
      return;
    }

    setValidationErrors({});

    setLoading(true);

    try {
      // Remove empty fields
      const plotData = {
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
        await generateNextPlotNumber();
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
    const defaults = getDefaultCoordinates();
    setFormData({
      plot_number: '',
      section: '',
      row_number: '',
      column_number: '',
      latitude: defaults.latitude,
      longitude: defaults.longitude,
      status: 'available',
      notes: '',
    });
    setError('');
    setSuccess('');
    setValidationErrors({});
    setAllPlots([]);
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
              Plot Number
            </label>
            <input
              type="text"
              name="plot_number"
              value={formData.plot_number || 'Auto-generated on save'}
              readOnly
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: '#f3f4f6',
                cursor: 'not-allowed',
              }}
            />
            <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
              This is assigned automatically by the server as the next sequence.
            </small>
          </div>

          {/* Section */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Section <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              list="add-plot-section-options"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              placeholder="Select or type a section"
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: validationErrors.section ? '1px solid #ef4444' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
            <datalist id="add-plot-section-options">
              {SECTION_OPTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
            {validationErrors.section && (
              <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                {validationErrors.section}
              </small>
            )}
          </div>

          {/* Row and Column */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Row Number <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="row_number"
                value={formData.row_number}
                onChange={handleInputChange}
                placeholder="e.g., 4"
                disabled={loading}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: validationErrors.row_number ? '1px solid #ef4444' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              {validationErrors.row_number && (
                <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {validationErrors.row_number}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Column Number <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                name="column_number"
                value={formData.column_number}
                onChange={handleInputChange}
                placeholder="e.g., 4"
                disabled={loading}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: validationErrors.column_number ? '1px solid #ef4444' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              {validationErrors.column_number && (
                <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {validationErrors.column_number}
                </small>
              )}
            </div>
          </div>

          {validationErrors.duplicate && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              borderRadius: '4px',
              fontSize: '0.875rem',
              marginBottom: '15px',
              border: '1px solid #ffc107',
            }}>
              ⚠️ {validationErrors.duplicate}
            </div>
          )}

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
                step="0.00000001"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: validationErrors.latitude ? '1px solid #ef4444' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              {validationErrors.latitude && (
                <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {validationErrors.latitude}
                </small>
              )}
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
                step="0.00000001"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: validationErrors.longitude ? '1px solid #ef4444' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              {validationErrors.longitude && (
                <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {validationErrors.longitude}
                </small>
              )}
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
                border: validationErrors.notes ? '1px solid #ef4444' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            {validationErrors.notes && (
              <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                {validationErrors.notes}
              </small>
            )}
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
