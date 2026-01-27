import React, { useState } from 'react';
import PublicLayout from '../components/common/PublicLayout';
import './AnnouncementsPage.css';

const AnnouncementsPage = () => {
  const [filter, setFilter] = useState('all');
  
  // Demo announcements
  const announcements = [
    {
      id: 1,
      title: "All Saints' Day Schedule",
      date: '2025-10-28',
      category: 'schedule',
      content: "Extended visiting hours from 6:00 AM to 10:00 PM. Please observe proper waste disposal and respect other visitors.",
      important: true,
    },
    {
      id: 2,
      title: 'Maintenance Notice',
      date: '2025-09-10',
      category: 'maintenance',
      content: "Certain sections of the memorial park will undergo cleaning and tree pruning this week. We apologize for any inconvenience.",
      important: false,
    },
    {
      id: 3,
      title: 'New Online Payment System',
      date: '2025-08-15',
      category: 'update',
      content: "Our new digital payment feature is now live! You can now conveniently pay your memorial dues online through the website.",
      important: true,
    },
    {
      id: 4,
      title: 'Holiday Operating Hours',
      date: '2025-12-20',
      category: 'schedule',
      content: "During the Christmas and New Year holidays, the memorial park will operate from 7:00 AM to 6:00 PM. The office will be closed on December 25 and January 1.",
      important: false,
    },
    {
      id: 5,
      title: 'Water System Upgrade',
      date: '2025-07-05',
      category: 'maintenance',
      content: "We are upgrading our water irrigation system to better maintain the gardens. Work will be completed by the end of the month.",
      important: false,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Updates' },
    { id: 'schedule', label: 'Schedules' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'update', label: 'News & Updates' },
  ];

  const filteredAnnouncements = announcements
    .filter(a => filter === 'all' || a.category === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'schedule': return '';
      case 'maintenance': return '';
      case 'update': return '';
      default: return '';
    }
  };

  return (
    <PublicLayout>
      <div className="announcements-page">
        <div className="page-header">
          <h1>Announcements & Updates</h1>
          <p>Stay informed about the latest news from Himlayang Pilipino</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-tab ${filter === cat.id ? 'active' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Announcements List */}
        <div className="announcements-list">
          {filteredAnnouncements.map((announcement, index) => (
            <article 
              key={announcement.id} 
              className={`announcement-card ${announcement.important ? 'important' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {announcement.important && (
                <span className="important-badge">Important</span>
              )}
              
              <div className="announcement-header">
                <span className="announcement-icon">
                  {getCategoryIcon(announcement.category)}
                </span>
                <div className="announcement-meta">
                  <h2 className="announcement-title">{announcement.title}</h2>
                  <time className="announcement-date">{formatDate(announcement.date)}</time>
                </div>
              </div>
              
              <p className="announcement-content">{announcement.content}</p>
              
              <div className="announcement-footer">
                <span className="category-tag">{announcement.category}</span>
                <button className="read-more">Read more →</button>
              </div>
            </article>
          ))}
        </div>

        {filteredAnnouncements.length === 0 && (
          <div className="no-announcements">
            <p>No announcements in this category</p>
          </div>
        )}

        {/* Back Button */}
        <div className="page-footer">
          <button 
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AnnouncementsPage;
