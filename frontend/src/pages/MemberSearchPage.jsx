import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import '../styles/MemberSearch.css';

const MemberSearchPage = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
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

  const recentSearches = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Garcia'];

  return (
    <div className="search-page">
      {/* Header */}
      <MemberHeader />

      {/* Hero Search Section */}
      <section className="search-hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h1>Find a Grave</h1>
          <p>Enter the known details (Name, Nickname, Date, or Plot Number) of the person you're looking for</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Enter name, nickname, date, or plot #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {/* Quick Search Suggestions */}
          {!searched && (
            <div className="quick-search">
              <span>Examples:</span>
              {recentSearches.map((term, idx) => (
                <button key={idx} onClick={() => setSearchQuery(term)} className="quick-tag">
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="search-main">
        {/* Search Results */}
        {searched && (
          <section className="results-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Searching for results...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="results-header">
                  <h2>Results</h2>
                  <span className="results-count">{searchResults.length} found</span>
                </div>
                <div className="results-grid">
                  {searchResults.map((result) => (
                    <div key={result.id} className="result-card">
                      <div className="result-avatar">
                        {result.deceased_photo_url ? (
                          <img 
                            src={result.deceased_photo_url} 
                            alt={result.deceased_name} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.classList.add('fallback');
                            }}
                          />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        )}
                      </div>
                      <div className="result-info">
                        <h3>{result.deceased_name}</h3>
                        <div className="result-details">
                          <div className="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Plot: {result.plot?.plot_number || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <path d="M3 9h18M9 21V9"/>
                            </svg>
                            <span>Section: {result.plot?.section || 'N/A'}, Block: {result.plot?.block || 'N/A'}</span>
                          </div>
                          {result.birth_date && result.death_date && (
                            <div className="detail-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18"/>
                              </svg>
                              <span>{result.birth_date} - {result.death_date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link to={`/grave/${result.plot?.plot_number}`} className="view-btn">
                        <span>View</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <h3>No Results Found</h3>
                <p>No results found for &quot;{searchQuery}&quot;</p>
                <div className="empty-suggestions">
                  <p>Suggestions:</p>
                  <ul>
                    <li>Check the spelling of the name</li>
                    <li>Try searching by last name only</li>
                    <li>Use shorter keywords</li>
                  </ul>
                </div>
                <button onClick={() => { setSearched(false); setSearchQuery(''); }} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}
          </section>
        )}

        {/* How It Works */}
        <section className="how-it-works">
          <div className="section-header">
            <h2>How to Use Search</h2>
            <p>Follow these simple steps</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h3>Enter the Name</h3>
              <p>Type the full name or last name of the person you're looking for</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <h3>Click Search</h3>
              <p>Press the button to start searching</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Find the Location</h3>
              <p>View the details and location of the grave</p>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="tips-section">
          <div className="tips-card">
            <div className="tips-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div className="tips-content">
              <h3>Search Tips</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Use the full name for more accurate results</span>
                </div>
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>If you don't know the full name, try searching by last name only</span>
                </div>
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>For assistance, contact our staff at (02) 8921-6947</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Need Help CTA */}
        <section className="help-cta">
          <div className="cta-content">
            <div className="cta-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div className="cta-text">
              <h3>Need Help?</h3>
              <p>Our staff is ready to assist you with your search</p>
            </div>
            <a href="tel:028921694" className="cta-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Call Now
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberSearchPage;
