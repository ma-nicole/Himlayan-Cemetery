import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import useKeyboardShortcuts, { useAppShortcuts } from '../hooks/useKeyboardShortcuts';
import dashboardService from '../services/dashboardService';
import maintenanceService from '../services/maintenanceService';

// New Components
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import CommandPalette from '../components/common/CommandPalette';
import { SkeletonDashboard } from '../components/common/Skeleton';
import { DonutChart, BarChart, LineChart, ProgressRing } from '../components/charts/Charts';

import './EnhancedDashboard.css';

const EnhancedDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'burial_date', direction: 'desc' });
  const [maintenance, setMaintenance] = useState({
    active: false,
    message: 'System is under maintenance. Please try again later.',
    updated_at: null,
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const toast = useToast();

  // Demo activities for the feed
  const [activities] = useState([
    { id: 1, type: 'burial', title: 'New burial record added', description: 'Maria Santos - Plot A-15-03', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, type: 'plot_reserved', title: 'Plot reserved', description: 'Plot B-22-08 reserved by Juan Cruz', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, type: 'user_registered', title: 'New member registered', description: 'Pedro Reyes joined the system', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 4, type: 'payment', title: 'Payment received', description: '₱15,000 - Annual maintenance fee', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ]);

  // Demo chart data
  const defaultMonthlyBurialData = [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 0 },
    { label: 'Mar', value: 0 },
    { label: 'Apr', value: 0 },
    { label: 'May', value: 0 },
    { label: 'Jun', value: 0 },
  ];

  const monthlyBurialData = stats?.monthly_burials || defaultMonthlyBurialData;

  const plotStatusData = [
    { label: 'Available', value: 145, color: 'success' },
    { label: 'Occupied', value: 312, color: 'primary' },
    { label: 'Reserved', value: 43, color: 'warning' },
  ];

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        toast?.error('Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadMaintenanceStatus = async () => {
      try {
        const response = await maintenanceService.getStatus();
        if (response?.success && response?.data) {
          setMaintenance((prev) => ({
            ...prev,
            ...response.data,
          }));
        }
      } catch (err) {
        console.error('Failed to load maintenance status:', err);
      } finally {
        setMaintenanceLoading(false);
      }
    };

    loadMaintenanceStatus();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => setCommandPaletteOpen(true),
    'ctrl+/': () => setCommandPaletteOpen(true),
  });

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError('');
    dashboardService.getStats()
      .then(response => {
        if (response.success) {
          setStats(response.data);
          toast?.success('Dashboard refreshed');
        }
      })
      .catch(() => {
        setError('Failed to refresh');
        toast?.error('Refresh failed');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleMaintenanceToggle = async () => {
    const nextActive = !maintenance.active;
    const confirmText = nextActive
      ? 'Enable maintenance mode? Regular users will be blocked.'
      : 'Disable maintenance mode and reopen the system?';

    if (!window.confirm(confirmText)) {
      return;
    }

    setMaintenanceSaving(true);
    try {
      const response = await maintenanceService.updateStatus({
        active: nextActive,
        message: maintenance.message || 'System is under maintenance. Please try again later.',
      });

      if (response?.success && response?.data) {
        setMaintenance((prev) => ({ ...prev, ...response.data }));
        toast?.success(nextActive ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update maintenance mode';
      toast?.error(message);
    } finally {
      setMaintenanceSaving(false);
    }
  };

  // Sort handler for Recent Burials table
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sorted burials - must be before conditional returns
  const sortedBurials = React.useMemo(() => {
    if (!stats?.recent_burials) return [];
    
    return [...stats.recent_burials].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'plot_number') {
        aValue = a.plot_number || '';
        bValue = b.plot_number || '';
      } else if (sortConfig.key === 'burial_date') {
        aValue = new Date(a.burial_date);
        bValue = new Date(b.burial_date);
      } else {
        return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stats?.recent_burials, sortConfig]);

  const occupancyRate = stats?.plots?.total 
    ? Math.round((stats.plots.occupied / stats.plots.total) * 100)
    : 0;

  if (loading) {
    return (
      <Layout>
        <SkeletonDashboard />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-state">
          <span className="error-icon"></span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a472a', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Welcome to Himlayan Cemetery Management System</p>
      </div>

      {(user?.role === 'admin' || user?.role === 'staff') && (
        <section className="dashboard-section">
          <div className="maintenance-panel">
            <div className="maintenance-info">
              <h3>System Maintenance</h3>
              <p>
                Current status:{' '}
                <span className={`maintenance-status ${maintenance.active ? 'active' : 'inactive'}`}>
                  {maintenance.active ? 'ON' : 'OFF'}
                </span>
              </p>
            </div>

            <button
              className={`maintenance-toggle-btn ${maintenance.active ? 'is-on' : 'is-off'}`}
              onClick={handleMaintenanceToggle}
              disabled={maintenanceSaving || maintenanceLoading}
              aria-label="Toggle maintenance mode"
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">
                {maintenanceLoading ? 'Loading...' : maintenanceSaving ? 'Saving...' : maintenance.active ? 'Disable' : 'Enable'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="dashboard-section">
        <h2 className="section-title">Plot Overview</h2>
        <div className="stats-grid-4">
          <StatCard
            title="Total Plots"
            value={stats?.plots?.total || 0}
            icon=""
            variant="primary"
            trend={{ value: 12, direction: 'up', label: 'vs last month' }}
          />
          <StatCard
            title="Available"
            value={stats?.plots?.available || 0}
            icon=""
            variant="success"
          />
          <StatCard
            title="Occupied"
            value={stats?.plots?.occupied || 0}
            icon=""
            variant="warning"
          />
          <StatCard
            title="Reserved"
            value={stats?.plots?.reserved || 0}
            icon=""
            variant="error"
          />
        </div>
      </section>

      {/* Charts Row */}
      <section className="dashboard-section">
        <div className="charts-grid">
          {/* Occupancy Donut */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Plot Status Distribution</h3>
            </div>
            <div className="chart-body">
              <DonutChart
                data={[
                  { label: 'Available', value: stats?.plots?.available || 0, color: 'success' },
                  { label: 'Occupied', value: stats?.plots?.occupied || 0, color: 'primary' },
                  { label: 'Reserved', value: stats?.plots?.reserved || 0, color: 'warning' },
                ]}
                size={200}
                centerLabel="Total"
              />
            </div>
          </div>

          {/* Monthly Burials */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Monthly Burials</h3>
              <span className="chart-subtitle">Last 6 months</span>
            </div>
            <div className="chart-body">
              <BarChart data={monthlyBurialData} height={200} color="primary" />
            </div>
          </div>

          {/* Occupancy Progress */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Occupancy Rate</h3>
            </div>
            <div className="chart-body chart-center">
              <ProgressRing
                value={occupancyRate}
                max={100}
                size={150}
                color={occupancyRate > 80 ? 'error' : occupancyRate > 60 ? 'warning' : 'success'}
                label="Occupied"
              />
              <p className="chart-note">
                {occupancyRate > 80 
                  ? 'Capacity nearly full' 
                  : occupancyRate > 60 
                    ? 'Moderate occupancy' 
                    : 'Good availability'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Burial Stats & Service Requests */}
      <section className="dashboard-section">
        <h2 className="section-title">Activity Overview</h2>
        <div className="stats-grid-4">
          <StatCard
            title="Total Burials"
            value={stats?.burials?.total || 0}
            icon=""
            variant="primary"
          />
          <StatCard
            title="Added This Month"
            value={stats?.burials?.this_month || 0}
            icon=""
            trend={{ value: 5, direction: 'up', label: 'from last month' }}
          />
          <StatCard
            title="Added This Year"
            value={stats?.burials?.this_year || 0}
            icon=""
            trend={{ value: 8, direction: 'up', label: 'from last year' }}
          />
          <StatCard
            title="Pending Requests"
            value={stats?.service_requests?.pending || 0}
            icon=""
            variant={stats?.service_requests?.pending > 0 ? 'warning' : 'success'}
          />
        </div>
      </section>

      {/* Bottom Row: Recent Burials + Activity Feed */}
      <section className="dashboard-section">
        <div className="bottom-grid">
          {/* Recent Burials Table */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Burials</h3>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => navigate('/burial-records')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {sortedBurials.length > 0 ? (
                <table className="data-table modern">
                  <thead>
                    <tr>
                      <th>Deceased Name</th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('plot_number')}
                        title="Click to sort by plot"
                      >
                        Plot {sortConfig.key === 'plot_number' && (
                          <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('burial_date')}
                        title="Click to sort by date"
                      >
                        Date {sortConfig.key === 'burial_date' && (
                          <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBurials.map(burial => (
                      <tr key={burial.id}>
                        <td>
                          <div className="burial-name">
                            <span className="avatar">
                              {burial.deceased_name.charAt(0)}
                            </span>
                            <strong>{burial.deceased_name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline">
                            {burial.plot_number}
                          </span>
                        </td>
                        <td>
                          {new Date(burial.burial_date).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No recent burials</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed 
            activities={activities}
            maxItems={5}
          />
        </div>
      </section>

      {/* Keyboard Shortcut Hint */}
      <div className="keyboard-hint">
        Press <kbd>Ctrl</kbd>+<kbd>K</kbd> to open command palette
      </div>
    </Layout>
  );
};

export default EnhancedDashboardPage;
