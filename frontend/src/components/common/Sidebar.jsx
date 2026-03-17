import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <img src="/himlayan.png" alt="Himlayan" className="sidebar-logo-img" />
        <h2>Himlayan</h2>
        <p>Cemetery Management</p>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/admin/dashboard" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/burial-records" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Burial Records
          </NavLink>
        </li>
        <li>
          <NavLink to="/plots" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Plots
          </NavLink>
        </li>
        <li>
          <NavLink to="/map" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Cemetery Map
          </NavLink>
        </li>
        
        {/* Management Section */}
        <li className="sidebar-divider">Management</li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/admin/users" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
              Users
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/admin/announcements" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Announcements
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/service-requests" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Service Requests
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/payments" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Payments
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/feedback" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Feedback
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports" onClick={handleNavClick} className={({ isActive }) => isActive ? 'active' : ''}>
            Reports
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-user" ref={menuRef}>
        <button
          type="button"
          className="sidebar-user-trigger"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-expanded={isMenuOpen}
        >
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
          <span className="sidebar-user-caret">▾</span>
        </button>

        {isMenuOpen && (
          <div className="sidebar-user-menu">
            <button type="button" className="sidebar-user-menu-item logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
