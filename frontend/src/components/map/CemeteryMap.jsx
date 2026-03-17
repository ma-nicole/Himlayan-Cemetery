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
                    ? createMarkerIcon('#1a3a6b')
                    : createMarkerIcon(statusColors[marker.status] || '#333'),
                  scaledSize: new window.google.maps.Size(32, 40),
                  anchor: new window.google.maps.Point(16, 40),
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
                        <strong style={{ fontSize: '14px' }}>📌 {marker.name}</strong>
                        <br />
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            backgroundColor: marker.status === 'open' ? '#27ae60' : '#95a5a6',
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
