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
  const [qrToast, setQrToast] = useState(''); // toast message for QR generate/regenerate
  const [archiveConfirmId, setArchiveConfirmId] = useState(null);
  const [archiveError, setArchiveError] = useState('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [qrData, setQrData] = useState(null);
  
  // Search and pagination
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [sortField, setSortField] = useState('death_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadRecords = useCallback(async (page = 1, searchVal = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await burialService.getAll({ 
        page, 
        search: searchVal || undefined,
        per_page: 5,
        sort_by: sortField,
        sort_order: sortOrder
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
  }, [sortField, sortOrder]);

  useEffect(() => {
    loadRecords(1, search);
  }, [loadRecords]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    loadRecords(1, search);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with desc order
      setSortField(field);
      setSortOrder('desc');
    }
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
      loadRecords(pagination.current_page, search);
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
      await burialService.archive(archiveConfirmId);
      setArchiveConfirmId(null);
      setSuccess('Burial record archived successfully');
      loadRecords(pagination.current_page, search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setArchiveError('Failed to archive burial record. Please try again.');
    }
  };

  // Handle QR code generation for burial records
  const handleGenerateQR = async (burialId) => {
    try {
      const response = await qrService.generate(burialId);
      if (response.success) {
        setQrData(response.data);
        setQrToast('QR Code Generated!');
        loadRecords(pagination.current_page, search);
        setTimeout(() => setQrToast(''), 3000);
      }
    } catch (err) {
      setError('Failed to generate QR code');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle QR code regeneration (replaces existing QR with new one)
  const handleRegenerateQR = async (burialId) => {
    try {
      const response = await qrService.regenerate(burialId);
      if (response.success) {
        setQrData(response.data);
        setQrToast('QR Code Regenerated!');
        loadRecords(pagination.current_page, search);
        setTimeout(() => setQrToast(''), 3000);
      }
    } catch (err) {
      setError('Failed to regenerate QR code');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <Layout>
      {/* QR Toast notification */}
      {qrToast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#1a472a', color: '#fff',
          padding: '14px 28px', borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '15px', fontWeight: '700', letterSpacing: '0.02em',
          animation: 'fadeInDown 0.3s ease'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {qrToast}
        </div>
      )}

      <div className="page-header">
        <h2>Burial Records</h2>
        <button className="page-action-btn" onClick={handleCreate}>
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
        <button type="submit" className="page-action-btn">Search</button>
        {search && (
          <button 
            type="button" 
            className="btn" 
            onClick={() => { setSearch(''); loadRecords(1, ''); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Sort Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Sort by:</label>
        <select 
          value={sortField} 
          onChange={(e) => {
            const field = e.target.value;
            setSortField(field);
            setSortOrder(['death_date', 'burial_date', 'created_at'].includes(field) ? 'desc' : 'asc');
          }}
          className="sort-select"
        >
          <option value="death_date">Death Date</option>
          <option value="burial_date">Burial Date</option>
          <option value="deceased_name">Deceased Name</option>
          <option value="plot_id">Plot</option>
          <option value="created_at">Created Date</option>
        </select>
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          className="sort-select"
        >
          {['death_date', 'burial_date', 'created_at'].includes(sortField) ? (
            <>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </>
          ) : (
            <>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </>
          )}
        </select>
      </div>

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
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => loadRecords(pagination.current_page - 1, search)}
              >
                Previous
              </button>
              <span>Page {pagination.current_page} of {pagination.last_page}</span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadRecords(pagination.current_page + 1, search)}
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
          onRegenerateQR={handleRegenerateQR}
        />
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
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Archive This Record?</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Are you sure you want to archive this burial record?</p>
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

export default BurialRecordsPage;
