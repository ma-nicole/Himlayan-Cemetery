import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const PlotList = ({ plots, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  if (!plots || plots.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#666' }}>No plots found.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Plot Number</th>
            <th>Section</th>
            <th>Location (Row/Col)</th>
            <th>Coordinates</th>
            <th>Status</th>
            <th>Occupant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plots.map(plot => (
            <tr key={plot.id}>
              <td><strong>{plot.plot_number}</strong></td>
              <td>{plot.section || '-'}</td>
              <td>
                {plot.row_number && plot.column_number 
                  ? `R${plot.row_number} / C${plot.column_number}`
                  : '-'
                }
              </td>
              <td>
                <small>
                  {parseFloat(plot.latitude).toFixed(6)},
                  <br />
                  {parseFloat(plot.longitude).toFixed(6)}
                </small>
              </td>
              <td>
                <span className={getStatusClass(plot.status)}>
                  {plot.status}
                </span>
              </td>
              <td>
                {plot.burial_record ? (
                  <span>{plot.burial_record.deceased_name}</span>
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </td>
              <td>
                <div className="btn-group">
                  <button
                    className="btn btn-sm"
                    onClick={() => onEdit(plot)}
                  >
                    Edit
                  </button>
                  {isAdmin && !plot.burial_record && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(plot.id)}
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

export default PlotList;
