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
                <strong>{record.deceased_name}</strong>
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
