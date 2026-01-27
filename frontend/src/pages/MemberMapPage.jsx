import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import '../styles/MemberMap.css';

const MemberMapPage = () => {
  const { user, logout } = useAuth();
  const [selectedSection, setSelectedSection] = useState(null);

  const handleLogout = async () => {
    await logout();
  };

  const sections = [
    { 
      id: 'lawn', 
      name: 'Lawn Section', 
      desc: 'Traditional lawn lots with perpetual care',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8l7-5 7 5M5 16c0-3 3-5 7-5s7 2 7 5"/>
        </svg>
      ),
      color: '#22c55e',
      image: '/Florante-at-Laura-1-scaled.jpg'
    },
    { 
      id: 'garden', 
      name: 'Garden Section', 
      desc: 'Beautiful garden setting with landscaping',
      availability: 'Limited',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22c4-4 8-7 8-12a8 8 0 10-16 0c0 5 4 8 8 12z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      color: '#ec4899',
      image: '/Panooran-2.jpg'
    },
    { 
      id: 'columbarium', 
      name: 'Columbarium', 
      desc: 'Climate-controlled niches for cremated remains',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
      ),
      color: '#8b5cf6',
      image: '/heritage_HD.png'
    },
    { 
      id: 'mausoleum', 
      name: 'Mausoleum', 
      desc: 'Private family tombs with custom designs',
      availability: 'By Request',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V7l7-4 7 4v14"/>
          <rect x="9" y="13" width="6" height="8"/>
          <rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/>
        </svg>
      ),
      color: '#f59e0b',
      image: '/Malakas-at-Maganda.jpg'
    },
    { 
      id: 'terrace', 
      name: 'Memorial Terrace', 
      desc: 'Elevated area with scenic views',
      availability: 'Available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
          <path d="M9 20v-6h6v6"/>
        </svg>
      ),
      color: '#06b6d4',
      image: '/Teresa-Magbanua-scaled.jpg'
    },
    { 
      id: 'heritage', 
      name: 'Heritage Section', 
      desc: 'Historical monuments and landmarks',
      availability: 'View Only',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14"/>
          <path d="M12 3v16M4 19h16"/>
          <circle cx="12" cy="10" r="2"/>
        </svg>
      ),
      color: '#ef4444',
      image: '/Gabriela-Silang-scaled.jpg'
    }
  ];

  const landmarks = [
    { name: 'Main Gate', icon: '' },
    { name: 'Chapel', icon: '' },
    { name: 'Admin Office', icon: '' },
    { name: 'Parking Area', icon: '' },
    { name: 'Comfort Room', icon: '' },
    { name: 'Waiting Shed', icon: '' }
  ];

  return (
    <div className="map-page">
      {/* Header */}
      <MemberHeader />

      {/* Hero */}
      <section className="map-hero">
        <div className="hero-content">
          <h1>Cemetery Map</h1>
          <p>Explore the different sections of Himlayang Pilipino Memorial Park</p>
        </div>
      </section>

      <main className="map-main">
        {/* Interactive Map Placeholder */}
        <section className="map-container">
          <div className="map-wrapper">
            <div className="map-placeholder">
              <div className="map-grid">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`map-section-btn ${selectedSection === section.id ? 'active' : ''}`}
                    style={{ '--section-color': section.color }}
                    onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                  >
                    <div className="section-icon">{section.icon}</div>
                    <span>{section.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="map-legend">
                <h4>Landmarks</h4>
                <div className="legend-items">
                  {landmarks.map((landmark, idx) => (
                    <div key={idx} className="legend-item">
                      <span className="legend-icon">{landmark.icon}</span>
                      <span>{landmark.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Detail Panel */}
            {selectedSection && (
              <div className="section-detail">
                {sections.filter(s => s.id === selectedSection).map(section => (
                  <div key={section.id} className="detail-content">
                    <div className="detail-image" style={{ backgroundImage: `url(${section.image})` }}></div>
                    <div className="detail-info">
                      <div className="detail-header">
                        <div className="detail-icon" style={{ background: section.color }}>{section.icon}</div>
                        <div>
                          <h3>{section.name}</h3>
                          <span className={`availability ${section.availability.toLowerCase().replace(' ', '-')}`}>
                            {section.availability}
                          </span>
                        </div>
                      </div>
                      <p>{section.desc}</p>
                      <div className="detail-actions">
                        <Link to="/member/services" className="detail-btn primary">View Services</Link>
                        <button className="detail-btn secondary" onClick={() => setSelectedSection(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sections Grid */}
        <section className="sections-grid">
          <div className="section-header">
            <h2>Cemetery Sections</h2>
            <p>Click on a section to learn more</p>
          </div>
          <div className="sections-cards">
            {sections.map((section) => (
              <div 
                key={section.id} 
                className={`section-card ${selectedSection === section.id ? 'active' : ''}`}
                onClick={() => setSelectedSection(section.id)}
              >
                <div className="card-image" style={{ backgroundImage: `url(${section.image})` }}>
                  <div className="card-overlay"></div>
                  <div className="card-icon" style={{ background: section.color }}>{section.icon}</div>
                </div>
                <div className="card-content">
                  <h3>{section.name}</h3>
                  <p>{section.desc}</p>
                  <span className={`availability-tag ${section.availability.toLowerCase().replace(' ', '-')}`}>
                    {section.availability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Directions */}
        <section className="directions-section">
          <div className="section-header">
            <h2>How to Get Here</h2>
            <p>Visit us at Himlayang Pilipino Memorial Park</p>
          </div>
          <div className="directions-grid">
            <div className="direction-card">
              <div className="direction-icon car">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 3H8l-4 6v8a2 2 0 002 2h1a2 2 0 002-2v-1h6v1a2 2 0 002 2h1a2 2 0 002-2V9l-4-6z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <h3>By Car</h3>
              <p>From EDSA, turn to Tandang Sora Avenue. The entrance is on the left side, near the corner. Free parking available.</p>
            </div>
            <div className="direction-card">
              <div className="direction-icon transit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="3" width="16" height="16" rx="2"/>
                  <path d="M4 11h16M8 19v2M16 19v2"/>
                  <circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>
                </svg>
              </div>
              <h3>By Commute</h3>
              <p>Take a jeepney going to Tandang Sora. Drop off at Himlayang Pilipino. It's about 5 minutes walk from the main road.</p>
            </div>
            <div className="direction-card">
              <div className="direction-icon contact">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <h3>Need Directions?</h3>
              <p>Call our office at <strong>(02) 8921-6947</strong> and we'll help guide you to our location.</p>
            </div>
          </div>
        </section>

        {/* Google Maps Embed */}
        <section className="google-map-section">
          <div className="section-header">
            <h2>Location</h2>
            <p>240 Tandang Sora Ave, Quezon City, Metro Manila</p>
          </div>
          <div className="google-map-container">
            <iframe 
              title="Himlayang Pilipino Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.0267894526584!2d121.04000861483937!3d14.684749789748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7a3c48db5d7%3A0x3e2e8b9d7e8b8e8b!2sHimlayang%20Pilipino%2C%20Quezon%20City%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1640000000000!5m2!1sen!2sph"
              width="100%" 
              height="400" 
              style={{ border: 0, borderRadius: '16px' }}
              allowFullScreen="" 
              loading="lazy"
            ></iframe>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberMapPage;
