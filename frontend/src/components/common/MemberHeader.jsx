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
            to="/member/loved-ones" 
            className={`member-nav-link ${isActive('/member/loved-ones') ? 'active' : ''}`}
          >
            My Loved Ones
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
          <Link 
            to="/pay-dues" 
            className={`member-nav-link ${isActive('/pay-dues') ? 'active' : ''}`}
          >
            Pay Dues
          </Link>
          <Link 
            to="/member/contact" 
            className={`member-nav-link ${isActive('/member/contact') ? 'active' : ''}`}
          >
            Feedback
          </Link>
        </nav>

        <div className="member-header-actions">
          <Link 
            to="/profile" 
            className="member-user-avatar"
            title="Edit Profile"
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="avatar-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span 
              className="avatar-initials"
              style={{ display: user?.avatar ? 'none' : 'flex' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </Link>
          <button onClick={handleLogout} className="member-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default MemberHeader;
