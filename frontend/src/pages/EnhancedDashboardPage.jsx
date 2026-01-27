import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import { useToast } from '../context/ToastContext';
import useKeyboardShortcuts, { useAppShortcuts } from '../hooks/useKeyboardShortcuts';
import dashboardService from '../services/dashboardService';

// New Components
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import CommandPalette from '../components/common/CommandPalette';
import { SkeletonDashboard } from '../components/common/Skeleton';
import { DonutChart, BarChart, LineChart, ProgressRing } from '../components/charts/Charts';

import './EnhancedDashboard.css';

const EnhancedDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const toast = useToast();

  // Demo activities for the feed
  const [activities] = useState([
    { id: 1, type: 'burial', title: 'New burial record added', description: 'Maria Santos - Plot A-15-03', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, type: 'plot_reserved', title: 'Plot reserved', description: 'Plot B-22-08 reserved by Juan Cruz', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, type: 'user_registered', title: 'New member registered', description: 'Pedro Reyes joined the system', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 4, type: 'payment', title: 'Payment received', description: '₱15,000 - Annual maintenance fee', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ]);

  // Demo chart data
  const monthlyBurialData = [
    { label: 'Jan', value: 12 },
    { label: 'Feb', value: 8 },
    { label: 'Mar', value: 15 },
    { label: 'Apr', value: 10 },
    { label: 'May', value: 18 },
    { label: 'Jun', value: 14 },
  ];

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
          toast?.success('Dashboard loaded successfully');
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

  const occupancyRate = stats?.plots?.total 
    ? Math.round((stats.plots.occupied / stats.plots.total) * 100)
    : 0;

  return (
    <Layout>
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome to Himlayan Cemetery Management System</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline" 
            onClick={() => setCommandPaletteOpen(true)}
            title="Open command palette (Ctrl+K)"
          >
            <span>⌘</span> Command
          </button>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

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
                  { label: 'Available', value: stats?.plots?.available || 145, color: 'success' },
                  { label: 'Occupied', value: stats?.plots?.occupied || 312, color: 'primary' },
                  { label: 'Reserved', value: stats?.plots?.reserved || 43, color: 'warning' },
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

      {/* Burial Stats */}
      <section className="dashboard-section">
        <h2 className="section-title">Burial Statistics</h2>
        <div className="stats-grid-3">
          <StatCard
            title="Total Burials"
            value={stats?.burials?.total || 0}
            icon=""
            variant="primary"
          />
          <StatCard
            title="This Month"
            value={stats?.burials?.this_month || 0}
            icon=""
            trend={{ value: 5, direction: 'up', label: 'from last month' }}
          />
          <StatCard
            title="This Year"
            value={stats?.burials?.this_year || 0}
            icon=""
            trend={{ value: 8, direction: 'up', label: 'from last year' }}
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
              <button className="btn btn-sm btn-outline">View All</button>
            </div>
            <div className="card-body">
              {stats?.recent_burials && stats.recent_burials.length > 0 ? (
                <table className="data-table modern">
                  <thead>
                    <tr>
                      <th>Deceased Name</th>
                      <th>Plot</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_burials.map(burial => (
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
