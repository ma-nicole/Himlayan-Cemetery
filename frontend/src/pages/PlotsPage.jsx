import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlotList from '../components/plot/PlotList';
import PlotForm from '../components/plot/PlotForm';
import plotService from '../services/plotService';
import { useAuth } from '../hooks/useAuth';

const PlotsPage = () => {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [sortField, setSortField] = useState('plot_number');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const { isAdmin } = useAuth();
  const [archiveConfirmId, setArchiveConfirmId] = useState(null);
  const [archiveError, setArchiveError] = useState('');

  // Load plots function - doesn't depend on search/filter/sort to avoid infinite loops
  const loadPlots = useCallback(async (page = 1, searchVal = '', filterVal = 'all', sortFieldVal = 'plot_number', sortOrderVal = 'asc') => {
    try {
      setLoading(true);
      const response = await plotService.getAll({ 
        page, 
        status: filterVal !== 'all' ? filterVal : undefined,
        search: searchVal || undefined,
        per_page: 15,
        sort_by: sortFieldVal,
        sort_order: sortOrderVal
      });
      if (response.success) {
        setPlots(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
        });
      }
    } catch (err) {
      setError('Failed to load plots');
    } finally {
      setLoading(false);
    }
  }, []);

  // Watch for changes in search, filter, or sort - reload plots on page 1
  useEffect(() => {
    loadPlots(1, search, filter, sortField, sortOrder);
  }, [search, filter, sortField, sortOrder, loadPlots]);

  // Watch for pagination changes - reload plots on current page
  const handlePageChange = useCallback((page) => {
    loadPlots(page, search, filter, sortField, sortOrder);
  }, [search, filter, sortField, sortOrder, loadPlots]);

  const handleSort = (field) => {
    // If clicking same field, toggle order; otherwise set to asc
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    // Don't call loadPlots here - the useEffect will handle it
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Don't call loadPlots here - the useEffect will handle it
  };

  const handleCreate = () => {
    setSelectedPlot(null);
    setShowForm(true);
  };

  const handleEdit = (plot) => {
    setSelectedPlot(plot);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedPlot) {
        await plotService.update(selectedPlot.id, data);
        setSuccess('Plot updated successfully');
      } else {
        await plotService.create(data);
        setSuccess('Plot created successfully');
      }
      setShowForm(false);
      handlePageChange(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = (id) => {
    setArchiveConfirmId(id);
    setArchiveError('');
  };

  const handleConfirmedDelete = async () => {
    try {
      await plotService.delete(archiveConfirmId);
      setArchiveConfirmId(null);
      setSuccess('Plot archived successfully');
      handlePageChange(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setArchiveError(err.response?.data?.message || 'Failed to archive plot. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Plot Management</h2>

      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label><strong>Filter by Status:</strong></label>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '250px' }}>
            <label><strong>Search:</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by plot number (e.g., PLT-0001)..."
              value={search}
              onChange={handleSearch}
              style={{ flex: 1 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading plots..." />
      ) : (
        <>
          <PlotList
            plots={plots}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Previous
              </button>
              <span>Page {pagination.current_page} of {pagination.last_page}</span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPlot ? 'Edit Plot' : 'Add Plot'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <PlotForm
                plot={selectedPlot}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {archiveConfirmId !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', padding: '40px 36px', maxWidth: '420px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>&times;</button>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🗄️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Archive This Plot?</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Are you sure you want to archive this plot?</p>
            <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>This cannot be undone.</p>
            {archiveError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>{archiveError}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setArchiveConfirmId(null); setArchiveError(''); }} style={{ padding: '10px 28px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleConfirmedDelete} style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: '#1a472a', color: '#fff', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>Yes, Archive</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PlotsPage;
