import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './PublicLayout.css';

const PublicLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: '' },
    { path: '/member/search', label: 'Find Grave', icon: '' },
    { path: '/pay-dues', label: 'Pay Dues', icon: '', auth: true },
    { path: '/profile', label: 'Profile', icon: '', auth: true },
    { path: '/feedback', label: 'Feedback', icon: '' },
    { path: '/announcements', label: 'Announcements', icon: '' },
    { path: '#about', label: 'About Us', icon: '' },
  ];

  const isActive = (path) => {
    if (path.startsWith('#')) return false;
    return location.pathname === path;
  };

  return (
    <div className="public-layout">
      {/* Navigation */}
      <nav className="public-nav">
        <div className="public-nav-container">
          <Link to="/" className="public-logo">
            <div className="logo-text">
              <span className="logo-title">Himlayang Pilipino</span>
              <span className="logo-subtitle">A Tribute to Filipino Spirit</span>
            </div>
          </Link>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>

          <ul className={`public-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {navLinks.map(link => {
              // Skip auth-required links if not logged in
              if (link.auth && !user) return null;
              
              if (link.path.startsWith('#')) {
                return (
                  <li key={link.path}>
                    <a href={link.path} className="nav-link">
                      {link.label}
                    </a>
                  </li>
                );
              }
              
              return (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="public-nav-actions">
            {user ? (
              <Link to="/dashboard" className="btn-nav btn-dashboard">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-nav btn-login">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="public-main">
        <div className="public-content">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div>
              <span className="footer-title">Himlayang Pilipino</span>
              <span className="footer-subtitle">Memorial Park</span>
            </div>
          </div>
          
          <div className="footer-links">
            <Link to="/feedback">Feedback</Link>
            <Link to="/announcements">Announcements</Link>
            <a href="#contact">Contact Us</a>
          </div>
          
          <p className="footer-copyright">
            © {new Date().getFullYear()} Himlayang Pilipino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
