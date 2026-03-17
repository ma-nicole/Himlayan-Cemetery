import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');

    if (status === 'success') {
      toast?.success('Payment completed successfully. Thank you!');
    } else if (status === 'failed') {
      toast?.error('Payment failed or was cancelled. You can try again.');
    }

    if (status === 'success' || status === 'failed') {
      navigate('/pay-dues', { replace: true });
    }
  }, [location.search, navigate, toast]);

  useEffect(() => {
    loadOutstandingDues();
  }, []);

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

    setLoading(true);
    try {
      const paymentType = selectedPlot.payment_type === 'service_fee'
        ? 'service_fee'
        : selectedPlot.type?.toLowerCase().includes('quarterly')
          ? 'quarterly_dues'
          : (selectedPlot.payment_type || 'annual_maintenance');

      const response = await api.post('/payments', {
        plot_id: selectedPlot.plot_id || null,
        amount: selectedPlot.due_amount,
        payment_type: paymentType,
        payment_method: paymentMethod,
        notes: selectedPlot.description || selectedPlot.notes || `${selectedPlot.payment_type || 'dues'} for ${selectedPlot.plot_number || 'N/A'}`,
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
                      {plot.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
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
