import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import dashboardService from '../services/dashboardService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* Plot Statistics */}
      <h3 style={{ marginBottom: '15px', color: '#666' }}>Plot Overview</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Plots</h3>
          <div className="number">{stats?.plots?.total || 0}</div>
        </div>
        <div className="stat-card available">
          <h3>Available</h3>
          <div className="number">{stats?.plots?.available || 0}</div>
        </div>
        <div className="stat-card occupied">
          <h3>Occupied</h3>
          <div className="number">{stats?.plots?.occupied || 0}</div>
        </div>
        <div className="stat-card reserved">
          <h3>Reserved</h3>
          <div className="number">{stats?.plots?.reserved || 0}</div>
        </div>
      </div>

      {/* Burial Statistics */}
      <h3 style={{ marginBottom: '15px', color: '#666' }}>Burial Records</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Burials</h3>
          <div className="number">{stats?.burials?.total || 0}</div>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <div className="number">{stats?.burials?.this_month || 0}</div>
        </div>
        <div className="stat-card">
          <h3>This Year</h3>
          <div className="number">{stats?.burials?.this_year || 0}</div>
        </div>
      </div>

      {/* Recent Burials */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Recent Burials</h3>
        </div>
        {stats?.recent_burials && stats.recent_burials.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Deceased Name</th>
                <th>Plot Number</th>
                <th>Burial Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_burials.map(burial => (
                <tr key={burial.id}>
                  <td><strong>{burial.deceased_name}</strong></td>
                  <td>{burial.plot_number}</td>
                  <td>{new Date(burial.burial_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No recent burials
          </p>
        )}
      </div>

      {/* System Info */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 style={{ margin: 0 }}>System Information</h3>
        </div>
        <div style={{ padding: '10px 0' }}>
          <p><strong>System:</strong> Smart Cemetery Navigation & Plot Management</p>
          <p><strong>Version:</strong> 1.0.0 (Prototype)</p>
          <p><strong>Features:</strong> GIS Mapping, QR Code Integration, Burial Records Management</p>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
