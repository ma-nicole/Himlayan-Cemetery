import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import '../styles/MemberDashboard.css';

const MemberAnnouncementsPage = () => {
  const { user, logout } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, selectedFilter]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements');
      if (response.data.success) {
        setAnnouncements(response.data.data || []);
      }
    } catch (err) {
      console.log('Failed to load announcements, using defaults');
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
          title: 'New Online Payment System Available',
          content: 'You can now pay memorial dues online through our website.',
          date: '2025-09-15',
          type: 'update'
        },
        {
          id: 3,
          title: 'Maintenance Schedule',
          content: 'All sections will be maintained every Sunday from 6 AM to 12 PM.',
          date: '2025-09-10',
          type: 'info'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    if (selectedFilter === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(announcements.filter(a => a.type === selectedFilter));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="member-page">
      <MemberHeader user={user} logout={logout} />
      
      <div className="member-content">
        <div className="announcements-detail-page">
          <div className="announcements-header">
            <div>
              <h1>Announcements</h1>
              <p>Stay informed with the latest updates from Himlayang Pilipino</p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="announcements-filters">
            <button 
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All Updates
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'important' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('important')}
            >
              Important
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'update' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('update')}
            >
              Updates
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'info' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('info')}
            >
              Info
            </button>
          </div>

          {/* Announcements List */}
          <div className="announcements-list-full">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading announcements...</p>
              </div>
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className={`announcement-card-full ${announcement.type}`}>
                  <div className="announcement-header-row">
                    <div>
                      <h3>{announcement.title}</h3>
                      <span className="announcement-date">
                        {formatDate(announcement.date)}
                      </span>
                    </div>
                    {announcement.type === 'important' && (
                      <span className="badge-important">Important</span>
                    )}
                  </div>
                  <div className="announcement-body">
                    <p>{announcement.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-announcements">
                <p>No announcements found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MemberFooter />
    </div>
  );
};

export default MemberAnnouncementsPage;
