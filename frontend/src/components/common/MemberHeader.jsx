import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './MemberHeader.css';

const MemberHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="member-header">
      <div className="member-header-container">
        <Link to="/member/dashboard" className="member-header-logo">
          <img src="/himlayan.png" alt="Himlayan" className="member-logo-img" />
          <span>Himlayan</span>
        </Link>
        
        <nav className="member-header-nav">
          <Link 
            to="/member/dashboard" 
            className={`member-nav-link ${isActive('/member/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/member/search" 
            className={`member-nav-link ${isActive('/member/search') ? 'active' : ''}`}
          >
            Find a Grave
          </Link>
          <Link 
            to="/member/map" 
            className={`member-nav-link ${isActive('/member/map') ? 'active' : ''}`}
          >
            Map
          </Link>
          <Link 
            to="/member/services" 
            className={`member-nav-link ${isActive('/member/services') ? 'active' : ''}`}
          >
            Services
          </Link>
        </nav>

        <div className="member-header-actions">
          <div className="member-user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="member-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default MemberHeader;
