import React from 'react';
import './Skeleton.css';

/**
 * Reusable Skeleton Loading Components
 */

// Basic skeleton shape
export const Skeleton = ({ 
  width, 
  height, 
  borderRadius = 'var(--radius-md)', 
  className = '',
  style = {},
}) => {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

// Text skeleton (multiple lines)
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text-container ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-base skeleton-text-line"
          style={{ 
            width: i === lines - 1 ? '70%' : '100%',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Avatar skeleton
export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };
  
  return (
    <div 
      className={`skeleton-base skeleton-avatar ${className}`}
      style={{
        width: sizes[size],
        height: sizes[size],
      }}
    />
  );
};

// Card skeleton
export const SkeletonCard = ({ height = 200, className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-base skeleton-card-image" style={{ height: height * 0.6 }} />
      <div className="skeleton-card-content">
        <div className="skeleton-base skeleton-card-title" />
        <div className="skeleton-base skeleton-card-subtitle" />
      </div>
    </div>
  );
};

// Table row skeleton
export const SkeletonTableRow = ({ columns = 4, className = '' }) => {
  return (
    <tr className={`skeleton-table-row ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div 
            className="skeleton-base"
            style={{ 
              height: '1rem',
              width: i === 0 ? '60%' : i === columns - 1 ? '40%' : '80%',
              animationDelay: `${i * 50}ms`,
            }}
          />
        </td>
      ))}
    </tr>
  );
};

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`skeleton-table-container ${className}`}>
      <table className="skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="skeleton-base" style={{ height: '0.75rem', width: '60%' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Stat card skeleton
export const SkeletonStatCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-stat-card ${className}`}>
      <div className="skeleton-stat-header">
        <div className="skeleton-base skeleton-stat-icon" />
      </div>
      <div className="skeleton-base skeleton-stat-label" />
      <div className="skeleton-base skeleton-stat-value" />
    </div>
  );
};

// List item skeleton
export const SkeletonListItem = ({ hasAvatar = true, className = '' }) => {
  return (
    <div className={`skeleton-list-item ${className}`}>
      {hasAvatar && <SkeletonAvatar size="md" />}
      <div className="skeleton-list-content">
        <div className="skeleton-base skeleton-list-title" />
        <div className="skeleton-base skeleton-list-subtitle" />
      </div>
    </div>
  );
};

// Dashboard skeleton
export const SkeletonDashboard = () => {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-dashboard-header">
        <div className="skeleton-base" style={{ width: 200, height: 32 }} />
        <div className="skeleton-base" style={{ width: 150, height: 40 }} />
      </div>
      
      <div className="skeleton-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      
      <div className="skeleton-dashboard-content">
        <div className="skeleton-dashboard-main">
          <SkeletonTable rows={5} columns={4} />
        </div>
        <div className="skeleton-dashboard-sidebar">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
