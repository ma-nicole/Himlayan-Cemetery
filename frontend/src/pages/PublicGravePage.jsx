import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import publicService from '../services/publicService';
import { resolvePhotoUrl } from '../utils/imageHelpers';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const PublicGravePage = () => {
  const { code } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markerInfoOpen, setMarkerInfoOpen] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await publicService.getGraveProfile(code);
        if (response.success) {
          setProfile(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Grave profile not found');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [code]);

  if (loading) {
    return (
      <div className="public-grave-container">
        <div className="grave-profile" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px', color: '#666' }}>Loading memorial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-grave-container">
        <div className="grave-profile" style={{ textAlign: 'center', padding: '60px' }}>
          <h2 style={{ color: '#e94560' }}>Error</h2>
          <h3 style={{ marginTop: '20px' }}>Profile Not Found</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-grave-container">
      {/* Back Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => window.history.back()}
          style={{ 
            padding: '10px 20px',
            fontSize: '1rem',
            color: 'white',
            backgroundColor: 'rgba(26, 71, 42, 0.6)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.85)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.6)'}
        >
          ← Back
        </button>
      </div>

      <div className="grave-profile">
        <div className="grave-profile-header">
          {(profile.deceased_photo_url || profile.photo_url) && (
            <img
              src={resolvePhotoUrl(profile.deceased_photo_url || profile.photo_url)}
              alt={profile.deceased_name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                marginBottom: '15px',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h1>{profile.deceased_name}</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            {profile.birth_date} — {profile.death_date}
          </p>
          {profile.age_at_death && (
            <p style={{ opacity: 0.7 }}>
              Lived {profile.age_at_death} years
            </p>
          )}
        </div>

        <div className="grave-profile-body">
          {profile.obituary && (
            <div className="grave-obituary">
              <h4 style={{ marginBottom: '10px', color: '#1a1a2e' }}>In Loving Memory</h4>
              <p>{profile.obituary}</p>
            </div>
          )}

          <div style={{ marginTop: '25px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Resting Place</h4>
            <div className="grave-info-row">
              <label>Plot Number</label>
              <span>{profile.location?.plot_number}</span>
            </div>
            <div className="grave-info-row">
              <label>Section</label>
              <span>{profile.location?.section || '-'}</span>
            </div>
            <div className="grave-info-row">
              <label>Buried</label>
              <span>{profile.burial_date}</span>
            </div>
          </div>

          {/* Map showing location */}
          {profile.location?.latitude && profile.location?.longitude && isLoaded && !loadError && (
            <div className="grave-map">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: profile.location.latitude, lng: profile.location.longitude }}
                zoom={18}
                options={{
                  scrollwheel: false,
                  streetViewControl: false,
                  fullscreenControl: true,
                  mapTypeControl: true,
                }}
              >
                <MarkerF
                  position={{ lat: profile.location.latitude, lng: profile.location.longitude }}
                  onClick={() => setMarkerInfoOpen(true)}
                  title={profile.deceased_name}
                />
                {markerInfoOpen && (
                  <InfoWindowF
                    position={{ lat: profile.location.latitude, lng: profile.location.longitude }}
                    onCloseClick={() => setMarkerInfoOpen(false)}
                  >
                    <div style={{ color: '#333' }}>
                      <strong>{profile.deceased_name}</strong>
                      <br />
                      Plot: {profile.location.plot_number}
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            </div>
          )}

          {profile.location?.latitude && profile.location?.longitude && (loadError || !isLoaded) && (
            <div className="grave-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
              <p style={{ color: '#999' }}>Map unavailable. Please use directions below.</p>
            </div>
          )}

          {/* Navigation Link */}
          {profile.location?.latitude && profile.location?.longitude && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${profile.location.latitude},${profile.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Get Directions
              </a>
            </div>
          )}
        </div>

        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          borderTop: '1px solid #eee',
          color: '#999',
          fontSize: '0.85rem'
        }}>
          <p><img src="/himlayan.png" alt="Himlayan" style={{width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '6px'}} />Himlayan</p>
          <p>Digital Memorial Profile</p>
        </div>
      </div>
    </div>
  );
};

export default PublicGravePage;
