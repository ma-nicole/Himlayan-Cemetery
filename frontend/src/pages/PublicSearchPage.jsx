/**
 * PublicSearchPage Component
 * 
 * This is the publicly accessible version of the grave search functionality.
 * Unlike MemberSearchPage, this does NOT require user authentication/login.
 * 
 * Purpose: Allow public visitors to search for graves without creating an account
 * Route: /search (accessible from landing page navbar)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // API service for making HTTP requests
import '../styles/MemberSearch.css'; // Reusing member search styles

const PublicSearchPage = () => {
  // State management for search functionality
  const [searchQuery, setSearchQuery] = useState(''); // Stores the user's search input
  const [searchResults, setSearchResults] = useState([]); // Stores the array of search results
  const [loading, setLoading] = useState(false); // Tracks if search is in progress
  const [searched, setSearched] = useState(false); // Tracks if user has performed a search (to show results section)

  /**
   * handleSearch Function
   * 
   * Executes when user submits the search form
   * Makes API call to /public/search endpoint (no authentication required)
   * 
   * @param {Event} e - Form submit event
   */
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    if (!searchQuery.trim()) return; // Don't search if input is empty

    setLoading(true); // Show loading spinner
    setSearched(true); // Mark that a search has been performed (shows results section)
    
    try {
      // Call public API endpoint - no auth token needed
      // encodeURIComponent ensures special characters in names are handled correctly
      const response = await api.get(`/public/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.data.success) {
        setSearchResults(response.data.data || []); // Update results with found records
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]); // Clear results on error
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  // Example search terms to help users understand what to search for
  const recentSearches = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Garcia'];

  return (
    <div className="search-page">
      {/* Public Navigation Bar - Different from member header, includes back to home and login links */}
      <nav className="public-search-nav">
        <div className="nav-container">
          {/* Logo - clicking returns to landing page */}
          <Link to="/" className="nav-logo">
            <img src="/himlayan.png" alt="Himlayan" className="logo-img" />
            <span className="logo-text">Himlayan</span>
          </Link>
          {/* Navigation links for public users */}
          <div className="nav-links">
            <Link to="/">Back to Home</Link> {/* Returns to landing page */}
            <Link to="/login" className="nav-login-btn">Login</Link> {/* For users who want to access member features */}
          </div>
        </div>
      </nav>

      {/* Hero Search Section - Main search interface with prominent search bar */}
      <section className="search-hero">
        <div className="hero-bg"></div> {/* Background gradient overlay */}
        <div className="hero-content">
          {/* Search icon SVG */}
          <div className="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          {/* Main heading and description */}
          <h1>Find a Grave</h1>
          <p>Enter the known details (Name, Nickname, Date, or Plot Number) of the person you're looking for</p>
          
          {/* Search form - calls handleSearch on submit */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              {/* Search icon displayed inside input field */}
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              {/* Main search input field - controlled component */}
              <input
                type="text"
                placeholder="Enter name, nickname, date (YYYY-MM-DD), or plot #..."
                value={searchQuery} // Controlled by searchQuery state
                onChange={(e) => setSearchQuery(e.target.value)} // Updates state on every keystroke
                className="search-input"
              />
              {/* Clear button - only shows when there's text in the input */}
              {searchQuery && (
                <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Submit button - disabled during loading to prevent multiple requests */}
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span> {/* Loading spinner animation */}
                  Searching...
                </>
              ) : (
                'Search' // Default button text
              )}
            </button>
          </form>

          {/* Quick Search Suggestions - Only shown before user performs first search */}
          {!searched && (
            <div className="quick-search">
              <span>Examples:</span>
              {/* Map through example names and create clickable buttons */}
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
        {/* Search Results Section - Only displayed after user has searched */}
        {searched && (
          <section className="results-section">
            {/* Show loading state while API request is in progress */}
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Searching for results...</p>
              </div>
            ) : searchResults.length > 0 ? ( // If results found, display them
              <>
                {/* Results header showing count */}
                <div className="results-header">
                  <h2>Results</h2>
                  <span className="results-count">{searchResults.length} found</span>
                </div>
                {/* Grid of result cards */}
                <div className="results-grid">
                  {/* Map through each search result and create a card */}
                  {searchResults.map((result) => (
                    <div key={result.id} className="result-card">
                      {/* Avatar icon for the deceased person */}
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
                              // If there's a sibling SVG (which there isn't in this conditional branch), we'd show it.
                              // Since we replaced the content, we need a way to show the fallback.
                              // Actually, the structure is: { url ? img : svg }. 
                              // If img fails, we just hide it. The container will be empty.
                              // Improvement: We can toggle a state for failed images, but that's complex for a map.
                              // Simple fallback: Add a background icon or color to the parent using CSS class.
                               e.target.parentElement.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                            }}
                          />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        )}
                      </div>
                      {/* Result information display */}
                      <div className="result-info">
                        <h3>{result.deceased_name}</h3> {/* Name of deceased */}
                        <div className="result-details">
                          {/* Location pin icon and plot number */}
                          <div className="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Plot: {result.plot?.plot_number || 'N/A'}</span> {/* Optional chaining to safely access nested properties */}
                          </div>
                          {/* Grid icon and section/block info */}
                          <div className="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <path d="M3 9h18M9 21V9"/>
                            </svg>
                            <span>Section: {result.plot?.section || 'N/A'}, Block: {result.plot?.block || 'N/A'}</span>
                          </div>
                          {/* Calendar icon and dates - only shown if dates exist */}
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
                      {/* View button - navigates to full grave profile page */}
                      <Link to={`/grave/${result.plot?.unique_code}`} className="view-btn">
                        <span>View</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/> {/* Arrow icon */}
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            ) : ( // If no results found, show empty state
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
                {/* Helpful suggestions for better search results */}
                <div className="empty-suggestions">
                  <p>Suggestions:</p>
                  <ul>
                    <li>Check the spelling of the name</li>
                    <li>Try searching by last name only</li>
                    <li>Use shorter keywords</li>
                  </ul>
                </div>
                {/* Reset button - clears search and returns to initial state */}
                <button onClick={() => { setSearched(false); setSearchQuery(''); }} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}
          </section>
        )}

        {/* How It Works - Educational section showing users how to use the search */}
        <section className="how-it-works">
          <div className="section-header">
            <h2>How to Use Search</h2>
            <p>Follow these simple steps</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h3>Enter Details</h3>
              <p>Type the name, nickname, birth/death date, or plot number</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <h3>Search Database</h3>
              <p>Our system will search through all burial records instantly</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Find Location</h3>
              <p>View the exact plot location and get directions</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Simple footer with copyright and useful links */}
      <footer className="public-search-footer">
        <div className="footer-content">
          <p>&copy; 2026 Himlayang Pilipino Memorial Park. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link> {/* Back to landing page */}
            <Link to="/feedback">Feedback</Link> {/* User feedback form */}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicSearchPage;
