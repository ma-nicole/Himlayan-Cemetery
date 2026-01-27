import React, { useState, useEffect } from 'react';

const PlotForm = ({ plot, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    plot_number: '',
    section: '',
    row_number: '',
    column_number: '',
    latitude: '',
    longitude: '',
    status: 'available',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (plot) {
      setFormData({
        plot_number: plot.plot_number || '',
        section: plot.section || '',
        row_number: plot.row_number || '',
        column_number: plot.column_number || '',
        latitude: plot.latitude || '',
        longitude: plot.longitude || '',
        status: plot.status || 'available',
        notes: plot.notes || '',
      });
    }
  }, [plot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save plot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label>Plot Number *</label>
          <input
            type="text"
            name="plot_number"
            className="form-control"
            value={formData.plot_number}
            onChange={handleChange}
            placeholder="e.g., PLT-0001"
            required
          />
        </div>
        <div className="form-group">
          <label>Section</label>
          <input
            type="text"
            name="section"
            className="form-control"
            value={formData.section}
            onChange={handleChange}
            placeholder="e.g., A, B, C"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Row Number</label>
          <input
            type="number"
            name="row_number"
            className="form-control"
            value={formData.row_number}
            onChange={handleChange}
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Column Number</label>
          <input
            type="number"
            name="column_number"
            className="form-control"
            value={formData.column_number}
            onChange={handleChange}
            min="1"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Latitude *</label>
          <input
            type="number"
            name="latitude"
            className="form-control"
            value={formData.latitude}
            onChange={handleChange}
            step="0.00000001"
            placeholder="e.g., 14.5547"
            required
          />
        </div>
        <div className="form-group">
          <label>Longitude *</label>
          <input
            type="number"
            name="longitude"
            className="form-control"
            value={formData.longitude}
            onChange={handleChange}
            step="0.00000001"
            placeholder="e.g., 121.0244"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          name="status"
          className="form-control"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          className="form-control"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="modal-footer" style={{ padding: '20px 0 0 0', borderTop: 'none' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (plot ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default PlotForm;
