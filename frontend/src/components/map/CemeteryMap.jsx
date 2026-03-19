import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const statusColors = {
  available: '#27ae60',
  occupied: '#e94560',
  reserved: '#f39c12',
  maintenance: '#95a5a6',
};

// Create SVG marker icon as data URL
const createMarkerIcon = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 7 12 20 12 20s12-13 12-20c0-6.6-5.4-12-12-12z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="1.5"/>
      <circle cx="12" cy="12.5" r="6" fill="white" opacity="0.3"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Inner symbol paths for each landmark name (fits inside a 24x24 viewport centered at 12,12)
const LANDMARK_ABBREVIATIONS = {
  'Main Gate':        'MG',
  'Chapel':           'CH',
  'Admin Office':     'AO',
  'Parking Area':     'P',
  'Comfort Room':     'CR',
  'Information Booth':'i',
  'Entrance':         'EN',
  'Exit':             'EX',
  'Food Stall':       'FS',
  'Cultural Heritage':'CU',
};

export const createLandmarkIcon = (landmarkName) => {
  const color = '#1a3a6b';
  const abbr = LANDMARK_ABBREVIATIONS[landmarkName] || 'LM';
  const fontSize = abbr.length === 1 ? '13' : '9';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
    <path d="M18 1C9.2 1 2 8.2 2 17c0 9.8 16 30 16 30S34 26.8 34 17C34 8.2 26.8 1 18 1z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="18" cy="17" r="11" fill="white"/>
    <text x="18" y="21" text-anchor="middle" font-size="${fontSize}" font-family="Arial,sans-serif" font-weight="bold" fill="${color}">${abbr}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Inline SVG icon component for UI (InfoWindow, detail panel)
const LANDMARK_UI_ICONS = {
  'Main Gate':        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  'Chapel':           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="7"/><line x1="10" y1="5" x2="14" y2="5"/><path d="M6 22V9Q12 4 18 9V22Z"/><path d="M9 22v-5a3 3 0 0 1 6 0v5"/></svg>,
  'Admin Office':     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></svg>,
  'Parking Area':     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
  'Comfort Room':     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h4v4H6z"/><path d="M14 2h4v4h-4z"/><path d="M7 6l-2 6h6L9 6"/><path d="M15 6l-2 6h6l-2-6"/><line x1="8" y1="12" x2="8" y2="22"/><line x1="16" y1="12" x2="16" y2="22"/></svg>,
  'Information Booth':<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>,
  'Entrance':         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  'Exit':             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  'Food Stall':       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h18v6H3z"/><path d="M3 8h18v13H3z"/><line x1="9" y1="8" x2="9" y2="21"/><line x1="15" y1="8" x2="15" y2="21"/></svg>,
  'Cultural Heritage':<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M12 2L2 9h20L12 2z"/><path d="M5 9v13"/><path d="M19 9v13"/><path d="M9 22v-5a3 3 0 0 1 6 0v5"/></svg>,
};

const DEFAULT_LANDMARK_ICON = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;

export const getLandmarkIcon = (name) => LANDMARK_UI_ICONS[name] || DEFAULT_LANDMARK_ICON;

const CemeteryMap = ({ markers, center, zoom, onMarkerClick, onMapClick }) => {
  const [mapCenter, setMapCenter] = useState(
    center ? { lat: center[0], lng: center[1] } : { lat: 14.682462, lng: 121.0530409 }
  );
  const [mapZoom] = useState(zoom || 18);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: [],
  });

  useEffect(() => {
    // Debug: Check if API key is loaded
    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      console.error('⚠️ REACT_APP_GOOGLE_MAPS_API_KEY is not set in .env');
    } else {
      console.log('✓ Google Maps API Key is configured');
    }
  }, []);

  useEffect(() => {
    if (center) {
      setMapCenter({ lat: center[0], lng: center[1] });
    }
  }, [center]);

  useEffect(() => {
    if (markers && markers.length > 0) {
      console.log(`✓ Markers loaded: ${markers.length} markers on map`);
    } else {
      console.warn('⚠️ No markers to display');
    }
  }, [markers]);

  const handleMarkerClick = (marker) => {
    setSelectedMarkerId(marker.id);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarkerId(null);
  };

  if (loadError) {
    console.error('Google Maps Load Error:', loadError);
    return (
      <div style={{ padding: '20px', color: '#e74c3c', textAlign: 'center', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
        <strong>Error loading Google Maps</strong>
        <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
          Please verify:
          <br />• API key is set in .env file
          <br />• Maps JavaScript API is enabled in Google Cloud Console
          <br />• API key restrictions allow this domain
        </p>
        <p style={{ fontSize: '0.85rem', color: '#999' }}>Check browser console for details</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🗺️</div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ height: '500px', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        ref={mapRef}
        options={{
          scrollwheel: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
          minZoom: 16,
          restriction: {
            latLngBounds: {
              north: 14.691,
              south: 14.673,
              east: 121.059,
              west: 121.047,
            },
            strictBounds: false,
          },
        }}
        onClick={(e) => {
          if (onMapClick) {
            onMapClick({
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng(),
            });
          }
        }}
      >
        {markers &&
          markers.map((marker) => (
            <React.Fragment key={marker.id}>
              <MarkerF
                position={{ lat: marker.latitude, lng: marker.longitude }}
                icon={{
                  url: marker.type === 'landmark'
                    ? createLandmarkIcon(marker.name)
                    : createMarkerIcon(statusColors[marker.status] || '#333'),
                  scaledSize: marker.type === 'landmark'
                    ? new window.google.maps.Size(36, 48)
                    : new window.google.maps.Size(32, 40),
                  anchor: marker.type === 'landmark'
                    ? new window.google.maps.Point(18, 48)
                    : new window.google.maps.Point(16, 40),
                }}
                onClick={() => handleMarkerClick(marker)}
                title={marker.type === 'landmark' ? marker.name : marker.plot_number}
              />

              {selectedMarkerId === marker.id && (
                <InfoWindowF
                  position={{ lat: marker.latitude, lng: marker.longitude }}
                  onCloseClick={handleInfoWindowClose}
                >
                  <div style={{ minWidth: '150px', color: '#333' }}>
                    {marker.type === 'landmark' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ color: '#1a3a6b', flexShrink: 0 }}>{LANDMARK_UI_ICONS[marker.name] || DEFAULT_LANDMARK_ICON}</span>
                          <strong style={{ fontSize: '14px' }}>{marker.name}</strong>
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            backgroundColor: {
                              open: '#27ae60',
                              available: '#2ecc71',
                              closed: '#e74c3c',
                              unavailable: '#e74c3c',
                              'under maintenance': '#f39c12',
                              'n/a': '#95a5a6',
                            }[marker.status] || '#95a5a6',
                            color: 'white',
                            marginTop: '5px',
                          }}
                        >
                          {marker.status}
                        </span>
                        {marker.notes && (
                          <>
                            <hr style={{ margin: '8px 0' }} />
                            <p style={{ margin: 0, fontSize: '12px' }}>{marker.notes}</p>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <strong style={{ fontSize: '14px' }}>{marker.plot_number}</strong>
                        <br />
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            backgroundColor: statusColors[marker.status],
                            color: 'white',
                            marginTop: '5px',
                          }}
                        >
                          {marker.status}
                        </span>
                        {marker.deceased_name && (
                          <>
                            <hr style={{ margin: '8px 0' }} />
                            <p style={{ margin: 0 }}>
                              <strong>{marker.deceased_name}</strong>
                            </p>
                            {marker.burial_date && (
                              <small>Buried: {marker.burial_date}</small>
                            )}
                          </>
                        )}
                        {onMarkerClick && (
                          <button
                            style={{
                              marginTop: '10px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              backgroundColor: '#1a1a2e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              width: '100%',
                            }}
                            onClick={() => handleMarkerClick(marker)}
                          >
                            View Details
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </React.Fragment>
          ))}
      </GoogleMap>
    </div>
  );
};

export default CemeteryMap;
