import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import api from '../services/api';
import './PaymentHistoryPage.css';

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/payments?per_page=50');
        const items = response?.data?.data;
        setPayments(Array.isArray(items) ? items : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEffectiveStatus = (item) => item.effective_status || item.status || 'pending';

  const displayStatus = (item) => {
    const raw = getEffectiveStatus(item);
    if (raw === 'unpaid') return 'Unpaid';
    if (raw === 'awaiting_verification') return 'Waiting';
    if (raw === 'under_investigation') return 'Pending';
    if (raw === 'verified') return 'Verified';
    if (raw === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const statusClass = (item) => {
    const raw = getEffectiveStatus(item);
    if (raw === 'unpaid') return 'unpaid';
    if (raw === 'awaiting_verification') return 'paid';
    if (raw === 'under_investigation') return 'pending';
    return raw; // pending | verified | rejected
  };

  const formatPaymentType = (type) => {
    if (!type) return 'Unspecified Payment';

    const labelMap = {
      annual_maintenance: 'Annual Maintenance Dues',
      quarterly_dues: 'Quarterly Dues',
      plot_purchase: 'Plot Purchase',
      service_fee: 'Service Fee',
    };

    return labelMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const buildPaymentTitle = (item) => {
    const typeLabel = formatPaymentType(item.payment_type);
    const plotNumber = item.plot?.plot_number;
    return plotNumber ? `${typeLabel} - Plot ${plotNumber}` : typeLabel;
  };

  const filteredPayments = payments
    .filter((item) => {
      if (filterStatus && displayStatus(item) !== filterStatus) return false;
      if (filterType && item.payment_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount);
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount);
      return 0;
    });

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'annual_maintenance', label: 'Annual Maintenance' },
    { value: 'quarterly_dues', label: 'Quarterly Dues' },
    { value: 'plot_purchase', label: 'Plot Purchase' },
    { value: 'service_fee', label: 'Service Fee' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Waiting', label: 'Waiting' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Verified', label: 'Verified' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  return (
    <div className="member-dashboard">
      <MemberHeader />
      <main className="member-main" style={{ paddingTop: '40px' }}>
        <div className="payment-history-page">
          <div className="payment-history-header">
            <div>
              <h1>Payment History</h1>
              <p>Review your previous dues transactions.</p>
            </div>
            <Link to="/pay-dues" className="payment-history-back-btn">
              Back to Pay Dues
            </Link>
          </div>

          {/* Filter / Sort bar */}
          {!loading && !error && payments.length > 0 && (
            <div className="payment-history-filters">
              <div className="phf-group">
                <label htmlFor="phf-status">Status</label>
                <select
                  id="phf-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="phf-group">
                <label htmlFor="phf-type">Type</label>
                <select
                  id="phf-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="phf-group">
                <label htmlFor="phf-sort">Sort by Date</label>
                <select
                  id="phf-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                </select>
              </div>

              {(filterStatus || filterType || sortBy !== 'date-desc') && (
                <button
                  className="phf-clear"
                  onClick={() => { setFilterStatus(''); setFilterType(''); setSortBy('date-desc'); }}
                >
                  Clear
                </button>
              )}

              <span className="phf-count">
                {filteredPayments.length} of {payments.length}
              </span>
            </div>
          )}

          {loading ? (
            <div className="payment-history-state">Loading payment history...</div>
          ) : error ? (
            <div className="payment-history-state error">{error}</div>
          ) : payments.length === 0 ? (
            <div className="payment-history-state">No payments found yet.</div>
          ) : filteredPayments.length === 0 ? (
            <div className="payment-history-state">No payments match the selected filters.</div>
          ) : (
            <div className="payment-history-list">
              {filteredPayments.map((item) => (
                <article key={item.id} className="payment-history-card">
                  <div className="payment-history-row">
                    <h3>{buildPaymentTitle(item)}</h3>
                    <span className={`payment-status ${statusClass(item)}`}>
                      {displayStatus(item)}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Ref: {item.reference_number || `Payment #${item.id}`}
                  </p>

                  <div className="payment-history-meta">
                    <p>
                      <strong>Amount:</strong> {formatCurrency(item.amount)}
                    </p>
                    <p>
                      <strong>Type:</strong> {formatPaymentType(item.payment_type)}
                    </p>
                    <p>
                      <strong>Method:</strong> {item.payment_method || 'N/A'}
                    </p>
                    <p>
                      <strong>Plot:</strong> {item.plot?.plot_number || 'N/A'}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(item.created_at)}
                    </p>
                  </div>

                  {/* Reason shown for rejected and under_investigation payments */}
                  {(item.status === 'rejected' || item.verification_decision === 'under_investigation') && item.admin_reason && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: item.status === 'rejected' ? '#fee2e2' : '#fef9c3', borderRadius: '6px', fontSize: '0.875rem', color: item.status === 'rejected' ? '#991b1b' : '#854d0e', borderLeft: `3px solid ${item.status === 'rejected' ? '#f87171' : '#fde047'}` }}>
                      <strong>Reason:</strong> {item.admin_reason}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <MemberFooter />
    </div>
  );
};

export default PaymentHistoryPage;
