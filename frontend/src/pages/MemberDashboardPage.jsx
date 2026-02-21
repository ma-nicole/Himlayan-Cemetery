import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import '../styles/MemberDashboard.css';

const MemberDashboardPage = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myPlots, setMyPlots] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadMyPlots();
    loadAnnouncements();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadMyPlots = async () => {
    try {
      const response = await api.get('/member/my-plots');
      if (response.data.success) {
        setMyPlots(response.data.data || []);
      }
    } catch (err) {
      console.log('No plots found or API not ready');
      setMyPlots([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      if (response.data.success) {
        setAnnouncements(response.data.data || []);
      }
    } catch (err) {
      setAnnouncements([
        {
          id: 1,
          title: 'Cemetery Open for All Saints Day',
          content: 'Oct 31 - Nov 2: Open 24 hours for visitors.',
          date: '2025-10-25',
          type: 'important'
        },
        {
          id: 2,
          title: 'New Memorial Garden',
          content: 'A new section of the memorial garden is now open.',
          date: '2025-10-01',
          type: 'info'
        },
        {
          id: 3,
          title: 'Online Payment Available',
          content: 'You can now pay your dues online.',
          date: '2025-09-15',
          type: 'success'
        }
      ]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`/public/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-PH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-PH', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="member-dashboard-pro">
      {/* Header */}
      <MemberHeader />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Hero */}
        <section className="welcome-hero">
          <div className="welcome-content">
            <div className="welcome-text">
              <p className="greeting">{getGreeting()},</p>
              <h1 className="welcome-name">{user?.name}!</h1>
              <p className="welcome-subtitle">Welcome to your Himlayang Pilipino Dashboard</p>
            </div>
            <div className="welcome-info">
              <div className="date-time">
                <p className="current-date">{formatDate(currentTime)}</p>
                <p className="current-time">{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions - Main Feature Cards */}
        <section className="feature-cards">
          <Link to="/member/search" className="feature-card find-grave">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div className="feature-content">
              <h3>Find Grave</h3>
              <p>Search and locate your loved ones' resting place</p>
            </div>
            <div className="feature-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>

          <Link to="/pay-dues" className="feature-card pay-dues">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="feature-content">
              <h3>Pay Dues</h3>
              <p>Settle maintenance fees and payments online</p>
            </div>
            <div className="feature-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>
        </section>

        {/* Search Section */}
        <section className="search-section-pro">
          <div className="search-header">
            <h2>Quick Search</h2>
            <p>Find a grave by name, plot number, or section</p>
          </div>
          <form onSubmit={handleSearch} className="search-form-pro">
            <div className="search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Enter name or plot number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-pro"
              />
            </div>
            <button type="submit" className="search-btn-pro" disabled={loading}>
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results-pro">
              {searchResults.map((result) => (
                <div key={result.id} className="result-card-pro">
                  <div className="result-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="result-info-pro">
                    <h4>{result.deceased_name}</h4>
                    <p>Plot: {result.plot?.plot_number || 'N/A'} • Section: {result.plot?.section || 'N/A'}</p>
                  </div>
                  <Link to={`/grave/${result.plot?.plot_number}`} className="result-btn-pro">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stats Overview */}
        <section className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon plots">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{myPlots.length}</span>
              <span className="stat-label">My Plots</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">0</span>
              <span className="stat-label">Pending Payments</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon visits">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">12</span>
              <span className="stat-label">Visits This Year</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon requests">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">2</span>
              <span className="stat-label">Service Requests</span>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="dashboard-columns">
          {/* My Plots */}
          <section className="plots-section-pro">
            <div className="section-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                My Plots
              </h2>
              <Link to="/member/plots" className="see-all-link">View All</Link>
            </div>
            
            {myPlots.length > 0 ? (
              <div className="plots-list-pro">
                {myPlots.slice(0, 3).map((plot) => (
                  <div key={plot.id} className="plot-card-pro">
                    <div className="plot-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div className="plot-info">
                      <h4>{plot.plot_number}</h4>
                      <p>Section {plot.section} • Block {plot.block}</p>
                    </div>
                    <span className={`status-tag ${plot.status}`}>{plot.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-pro">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h4>No Plots Yet</h4>
                <p>You haven't reserved or purchased any plots yet.</p>
                <Link to="/member/services" className="empty-cta">Inquire Now</Link>
              </div>
            )}
          </section>

          {/* Announcements */}
          <section className="announcements-section-pro">
            <div className="section-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                </svg>
                Announcements
              </h2>
              <Link to="/member/announcements" className="see-all-link">View All</Link>
            </div>
            
            <div className="announcements-list-pro">
              {announcements.map((announcement) => (
                <div key={announcement.id} className={`announcement-card-pro ${announcement.type}`}>
                  <div className="announcement-indicator"></div>
                  <div className="announcement-content">
                    <h4>{announcement.title}</h4>
                    <p>{announcement.content}</p>
                    <span className="announcement-date">{announcement.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Quick Links */}
        <section className="quick-links-section">
          <div className="section-header">
            <h2>Quick Links</h2>
          </div>
          <div className="quick-links-grid">
            <Link to="/member/map" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
              </div>
              <span>Cemetery Map</span>
            </Link>
            <Link to="/member/history" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span>Payment History</span>
            </Link>
            <Link to="/member/services" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span>Maintenance Request</span>
            </Link>
            <Link to="/member/schedule" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span>Schedule Visit</span>
            </Link>
            <Link to="/member/contact" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span>Contact Us</span>
            </Link>
            <Link to="/member/help" className="quick-link-card">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span>Help & FAQ</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberDashboardPage;
