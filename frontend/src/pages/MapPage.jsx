import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CemeteryMap from '../components/map/CemeteryMap';
import AddPlotModal from '../components/map/AddPlotModal';
import DeletePlotModal from '../components/map/DeletePlotModal';
import { mapService } from '../services/mapService';
import { useAuth } from '../hooks/useAuth';

const MapPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const DEFAULT_CEMETERY_CENTER = [14.682462, 121.0530409];

  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CEMETERY_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markerDetails, setMarkerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [filter, setFilter] = useState('all');
  
  // Modal states
  const [showAddPlotModal, setShowAddPlotModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [plotToDelete, setPlotToDelete] = useState(null);
  
  // Add plot mode state
  const [addPlotMode, setAddPlotMode] = useState(false);
  const [selectedPlotCoordinates, setSelectedPlotCoordinates] = useState(null);

  const loadMapData = async () => {
    try {
      setLoading(true);
      
      // Load markers only and keep fixed default center for this page
      const markersRes = await mapService.getMarkers();
      
      if (markersRes.success) {
        setMarkers(markersRes.data);
      }

      setMapCenter(DEFAULT_CEMETERY_CENTER);
    } catch (err) {
      setError('Failed to load map data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handlePlotAdded = (newPlot) => {
    // Reload all markers to get the updated list
    loadMapData();
    // Clear selection
    setSelectedMarker(null);
    setMarkerDetails(null);
  };

  const handleDeleteClick = (marker) => {
    if (isAdmin) {
      setPlotToDelete(marker);
      setShowDeleteModal(true);
    }
  };

  const handlePlotDeleted = (plotId) => {
    // Remove deleted plot from markers
    setMarkers(prev => prev.filter(m => m.id !== plotId));
    setSelectedMarker(null);
    setMarkerDetails(null);
  };

  const handleMapClick = (coordinates) => {
    if (addPlotMode) {
      setSelectedPlotCoordinates(coordinates);
      setShowAddPlotModal(true);
    }
  };

  const handleAddPlotClick = () => {
    // Just open the modal - don't enable map click mode yet
    setShowAddPlotModal(true);
    setSelectedPlotCoordinates(null);
    setSelectedMarker(null);
  };

  const handleAddPlotModalClose = () => {
    setShowAddPlotModal(false);
    setAddPlotMode(false);
    setSelectedPlotCoordinates(null);
  };

  const toggleMapClickMode = () => {
    if (!addPlotMode) {
      // Entering map click mode - close modal to allow map interaction
      setShowAddPlotModal(false);
      setAddPlotMode(true);
    } else {
      // Exiting map click mode - reopen modal
      setShowAddPlotModal(true);
      setAddPlotMode(false);
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
          <div className="card" style={{ padding: 0, position: 'relative' }}>
            {addPlotMode && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#f39c12',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                📍 Click on the map to select plot location
              </div>
            )}
            <CemeteryMap
              markers={filteredMarkers}
              center={mapCenter}
              zoom={18}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
            />
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ width: '350px' }}>
          {isAdmin && (
            <button
              onClick={handleAddPlotClick}
              style={{
                width: '100%',
                padding: '10px 16px',
                marginBottom: '15px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#229954';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#27ae60';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(39, 174, 96, 0.3)';
              }}
            >
              + Add Plot
            </button>
          )}
          
          <div className="card">
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Plot Details</h3>
            </div>
            
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

                {/* Admin Actions */}
                {isAdmin && (
                  <div style={{ marginTop: '20px' }}>
                    <hr style={{ margin: '15px 0' }} />
                    <button
                      onClick={() => handleDeleteClick(selectedMarker)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                      }}
                    >
                      🗑️ Delete Plot
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPlotModal
        isOpen={showAddPlotModal}
        onClose={handleAddPlotModalClose}
        onPlotAdded={handlePlotAdded}
        center={mapCenter}
        selectedCoordinates={selectedPlotCoordinates}
        addPlotMode={addPlotMode}
        toggleMapClickMode={toggleMapClickMode}
        onMapClick={handleMapClick}
      />

      <DeletePlotModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        plot={plotToDelete}
        onPlotDeleted={handlePlotDeleted}
        isAdmin={isAdmin}
      />
    </Layout>
  );
};

export default MapPage;
