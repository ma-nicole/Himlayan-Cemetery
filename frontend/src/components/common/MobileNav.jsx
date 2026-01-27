import React from 'react';
import './MobileNav.css';

const MobileNav = ({ 
  isOpen, 
  onClose, 
  navItems = [],
  currentPath,
  user,
  onLogout
}) => {
  const handleNavClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`mobile-nav-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand">
            <span className="brand-text">HIMLAYAN</span>
          </div>
          <button className="mobile-nav-close" onClick={onClose}>
            Close
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mobile-nav-user">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-role">{user.role || 'Member'}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mobile-nav-content">
          <ul className="mobile-nav-list">
            {navItems.map((item, index) => (
              <li key={item.path || index}>
                {item.divider ? (
                  <div className="nav-divider">
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <button
                    className={`mobile-nav-item ${currentPath === item.path ? 'active' : ''}`}
                    onClick={() => handleNavClick(item)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                    {item.path && (
                      <span className="nav-arrow">›</span>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="mobile-nav-footer">
          <button className="mobile-nav-item" onClick={() => {}}>
            <span className="nav-label">Settings</span>
          </button>
          {onLogout && (
            <button className="mobile-nav-item logout" onClick={onLogout}>
              <span className="nav-label">Logout</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

// Hamburger Button Component
export const HamburgerButton = ({ isOpen, onClick }) => (
  <button 
    className={`hamburger-btn ${isOpen ? 'open' : ''}`}
    onClick={onClick}
    aria-label="Toggle navigation menu"
    aria-expanded={isOpen}
  >
    <span className="hamburger-line"></span>
    <span className="hamburger-line"></span>
    <span className="hamburger-line"></span>
  </button>
);

export default MobileNav;
