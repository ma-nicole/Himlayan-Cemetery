import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CemeteryMap, { getLandmarkIcon } from '../components/map/CemeteryMap';
import AddPlotModal from '../components/map/AddPlotModal';
import AddLandmarkModal from '../components/map/AddLandmarkModal';
import DeletePlotModal from '../components/map/DeletePlotModal';
import { mapService } from '../services/mapService';
import { useAuth } from '../hooks/useAuth';

const MapPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

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

  // Add landmark mode state
  const [showAddLandmarkModal, setShowAddLandmarkModal] = useState(false);
  const [addLandmarkMode, setAddLandmarkMode] = useState(false);
  const [selectedLandmarkCoordinates, setSelectedLandmarkCoordinates] = useState(null);
  const [landmarkToEdit, setLandmarkToEdit] = useState(null);
  const [showEditLandmarkModal, setShowEditLandmarkModal] = useState(false);
  const [editLandmarkMode, setEditLandmarkMode] = useState(false);
  const [editLandmarkCoordinates, setEditLandmarkCoordinates] = useState(null);

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

    // Landmarks don't have plot details — show info from marker data directly
    if (marker.type === 'landmark') {
      setMarkerDetails(null);
      setLoadingDetails(false);
      return;
    }

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
    if (addLandmarkMode) {
      setSelectedLandmarkCoordinates(coordinates);
      setAddLandmarkMode(false);
      setShowAddLandmarkModal(true);
    } else if (editLandmarkMode) {
      setEditLandmarkCoordinates(coordinates);
      setEditLandmarkMode(false);
      setShowEditLandmarkModal(true);
    } else if (addPlotMode) {
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
      setShowAddPlotModal(false);
      setAddPlotMode(true);
    } else {
      setShowAddPlotModal(true);
      setAddPlotMode(false);
    }
  };

  const handleAddLandmarkClick = () => {
    setShowAddLandmarkModal(true);
    setSelectedLandmarkCoordinates(null);
    setSelectedMarker(null);
  };

  const handleAddLandmarkModalClose = () => {
    setShowAddLandmarkModal(false);
    setAddLandmarkMode(false);
    setSelectedLandmarkCoordinates(null);
  };

  const handleLandmarkAdded = () => {
    loadMapData();
    setSelectedMarker(null);
    setMarkerDetails(null);
  };

  const handleEditLandmarkClick = (marker) => {
    setLandmarkToEdit(marker);
    setShowEditLandmarkModal(true);
  };

  const handleLandmarkUpdated = (updatedLandmark) => {
    // Update the marker in the list and refresh selected marker
    setMarkers(prev => prev.map(m =>
      m.id === updatedLandmark.id ? { ...m, ...updatedLandmark } : m
    ));
    setSelectedMarker(prev => prev && prev.id === updatedLandmark.id ? { ...prev, ...updatedLandmark } : prev);
    setShowEditLandmarkModal(false);
    setLandmarkToEdit(null);
  };

  const handleDeleteLandmarkClick = async (marker) => {
    if (!window.confirm(`Delete landmark "${marker.name}"? This cannot be undone.`)) return;
    const numericId = String(marker.id).replace('lm_', '');
    try {
      const response = await mapService.deleteLandmark(numericId);
      if (response.success) {
        setMarkers(prev => prev.filter(m => m.id !== marker.id));
        setSelectedMarker(null);
      }
    } catch (err) {
      console.error('Failed to delete landmark:', err);
    }
  };

  const toggleLandmarkMapClickMode = () => {
    if (!addLandmarkMode) {
      setShowAddLandmarkModal(false);
      setAddLandmarkMode(true);
    } else {
      setShowAddLandmarkModal(true);
      setAddLandmarkMode(false);
    }
  };

  const toggleEditLandmarkMapClickMode = () => {
    if (!editLandmarkMode) {
      setShowEditLandmarkModal(false);
      setEditLandmarkMode(true);
    } else {
      setShowEditLandmarkModal(true);
      setEditLandmarkMode(false);
    }
  };

  const plotMarkers = markers.filter(m => m.type !== 'landmark');

  // When filtering by plot status, always keep landmarks visible
  const filteredMarkers = filter === 'all'
    ? markers
    : markers.filter(m => m.type === 'landmark' || m.status === filter);

  // Legend for marker colors
  const legend = [
    { status: 'available', color: '#27ae60', label: 'Available' },
    { status: 'occupied', color: '#e94560', label: 'Occupied' },
    { status: 'reserved', color: '#f39c12', label: 'Reserved' },
    { status: 'maintenance', color: '#95a5a6', label: 'Maintenance' },
    { status: 'landmark', color: '#1a3a6b', label: 'Landmark' },
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

      <div className="map-page-layout">
        {/* Map Section */}
        <div className="map-page-main">
          {/* Filter and Legend */}
          <div className="card" style={{ marginBottom: '15px' }}>
            <div className="map-filter-row">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label><strong>Filter:</strong></label>
                <select
                  className="form-control"
                  style={{ width: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All ({plotMarkers.length} plots)</option>
                  <option value="available">Available ({plotMarkers.filter(m => m.status === 'available').length})</option>
                  <option value="occupied">Occupied ({plotMarkers.filter(m => m.status === 'occupied').length})</option>
                  <option value="reserved">Reserved ({plotMarkers.filter(m => m.status === 'reserved').length})</option>
                  <option value="maintenance">Maintenance ({plotMarkers.filter(m => m.status === 'maintenance').length})</option>
                </select>
              </div>
              <div className="map-legend">
                {legend.map(item => (
                  <div key={item.status} className="map-legend-item">
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
            {(addLandmarkMode || editLandmarkMode) && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#1a3a6b',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                📌 Click on the map to set landmark location
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
        <div className="map-page-panel">
          {(isAdmin || isStaff) && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {isAdmin && (
              <button
                onClick={handleAddPlotClick}
                style={{
                  flex: 1,
                  padding: '10px 16px',
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
              <button
                onClick={handleAddLandmarkClick}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#1a3a6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(26, 58, 107, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0d2358';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(26, 58, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1a3a6b';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(26, 58, 107, 0.3)';
                }}
              >
                📌 Add Landmark
              </button>
            </div>
          )}
          
          <div className="card">
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>
                {selectedMarker?.type === 'landmark' ? 'Landmark Details' : 'Plot Details'}
              </h3>
            </div>

            {!selectedMarker && (
              <p style={{ color: '#666', textAlign: 'center' }}>
                Click on a marker to view details
              </p>
            )}

            {/* Landmark details panel */}
            {selectedMarker?.type === 'landmark' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#1a3a6b', flexShrink: 0 }}>{getLandmarkIcon(selectedMarker.name)}</span>
                    <h4 style={{ color: '#1a1a2e', margin: 0 }}>{selectedMarker.name}</h4>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      backgroundColor: {
                        open: '#27ae60',
                        available: '#2ecc71',
                        closed: '#e74c3c',
                        unavailable: '#e74c3c',
                        'under maintenance': '#f39c12',
                        'n/a': '#95a5a6',
                      }[selectedMarker.status] || '#95a5a6',
                      color: 'white',
                    }}
                  >
                    {selectedMarker.status}
                  </span>
                </div>
                {selectedMarker.notes && (
                  <div className="grave-info-row">
                    <label>Notes</label>
                    <span>{selectedMarker.notes}</span>
                  </div>
                )}
                <div className="grave-info-row">
                  <label>Coordinates</label>
                  <span style={{ fontSize: '0.85rem' }}>
                    {Number(selectedMarker.latitude).toFixed(6)},
                    {Number(selectedMarker.longitude).toFixed(6)}
                  </span>
                </div>
                {isAdmin && (
                  <div style={{ marginTop: '20px' }}>
                    <hr style={{ margin: '15px 0' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditLandmarkClick(selectedMarker)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#1a3a6b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLandmarkClick(selectedMarker)}
                        style={{
                          flex: 1,
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
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loadingDetails && (
              <LoadingSpinner text="Loading..." />
            )}

            {markerDetails && !loadingDetails && selectedMarker?.type !== 'landmark' && (
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

      <AddLandmarkModal
        isOpen={showAddLandmarkModal}
        onClose={handleAddLandmarkModalClose}
        onLandmarkAdded={handleLandmarkAdded}
        center={mapCenter}
        selectedCoordinates={selectedLandmarkCoordinates}
        addLandmarkMode={addLandmarkMode}
        toggleMapClickMode={toggleLandmarkMapClickMode}
      />

      <AddLandmarkModal
        isOpen={showEditLandmarkModal}
        onClose={() => { setShowEditLandmarkModal(false); setLandmarkToEdit(null); setEditLandmarkMode(false); setEditLandmarkCoordinates(null); }}
        onLandmarkUpdated={handleLandmarkUpdated}
        initialData={landmarkToEdit}
        center={mapCenter}
        selectedCoordinates={editLandmarkCoordinates}
        addLandmarkMode={editLandmarkMode}
        toggleMapClickMode={toggleEditLandmarkMapClickMode}
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
