import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthday: '',
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      };
      
      const result = await authService.register(submitData);
      
      if (result.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="cyl-auth-page">
      {/* Background decorations */}
      <div className="cyl-bg-decoration cyl-bg-top-right"></div>
      <div className="cyl-bg-decoration cyl-bg-bottom-left"></div>
      
      <div className="cyl-auth-card cyl-auth-card-wide">
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
            <h1 className="cyl-form-title">Create an Account</h1>
            <p className="cyl-form-subtitle">
              Already have an account? <Link to="/login">Login</Link>
            </p>

            {error && <div className="cyl-alert cyl-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="cyl-form">
              <div className="cyl-form-row">
                <div className="cyl-form-group">
                  <input
                    type="text"
                    name="firstName"
                    className="cyl-input"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="cyl-form-group">
                  <input
                    type="text"
                    name="lastName"
                    className="cyl-input"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div className="cyl-form-row">
                <div className="cyl-form-group">
                  <input
                    type="email"
                    name="email"
                    className="cyl-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    required
                  />
                </div>
                <div className="cyl-form-group">
                  <label className="cyl-input-label">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    className="cyl-input"
                    value={formData.birthday}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cyl-form-row">
                <div className="cyl-form-group">
                  <div className="cyl-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="cyl-input"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="cyl-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="cyl-form-group">
                  <div className="cyl-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="password_confirmation"
                      className="cyl-input"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      required
                    />
                    <button
                      type="button"
                      className="cyl-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="cyl-divider"></div>

              <button
                type="submit"
                className="cyl-btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
