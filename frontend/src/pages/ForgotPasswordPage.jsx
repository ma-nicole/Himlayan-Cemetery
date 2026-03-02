import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail } from '../utils/formValidator';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setValidationError(emailValidation.error);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email });
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Please wait a few minutes before requesting another reset link.');
      } else {
        setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyl-auth-page">
      {/* Background decorations */}
      <div className="cyl-bg-decoration cyl-bg-top-right"></div>
      <div className="cyl-bg-decoration cyl-bg-bottom-left"></div>
      
      <div className="cyl-auth-card cyl-forgot-card">
        <div className="cyl-auth-form-side cyl-forgot-form-side">
          <div className="cyl-form-content">
            {/* Logo */}
            <div className="cyl-forgot-logo">
              <img src="/himlayan.png" alt="Himlayan" className="cyl-logo-img" />
              <span className="cyl-logo-text">Himlayang Pilipino</span>
            </div>

            {!success ? (
              <>
                <h1 className="cyl-form-title">Forgot Password</h1>
                <p className="cyl-form-subtitle">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="cyl-alert cyl-alert-error" style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="cyl-form">
                  <div className="cyl-form-group">
                    <label className="cyl-label">Email Address</label>
                    <input
                      type="email"
                      className={`cyl-input ${validationError ? 'error' : ''}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationError) {
                          const validation = validateEmail(e.target.value);
                          setValidationError(validation.valid ? '' : validation.error);
                        }
                      }}
                      placeholder="Enter your email address"
                      required
                      maxLength="254"
                    />
                    {validationError && (
                      <small className="error-message">{validationError}</small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="cyl-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <div className="cyl-success-message">
                <div className="cyl-success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h1 className="cyl-form-title">Check Your Email</h1>
                <p className="cyl-form-subtitle cyl-success-subtitle">
                  If an account with that email exists, we've sent a password reset link. 
                  Please check your inbox and spam folder.
                </p>
                <p className="cyl-security-note">
                  <strong>Security Note:</strong> The link will expire in 60 minutes.
                </p>
              </div>
            )}

            <Link to="/login" className="cyl-back-home-btn cyl-back-home-below">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
