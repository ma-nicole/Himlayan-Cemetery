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

          {loading ? (
            <div className="payment-history-state">Loading payment history...</div>
          ) : error ? (
            <div className="payment-history-state error">{error}</div>
          ) : payments.length === 0 ? (
            <div className="payment-history-state">No payments found yet.</div>
          ) : (
            <div className="payment-history-list">
              {payments.map((item) => (
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
