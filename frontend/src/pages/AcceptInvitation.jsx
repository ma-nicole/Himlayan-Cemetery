import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AcceptInvitation.css';
import api from '../services/api';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - no token provided');
      setLoading(false);
      return;
    }

    // Fetch invitation details
    const fetchInvitationDetails = async () => {
      try {
        const response = await api.get('/invitations/details', {
          params: { token },
        });

        setInvitationData(response.data?.data || null);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link');
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleAcceptInvitation = async () => {
    setAccepting(true);
    try {
      await api.post('/invitations/accept', { token });

      setAccountCreated(true);
      setAccepting(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="accept-invitation-container">
        <div className="accept-invitation-card">
          <div className="loading-message">
            <p>Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="accept-invitation-container">
        <div className="accept-invitation-card">
          <h2>Invitation Error</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (accountCreated && invitationData) {
    return (
      <div className="accept-invitation-container">
        <div className="accept-invitation-card">
          <div className="success-message">
            <h2>✓ Account Created Successfully!</h2>
            <p>Your account is ready to use.</p>
            
            <div className="credentials-box">
              <h3>Your Login Credentials:</h3>
              <div className="credential-item">
                <label>Email:</label>
                <span>{invitationData.email}</span>
              </div>
              <div className="credential-item">
                <label>Password:</label>
                <span className="password">{invitationData.password}</span>
              </div>
            </div>

            <button onClick={handleLogin} className="login-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invitation-container">
      <div className="accept-invitation-card">
        {error && <div className="error-message">{error}</div>}
        
        {invitationData && (
          <div className="invitation-details">
            <h2>Activate Your Account</h2>
            <p>We've generated credentials for you:</p>

            <div className="credentials-box">
              <div className="credential-item">
                <label>Email:</label>
                <span>{invitationData.email}</span>
              </div>
              <div className="credential-item">
                <label>Password:</label>
                <span className="password">{invitationData.password}</span>
              </div>
            </div>

            <button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="accept-btn"
            >
              {accepting ? 'Creating Account...' : '✓ Accept & Create Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
