import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import api from '../services/api';
import { validateName, validateEmail, validatePhone, validateRequired, validateTextArea } from '../utils/formValidator';
import './FeedbackPage.css';

const MemberContactPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_country_code: '+63',
    phone: '',
    message: '',
  });

  const getPhoneRequirements = (countryCode) => {
    const requirements = {
      '+63': { digits: 10, country: 'Philippines' },
      '+1': { digits: 10, country: 'USA/Canada' },
      '+44': { digits: 10, country: 'UK' },
      '+61': { digits: 9, country: 'Australia' },
      '+81': { digits: 10, country: 'Japan' },
      '+82': { digits: 10, country: 'South Korea' },
      '+86': { digits: 11, country: 'China' },
      '+65': { digits: 8, country: 'Singapore' },
      '+60': { digits: 10, country: 'Malaysia' },
      '+971': { digits: 9, country: 'UAE' }
    };
    return requirements[countryCode] || { digits: 10, country: 'Selected Country' };
  };

  // Real-time field validation
  const validateField = (name, value, allData) => {
    let error = null;
    switch (name) {
      case 'name':
        if (value.trim()) { const r = validateName(value); if (!r.valid) error = r.error; }
        break;
      case 'email':
        if (value.trim()) { const r = validateEmail(value); if (!r.valid) error = r.error; }
        break;
      case 'phone':
        if (value.trim()) { const r = validatePhone(value, allData.phone_country_code); if (!r.valid) error = r.error; }
        break;
      case 'message':
        if (value.trim()) { const r = validateTextArea(value); if (!r.valid) error = r.error; }
        break;
      default:
        break;
    }
    setValidationErrors(prev => {
      const updated = { ...prev };
      if (error) { updated[name] = error; } else { delete updated[name]; }
      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let actualValue = value;
    // Handle phone number input - only allow digits and enforce length limit
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const maxLength = getPhoneRequirements(formData.phone_country_code).digits;
      actualValue = digitsOnly.slice(0, maxLength);
      setFormData(prev => ({ 
        ...prev, 
        [name]: actualValue
      }));
    } else if (name === 'phone_country_code') {
      // Handle country code changes - clear phone if it exceeds new country's limit
      const currentPhone = formData.phone;
      const newMaxLength = getPhoneRequirements(value).digits;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        phone: currentPhone.length > newMaxLength ? '' : currentPhone
      }));
      return;
    } else {
      actualValue = value;
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Validate field in real-time
    validateField(name, actualValue, { ...formData, [name]: actualValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started', { formData, rating, loading });
    
    const newErrors = {};

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    // Validate phone if provided
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone, formData.phone_country_code);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    // Validate message
    const messageValidation = validateTextArea(formData.message);
    if (!messageValidation.valid) {
      newErrors.message = messageValidation.error;
    }

    console.log('Validation errors:', newErrors);

    // If there are validation errors, display them and don't submit
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation failed, stopping submission');
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});
    setLoading(true);
    console.log('Starting API call...');
    
    try {
      const response = await api.post('/feedback', {
        ...formData,
        rating: rating > 0 ? rating : null
      });
      
      console.log('API response:', response);
      
      // Always treat 200 response as success
      if (response.status === 200 || response.data?.success) {
        console.log('Feedback submitted successfully!');
        toast?.success('Thank you for your feedback!');
        setSubmitted(true);
      } else {
        console.log('Response was not successful');
        toast?.error(response.data?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast?.error(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone_country_code: '+63',
      phone: '',
      message: '',
    });
    setRating(0);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="member-dashboard">
        <MemberHeader />
        <main className="member-main">
          <div className="feedback-page">
            <div className="feedback-success">
              <div className="success-icon">Success</div>
              <h2>Thank You!</h2>
              <p>Your feedback has been submitted successfully.</p>
              <p className="success-note">We appreciate your input and will review it shortly.</p>
              <div className="success-actions">
                <button className="btn btn-primary" onClick={handleReset}>
                  Submit Another Feedback
                </button>
              </div>
            </div>
          </div>
        </main>
        <MemberFooter />
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <MemberHeader />
      <main className="member-main">
        <div className="feedback-page">
          <div className="page-header">
            <h1>Feedback & Suggestions</h1>
            <p>We value your feedback. Help us improve our services.</p>
          </div>

          <div className="feedback-card">
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${validationErrors.name ? 'error' : ''}`}
                    placeholder="Your full name"
                    required
                    style={{ borderColor: validationErrors.name ? '#ef4444' : undefined }}
                  />
                  {validationErrors.name && (
                    <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {validationErrors.name}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${validationErrors.email ? 'error' : ''}`}
                    placeholder="your.email@example.com"
                    required
                    style={{ borderColor: validationErrors.email ? '#ef4444' : undefined }}
                  />
                  {validationErrors.email && (
                    <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {validationErrors.email}
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <select
                    name="phone_country_code"
                    className="form-input form-select"
                    value={formData.phone_country_code}
                    onChange={handleChange}
                    style={{ 
                      flex: '0 0 120px',
                      padding: '0.875rem 1rem'
                    }}
                  >
                    <option value="+63">🇵🇭 +63</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 9123456789"
                    style={{ flex: '1', borderColor: validationErrors.phone ? '#ef4444' : undefined }}
                    title={`Please enter exactly ${getPhoneRequirements(formData.phone_country_code).digits} digits for ${getPhoneRequirements(formData.phone_country_code).country}`}
                  />
                </div>
                {validationErrors.phone && (
                  <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    {validationErrors.phone}
                  </small>
                )}
                {!validationErrors.phone && (
                  <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                    {formData.phone ? (
                      formData.phone.length === getPhoneRequirements(formData.phone_country_code).digits
                        ? '✓ Valid'
                        : `Enter exactly ${getPhoneRequirements(formData.phone_country_code).digits} digits for ${getPhoneRequirements(formData.phone_country_code).country}`
                    ) : (
                      `Optional - Enter exactly ${getPhoneRequirements(formData.phone_country_code).digits} digits for ${getPhoneRequirements(formData.phone_country_code).country}`
                    )}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Rating (Optional)</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={`form-input form-textarea ${validationErrors.message ? 'error' : ''}`}
                  placeholder="Write your feedback or suggestions here..."
                  rows={6}
                  required
                  style={{ borderColor: validationErrors.message ? '#ef4444' : undefined }}
                />
                {validationErrors.message && (
                  <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    {validationErrors.message}
                  </small>
                )}
                {!validationErrors.message && (
                  <span className="char-count">{formData.message.length} / 1000</span>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <MemberFooter />
    </div>
  );
};

export default MemberContactPage;
