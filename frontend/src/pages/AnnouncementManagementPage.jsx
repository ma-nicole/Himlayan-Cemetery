import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/common/Layout';
import { validateRequired, validateTextArea } from '../utils/formValidator';
import '../styles/AdminManagement.css';

const AnnouncementManagementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_active: true,
    expires_at: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [archiveConfirmId, setArchiveConfirmId] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  useEffect(() => {
    loadAnnouncements();
    loadStats();
  }, [searchQuery, typeFilter, pagination.currentPage]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('all', '1');
      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', pagination.currentPage);
      params.append('per_page', 10);

      const response = await api.get(`/announcements?${params.toString()}`);
      if (response.data.success) {
        setAnnouncements(response.data.data);
        setPagination({
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total
        });
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/announcements/statistics');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setFormError('');
    setValidationErrors({});
    if (mode === 'edit' && item) {
      setFormData({
        title: item.title,
        content: item.content,
        type: item.type,
        is_active: item.is_active,
        expires_at: item.expires_at ? item.expires_at.split('T')[0] : ''
      });
    } else {
      setFormData({ title: '', content: '', type: 'info', is_active: true, expires_at: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const newErrors = {};

    // Validate title
    const titleValidation = validateRequired(formData.title, 'Title');
    if (!titleValidation.valid) {
      newErrors.title = titleValidation.error;
    }

    // Validate content
    const contentValidation = validateRequired(formData.content, 'Content');
    if (!contentValidation.valid) {
      newErrors.content = contentValidation.error;
    }

    // Validate content length
    if (formData.content.trim()) {
      const textAreaValidation = validateTextArea(formData.content, 'Content', 10, 5000);
      if (!textAreaValidation.valid) {
        newErrors.content = textAreaValidation.error;
      }
    }

    // If there are validation errors, show them
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.expires_at) delete payload.expires_at;

      if (modalMode === 'add') {
        await api.post('/announcements', payload);
      } else {
        await api.put(`/announcements/${selectedItem.id}`, payload);
      }
      setShowModal(false);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = (id) => {
    setArchiveConfirmId(id);
    setArchiveError('');
  };

  const handleConfirmedDelete = async () => {
    try {
      await api.delete(`/announcements/${archiveConfirmId}`);
      setArchiveConfirmId(null);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      setArchiveError('Failed to archive announcement. Please try again.');
    }
  };

  const getTypeBadgeClass = (type) => {
    const classes = { info: 'badge-info', warning: 'badge-warning', urgent: 'badge-urgent' };
    return classes[type] || 'badge-info';
  };

  return (
    <Layout>
      <div className="admin-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Announcements</h1>
              <p>Manage system announcements and notices</p>
            </div>
            <button className="btn-add" onClick={() => handleOpenModal('add')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Announcement
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.total || 0}</span><span className="stat-label">Total</span></div>
            </div>
            <div className="stat-card active">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.active || 0}</span><span className="stat-label">Active</span></div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.urgent || 0}</span><span className="stat-label">Urgent</span></div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search announcements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-dropdown">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="data-table-container">
            {loading ? (
              <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">No announcements found</td></tr>
                  ) : (
                    announcements.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.title}</strong></td>
                        <td><span className={`type-badge ${getTypeBadgeClass(item.type)}`}>{item.type}</span></td>
                        <td><span className={`status-badge ${item.is_active ? 'badge-active' : 'badge-inactive'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>{item.author?.name || 'Unknown'}</td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleOpenModal('edit', item)} title="Edit">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              className="btn-archive"
                              onClick={() => handleDelete(item.id)}
                              title="Archive"
                              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontWeight: '500' }}
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {pagination.lastPage > 1 && (
              <div className="pagination">
                <button disabled={pagination.currentPage === 1} onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}>Previous</button>
                <span>Page {pagination.currentPage} of {pagination.lastPage}</span>
                <button disabled={pagination.currentPage === pagination.lastPage} onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}>Next</button>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <h2>{modalMode === 'add' ? 'New Announcement' : 'Edit Announcement'}</h2>
              {formError && <div className="form-error">{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => {
                      setFormData({...formData, title: e.target.value});
                      const r = e.target.value.trim() ? validateRequired(e.target.value, 'Title') : { valid: true };
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        if (!r.valid) { updated.title = r.error; } else { delete updated.title; }
                        return updated;
                      });
                    }} 
                    className={validationErrors.title ? 'error' : ''}
                    required 
                  />
                  {validationErrors.title && (
                    <small className="error-message">{validationErrors.title}</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <textarea 
                    rows="4" 
                    value={formData.content} 
                    onChange={(e) => {
                      setFormData({...formData, content: e.target.value});
                      let error = null;
                      if (e.target.value.trim()) {
                        const r = validateTextArea(e.target.value, 'Content', 10, 5000);
                        if (!r.valid) error = r.error;
                      }
                      setValidationErrors(prev => {
                        const updated = { ...prev };
                        if (error) { updated.content = error; } else { delete updated.content; }
                        return updated;
                      });
                    }} 
                    className={validationErrors.content ? 'error' : ''}
                    required 
                  />
                  {validationErrors.content && (
                    <small className="error-message">{validationErrors.content}</small>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expires At</label>
                    <input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} />
                  </div>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                    Active
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit" disabled={Object.keys(validationErrors).length > 0}>{modalMode === 'add' ? 'Create' : 'Update'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      {archiveConfirmId !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', padding: '40px 36px', maxWidth: '420px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>&times;</button>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🗄️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Archive This Announcement?</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Are you sure you want to archive this announcement?</p>
            <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>This cannot be undone.</p>
            {archiveError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>{archiveError}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }} style={{ padding: '10px 28px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleConfirmedDelete} style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: '#1a472a', color: '#fff', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>Yes, Archive</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AnnouncementManagementPage;
