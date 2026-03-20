import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/common/Layout';
import { validateRequired, validateTextArea } from '../utils/formValidator';
import '../styles/AdminManagement.css';

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ status: '', notes: '' });
  const [validationErrors, setValidationErrors] = useState({});
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
    // Pre-fill state based on current payment state
    const preStatus = item.status === 'verified'
      ? 'verified'
      : item.verification_decision === 'under_investigation'
        ? 'under_investigation'
        : '';
    setFormData({
      status: preStatus,
      notes: item.notes || '',
      reason: item.admin_reason || '',
    });
    setFormError('');
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const isAlreadyVerified = selectedItem?.status === 'verified';

    // Only require a decision for pending payments; verified ones are locked
    if (!isAlreadyVerified) {
      const statusValidation = validateRequired(formData.status, 'Verification decision');
      if (!statusValidation.valid) {
        newErrors.status = statusValidation.error;
      }
      // Reason is mandatory when rejecting or flagging as under investigation
      if (['rejected', 'under_investigation'].includes(formData.status) && !formData.reason.trim()) {
        newErrors.reason = 'Reason is required for this decision.';
      }
    }

    // Validate notes if provided
    if (formData.notes.trim()) {
      const notesValidation = validateTextArea(formData.notes, { minLength: 2, maxLength: 1500 });
      if (!notesValidation.valid) {
        newErrors.notes = notesValidation.error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setFormError('');
    try {
      // For verified payments only send notes (decision is immutable)
      const payload = isAlreadyVerified
        ? { notes: formData.notes }
        : { status: formData.status, notes: formData.notes, reason: formData.reason };
      await api.post(`/payments/${selectedItem.id}/verify`, payload);
      setShowModal(false);
      loadPayments();
      loadStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive this payment record?')) return;
    try {
      await api.delete(`/payments/${id}`);
      loadPayments();
      loadStats();
    } catch (error) {
      alert('Failed to archive payment');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      unpaid: 'badge-cancelled',
      pending: 'badge-pending',
      verified: 'badge-verified',
      rejected: 'badge-rejected',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-pending';
  };

  // Derive the display status for the admin table.
  // - unpaid: payment_method=null and paid_at=null → not yet submitted
  // - pending: submitted (paid_at set) or under_investigation → awaiting review
  // - verified / rejected / cancelled → final states
  const getAdminDisplayStatus = (item) => {
    const eff = item.effective_status || item.status;
    if (eff === 'unpaid') return 'unpaid';
    if (['awaiting_verification', 'under_investigation', 'pending'].includes(eff)) return 'pending';
    return eff;
  };

  const getAdminDisplayLabel = (item) => {
    const display = getAdminDisplayStatus(item);
    return display.charAt(0).toUpperCase() + display.slice(1);
  };

  const formatPaymentType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <Layout>
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
                        <td>{item.payment_method ? item.payment_method.toUpperCase() : 'Unpaid'}</td>
                        <td><code>{item.reference_number || '-'}</code></td>
                        <td><span className={`status-badge ${getStatusBadgeClass(getAdminDisplayStatus(item))}`}>{getAdminDisplayLabel(item)}</span></td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            {(item.status === 'pending' || item.status === 'verified') && (
                              <button className="btn-edit" onClick={() => handleOpenModal(item)} title={item.status === 'verified' ? 'Edit Notes' : 'Verify'}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </button>
                            )}
                            {item.status === 'rejected' && (
                              <button className="btn-view" onClick={() => { setViewItem(item); setShowViewModal(true); }} title="View rejection details">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                            )}
                            <button className="btn-delete" onClick={() => handleDelete(item.id)} title="Archive">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
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
              <h2>{selectedItem?.status === 'verified' ? 'Edit Payment Notes' : 'Verify Payment'}</h2>
              {formError && <div className="form-error">{formError}</div>}
              
              {/* Sub-status notice when payment is under investigation */}
              {selectedItem?.verification_decision === 'under_investigation' && (
                <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', fontSize: '0.85rem', color: '#854d0e' }}>
                  <strong>⚠️ Pending Confirmation (Under Investigation)</strong>
                  {selectedItem?.admin_reason && (
                    <p style={{ margin: '4px 0 0' }}>Reason: {selectedItem.admin_reason}</p>
                  )}
                </div>
              )}

              <div className="request-details">
                <p><strong>Payer:</strong> {selectedItem?.user?.name}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem?.amount || 0)}</p>
                <p><strong>Type:</strong> {formatPaymentType(selectedItem?.payment_type || '')}</p>
                <p><strong>Method:</strong> {selectedItem?.payment_method?.toUpperCase() || 'Unpaid'}</p>
                <p><strong>Reference:</strong> {selectedItem?.reference_number || 'N/A'}</p>
                <p><strong>Paid At:</strong> {selectedItem?.paid_at ? new Date(selectedItem.paid_at).toLocaleString() : 'N/A'}</p>
              </div>

              <form onSubmit={handleSubmit}>
                {selectedItem?.status === 'verified' ? (
                  /* Verified — decision locked, hint shown */
                  <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af' }}>
                    ℹ️ This payment has already been verified. The verification decision can no longer be changed. Only notes can be updated.
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Verification Decision *</label>
                    {!selectedItem?.payment_method && (
                      <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', fontSize: '0.85rem', color: '#854d0e' }}>
                        ⚠️ This payment has not been paid yet. Verification is not allowed — you may only reject it.
                      </div>
                    )}
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        setFormData({...formData, status: e.target.value});
                        if (validationErrors.status) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.status;
                            return newErrors;
                          });
                        }
                      }}
                      className={validationErrors.status ? 'error' : ''}
                      required
                    >
                      <option value="">Select...</option>
                      {selectedItem?.payment_method && (
                        <option value="verified">Verify Payment</option>
                      )}
                      <option value="rejected">Reject Payment</option>
                      <option value="under_investigation">Pending Confirmation (Under Investigation)</option>
                    </select>
                    {validationErrors.status && (
                      <small className="error-message">{validationErrors.status}</small>
                    )}
                  </div>
                )}
                {/* Reason field — required for rejected and under_investigation decisions */}
                {['rejected', 'under_investigation'].includes(formData.status) && (
                  <div className="form-group">
                    <label>Reason *</label>
                    <textarea
                      rows="2"
                      value={formData.reason}
                      onChange={(e) => {
                        setFormData({...formData, reason: e.target.value});
                        if (validationErrors.reason) {
                          setValidationErrors(prev => { const n = {...prev}; delete n.reason; return n; });
                        }
                      }}
                      className={validationErrors.reason ? 'error' : ''}
                      placeholder={formData.status === 'under_investigation'
                        ? 'Describe the issue or what needs investigation...'
                        : 'State the reason for rejecting this payment...'}
                      required
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                      ℹ️ This reason will be visible to the member on their Pay Dues page.
                    </small>
                    {validationErrors.reason && (
                      <small className="error-message">{validationErrors.reason}</small>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    rows="3" 
                    value={formData.notes} 
                    onChange={(e) => {
                      setFormData({...formData, notes: e.target.value});
                      if (validationErrors.notes) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.notes;
                          return newErrors;
                        });
                      }
                    }} 
                    className={validationErrors.notes ? 'error' : ''}
                    placeholder="Add verification notes..." 
                  />
                  {validationErrors.notes && (
                    <small className="error-message">{validationErrors.notes}</small>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit" disabled={Object.keys(validationErrors).length > 0}>Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showViewModal && viewItem && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <h2>Payment Details</h2>

              <div className="request-details">
                <p><strong>Payer:</strong> {viewItem.user?.name}</p>
                <p><strong>Amount:</strong> {formatCurrency(viewItem.amount || 0)}</p>
                <p><strong>Type:</strong> {formatPaymentType(viewItem.payment_type || '')}</p>
                <p><strong>Method:</strong> {viewItem.payment_method?.toUpperCase() || 'Unpaid'}</p>
                <p><strong>Reference:</strong> {viewItem.reference_number || 'N/A'}</p>
                <p><strong>Paid At:</strong> {viewItem.paid_at ? new Date(viewItem.paid_at).toLocaleString() : 'N/A'}</p>
                <p><strong>Date Created:</strong> {new Date(viewItem.created_at).toLocaleString()}</p>
              </div>

              <div style={{ marginTop: '14px', padding: '12px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#991b1b' }}>❌ Rejected</p>
                {viewItem.admin_reason ? (
                  <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem' }}><strong>Reason:</strong> {viewItem.admin_reason}</p>
                ) : (
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No reason provided.</p>
                )}
                {viewItem.verifier?.name && (
                  <p style={{ margin: '6px 0 0', color: '#7f1d1d', fontSize: '0.82rem' }}>Rejected by: {viewItem.verifier.name}</p>
                )}
                {viewItem.verified_at && (
                  <p style={{ margin: '2px 0 0', color: '#7f1d1d', fontSize: '0.82rem' }}>Rejected at: {new Date(viewItem.verified_at).toLocaleString()}</p>
                )}
              </div>

              {viewItem.notes && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.875rem', color: '#374151' }}>
                  <strong>Notes:</strong> {viewItem.notes}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-submit" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
    </Layout>
  );
};

export default PaymentManagementPage;
