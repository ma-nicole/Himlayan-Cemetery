import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CemeteryMap from '../components/map/CemeteryMap';
import mapService from '../services/mapService';

const MapPage = () => {
  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markerDetails, setMarkerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        
        // Load markers and bounds in parallel
        const [markersRes, boundsRes] = await Promise.all([
          mapService.getMarkers(),
          mapService.getBounds(),
        ]);
        
        if (markersRes.success) {
          setMarkers(markersRes.data);
        }
        
        if (boundsRes.success && boundsRes.data.center) {
          setMapCenter([boundsRes.data.center.lat, boundsRes.data.center.lng]);
        }
      } catch (err) {
        setError('Failed to load map data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  const handleMarkerClick = async (marker) => {
    setSelectedMarker(marker);
    setLoadingDetails(true);
    setMarkerDetails(null);
    
    try {
      const response = await mapService.getMarkerDetails(marker.id);
      if (response.success) {
        setMarkerDetails(response.data);
      }
    } catch (err) {
      console.error('Failed to load marker details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredMarkers = filter === 'all' 
    ? markers 
    : markers.filter(m => m.status === filter);

  // Legend for marker colors
  const legend = [
    { status: 'available', color: '#27ae60', label: 'Available' },
    { status: 'occupied', color: '#e94560', label: 'Occupied' },
    { status: 'reserved', color: '#f39c12', label: 'Reserved' },
    { status: 'maintenance', color: '#95a5a6', label: 'Maintenance' },
  ];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading cemetery map..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>Cemetery Map</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Map Section */}
        <div style={{ flex: 1 }}>
          {/* Filter and Legend */}
          <div className="card" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label><strong>Filter:</strong></label>
                <select
                  className="form-control"
                  style={{ width: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All ({markers.length})</option>
                  <option value="available">Available ({markers.filter(m => m.status === 'available').length})</option>
                  <option value="occupied">Occupied ({markers.filter(m => m.status === 'occupied').length})</option>
                  <option value="reserved">Reserved ({markers.filter(m => m.status === 'reserved').length})</option>
                  <option value="maintenance">Maintenance ({markers.filter(m => m.status === 'maintenance').length})</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {legend.map(item => (
                  <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                    }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="card" style={{ padding: 0 }}>
            <CemeteryMap
              markers={filteredMarkers}
              center={mapCenter}
              zoom={18}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ width: '350px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Plot Details</h3>
            
            {!selectedMarker && (
              <p style={{ color: '#666', textAlign: 'center' }}>
                Click on a marker to view details
              </p>
            )}
            
            {loadingDetails && (
              <LoadingSpinner text="Loading..." />
            )}
            
            {markerDetails && !loadingDetails && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ color: '#1a1a2e' }}>{markerDetails.plot.plot_number}</h4>
                  <span className={`status-badge status-${markerDetails.plot.status}`}>
                    {markerDetails.plot.status}
                  </span>
                </div>
                
                <div className="grave-info-row">
                  <label>Section</label>
                  <span>{markerDetails.plot.section || '-'}</span>
                </div>
                <div className="grave-info-row">
                  <label>Row / Column</label>
                  <span>
                    {markerDetails.plot.row && markerDetails.plot.column
                      ? `R${markerDetails.plot.row} / C${markerDetails.plot.column}`
                      : '-'}
                  </span>
                </div>
                <div className="grave-info-row">
                  <label>Coordinates</label>
                  <span style={{ fontSize: '0.85rem' }}>
                    {markerDetails.plot.latitude.toFixed(6)},
                    {markerDetails.plot.longitude.toFixed(6)}
                  </span>
                </div>
                
                {markerDetails.burial_record && (
                  <>
                    <hr style={{ margin: '15px 0' }} />
                    <h4 style={{ marginBottom: '10px', color: '#1a1a2e' }}>Burial Information</h4>
                    <div className="grave-info-row">
                      <label>Deceased</label>
                      <span><strong>{markerDetails.burial_record.deceased_name}</strong></span>
                    </div>
                    <div className="grave-info-row">
                      <label>Death Date</label>
                      <span>{markerDetails.burial_record.death_date || '-'}</span>
                    </div>
                    <div className="grave-info-row">
                      <label>Burial Date</label>
                      <span>{markerDetails.burial_record.burial_date || '-'}</span>
                    </div>
                    <div className="grave-info-row">
                      <label>QR Code</label>
                      <span>
                        {markerDetails.burial_record.has_qr_code ? (
                          <span className="status-badge status-available">Generated</span>
                        ) : (
                          <span className="status-badge status-maintenance">Not Generated</span>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapPage;
