import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const BurialList = ({ records, onView, onEdit, onDelete, onGenerateQR }) => {
  const { isAdmin } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (!records || records.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#666' }}>No burial records found.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Deceased Name</th>
            <th>Plot</th>
            <th>Death Date</th>
            <th>Burial Date</th>
            <th>QR Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {record.deceased_photo_url ? (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #1a472a',
                      flexShrink: 0
                    }}>
                      <img 
                        src={record.deceased_photo_url.startsWith('http') ? record.deceased_photo_url : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${record.deceased_photo_url}`}
                        alt={record.deceased_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#f0fdf4',
                      border: '2px solid #1a472a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a472a" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                  <strong>{record.deceased_name}</strong>
                </div>
              </td>
              <td>
                {record.plot?.plot_number || '-'}
                <br />
                <small style={{ color: '#666' }}>Section {record.plot?.section}</small>
              </td>
              <td>{formatDate(record.death_date)}</td>
              <td>{formatDate(record.burial_date)}</td>
              <td>
                {record.qr_code ? (
                  <span className="status-badge status-available">Generated</span>
                ) : (
                  <span className="status-badge status-maintenance">Not Generated</span>
                )}
              </td>
              <td>
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onView(record)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => onEdit(record)}
                  >
                    Edit
                  </button>
                  {!record.qr_code && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => onGenerateQR(record.id)}
                    >
                      Generate QR
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(record.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BurialList;
