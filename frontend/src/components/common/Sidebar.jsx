import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/himlayan.png" alt="Himlayan" className="sidebar-logo-img" />
        <h2>Himlayan</h2>
        <p>Cemetery Management</p>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/burial-records" className={({ isActive }) => isActive ? 'active' : ''}>
            Burial Records
          </NavLink>
        </li>
        <li>
          <NavLink to="/plots" className={({ isActive }) => isActive ? 'active' : ''}>
            Plots
          </NavLink>
        </li>
        <li>
          <NavLink to="/map" className={({ isActive }) => isActive ? 'active' : ''}>
            Cemetery Map
          </NavLink>
        </li>
        
        {/* Management Section */}
        <li className="sidebar-divider">Management</li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
              Users
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/admin/announcements" className={({ isActive }) => isActive ? 'active' : ''}>
            Announcements
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/service-requests" className={({ isActive }) => isActive ? 'active' : ''}>
            Service Requests
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'active' : ''}>
            Payments
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/feedback" className={({ isActive }) => isActive ? 'active' : ''}>
            Feedback
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-role">{user?.role}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
