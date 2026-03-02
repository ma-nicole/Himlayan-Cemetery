import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validatePassword } from '../utils/formValidator';
import axios from 'axios';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswords, setShowPasswords] = useState(false);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field when user starts correcting it
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Check password strength for new password
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444'; // red-500
    if (passwordStrength <= 4) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const getStrengthWidth = () => {
    return `${(passwordStrength / 6) * 100}%`;
  };

  const getStrengthText = () => {
    if (formData.newPassword.length === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const newErrors = {};

    // Validate current password
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = passwordValidation.error;
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // If there are validation errors, show them
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8000/api/auth/change-password',
        {
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          new_password_confirmation: formData.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Success - redirect to dashboard
      alert('Password changed successfully! Please log in again with your new password.');
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0fdf4', // green-50
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2315803d' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      padding: '20px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '480px',
      overflow: 'hidden',
    },
    header: {
      backgroundColor: '#166534', // green-800
      padding: '30px',
      textAlign: 'center',
      color: 'white',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 10px 0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    subtitle: {
      fontSize: '14px',
      opacity: '0.9',
      margin: 0,
      lineHeight: '1.5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    content: {
      padding: '40px 30px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151', // gray-700
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db', // gray-300
      fontSize: '16px',
      transition: 'border-color 0.2s',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputWrapper: {
        position: 'relative'
    },
    button: {
      width: '100%',
      backgroundColor: '#166534', // green-800
      color: 'white',
      padding: '14px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '10px',
    },
    buttonDisabled: {
      opacity: '0.7',
      cursor: 'not-allowed',
    },
    alert: {
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: '#fee2e2', // red-100
      color: '#b91c1c', // red-700
      fontSize: '14px',
      marginBottom: '20px',
      border: '1px solid #fecaca',
    },
    strengthBar: {
      height: '4px',
      backgroundColor: '#e5e7eb', // gray-200
      borderRadius: '2px',
      marginTop: '8px',
      overflow: 'hidden',
    },
    strengthFill: {
      height: '100%',
      backgroundColor: getStrengthColor(),
      width: getStrengthWidth(),
      transition: 'width 0.3s ease, background-color 0.3s ease',
    },
    strengthText: {
      fontSize: '12px',
      marginTop: '4px',
      textAlign: 'right',
      color: getStrengthColor(),
      fontWeight: '600',
    },
    logoutBtn: {
      background: 'none',
      border: 'none',
      color: '#6b7280', // gray-500
      fontSize: '14px',
      cursor: 'pointer',
      marginTop: '20px',
      width: '100%',
      textDecoration: 'underline',
    },
    toggleBtn: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      fontSize: '11px',
      color: '#6b7280',
      cursor: 'pointer',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Secure Your Account</h1>
          <p style={styles.subtitle}>
            Please set a new password to access your account.
          </p>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.alert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="currentPassword">Current Temporary Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPasswords ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.currentPassword ? '#ef4444' : '#d1d5db',
                    backgroundColor: validationErrors.currentPassword ? '#fef2f2' : 'white',
                  }}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter the password from your email"
                  onFocus={(e) => e.target.style.borderColor = '#166534'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.currentPassword ? '#ef4444' : '#d1d5db'}
                />
              </div>
              {validationErrors.currentPassword && (
                <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.currentPassword}
                </small>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="newPassword">New Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPasswords ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.newPassword ? '#ef4444' : '#d1d5db',
                    backgroundColor: validationErrors.newPassword ? '#fef2f2' : 'white',
                  }}
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Min. 8 characters"
                  onFocus={(e) => e.target.style.borderColor = '#166534'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.newPassword ? '#ef4444' : '#d1d5db'}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPasswords(!showPasswords)}
                  style={styles.toggleBtn}
                >
                  {showPasswords ? "HIDE" : "SHOW"}
                </button>
              </div>
              {validationErrors.newPassword && (
                <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.newPassword}
                </small>
              )}
              
              {formData.newPassword && !validationErrors.newPassword && (
                <>
                  <div style={styles.strengthBar}>
                    <div style={styles.strengthFill}></div>
                  </div>
                  <div style={styles.strengthText}>{getStrengthText()}</div>
                </>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPasswords ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.confirmPassword ? '#ef4444' : '#d1d5db',
                    backgroundColor: validationErrors.confirmPassword ? '#fef2f2' : 'white',
                  }}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter your new password"
                  onFocus={(e) => e.target.style.borderColor = '#166534'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.confirmPassword ? '#ef4444' : '#d1d5db'}
                />
              </div>
              {validationErrors.confirmPassword && (
                <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.confirmPassword}
                </small>
              )}
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading || Object.keys(validationErrors).length > 0 ? styles.buttonDisabled : {})
              }}
              disabled={loading || Object.keys(validationErrors).length > 0}
              onMouseOver={(e) => !loading && Object.keys(validationErrors).length === 0 && (e.target.style.backgroundColor = '#15803d')}
              onMouseOut={(e) => !loading && Object.keys(validationErrors).length === 0 && (e.target.style.backgroundColor = '#166534')}
            >
              {loading ? 'Updating Password...' : 'Set New Password'}
            </button>
          </form>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            Cancel and Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
