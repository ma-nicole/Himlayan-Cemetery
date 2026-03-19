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
  const [statsLoading, setStatsLoading] = useState(true);
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [myPlots, setMyPlots] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    my_plots: 0,
    pending_payments: 0,
    visits_this_year: 0,
    service_requests: 0
  });

  useEffect(() => {
    loadMyPlots();
    loadAnnouncements();
    loadDashboardStats();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get('/member/dashboard-stats');
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (err) {
      console.log('Failed to load dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMyPlots = async () => {
    setPlotsLoading(true);
    try {
      const response = await api.get('/member/my-plots');
      if (response.data.success) {
        setMyPlots(response.data.data || []);
      }
    } catch (err) {
      console.log('No plots found or API not ready');
      setMyPlots([]);
    } finally {
      setPlotsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setAnnouncementsLoading(true);
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
    } finally {
      setAnnouncementsLoading(false);
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
                    {result.deceased_photo_url ? (
                      <img 
                        src={result.deceased_photo_url} 
                        alt={result.deceased_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
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
          <Link to="/member/loved-ones" className={`stat-card clickable ${statsLoading ? 'loading' : ''}`}>
            <div className="stat-icon plots">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="stat-info">
              {!statsLoading && <span className="stat-number">{dashboardStats.my_plots}</span>}
              <span className="stat-label">My Plots</span>
            </div>
          </Link>

          <Link to="/pay-dues" className={`stat-card clickable ${statsLoading ? 'loading' : ''}`}>
            <div className="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              {!statsLoading && <span className="stat-number">{dashboardStats.pending_payments}</span>}
              <span className="stat-label">Pay Dues</span>
            </div>
          </Link>

          <div className={`stat-card ${statsLoading ? 'loading' : ''}`}>
            <div className="stat-icon visits">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              {!statsLoading && <span className="stat-number">{dashboardStats.visits_this_year}</span>}
              <span className="stat-label">Visits This Year</span>
            </div>
          </div>

          <Link to="/member/services?tab=my-requests" className={`stat-card clickable ${statsLoading ? 'loading' : ''}`}>
            <div className="stat-icon requests">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="stat-info">
              {!statsLoading && <span className="stat-number">{dashboardStats.service_requests}</span>}
              <span className="stat-label">Pending Requests</span>
            </div>
          </Link>
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
              <Link to="/member/loved-ones" className="see-all-link">View All</Link>
            </div>
            
            {plotsLoading ? (
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Loading your plots...</p>
              </div>
            ) : myPlots.length > 0 ? (
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
              {announcementsLoading ? (
                <div className="loading-spinner-container">
                  <div className="loading-spinner"></div>
                  <p>Loading announcements...</p>
                </div>
              ) : announcements.slice(0, 3).map((announcement) => (
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

      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberDashboardPage;
