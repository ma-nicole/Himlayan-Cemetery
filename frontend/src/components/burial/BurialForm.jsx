import React, { useState, useEffect } from 'react';
import plotService from '../../services/plotService';

const BurialForm = ({ burial, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    plot_id: '',
    deceased_name: '',
    birth_date: '',
    death_date: '',
    burial_date: '',
    obituary: '',
    notes: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });
  const [availablePlots, setAvailablePlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available plots
  useEffect(() => {
    const loadPlots = async () => {
      try {
        const response = await plotService.getAvailable();
        if (response.success) {
          setAvailablePlots(response.data);
        }
      } catch (err) {
        console.error('Failed to load plots:', err);
      }
    };
    loadPlots();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (burial) {
      setFormData({
        plot_id: burial.plot_id || '',
        deceased_name: burial.deceased_name || '',
        birth_date: burial.birth_date?.split('T')[0] || '',
        death_date: burial.death_date?.split('T')[0] || '',
        burial_date: burial.burial_date?.split('T')[0] || '',
        obituary: burial.obituary || '',
        notes: burial.notes || '',
        contact_name: burial.contact_name || '',
        contact_phone: burial.contact_phone || '',
        contact_email: burial.contact_email || '',
      });
    }
  }, [burial]);

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
      setError(err.response?.data?.message || 'Failed to save burial record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label>Plot *</label>
          <select
            name="plot_id"
            className="form-control"
            value={formData.plot_id}
            onChange={handleChange}
            required
            disabled={!!burial}
          >
            <option value="">Select a plot</option>
            {burial?.plot && (
              <option value={burial.plot_id}>
                {burial.plot.plot_number} - Section {burial.plot.section}
              </option>
            )}
            {availablePlots.map(plot => (
              <option key={plot.id} value={plot.id}>
                {plot.plot_number} - Section {plot.section}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Deceased Name *</label>
          <input
            type="text"
            name="deceased_name"
            className="form-control"
            value={formData.deceased_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birth_date"
            className="form-control"
            value={formData.birth_date}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Death Date *</label>
          <input
            type="date"
            name="death_date"
            className="form-control"
            value={formData.death_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Burial Date *</label>
        <input
          type="date"
          name="burial_date"
          className="form-control"
          value={formData.burial_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Obituary</label>
        <textarea
          name="obituary"
          className="form-control"
          value={formData.obituary}
          onChange={handleChange}
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          className="form-control"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
        />
      </div>

      <h4 style={{ marginTop: '20px', marginBottom: '15px' }}>Contact Information</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Name</label>
          <input
            type="text"
            name="contact_name"
            className="form-control"
            value={formData.contact_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Contact Phone</label>
          <input
            type="text"
            name="contact_phone"
            className="form-control"
            value={formData.contact_phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contact Email</label>
        <input
          type="email"
          name="contact_email"
          className="form-control"
          value={formData.contact_email}
          onChange={handleChange}
        />
      </div>

      <div className="modal-footer" style={{ padding: '20px 0 0 0', borderTop: 'none' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (burial ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default BurialForm;
