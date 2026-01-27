import React, { useState } from 'react';
import PublicLayout from '../components/common/PublicLayout';
import { useToast } from '../context/ToastContext';
import './PayDuesPage.css';

const PayDuesPage = () => {
  const toast = useToast();
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo plot dues data
  const plotDues = [
    {
      id: 1,
      plotNumber: 'A-15-03',
      section: 'Garden of Peace',
      deceasedName: 'Maria Santos',
      dueAmount: 5000,
      dueDate: '2026-03-15',
      status: 'pending',
      type: 'Annual Maintenance',
    },
    {
      id: 2,
      plotNumber: 'B-22-08',
      section: 'Memorial Terrace',
      deceasedName: 'Jose Reyes',
      dueAmount: 3500,
      dueDate: '2026-02-28',
      status: 'overdue',
      type: 'Quarterly Dues',
    },
  ];

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: '' },
    { id: 'maya', name: 'Maya', icon: '' },
    { id: 'bank', name: 'Bank Transfer', icon: '' },
    { id: 'card', name: 'Credit/Debit Card', icon: '' },
  ];

  const handlePayment = () => {
    if (!selectedPlot) {
      toast?.warning('Please select a plot to pay');
      return;
    }
    if (!paymentMethod) {
      toast?.warning('Please select a payment method');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast?.success('Payment initiated! Redirecting to payment gateway...');
      setLoading(false);
    }, 1500);
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
    <PublicLayout>
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
              {plotDues.map(plot => (
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
                    <h3>{plot.deceasedName}</h3>
                    <p className="plot-info">
                      <span className="plot-number">{plot.plotNumber}</span>
                      <span className="separator">•</span>
                      <span>{plot.section}</span>
                    </p>
                    <p className="due-type">{plot.type}</p>
                  </div>
                  
                  <div className="due-amount">
                    <span className="amount">{formatCurrency(plot.dueAmount)}</span>
                    <span className="due-date">Due: {formatDate(plot.dueDate)}</span>
                  </div>
                  
                  <div className="select-indicator">
                    {selectedPlot?.id === plot.id ? '✓' : '○'}
                  </div>
                </div>
              ))}
            </div>

            {plotDues.length === 0 && (
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
                    <span>Plot</span>
                    <span>{selectedPlot.plotNumber}</span>
                  </div>
                  <div className="summary-row">
                    <span>Description</span>
                    <span>{selectedPlot.type}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Amount Due</span>
                    <span>{formatCurrency(selectedPlot.dueAmount)}</span>
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
                  {loading ? 'Processing...' : `Pay ${formatCurrency(selectedPlot.dueAmount)}`}
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
          <button className="btn btn-outline">
            View Payment History
          </button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PayDuesPage;
