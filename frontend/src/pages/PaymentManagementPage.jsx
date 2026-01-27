import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import '../styles/AdminManagement.css';

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ status: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [searchQuery, statusFilter, pagination.currentPage]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.currentPage);
      params.append('per_page', 10);

      const response = await api.get(`/payments?${params.toString()}`);
      if (response.data.success) {
        setPayments(response.data.data);
        setPagination({
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total
        });
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/payments/statistics');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setFormData({ status: '', notes: item.notes || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.status) {
      setFormError('Please select a status');
      return;
    }
    setFormError('');
    try {
      await api.post(`/payments/${selectedItem.id}/verify`, formData);
      setShowModal(false);
      loadPayments();
      loadStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await api.delete(`/payments/${id}`);
      loadPayments();
      loadStats();
    } catch (error) {
      alert('Failed to delete payment');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = { pending: 'badge-pending', verified: 'badge-verified', rejected: 'badge-rejected' };
    return classes[status] || 'badge-pending';
  };

  const formatPaymentType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Payments</h1>
              <p>Manage and verify member payments</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.total || 0}</span><span className="stat-label">Total</span></div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.pending || 0}</span><span className="stat-label">Pending</span></div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{stats.verified || 0}</span><span className="stat-label">Verified</span></div>
            </div>
            <div className="stat-card amount">
              <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg></div>
              <div className="stat-info"><span className="stat-number">{formatCurrency(stats.total_amount || 0)}</span><span className="stat-label">Total Verified</span></div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search by reference or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
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
                    <th>Payer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="8" className="empty-state">No payments found</td></tr>
                  ) : (
                    payments.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{item.user?.name?.charAt(0).toUpperCase()}</div>
                            <div className="user-name">{item.user?.name}</div>
                          </div>
                        </td>
                        <td>{formatPaymentType(item.payment_type)}</td>
                        <td><strong>{formatCurrency(item.amount)}</strong></td>
                        <td>{item.payment_method.toUpperCase()}</td>
                        <td><code>{item.reference_number || '-'}</code></td>
                        <td><span className={`status-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            {item.status === 'pending' && (
                              <button className="btn-edit" onClick={() => handleOpenModal(item)} title="Verify">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </button>
                            )}
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
              <h2>Verify Payment</h2>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="request-details">
                <p><strong>Payer:</strong> {selectedItem?.user?.name}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem?.amount || 0)}</p>
                <p><strong>Type:</strong> {formatPaymentType(selectedItem?.payment_type || '')}</p>
                <p><strong>Method:</strong> {selectedItem?.payment_method?.toUpperCase()}</p>
                <p><strong>Reference:</strong> {selectedItem?.reference_number || 'N/A'}</p>
                <p><strong>Paid At:</strong> {selectedItem?.paid_at ? new Date(selectedItem.paid_at).toLocaleString() : 'N/A'}</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Verification Decision *</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
                    <option value="">Select...</option>
                    <option value="verified">Verify Payment</option>
                    <option value="rejected">Reject Payment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Add verification notes..." />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentManagementPage;
