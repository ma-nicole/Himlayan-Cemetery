import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const validatePassword = () => {
    const errors = {};
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmPassword
      });
      
      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful! Please log in with your new password.' }
          });
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
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
                <h1 className="cyl-form-title">Reset Password</h1>
                <p className="cyl-form-subtitle">
                  Enter your new password below.
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

                {(!token || !email) ? (
                  <div className="cyl-invalid-link">
                    <p>This password reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="cyl-btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                      Request New Link
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="cyl-form">
                    <div className="cyl-form-group">
                      <label className="cyl-label">New Password</label>
                      <div className="cyl-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`cyl-input ${validationErrors.password ? 'error' : ''}`}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (validationErrors.password) {
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.password;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder="Enter new password"
                          required
                          maxLength="128"
                        />
                        <button
                          type="button"
                          className="cyl-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <small className="error-message">{validationErrors.password}</small>
                      )}
                      <small className="cyl-password-hint">
                        Password must be at least 8 characters with uppercase, lowercase, and number.
                      </small>
                    </div>

                    <div className="cyl-form-group">
                      <label className="cyl-label">Confirm Password</label>
                      <div className="cyl-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`cyl-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (validationErrors.confirmPassword) {
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.confirmPassword;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder="Confirm new password"
                          required
                          maxLength="128"
                        />
                        <button
                          type="button"
                          className="cyl-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <small className="error-message">{validationErrors.confirmPassword}</small>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="cyl-btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="cyl-success-message">
                <div className="cyl-success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h1 className="cyl-form-title">Password Reset Successful!</h1>
                <p className="cyl-form-subtitle cyl-success-subtitle">
                  Your password has been changed successfully. 
                  Redirecting you to login...
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

export default ResetPasswordPage;
