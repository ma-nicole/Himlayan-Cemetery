import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import '../styles/AdminManagement.css';

const ServiceRequestManagementPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ status: '', admin_notes: '' });
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [searchQuery, statusFilter, pagination.currentPage]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.currentPage);
      params.append('per_page', 10);

      const response = await api.get(`/service-requests?${params.toString()}`);
      if (response.data.success) {
        setRequests(response.data.data);
        setPagination({
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total
        });
      }
    } catch (error) {
      console.error('Failed to load service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/service-requests/statistics');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setFormData({ status: item.status, admin_notes: item.admin_notes || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.put(`/service-requests/${selectedItem.id}`, formData);
      setShowModal(false);
      loadRequests();
      loadStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/service-requests/${id}`);
      loadRequests();
      loadStats();
    } catch (error) {
      alert('Failed to delete request');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', completed: 'badge-completed' };
    return classes[status] || 'badge-pending';
  };

  const formatServiceType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Service Requests</h1>
              <p>Manage member service requests</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.total || 0}</span><span className="stat-label">Total</span></div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.pending || 0}</span><span className="stat-label">Pending</span></div>
            </div>
            <div className="stat-card approved">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.approved || 0}</span><span className="stat-label">Approved</span></div>
            </div>
            <div className="stat-card completed">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.completed || 0}</span><span className="stat-label">Completed</span></div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
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
                    <th>Requester</th>
                    <th>Service Type</th>
                    <th>Preferred Date</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">No service requests found</td></tr>
                  ) : (
                    requests.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{item.user?.name?.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="user-name">{item.user?.name}</div>
                              <div className="user-email">{item.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong>{formatServiceType(item.service_type)}</strong></td>
                        <td>{item.preferred_date ? new Date(item.preferred_date).toLocaleDateString() : '-'}</td>
                        <td><span className={`status-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleOpenModal(item)} title="Process">
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
              <h2>Process Service Request</h2>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="request-details">
                <p><strong>Requester:</strong> {selectedItem?.user?.name}</p>
                <p><strong>Service:</strong> {formatServiceType(selectedItem?.service_type || '')}</p>
                <p><strong>Description:</strong> {selectedItem?.description || 'No description provided'}</p>
                <p><strong>Contact:</strong> {selectedItem?.contact_number || 'N/A'}</p>
                <p><strong>Preferred Date:</strong> {selectedItem?.preferred_date ? new Date(selectedItem.preferred_date).toLocaleDateString() : 'Not specified'}</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Status *</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea rows="3" value={formData.admin_notes} onChange={(e) => setFormData({...formData, admin_notes: e.target.value})} placeholder="Add notes about this request..." />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit">Update Status</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ServiceRequestManagementPage;