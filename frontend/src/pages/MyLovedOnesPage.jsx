import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MyLovedOnesPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    deceased_nickname: '',
    is_publicly_searchable: false,
    obituary: '',
    deceased_photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/my-burial-records');
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError('Failed to load your records.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      deceased_nickname: record.deceased_nickname || '',
      is_publicly_searchable: Boolean(record.is_publicly_searchable),
      obituary: record.obituary || '',
      deceased_photo: null
    });
    // Check if photo URL is already a full URL or needs storage path prepended
    const photoUrl = record.deceased_photo_url 
      ? (record.deceased_photo_url.startsWith('http') 
          ? record.deceased_photo_url 
          : `http://localhost:8000/storage/${record.deceased_photo_url}`)
      : null;
    setPhotoPreview(photoUrl);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setEditingRecord(null);
    setPhotoPreview(null);
    setFormData({
      deceased_nickname: '',
      is_publicly_searchable: false,
      obituary: '',
      deceased_photo: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, deceased_photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Use FormData for file upload
      const data = new FormData();
      data.append('deceased_nickname', formData.deceased_nickname);
      // Backend expects boolean value (1 or 0)
      data.append('is_publicly_searchable', formData.is_publicly_searchable ? '1' : '0'); 
      data.append('obituary', formData.obituary);
      
      if (formData.deceased_photo) {
        data.append('deceased_photo', formData.deceased_photo);
      }

      const response = await api.post(`/my-burial-records/${editingRecord.id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Record updated successfully!');
        handleCloseModal();
        fetchRecords(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.response?.data?.message || 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cyl-page-wrapper">
      <MemberHeader />
      
      <main className="cyl-main-content" style={{ minHeight: 'calc(100vh - 200px)', padding: '40px 20px', backgroundColor: '#f9fafb' }}>
        <div className="cyl-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="page-header" style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', color: '#1a472a', marginBottom: '10px' }}>My Loved Ones</h1>
            <p style={{ color: '#666' }}>Manage memorials and profiles for your deceased family members.</p>
          </div>

          {error && <div className="cyl-alert cyl-alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
          {success && <div className="cyl-alert cyl-alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <div className="loading-spinner"></div>
             </div>
          ) : records.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#9ca3af', marginBottom: '15px' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
                   <path d="M9 10h.01"/>
                   <path d="M15 10h.01"/>
                   <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', color: '#374151', marginBottom: '10px' }}>No Records Found</h3>
              <p style={{ color: '#6b7280' }}>You don't have any burial records associated with this account yet.</p>
            </div>
          ) : (
            <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
              {records.map(record => (
                <div key={record.id} className="record-card" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                  <div className="card-header" style={{ position: 'relative', height: '140px', backgroundColor: '#e5e7eb' }}>
                    {record.deceased_photo_url ? (
                      <img 
                        src={record.deceased_photo_url.startsWith('http') ? record.deceased_photo_url : `http://localhost:8000/storage/${record.deceased_photo_url}`}
                        alt={record.deceased_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db', color: '#9ca3af' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                           <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                    <div className="status-badge" style={{ 
                      position: 'absolute', 
                      top: '15px', 
                      right: '15px', 
                      backgroundColor: record.is_publicly_searchable ? '#dcfce7' : '#f3f4f6',
                      color: record.is_publicly_searchable ? '#166534' : '#6b7280',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {record.is_publicly_searchable ? 'Publicly Visible' : 'Private'}
                    </div>
                  </div>
                  
                  <div className="card-content" style={{ padding: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '5px' }}>{record.deceased_name}</h2>
                    {record.deceased_nickname && <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '15px', fontStyle: 'italic' }}>"{record.deceased_nickname}"</p>}
                    
                    <div className="info-list" style={{ fontSize: '14px', color: '#374151', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ width: '100px', color: '#6b7280' }}>Plot:</span>
                        <span style={{ fontWeight: '500' }}>{record.plot?.plot_number} (Loc: {record.plot?.section}-{record.plot?.block})</span>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ width: '100px', color: '#6b7280' }}>Born:</span>
                        <span>{record.birth_date ? new Date(record.birth_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ width: '100px', color: '#6b7280' }}>Died:</span>
                        <span>{new Date(record.death_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleEdit(record)}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: '#1a472a', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#1a472a'}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Edit Profile: {editingRecord.deceased_name}</h3>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
              {/* Photo Upload */}
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Photo</label>
                <div style={{ 
                  width: '150px', 
                  height: '150px', 
                  margin: '0 auto 15px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  backgroundColor: '#f3f4f6', 
                  border: '2px dashed #d1d5db',
                  position: 'relative'
                }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                      No Photo
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload"
                  style={{ 
                    cursor: 'pointer',
                    color: '#1a472a',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '8px 16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px'
                  }}
                >
                  Change Photo
                </label>
              </div>

              {/* Nickname */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Nickname</label>
                <input 
                  type="text"
                  name="deceased_nickname"
                  value={formData.deceased_nickname}
                  onChange={handleInputChange}
                  placeholder="e.g. Nonoy"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    fontSize: '15px'
                  }}
                />
              </div>

              {/* Obituary */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Obituary / Life Story</label>
                <textarea
                  name="obituary"
                  value={formData.obituary}
                  onChange={handleInputChange}
                  placeholder="Share a short biography or memory..."
                  rows="4"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Searchable Checkbox */}
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    name="is_publicly_searchable"
                    checked={formData.is_publicly_searchable}
                    onChange={handleInputChange}
                    style={{ marginTop: '4px', marginRight: '10px', width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', color: '#111827' }}>Make Profile Publicly Searchable</span>
                    <span style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      Allow others to find this grave using the "Find a Grave" feature. Unchecking this hides the record from public search.
                    </span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 2, 
                    padding: '12px', 
                    backgroundColor: '#1a472a', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <MemberFooter />
    </div>
  );
};

export default MyLovedOnesPage;
