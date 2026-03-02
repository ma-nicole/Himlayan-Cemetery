import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { validateName, validateEmail, validatePhone, validateAddress } from '../utils/formValidator';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = React.useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phone_country_code: '+63',
    address: '',
    avatarPreview: null,
    avatarFile: null,
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

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'Juan Dela Cruz',
        email: user.email || 'juan.delacruz@example.com',
        phone: user.phone || '9123456789',
        phone_country_code: '+63',
        address: user.address || 'Quezon City, Philippines',
        avatarPreview: user.avatar ? user.avatar : null,
        avatarFile: null,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number input - only allow digits and enforce length limit
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const maxLength = getPhoneRequirements(formData.phone_country_code).digits;
      setFormData(prev => ({ 
        ...prev, 
        [name]: digitsOnly.slice(0, maxLength)
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error for this field when user starts correcting it
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast?.error('Only PNG and JPG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast?.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        avatarPreview: reader.result,
        avatarFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else {
      const nameValidation = validateName(formData.name);
      if (!nameValidation.valid) {
        newErrors.name = nameValidation.error;
      }
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error;
      }
    }

    // Validate phone if provided
    if (formData.phone.trim()) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    // Validate address if provided
    if (formData.address.trim()) {
      const addressValidation = validateAddress(formData.address);
      if (!addressValidation.valid) {
        newErrors.address = addressValidation.error;
      }
    }

    // If there are validation errors, show them
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData for multipart file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      
      // Only append avatar if a new one was selected
      if (formData.avatarFile) {
        formDataToSend.append('avatar', formData.avatarFile);
      }

      const response = await api.post('/profile/update', formDataToSend);

      if (response.data.success) {
        toast?.success('Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data from server to get updated avatar and other fields
        const updatedUser = await refreshUser();
        if (updatedUser && updatedUser.avatar) {
          setFormData(prev => ({
            ...prev,
            avatarPreview: updatedUser.avatar
          }));
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast?.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (user) {
      setFormData({
        name: user.name || 'Juan Dela Cruz',
        email: user.email || 'juan.delacruz@example.com',
        phone: user.phone || '9123456789',
        phone_country_code: '+63',
        address: user.address || 'Quezon City, Philippines',
        avatarPreview: user.avatar ? user.avatar : null,
        avatarFile: null,
      });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="member-dashboard">
      <MemberHeader />
      <main className="member-main" style={{ paddingTop: '40px' }}>
        <div className="profile-page">
          <div className="profile-header">
            <h1>User Profile</h1>
          </div>

        <div className="profile-card">
          <div className="profile-avatar">
            {formData.avatarPreview ? (
              <img src={formData.avatarPreview} alt="Avatar" className="avatar-image" />
            ) : user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="avatar-image" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }} 
              />
            ) : null}
            {!formData.avatarPreview && !user?.avatar && (
              <span className="avatar-text" style={{ display: formData.avatarPreview || user?.avatar ? 'none' : 'flex' }}>
                {formData.name.charAt(0).toUpperCase()}
              </span>
            )}
            {isEditing && (
              <>
                <button 
                  type="button"
                  className="avatar-edit" 
                  title="Change photo"
                  onClick={handleAvatarClick}
                >
                  Edit
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  aria-label="Upload avatar"
                />
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${validationErrors.name ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.name && (
                    <small className="error-message">{validationErrors.name}</small>
                  )}
                </>
              ) : (
                <p className="form-value">{formData.name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${validationErrors.email ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.email && (
                    <small className="error-message">{validationErrors.email}</small>
                  )}
                </>
              ) : (
                <p className="form-value">{formData.email}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              {isEditing ? (
                <>
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
                </>
              ) : (
                <p className="form-value">{formData.phone_country_code} {formData.phone}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              {isEditing ? (
                <>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`form-input form-textarea ${validationErrors.address ? 'error' : ''}`}
                    rows={2}
                  />
                  {validationErrors.address && (
                    <small className="error-message">{validationErrors.address}</small>
                  )}
                </>
              ) : (
                <p className="form-value">{formData.address}</p>
              )}
            </div>

            <div className="form-actions">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || Object.keys(validationErrors).length > 0}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Additional Profile Sections */}
        <div className="profile-sections">
          <div className="profile-section">
            <h3>Security</h3>
            <p>Manage your password and security settings</p>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </button>
          </div>

          <div className="profile-section">
            <h3>My Records</h3>
            <p>View burial records associated with your account</p>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/member/loved-ones')}
            >
              View Records
            </button>
          </div>
        </div>
        </div>
      </main>
      <MemberFooter />
    </div>
  );
};

export default ProfilePage;
