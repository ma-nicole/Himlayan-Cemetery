import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import { mapService } from '../services/mapService';
import { getLandmarkIcon, createLandmarkIcon } from '../components/map/CemeteryMap';
import '../styles/MemberMap.css';

const CEMETERY_CENTER = { lat: 14.682462, lng: 121.0530409 };

const STATUS_COLORS = {
  open: '#27ae60',
  available: '#2ecc71',
  closed: '#e74c3c',
  unavailable: '#e74c3c',
  'under maintenance': '#f39c12',
  'n/a': '#95a5a6',
};

const MemberMapPage = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [loadingLandmarks, setLoadingLandmarks] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  const HIMLAYAN_COORDS = { lat: 14.682462, lng: 121.0530409 };

  useEffect(() => {
    mapService.getLandmarks()
      .then(res => { if (res.success) setLandmarks(res.data); })
      .catch(err => console.error('Failed to load landmarks:', err))
      .finally(() => setLoadingLandmarks(false));
  }, []);

  const handleSelectLandmark = (landmark) => {
    setSelectedLandmark(landmark);
    setInfoWindowOpen(true);
  };

  const handleGetDirections = (landmark) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${landmark.latitude},${landmark.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const sections = [
    { 
      id: 'lawn', 
      name: 'Lawn Section', 
      desc: 'Traditional lawn lots with perpetual care',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8l7-5 7 5M5 16c0-3 3-5 7-5s7 2 7 5"/>
        </svg>
      ),
      color: '#22c55e',
      image: '/Florante-at-Laura-1-scaled.jpg'
    },
    { 
      id: 'garden', 
      name: 'Garden Section', 
      desc: 'Beautiful garden setting with landscaping',
      availability: 'Limited',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22c4-4 8-7 8-12a8 8 0 10-16 0c0 5 4 8 8 12z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      color: '#ec4899',
      image: '/Panooran-2.jpg'
    },
    { 
      id: 'columbarium', 
      name: 'Columbarium', 
      desc: 'Climate-controlled niches for cremated remains',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
      ),
      color: '#8b5cf6',
      image: '/himlayanheritage.jpg'
    },
    { 
      id: 'mausoleum', 
      name: 'Mausoleum', 
      desc: 'Private family tombs with custom designs',
      availability: 'By Request',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V7l7-4 7 4v14"/>
          <rect x="9" y="13" width="6" height="8"/>
          <rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/>
        </svg>
      ),
      color: '#f59e0b',
      image: '/Malakas-at-Maganda.jpg'
    },
    { 
      id: 'terrace', 
      name: 'Memorial Terrace', 
      desc: 'Elevated area with scenic views',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
          <path d="M9 20v-6h6v6"/>
        </svg>
      ),
      color: '#06b6d4',
      image: '/Teresa-Magbanua-scaled.jpg'
    },
    { 
      id: 'heritage', 
      name: 'Heritage Section', 
      desc: 'Historical monuments and landmarks',
      availability: 'View Only',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14"/>
          <path d="M12 3v16M4 19h16"/>
          <circle cx="12" cy="10" r="2"/>
        </svg>
      ),
      color: '#ef4444',
      image: '/Gabriela-Silang-scaled.jpg'
    }
  ];

  const landmarks_static = [
    { name: 'Main Gate', icon: '' },
  ]; // kept for reference only — landmark list is now fetched from API

  return (
    <div className="map-page">
      {/* Header */}
      <MemberHeader />

      {/* Hero */}
      <section className="map-hero">
        <div className="hero-content">
          <h1>Cemetery Map</h1>
          <p>Explore the different sections of Himlayang Pilipino Memorial Park</p>
        </div>
      </section>

      <main className="map-main">
        {/* ── Landmark Map Section (live from DB) ── */}
        <section className="lm-section">
          <div className="section-header">
            <h2>Navigation</h2>
            <p>Click a landmark to see details and get directions</p>
          </div>

          <div className="lm-layout">
            {/* Google Map */}
            <div className="lm-map-wrap">
              {(!isLoaded || loadingLandmarks) ? (
                <div className="lm-loading">
                  <div className="lm-spinner"></div>
                  <p>Loading map…</p>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={CEMETERY_CENTER}
                  zoom={18}
                  options={{
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    clickableIcons: false,
                  }}
                  onClick={() => setInfoWindowOpen(false)}
                >
                  {landmarks.map((lm) => (
                    <MarkerF
                      key={lm.id}
                      position={{ lat: parseFloat(lm.latitude), lng: parseFloat(lm.longitude) }}
                      icon={createLandmarkIcon(lm.name)}
                      onClick={() => handleSelectLandmark(lm)}
                    />
                  ))}
                  {selectedLandmark && infoWindowOpen && (
                    <InfoWindowF
                      position={{
                        lat: parseFloat(selectedLandmark.latitude),
                        lng: parseFloat(selectedLandmark.longitude),
                      }}
                      onCloseClick={() => setInfoWindowOpen(false)}
                    >
                      <div className="lm-infowindow">
                        <strong>{selectedLandmark.name}</strong>
                        <span style={{ color: STATUS_COLORS[selectedLandmark.status] || '#666' }}>
                          {selectedLandmark.status}
                        </span>
                        {selectedLandmark.notes && <p>{selectedLandmark.notes}</p>}
                        <button
                          className="lm-infowindow-btn"
                          onClick={() => handleGetDirections(selectedLandmark)}
                        >
                          🗺️ Get Directions
                        </button>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              )}
            </div>

            {/* Landmark List Panel */}
            <div className="lm-panel">
              <h3 className="lm-panel-title">Landmarks</h3>

              {loadingLandmarks ? (
                <p className="lm-panel-loading">Loading landmarks…</p>
              ) : landmarks.length === 0 ? (
                <p className="lm-panel-empty">No landmarks found.</p>
              ) : (
                <ul className="lm-list">
                  {landmarks.map((lm) => (
                    <li
                      key={lm.id}
                      className={`lm-item${selectedLandmark?.id === lm.id ? ' lm-item--active' : ''}`}
                      onClick={() => handleSelectLandmark(lm)}
                    >
                      <span className="lm-item-icon">{getLandmarkIcon(lm.name)}</span>
                      <div className="lm-item-text">
                        <span className="lm-item-name">{lm.name}</span>
                        <span
                          className="lm-item-status"
                          style={{ color: STATUS_COLORS[lm.status] || '#95a5a6' }}
                        >
                          {lm.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Selected Landmark Detail Card */}
              {selectedLandmark && (
                <div className="lm-detail-card">
                  <div className="lm-detail-head">
                    <span className="lm-detail-icon">{getLandmarkIcon(selectedLandmark.name)}</span>
                    <h4>{selectedLandmark.name}</h4>
                  </div>
                  <span
                    className="lm-detail-badge"
                    style={{ backgroundColor: STATUS_COLORS[selectedLandmark.status] || '#95a5a6' }}
                  >
                    {selectedLandmark.status}
                  </span>
                  {selectedLandmark.notes && (
                    <p className="lm-detail-notes">{selectedLandmark.notes}</p>
                  )}
                  <button
                    className="lm-directions-btn"
                    onClick={() => handleGetDirections(selectedLandmark)}
                  >
                    🗺️ Get Directions
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link
              to="/member/search"
              className="lm-directions-btn"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
              }}
            >
              🔎 Find a Grave
            </Link>
          </div>
        </section>

        {/* Directions */}
        <section className="directions-section">
          <div className="section-header">
            <h2>How to Get Here</h2>
            <p>Visit us at Himlayang Pilipino Memorial Park</p>
          </div>
          <div className="directions-grid">
            <div className="direction-card">
              <div className="direction-icon car">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 3H8l-4 6v8a2 2 0 002 2h1a2 2 0 002-2v-1h6v1a2 2 0 002 2h1a2 2 0 002-2V9l-4-6z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <h3>By Car</h3>
              <p>From EDSA, turn to Tandang Sora Avenue. The entrance is on the left side, near the corner. Free parking available.</p>
            </div>
            <div className="direction-card">
              <div className="direction-icon transit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="3" width="16" height="16" rx="2"/>
                  <path d="M4 11h16M8 19v2M16 19v2"/>
                  <circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>
                </svg>
              </div>
              <h3>By Commute</h3>
              <p>Take a jeepney going to Tandang Sora. Drop off at Himlayang Pilipino. It's about 5 minutes walk from the main road.</p>
            </div>
            <div className="direction-card">
              <div className="direction-icon contact">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <h3>Need Directions?</h3>
              <p>Call our office at <strong>(02) 8921-6947</strong> and we'll help guide you to our location.</p>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="google-map-section">
          <div className="section-header">
            <h2>Location</h2>
            <p>Himlayang Pilipino Memorial Park - Pantranco, Quezon City, 1107 Metro Manila</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberMapPage;
