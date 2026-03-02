import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/formValidator';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  // Image slideshow
  const images = [
    '/himlayangpilipino.webp',
    '/heritage_HD.png',
    '/Florante-at-Laura-1-scaled.jpg',
    '/Florante-at-Laura-2-scaled.jpg',
    '/Gabriela-Silang-scaled.jpg',
    '/Malakas-at-Maganda.jpg',
    '/Panooran-2.jpg',
    '/Pugad-Lawin-scaled.jpg',
    '/Teresa-Magbanua-scaled.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }

    // Validate password
    if (!password || password.trim() === '') {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Check if user must change password
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && storedUser.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="cyl-auth-page">
      {/* Background decorations */}
      <div className="cyl-bg-decoration cyl-bg-top-right"></div>
      <div className="cyl-bg-decoration cyl-bg-bottom-left"></div>
      
      <div className="cyl-auth-card">
        {/* Left Side - Image Slideshow */}
        <div className="cyl-auth-image">
          {images.map((img, index) => (
            <img 
              key={index}
              src={img} 
              alt={`Himlayang Pilipino ${index + 1}`}
              className={`cyl-slide-image ${index === currentImage ? 'active' : ''}`}
            />
          ))}
          <div className="cyl-image-overlay">
            <div className="cyl-brand">
              <img src="/himlayan.png" alt="Himlayan" className="cyl-logo-img" />
              <span className="cyl-logo-text">Himlayang Pilipino</span>
            </div>
            <p className="cyl-tagline">HONORING MEMORIES. PRESERVING LEGACIES.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="cyl-auth-form-side">
          <div className="cyl-form-content">
            <h1 className="cyl-form-title">Log in your Account</h1>
            <p className="cyl-form-subtitle">
              Welcome back! Please enter your credentials to continue.
            </p>

            {successMessage && <div className="cyl-alert cyl-alert-success">{successMessage}</div>}
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
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Login Failed</strong>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="cyl-form">
              <div className="cyl-form-group">
                <input
                  type="email"
                  className={`cyl-input ${validationErrors.email ? 'error' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      const validation = validateEmail(e.target.value);
                      setValidationErrors(prev => ({
                        ...prev,
                        email: validation.valid ? undefined : validation.error
                      }));
                    }
                  }}
                  placeholder="Email address"
                  required
                  maxLength="254"
                />
                {validationErrors.email && (
                  <small className="error-message">{validationErrors.email}</small>
                )}
              </div>

              <div className="cyl-form-group">
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
                    placeholder="Password"
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
              </div>

              <div className="cyl-forgot-password">
                <Link to="/forgot-password" className="cyl-forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="cyl-btn-primary"
                disabled={loading || Object.keys(validationErrors).length > 0}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <Link to="/" className="cyl-back-home-btn cyl-back-home-below">
              ← Back to Home
            </Link>

            {/* Demo Credentials */}
            <div className="cyl-demo-box">
              <p className="cyl-demo-title">Demo Credentials</p>
              <div className="cyl-demo-creds">
                <div className="cyl-demo-item">
                  <span className="cyl-demo-role">Admin</span>
                  <span>admin@cemetery.com</span>
                </div>
                <div className="cyl-demo-item">
                  <span className="cyl-demo-role">Staff</span>
                  <span>staff@cemetery.com</span>
                </div>
              </div>
              <p className="cyl-demo-pass">Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
