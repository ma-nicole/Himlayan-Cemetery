import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BurialList from '../components/burial/BurialList';
import BurialForm from '../components/burial/BurialForm';
import BurialDetails from '../components/burial/BurialDetails';
import burialService from '../services/burialService';
import qrService from '../services/qrService';

const BurialRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [qrData, setQrData] = useState(null);
  
  // Search and pagination
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });

  const loadRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await burialService.getAll({ 
        page, 
        search: search || undefined,
        per_page: 10 
      });
      if (response.success) {
        setRecords(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
        });
      }
    } catch (err) {
      setError('Failed to load burial records');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadRecords(1);
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setShowForm(true);
  };

  const handleView = async (record) => {
    setSelectedRecord(record);
    setQrData(null);
    setShowDetails(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedRecord) {
        await burialService.update(selectedRecord.id, data);
        setSuccess('Burial record updated successfully');
      } else {
        await burialService.create(data);
        setSuccess('Burial record created successfully');
      }
      setShowForm(false);
      loadRecords(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this burial record?')) {
      return;
    }

    try {
      await burialService.delete(id);
      setSuccess('Burial record deleted successfully');
      loadRecords(pagination.current_page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete burial record');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle QR code generation for burial records
  const handleGenerateQR = async (burialId) => {
    try {
      const response = await qrService.generate(burialId);
      if (response.success) {
        setQrData(response.data);
        setSuccess('QR code generated successfully');
        loadRecords(pagination.current_page); // Reload to show updated QR status
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to generate QR code');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Burial Records</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add Burial Record
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by name, nickname, date, or plot..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
        {search && (
          <button 
            type="button" 
            className="btn" 
            onClick={() => { setSearch(''); loadRecords(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <LoadingSpinner text="Loading burial records..." />
      ) : (
        <>
          <BurialList
            records={records}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateQR={handleGenerateQR}
          />

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => loadRecords(pagination.current_page - 1)}
              >
                Previous
              </button>
              {[...Array(pagination.last_page)].map((_, i) => (
                <button
                  key={i + 1}
                  className={pagination.current_page === i + 1 ? 'active' : ''}
                  onClick={() => loadRecords(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadRecords(pagination.current_page + 1)}
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
              <h3>{selectedRecord ? 'Edit Burial Record' : 'Add Burial Record'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <BurialForm
                burial={selectedRecord}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRecord && (
        <BurialDetails
          burial={selectedRecord}
          qrData={qrData}
          onClose={() => setShowDetails(false)}
          onGenerateQR={handleGenerateQR}
        />
      )}
    </Layout>
  );
};

export default BurialRecordsPage;
