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
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  
  const { isAdmin } = useAuth();

  const loadPlots = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await plotService.getAll({ 
        page, 
        status: filter !== 'all' ? filter : undefined,
        per_page: 15 
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
  }, [filter]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

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
      loadPlots(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plot?')) {
      return;
    }

    try {
      await plotService.delete(id);
      setSuccess('Plot deleted successfully');
      loadPlots(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plot');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Plot Management</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Plot
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
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
      </div>

      {loading ? (
        <LoadingSpinner text="Loading plots..." />
      ) : (
        <>
          <PlotList
            plots={plots}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => loadPlots(pagination.current_page - 1)}
              >
                Previous
              </button>
              {[...Array(pagination.last_page)].map((_, i) => (
                <button
                  key={i + 1}
                  className={pagination.current_page === i + 1 ? 'active' : ''}
                  onClick={() => loadPlots(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadPlots(pagination.current_page + 1)}
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
