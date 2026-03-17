import React, { useState, useCallback } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      {/* backdrop: closes sidebar when tapping outside on mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
      )}
      <main className="main-content">
        <Navbar onMenuToggle={openSidebar} />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
