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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive this plot?')) {
      return;
    }

    try {
      await plotService.delete(id);
      setSuccess('Plot archived successfully');
      handlePageChange(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive plot');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Plot Management</h2>
        {isAdmin && (
          <button className="page-action-btn" onClick={handleCreate}>
            + Add Plot
          </button>
        )}
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
    </Layout>
  );
};

export default PlotsPage;
