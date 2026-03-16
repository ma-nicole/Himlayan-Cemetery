import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import MobileNav, { HamburgerButton } from './MobileNav';
import './MemberHeader.css';

const MemberHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const mobileNavItems = [
    { path: '/member/dashboard', label: 'Dashboard', icon: '🏠', onClick: () => navigate('/member/dashboard') },
    { path: '/member/search', label: 'Find a Grave', icon: '🔎', onClick: () => navigate('/member/search') },
    { path: '/member/loved-ones', label: 'My Loved Ones', icon: '❤️', onClick: () => navigate('/member/loved-ones') },
    { path: '/member/map', label: 'Map', icon: '🗺️', onClick: () => navigate('/member/map') },
    { path: '/member/services', label: 'Services', icon: '🛎️', onClick: () => navigate('/member/services') },
    { path: '/pay-dues', label: 'Pay Dues', icon: '💳', onClick: () => navigate('/pay-dues') },
    { path: '/member/contact', label: 'Feedback', icon: '💬', onClick: () => navigate('/member/contact') },
    { path: '/profile', label: 'Profile', icon: '👤', onClick: () => navigate('/profile') },
  ];

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
          <HamburgerButton
            isOpen={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(prev => !prev)}
          />
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

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navItems={mobileNavItems}
        currentPath={location.pathname}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default MemberHeader;
