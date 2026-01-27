import React, { useState, useEffect } from 'react';
import './ActivityFeed.css';

const ActivityFeed = ({ activities = [], loading = false, maxItems = 10 }) => {
  const [visibleActivities, setVisibleActivities] = useState([]);

  useEffect(() => {
    // Animate activities appearing one by one
    if (activities.length > 0) {
      activities.slice(0, maxItems).forEach((_, index) => {
        setTimeout(() => {
          setVisibleActivities(prev => [...prev, index]);
        }, index * 100);
      });
    }
  }, [activities, maxItems]);

  const getActivityIcon = (type) => {
    const icons = {
      burial: '●',
      plot_reserved: '●',
      plot_available: '●',
      user_registered: '●',
      qr_generated: '●',
      maintenance: '●',
      payment: '●',
      visit: '●',
    };
    return icons[type] || '●';
  };

  const getActivityColor = (type) => {
    const colors = {
      burial: 'purple',
      plot_reserved: 'warning',
      plot_available: 'success',
      user_registered: 'info',
      qr_generated: 'primary',
      maintenance: 'neutral',
      payment: 'success',
      visit: 'neutral',
    };
    return colors[type] || 'neutral';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="activity-feed">
        <div className="activity-feed-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-feed-list">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="activity-item loading">
              <div className="activity-icon skeleton" />
              <div className="activity-content">
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Demo data if no activities provided
  const demoActivities = activities.length > 0 ? activities : [
    { id: 1, type: 'burial', message: 'New burial record added for Juan Dela Cruz', timestamp: new Date(Date.now() - 1800000) },
    { id: 2, type: 'plot_reserved', message: 'Plot A-15 was reserved by Maria Santos', timestamp: new Date(Date.now() - 3600000) },
    { id: 3, type: 'user_registered', message: 'New visitor registered: Pedro Gonzales', timestamp: new Date(Date.now() - 7200000) },
    { id: 4, type: 'qr_generated', message: 'QR code generated for Plot B-22', timestamp: new Date(Date.now() - 14400000) },
    { id: 5, type: 'plot_available', message: 'Plot C-8 marked as available', timestamp: new Date(Date.now() - 28800000) },
    { id: 6, type: 'visit', message: 'QR scan recorded at Plot A-12', timestamp: new Date(Date.now() - 43200000) },
    { id: 7, type: 'maintenance', message: 'Section D maintenance completed', timestamp: new Date(Date.now() - 86400000) },
  ];

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h3>Recent Activity</h3>
        <span className="activity-badge">{demoActivities.length} updates</span>
      </div>
      
      <div className="activity-feed-list">
        {demoActivities.slice(0, maxItems).map((activity, index) => (
          <div
            key={activity.id}
            className={`activity-item activity-${getActivityColor(activity.type)} ${visibleActivities.includes(index) ? 'visible' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="activity-timeline">
              <div className="activity-dot" />
              {index < demoActivities.length - 1 && <div className="activity-line" />}
            </div>
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <p className="activity-message">{activity.message}</p>
              <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>

      {demoActivities.length > maxItems && (
        <div className="activity-feed-footer">
          <button className="activity-show-more">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
