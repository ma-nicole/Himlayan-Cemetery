import React from 'react';

const BurialDetails = ({ burial, qrData, onClose, onGenerateQR }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
