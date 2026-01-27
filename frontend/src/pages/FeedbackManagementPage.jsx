import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import '../styles/AdminManagement.css';

const FeedbackManagementPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [response, setResponse] = useState('');
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [searchQuery, statusFilter, pagination.currentPage]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.currentPage);
      params.append('per_page', 10);

      const res = await api.get(`/feedbacks?${params.toString()}`);
      if (res.data.success) {
        setFeedbacks(res.data.data);
        setPagination({
          currentPage: res.data.meta.current_page,
          lastPage: res.data.meta.last_page,
          total: res.data.meta.total
        });
      }
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/feedbacks/statistics');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setResponse(item.admin_response || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      setFormError('Please enter a response');
      return;
    }
    setFormError('');
    try {
      await api.post(`/feedbacks/${selectedItem.id}/respond`, { admin_response: response });
      setShowModal(false);
      loadFeedbacks();
      loadStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/feedbacks/${id}`);
      loadFeedbacks();
      loadStats();
    } catch (error) {
      alert('Failed to delete feedback');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = { new: 'badge-new', read: 'badge-read', responded: 'badge-responded' };
    return classes[status] || 'badge-new';
  };

  const renderStars = (rating) => {
    if (!rating) return '-';
    return rating + '/5';
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Feedback</h1>
              <p>View and respond to user feedback</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.total || 0}</span><span className="stat-label">Total</span></div>
            </div>
            <div className="stat-card new">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.new || 0}</span><span className="stat-label">New</span></div>
            </div>
            <div className="stat-card responded">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.responded || 0}</span><span className="stat-label">Responded</span></div>
            </div>
            <div className="stat-card rating">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.average_rating || 0}</span><span className="stat-label">Avg Rating</span></div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search feedback..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
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
                    <th>From</th>
                    <th>Subject</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">No feedback found</td></tr>
                  ) : (
                    feedbacks.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{item.name?.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="user-name">{item.name}</div>
                              <div className="user-email">{item.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong>{item.subject || 'No subject'}</strong></td>
                        <td>{renderStars(item.rating)}</td>
                        <td><span className={`status-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleOpenModal(item)} title="View & Respond">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <h2>Feedback Details</h2>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="feedback-details">
                <div className="feedback-header">
                  <div>
                    <strong>{selectedItem?.name}</strong>
                    <span>{selectedItem?.email}</span>
                  </div>
                  <div className="feedback-rating">{renderStars(selectedItem?.rating)}</div>
                </div>
                <div className="feedback-subject">{selectedItem?.subject || 'No subject'}</div>
                <div className="feedback-message">{selectedItem?.message}</div>
                <div className="feedback-date">Submitted: {new Date(selectedItem?.created_at).toLocaleString()}</div>
              </div>

              {selectedItem?.admin_response && (
                <div className="previous-response">
                  <strong>Previous Response:</strong>
                  <p>{selectedItem.admin_response}</p>
                  <small>By {selectedItem.responder?.name} on {new Date(selectedItem.responded_at).toLocaleString()}</small>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{selectedItem?.admin_response ? 'Update Response' : 'Your Response'}</label>
                  <textarea rows="4" value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your response to this feedback..." />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Close</button>
                  <button type="submit" className="btn-submit">Send Response</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FeedbackManagementPage;
