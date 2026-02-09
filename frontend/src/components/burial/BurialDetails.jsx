import React, { useState, useEffect } from 'react';
import { sendInvitation, resendInvitation, getInvitationStatus } from '../../services/invitationService';

const BurialDetails = ({ burial, qrData, onClose, onGenerateQR }) => {
  const [invitationStatus, setInvitationStatus] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch invitation status on component mount
  useEffect(() => {
    const fetchInvitationStatus = async () => {
      setLoadingStatus(true);
      setStatusError(null);
      try {
        console.log('Fetching invitation status for burial ID:', burial.id);
        const status = await getInvitationStatus(burial.id);
        console.log('Invitation status response:', status);
        setInvitationStatus(status);
      } catch (error) {
        console.error('Error fetching invitation status:', error);
        setStatusError(error.message || 'Failed to load invitation status');
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchInvitationStatus();
  }, [burial.id]);

  // Handle sending invitation
  const handleSendInvitation = async () => {
    setLoadingInvitation(true);
    setInvitationMessage('');
    try {
      const response = await sendInvitation(burial.id);
      setInvitationMessage(response.message);
      // Refresh status
      const status = await getInvitationStatus(burial.id);
      setInvitationStatus(status);
    } catch (error) {
      setInvitationMessage(error.message || 'Failed to send invitation');
    } finally {
      setLoadingInvitation(false);
    }
  };

  // Handle resending invitation
  const handleResendInvitation = async () => {
    setLoadingInvitation(true);
    setInvitationMessage('');
    try {
      const response = await resendInvitation(burial.id);
      setInvitationMessage(response.message);
      // Refresh status
      const status = await getInvitationStatus(burial.id);
      setInvitationStatus(status);
    } catch (error) {
      setInvitationMessage(error.message || 'Failed to resend invitation');
    } finally {
      setLoadingInvitation(false);
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
    };

    switch (status) {
      case 'accepted':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'pending':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'expired':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      case 'not_sent':
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
      case 'no_email':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return baseStyle;
    }
  };

  // Format status text
  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      case 'not_sent':
        return 'Not Sent';
      case 'no_email':
        return 'No Email';
      default:
        return status;
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Burial Record Details</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Deceased Information */}
          <div className="card" style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Deceased Information</h4>
            
            {/* Photo section */}
            {burial.deceased_photo_url && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto',
                  border: '3px solid #1a472a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={burial.deceased_photo_url.startsWith('http') ? burial.deceased_photo_url : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${burial.deceased_photo_url}`}
                    alt={burial.deceased_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="grave-info-row">
              <label>Name</label>
              <span><strong>{burial.deceased_name}</strong></span>
            </div>
            <div className="grave-info-row">
              <label>Birth Date</label>
              <span>{formatDate(burial.birth_date)}</span>
            </div>
            <div className="grave-info-row">
              <label>Death Date</label>
              <span>{formatDate(burial.death_date)}</span>
            </div>
            <div className="grave-info-row">
              <label>Burial Date</label>
              <span>{formatDate(burial.burial_date)}</span>
            </div>
          </div>

          {/* Plot Information */}
          <div className="card" style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Plot Information</h4>
            <div className="grave-info-row">
              <label>Plot Number</label>
              <span>{burial.plot?.plot_number}</span>
            </div>
            <div className="grave-info-row">
              <label>Section</label>
              <span>{burial.plot?.section}</span>
            </div>
            <div className="grave-info-row">
              <label>Coordinates</label>
              <span>{burial.plot?.latitude}, {burial.plot?.longitude}</span>
            </div>
          </div>

          {/* Obituary */}
          {burial.obituary && (
            <div className="card" style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Obituary</h4>
              <p style={{ lineHeight: 1.6 }}>{burial.obituary}</p>
            </div>
          )}

          {/* Contact Information */}
          {(burial.contact_name || burial.contact_phone || burial.contact_email) && (
            <div className="card" style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Contact Information</h4>
              {burial.contact_name && (
                <div className="grave-info-row">
                  <label>Name</label>
                  <span>{burial.contact_name}</span>
                </div>
              )}
              {burial.contact_phone && (
                <div className="grave-info-row">
                  <label>Phone</label>
                  <span>{burial.contact_phone}</span>
                </div>
              )}
              {burial.contact_email && (
                <div className="grave-info-row">
                  <label>Email</label>
                  <span>{burial.contact_email}</span>
                </div>
              )}
            </div>
          )}

          {/* Account Invitation */}
          <div className="card" style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Account Invitation</h4>
            
            {loadingStatus ? (
              <p style={{ color: '#666' }}>Loading invitation status...</p>
            ) : statusError ? (
              <div style={{
                padding: '10px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <strong>Error:</strong> {statusError}
                <br />
                <small>Check browser console for details.</small>
              </div>
            ) : invitationStatus ? (
              <>
                <div className="grave-info-row">
                  <label>Status</label>
                  <span style={getStatusBadgeStyle(invitationStatus.status)}>
                    {getStatusText(invitationStatus.status)}
                  </span>
                </div>

                {invitationStatus.user && (
                  <>
                    <div className="grave-info-row">
                      <label>Account Email</label>
                      <span>{invitationStatus.user.email}</span>
                    </div>
                    
                    {invitationStatus.status === 'pending' && invitationStatus.user.invitation_expires_at && (
                      <div className="grave-info-row">
                        <label>Expires At</label>
                        <span>{formatDate(invitationStatus.user.invitation_expires_at)}</span>
                      </div>
                    )}

                    {invitationStatus.status === 'accepted' && invitationStatus.user.invitation_accepted_at && (
                      <div className="grave-info-row">
                        <label>Accepted At</label>
                        <span>{formatDate(invitationStatus.user.invitation_accepted_at)}</span>
                      </div>
                    )}
                  </>
                )}

                {invitationMessage && (
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: invitationMessage.includes('Failed') ? '#f8d7da' : '#d4edda',
                    color: invitationMessage.includes('Failed') ? '#721c24' : '#155724',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {invitationMessage}
                  </div>
                )}

                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  {invitationStatus.status === 'not_sent' && burial.contact_email && (
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSendInvitation}
                      disabled={loadingInvitation}
                    >
                      {loadingInvitation ? 'Sending...' : 'Send Invitation'}
                    </button>
                  )}

                  {(invitationStatus.status === 'pending' || invitationStatus.status === 'expired') && (
                    <button 
                      className="btn btn-warning" 
                      onClick={handleResendInvitation}
                      disabled={loadingInvitation}
                      style={{ backgroundColor: '#ffc107', borderColor: '#ffc107', color: '#000' }}
                    >
                      {loadingInvitation ? 'Resending...' : 'Resend Invitation'}
                    </button>
                  )}

                  {invitationStatus.status === 'accepted' && (
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#d4edda', 
                      color: '#155724',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      ✓ User account is active
                    </div>
                  )}

                  {invitationStatus.status === 'no_email' && (
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f8d7da', 
                      color: '#721c24',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      No contact email provided. Please update the burial record to add an email address.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: '#666' }}>No invitation data available.</p>
            )}
          </div>

          {/* QR Code */}
          <div className="card">
            <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>QR Code</h4>
            {qrData ? (
              <div className="qr-display">
                <img src={qrData.qr_url} alt="QR Code" />
                <p style={{ marginTop: '10px' }}>
                  <strong>Public Profile URL:</strong>
                </p>
                <div className="qr-url">
                  {qrData.qr_code.url}
                </div>
              </div>
            ) : burial.qr_code ? (
              <div className="qr-display">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(burial.qr_code.url)}`} 
                  alt="QR Code" 
                />
                <p style={{ marginTop: '10px' }}>
                  <strong>Public Profile URL:</strong>
                </p>
                <div className="qr-url">
                  {burial.qr_code.url}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>No QR code generated yet.</p>
                <button className="btn btn-success" onClick={() => onGenerateQR(burial.id)}>
                  Generate QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurialDetails;
