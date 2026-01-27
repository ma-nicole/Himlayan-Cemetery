import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different statuses
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const statusColors = {
  available: '#27ae60',
  occupied: '#e94560',
  reserved: '#f39c12',
  maintenance: '#95a5a6',
};

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 18);
    }
  }, [center, zoom, map]);
  
  return null;
};

const CemeteryMap = ({ markers, center, zoom, onMarkerClick }) => {
  const [mapCenter, setMapCenter] = useState(center || [14.5547, 121.0244]);
  const [mapZoom] = useState(zoom || 18);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
  }, [center]);

  return (
    <div className="map-container">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {markers && markers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={createCustomIcon(statusColors[marker.status] || '#333')}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker),
            }}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong style={{ fontSize: '14px' }}>{marker.plot_number}</strong>
                <br />
                <span style={{ 
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  backgroundColor: statusColors[marker.status],
                  color: 'white',
                  marginTop: '5px',
                }}>
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
                    onClick={() => onMarkerClick(marker)}
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CemeteryMap;
