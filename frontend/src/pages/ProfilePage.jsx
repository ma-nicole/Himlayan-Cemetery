import React, { useState, useEffect } from 'react';
import PublicLayout from '../components/common/PublicLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'Juan Dela Cruz',
        email: user.email || 'juan.delacruz@example.com',
        phone: user.phone || '+63 912 345 6789',
        address: user.address || 'Quezon City, Philippines',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast?.success('Profile updated successfully!');
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (user) {
      setFormData({
        name: user.name || 'Juan Dela Cruz',
        email: user.email || 'juan.delacruz@example.com',
        phone: user.phone || '+63 912 345 6789',
        address: user.address || 'Quezon City, Philippines',
      });
    }
  };

  return (
    <PublicLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>User Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            <span className="avatar-text">
              {formData.name.charAt(0).toUpperCase()}
            </span>
            {isEditing && (
              <button className="avatar-edit" title="Change photo">
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="form-value">{formData.name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="form-value">{formData.email}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="form-value">{formData.phone}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  rows={2}
                />
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
                    disabled={loading}
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
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                  >
                    Back to Home
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
            <button className="btn btn-outline btn-sm">Change Password</button>
          </div>

          <div className="profile-section">
            <h3>My Records</h3>
            <p>View burial records associated with your account</p>
            <button className="btn btn-outline btn-sm">View Records</button>
          </div>

          <div className="profile-section">
            <h3>Payment History</h3>
            <p>View your payment and dues history</p>
            <button className="btn btn-outline btn-sm">View History</button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProfilePage;
