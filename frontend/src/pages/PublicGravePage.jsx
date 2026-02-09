import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import publicService from '../services/publicService';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PublicGravePage = () => {
  const { code } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="grave-profile">
        <div className="grave-profile-header">
          {(profile.deceased_photo_url || profile.photo_url) && (
            <img
              src={profile.deceased_photo_url || profile.photo_url}
              alt={profile.deceased_name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                marginBottom: '15px',
              }}
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
          {profile.location?.latitude && profile.location?.longitude && (
            <div className="grave-map">
              <MapContainer
                center={[profile.location.latitude, profile.location.longitude]}
                zoom={18}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[profile.location.latitude, profile.location.longitude]}>
                  <Popup>
                    <strong>{profile.deceased_name}</strong>
                    <br />
                    Plot: {profile.location.plot_number}
                  </Popup>
                </Marker>
              </MapContainer>
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
