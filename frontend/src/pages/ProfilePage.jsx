import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { resolveAvatarUrl } from '../utils/imageHelpers';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, refreshUser, setUserFromSocial: setUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [user]);

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
      setAvatarPreview(reader.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSavePhoto = async () => {
    if (!avatarFile) return;
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', avatarFile);
      // Keep existing profile fields unchanged
      if (user) {
        formDataToSend.append('name', user.name || '');
        formDataToSend.append('email', user.email || '');
        formDataToSend.append('phone', user.phone || '');
      }
      const response = await api.post('/profile/update', formDataToSend);
      if (response.data.success) {
        toast?.success('Profile photo updated!');
        setAvatarFile(null);
        // Update user state immediately from the response so the avatar shows
        // without waiting for a separate GET /user round-trip.
        if (response.data.data) {
          setUserData(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      toast?.error(error.response?.data?.message || 'Failed to update photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPhoto = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
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
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="avatar-image" />
            ) : (
              <>
                <img
                  src={resolveAvatarUrl(user?.avatar, user?.updated_at) || ''}
                  alt="Avatar"
                  className="avatar-image"
                  style={{ display: resolveAvatarUrl(user?.avatar, user?.updated_at) ? 'block' : 'none' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <span
                  className="avatar-text"
                  style={{ display: resolveAvatarUrl(user?.avatar, user?.updated_at) ? 'none' : 'flex' }}
                >
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </>
            )}
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
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <p className="form-value">{user?.name || '—'}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <p className="form-value">{user?.email || '—'}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <p className="form-value">
                {user?.phone ? `+63 ${user.phone}` : '—'}
              </p>
            </div>

            {avatarFile && (
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancelPhoto}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSavePhoto}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Photo'}
                </button>
              </div>
            )}
          </div>
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
