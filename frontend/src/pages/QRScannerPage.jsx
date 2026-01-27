import React, { useState, useRef, useEffect } from 'react';
import PublicLayout from '../components/common/PublicLayout';
import { useToast } from '../context/ToastContext';
import './QRScannerPage.css';

const QRScannerPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [graveInfo, setGraveInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const toast = useToast();

  // Demo grave data
  const demoGraves = {
    'QR001': {
      deceased_name: 'Maria Santos',
      birth_date: '1945-03-15',
      death_date: '2020-08-22',
      plot_number: 'A-15-03',
      section: 'Garden of Peace',
      burial_date: '2020-08-25',
      epitaph: 'Forever in our hearts',
    },
    'QR002': {
      deceased_name: 'Jose Reyes',
      birth_date: '1938-11-20',
      death_date: '2019-05-10',
      plot_number: 'B-22-08',
      section: 'Memorial Terrace',
      burial_date: '2019-05-14',
      epitaph: 'Rest in eternal peace',
    },
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      toast?.error('Camera access denied. Please use manual code entry.');
      console.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast?.warning('Please enter a QR code');
      return;
    }
    lookupGrave(manualCode.trim().toUpperCase());
  };

  const lookupGrave = (code) => {
    setLoading(true);
    setGraveInfo(null);
    
    // Simulate API call
    setTimeout(() => {
      const grave = demoGraves[code];
      if (grave) {
        setGraveInfo(grave);
        toast?.success('Grave information found!');
      } else {
        toast?.error('No grave found with this code');
      }
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birth, death) => {
    const birthDate = new Date(birth);
    const deathDate = new Date(death);
    let age = deathDate.getFullYear() - birthDate.getFullYear();
    const m = deathDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <PublicLayout>
      <div className="qr-scanner-page">
        <div className="page-header">
          <h1>QR Code Scanner</h1>
          <p>Scan the QR code on a tombstone to view grave information</p>
        </div>

        <div className="scanner-container">
          {/* Scanner Section */}
          <div className="scanner-card">
            <h2>Scan QR Code</h2>
            
            <div className="camera-preview">
              {isScanning ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="camera-video"
                />
              ) : (
                <div className="camera-placeholder">
                  <p>Camera Preview</p>
                  <span className="camera-hint">Position QR code within frame</span>
                </div>
              )}
              
              {isScanning && (
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                </div>
              )}
            </div>

            <button 
              className={`btn-scan ${isScanning ? 'scanning' : ''}`}
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>

            <div className="manual-entry">
              <p className="divider-text">Or enter QR code manually:</p>
              <form onSubmit={handleManualSubmit} className="manual-form">
                <input
                  type="text"
                  placeholder="Enter code (e.g., QR001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="manual-input"
                />
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Submit'}
                </button>
              </form>
              <p className="hint-text">Try: QR001 or QR002</p>
            </div>
          </div>

          {/* Result Section */}
          <div className="result-card">
            {loading ? (
              <div className="result-loading">
                <div className="loading-spinner"></div>
                <p>Searching...</p>
              </div>
            ) : graveInfo ? (
              <div className="grave-info">
                <div className="info-header">
                  <h3>{graveInfo.deceased_name}</h3>
                </div>
                
                <div className="info-dates">
                  <span>{formatDate(graveInfo.birth_date)}</span>
                  <span className="date-separator">—</span>
                  <span>{formatDate(graveInfo.death_date)}</span>
                </div>
                
                <p className="info-age">
                  Age: {calculateAge(graveInfo.birth_date, graveInfo.death_date)} years old
                </p>

                {graveInfo.epitaph && (
                  <p className="info-epitaph">"{graveInfo.epitaph}"</p>
                )}

                <div className="info-details">
                  <div className="detail-item">
                    <span className="detail-label">Plot Number</span>
                    <span className="detail-value">{graveInfo.plot_number}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Section</span>
                    <span className="detail-value">{graveInfo.section}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Burial Date</span>
                    <span className="detail-value">{formatDate(graveInfo.burial_date)}</span>
                  </div>
                </div>

                <div className="info-actions">
                  <button className="btn-action btn-primary">
                    View on Map
                  </button>
                  <button className="btn-action btn-secondary">
                    Get Directions
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-empty">
                <span className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </span>
                <p>Scan a QR code to view grave information</p>
                <span className="empty-hint">Information will appear here</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default QRScannerPage;
