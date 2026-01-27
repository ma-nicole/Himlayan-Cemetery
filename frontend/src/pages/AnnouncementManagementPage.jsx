import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
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
  const [formError, setFormError] = useState('');
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      alert('Failed to delete announcement');
    }
  };

  const getTypeBadgeClass = (type) => {
    const classes = { info: 'badge-info', warning: 'badge-warning', success: 'badge-success', urgent: 'badge-urgent' };
    return classes[type] || 'badge-info';
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
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
                <option value="success">Success</option>
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
                            <button className="btn-delete" onClick={() => handleDelete(item.id)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <textarea rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
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
                  <button type="submit" className="btn-submit">{modalMode === 'add' ? 'Create' : 'Update'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnouncementManagementPage;
