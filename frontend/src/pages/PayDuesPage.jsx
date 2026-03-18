import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import './PayDuesPage.css';

const PayDuesPage = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotDues, setPlotDues] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [duesLoading, setDuesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const pollingRef = useRef(null);

  const loadOutstandingDues = async () => {
    setDuesLoading(true);
    try {
      const response = await api.get('/payments/my-dues');
      const dues = Array.isArray(response?.data?.data) ? response.data.data : [];
      setPlotDues(dues);
      setSelectedPlot((previous) => {
        if (!dues.length) return null;
        if (!previous) return dues[0];
        return dues.find((item) => item.id === previous.id) || dues[0];
      });
    } catch (err) {
      setPlotDues([]);
      setSelectedPlot(null);
      toast?.error(err?.response?.data?.message || 'Failed to load outstanding dues.');
    } finally {
      setDuesLoading(false);
    }
  };

  // Clean up any pending poll timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Handle Xendit redirect: detect ?status=success|failed, mark payment as paid,
  // then poll the backend until the status reflects 'awaiting_verification'.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const paymentId = params.get('payment_id');

    if (status === 'failed') {
      toast?.error('Payment failed or was cancelled. You can try again.');
      navigate('/pay-dues', { replace: true });
      return;
    }

    if (status !== 'success') return;

    // Strip the Xendit params from the URL immediately so this effect
    // does not re-run when location.search becomes '' after navigate.
    navigate('/pay-dues', { replace: true });

    let cancelled = false;

    const handleSuccess = async () => {
      if (!paymentId) {
        loadOutstandingDues();
        toast?.success('Payment completed. Awaiting admin verification.');
        return;
      }

      setIsVerifying(true);

      // Inform the backend that payment was completed.
      try {
        await api.post(`/payments/${paymentId}/mark-paid`);
      } catch {
        // Non-fatal: payment may already be marked by webhook.
      }

      if (cancelled) return;

      // Poll my-dues every 2.5 s until the payment status updates
      // (up to 10 attempts = ~25 s), then refresh the UI.
      const MAX_ATTEMPTS = 10;
      let attempts = 0;

      const poll = async () => {
        if (cancelled) return;
        attempts++;

        try {
          const res = await api.get('/payments/my-dues');
          if (cancelled) return;

          const dues = Array.isArray(res?.data?.data) ? res.data.data : [];
          const target = dues.find((d) => String(d.id) === String(paymentId));

          // Confirmed when: the item shows awaiting_verification (paid_at set)
          // or has disappeared from outstanding list (already verified by admin).
          const confirmed = !target || target.status === 'awaiting_verification';

          if (confirmed || attempts >= MAX_ATTEMPTS) {
            setPlotDues(dues);
            setSelectedPlot((prev) => {
              if (!dues.length) return null;
              return dues.find((d) => d.id === prev?.id) || dues[0];
            });
            setIsVerifying(false);

            if (confirmed) {
              toast?.success('Payment completed successfully. Awaiting admin verification.');
            } else {
              toast?.warning(
                'Payment submitted. Status may take a moment to update — refresh if needed.',
              );
            }
          } else {
            pollingRef.current = setTimeout(poll, 2500);
          }
        } catch {
          if (!cancelled) {
            setIsVerifying(false);
            loadOutstandingDues();
          }
        }
      };

      poll();
    };

    handleSuccess();

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOutstandingDues();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: '' },
    { id: 'maya', name: 'Maya', icon: '' },
    { id: 'bank', name: 'Bank Transfer', icon: '' },
    { id: 'card', name: 'Credit/Debit Card', icon: '' },
  ];

  const handlePayment = async () => {
    if (!selectedPlot) {
      toast?.warning('Please select a plot to pay');
      return;
    }
    if (!paymentMethod) {
      toast?.warning('Please select a payment method');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to proceed to payment?\n\nAmount: ${formatCurrency(selectedPlot.due_amount)}\nMethod: ${paymentMethod.toUpperCase()}\n\nYou will be redirected to the secure payment gateway.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      // Use the existing pending payment record — do not create a new one.
      const response = await api.post(`/payments/${selectedPlot.id}/checkout`, {
        payment_method: paymentMethod,
      });

      const checkoutUrl =
        response?.data?.checkout_url ||
        response?.data?.invoice_url ||
        response?.data?.data?.invoice_url ||
        response?.data?.data?.checkout_url;

      if (checkoutUrl) {
        toast?.success('Redirecting to secure payment checkout...');

        // Prefer same-tab redirect, with fallback to new tab when blocked by browser policies.
        window.location.assign(checkoutUrl);
        setTimeout(() => {
          if (window.location.href.includes('/pay-dues')) {
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
          }
        }, 500);
        return;
      }

      toast?.warning('Payment created but no checkout URL returned.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Payment initiation failed. Please try again.';
      toast?.error(message);
    } finally {
      setLoading(false);
      loadOutstandingDues();
    }
  };

  const formatPaymentType = (type) => {
    if (!type) return 'Maintenance Dues';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="member-dashboard">
      <MemberHeader />
      <main className="member-main" style={{ paddingTop: '40px' }}>
        <div className="pay-dues-page">
          <div className="page-header">
            <h1>Pay Dues</h1>
            <p>Manage and pay your memorial park dues online</p>
          </div>

          {isVerifying && (
            <div className="payment-verifying-banner">
              <span className="payment-verifying-spinner" />
              <span>Verifying your payment&hellip; please refresh your browser.</span>
            </div>
          )}

          <div className="dues-container">
          {/* Dues List */}
          <div className="dues-section">
            <h2>Outstanding Dues</h2>
            
            <div className="dues-list">
              {duesLoading ? (
                <div className="no-selection">
                  <p>Loading outstanding dues...</p>
                </div>
              ) : plotDues.map(plot => (
                <div 
                  key={plot.id}
                  className={`due-card ${selectedPlot?.id === plot.id ? 'selected' : ''} ${plot.status}`}
                  onClick={() => setSelectedPlot(plot)}
                >
                  <div className="due-status">
                    <span className={`status-badge ${plot.status}`}>
                      {plot.status === 'overdue' ? 'Overdue'
                        : plot.status === 'awaiting_verification' ? 'Waiting for Payment Verification'
                        : plot.status === 'under_investigation' ? 'Pending Confirmation (Under Investigation)'
                        : plot.status === 'unpaid' ? 'Unpaid'
                        : 'Pending'}
                    </span>
                    {plot.status === 'awaiting_verification' && (
                      <span className="status-hint" style={{ display: 'block', fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
                        Please allow 1–3 business days for payment verification.
                      </span>
                    )}
                    {plot.status === 'under_investigation' && (
                      <span className="status-hint" style={{ display: 'block', fontSize: '0.72rem', color: '#92400e', marginTop: '2px' }}>
                        Under review. Allow 1–7 business days.
                      </span>
                    )}
                  </div>
                  
                  <div className="due-details">
                    <h3>{plot.payment_type === 'service_fee' ? 'Service Fee' : (plot.plot_number || 'N/A')}</h3>
                    <p className="plot-info">
                      {plot.payment_type === 'service_fee' ? (
                        <span className="plot-number">{plot.description || plot.notes || 'Service Fee'}</span>
                      ) : (
                        <>
                          <span className="plot-number">{plot.plot_number || 'N/A'}</span>
                          {plot.section && plot.section !== 'N/A' && (
                            <>
                              <span className="separator">•</span>
                              <span>{plot.section}</span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                    <p className="due-type">{formatPaymentType(plot.payment_type)}</p>
                  </div>
                  
                  <div className="due-amount">
                    <span className="amount">{formatCurrency(plot.due_amount)}</span>
                    <span className="due-date">Due: {formatDate(plot.due_date)}</span>
                  </div>
                  
                  <div className="select-indicator">
                    {selectedPlot?.id === plot.id ? '✓' : '○'}
                  </div>
                </div>
              ))}
            </div>

            {!duesLoading && plotDues.length === 0 && (
              <div className="no-dues">
                <span className="empty-icon"></span>
                <p>No outstanding dues</p>
                <span>All your payments are up to date!</span>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="payment-section">
            <h2>Payment Details</h2>
            
            {selectedPlot ? (
              <div className="payment-form">
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>{selectedPlot.payment_type === 'service_fee' ? 'Service' : 'Plot'}</span>
                    <span>{selectedPlot.payment_type === 'service_fee' ? 'Service Fee' : (selectedPlot.plot_number || 'N/A')}</span>
                  </div>
                  <div className="summary-row">
                    <span>Description</span>
                    <span>{selectedPlot.payment_type === 'service_fee'
                      ? (selectedPlot.description || selectedPlot.notes || 'Service Fee')
                      : formatPaymentType(selectedPlot.payment_type)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Amount Due</span>
                    <span>{formatCurrency(selectedPlot.due_amount)}</span>
                  </div>
                </div>

                {isVerifying || selectedPlot.status === 'awaiting_verification' || selectedPlot.status === 'under_investigation' ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: selectedPlot.status === 'under_investigation' ? '#fffbeb' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${selectedPlot.status === 'under_investigation' ? '#fde68a' : '#bbf7d0'}` }}>
                    {isVerifying ? (
                      <>
                        <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 4 }}>⏳ Verifying Payment…</p>
                        <p style={{ color: '#166534', fontSize: '0.875rem', margin: 0 }}>Please refresh your browser to confirm your payment.</p>
                      </>
                    ) : selectedPlot.status === 'under_investigation' ? (
                      <>
                        <p style={{ color: '#d97706', fontWeight: 600, marginBottom: 4 }}>⚠️ Pending Confirmation (Under Investigation)</p>
                        <p style={{ color: '#92400e', fontSize: '0.875rem', margin: '0 0 6px' }}>Your payment is currently under review. Please allow 1–7 business days for confirmation.</p>
                        {selectedPlot.admin_reason && (
                          <p style={{ color: '#78350f', fontSize: '0.85rem', margin: 0, background: '#fef3c7', padding: '6px 10px', borderRadius: '4px', textAlign: 'left' }}>
                            <strong>Reason:</strong> {selectedPlot.admin_reason}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 4 }}>✓ Payment Submitted</p>
                        <p style={{ color: '#166534', fontSize: '0.875rem', margin: '0 0 6px' }}>Your payment is awaiting admin verification.</p>
                        <p style={{ color: '#166534', fontSize: '0.8rem', margin: 0 }}>Please allow 1–3 business days for payment verification.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="payment-methods">
                      <label className="method-label">Select Payment Method</label>
                      <div className="methods-grid">
                        {paymentMethods.map(method => (
                          <button
                            key={method.id}
                            className={`method-btn ${paymentMethod === method.id ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <span className="method-icon">{method.icon}</span>
                            <span className="method-name">{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn-pay"
                      onClick={handlePayment}
                      disabled={loading || !paymentMethod}
                    >
                      {loading ? 'Processing...' : `Pay ${formatCurrency(selectedPlot.due_amount)}`}
                    </button>

                    <p className="payment-note">
                      Secured by SSL encryption. Your payment information is safe.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a plot to view payment details</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Link */}
        <div className="history-link">
          <button
            className="btn btn-outline"
            onClick={() => navigate('/pay-dues/history')}
          >
            View Payment History
          </button>
        </div>
        </div>
      </main>
      <MemberFooter />
    </div>
  );
};

export default PayDuesPage;
