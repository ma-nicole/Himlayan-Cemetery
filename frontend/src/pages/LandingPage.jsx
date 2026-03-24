import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // For making search API requests
import { validateName, validateEmail, validateTextArea, validatePhone } from '../utils/formValidator';
import { resolvePhotoUrl } from '../utils/imageHelpers';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Services section state
  const [activeServiceTab, setActiveServiceTab] = useState('all');

  // reCAPTCHA state
  const recaptchaRef = useRef(null);
  const recaptchaWidgetId = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  // Render reCAPTCHA widget when the element and API are both ready
  useEffect(() => {
    const renderWidget = () => {
      if (recaptchaRef.current && window.grecaptcha && window.grecaptcha.render && recaptchaWidgetId.current === null) {
        try {
          recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: '6LcDjZYsAAAAALNXGRJoOmsC0igbO9Eja1-Ie0KC',
            callback: (token) => setRecaptchaToken(token),
            'expired-callback': () => setRecaptchaToken(''),
          });
        } catch (e) {
          // Widget may already be rendered
        }
      }
    };

    // Try immediately, and also poll briefly in case API loads after mount
    renderWidget();
    const interval = setInterval(renderWidget, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone_country_code: '+63',
    phone: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Services data — same as member services page
  const landingServices = [
    {
      id: 1,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <rect x="7" y="7" width="4" height="4"/>
          <rect x="13" y="7" width="4" height="4"/>
          <rect x="7" y="13" width="4" height="4"/>
          <rect x="13" y="13" width="4" height="4"/>
        </svg>
      ),
      title: 'Pugad Lawin Columbary',
      subtitle: 'Affordable Crypt Options',
      description: 'Affordable crypts offer a dignified resting place for loved ones, accommodating full-sized caskets, urns, and bone remains. These secure and serene spaces provide families a meaningful and cost-effective place to honor and remember their deceased.',
      price: 'starting price: ₱70,000',
      popular: false,
      image: '/hp-columbary.png'
    },
    {
      id: 2,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <rect x="7" y="7" width="4" height="4"/>
          <rect x="13" y="7" width="4" height="4"/>
          <rect x="7" y="13" width="4" height="4"/>
          <rect x="13" y="13" width="4" height="4"/>
        </svg>
      ),
      title: 'Dambana ng Alaala',
      subtitle: 'Dignified Resting Place',
      description: 'Affordable crypts offer a dignified resting place for loved ones, accommodating full-sized caskets, urns, and bone remains. These secure and serene spaces provide families a meaningful and cost-effective place to honor and remember their deceased.',
      price: 'starting price: ₱70,000',
      popular: false,
      image: '/hp-columbary.png'
    },
    {
      id: 3,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8l7-5 7 5M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
        </svg>
      ),
      title: 'Lawn Lots',
      subtitle: 'Serene Garden Setting',
      description: 'Lush spaces that offer a serene resting place. Whether by a tree, a pathwalk, or road you will be assured of a tranquil environment.',
      price: 'starting price: ₱355,000',
      popular: false,
      image: '/hp-lawn-lots.png'
    },
    {
      id: 4,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>
          <rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/>
        </svg>
      ),
      title: 'Memorials',
      subtitle: 'Manicured Garden Lots',
      description: 'Manicured garden lots with above-ground niches. The imposing niches serve as reverence to the status and achievements of the interred. Memorial lots has the highest capacity per area in our inventory. Lot varies from 9sqm to 30sqm.',
      price: 'starting price: ₱1,200,000',
      popular: true,
      image: '/hp-memorials.png'
    },
    {
      id: 5,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Family Estates',
      subtitle: 'Private Family Mausoleums',
      description: 'Mausoleums that give you privacy befitting your family. Most plans and layouts are made with provision for washroom and pantry depending on the location. Various sizes available ranging from 40sqm to 100sqm.',
      price: 'starting price: ₱3,200,000',
      popular: false,
      image: '/hp-family-estates.png'
    },
    {
      id: 6,
      category: 'products',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <circle cx="12" cy="16" r="3"/>
        </svg>
      ),
      title: 'Terraces',
      subtitle: 'Premium Custom Mausoleums',
      description: 'Our largest and premium mausoleums that are tailored for the families\' comfort and requirement. Memorial Terraces also allows them to incorporate their own design and ideas. Lot sizes ranges from 80sqm to 250sqm.',
      price: 'starting price: ₱8,000,000',
      popular: false,
      image: '/hp-terraces.png'
    },
    {
      id: 7,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8l7-5 7 5M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
        </svg>
      ),
      title: 'Internment',
      subtitle: 'Compassionate Interment Services',
      description: 'Experience compassionate interments with our services. We ensure a respectful and serene final resting place for your loved ones, providing personalized care and support during this difficult time.',
      price: 'Contact for pricing',
      popular: false,
      image: '/hp-internment.jpg'
    },
    {
      id: 8,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      ),
      title: 'Cremation',
      subtitle: 'Dignified Cremation Process',
      description: 'Our cremation process is done in a dignified manner and as solemn as possible. We can help you hold ceremonies appropriate to your religious beliefs and needs.',
      price: 'Contact for pricing',
      popular: false,
      image: '/hp-cremation.jpg'
    },
    {
      id: 9,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 2H6a2 2 0 00-2 2v16l8-4 8 4V4a2 2 0 00-2-2z"/>
        </svg>
      ),
      title: 'Funeral Chapels',
      subtitle: 'Flexible Chapel Spaces',
      description: 'We have made our chapels flexible to address your every need. Our chapels can accommodate 30 to 200 people, depending on the number of people expected to pay their respects.',
      price: 'Contact for pricing',
      popular: false,
      image: '/hp-funeral-chapels.jpg'
    },
    {
      id: 10,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1M16 16H8M5.5 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
        </svg>
      ),
      title: 'Packages',
      subtitle: 'Care & Compassion Packages',
      description: 'Designed with care and compassion, our packages ensure that your loved one is honored with dignity and respect. We have thoughtfully prepared packages for cremation, chapel viewing, and everything in between. Families can choose which suits their needs.',
      price: 'Contact for pricing',
      popular: true,
      image: '/hp-packages.jpg'
    }
  ];

  // Filter services based on active tab
  const filteredLandingServices = activeServiceTab === 'all'
    ? landingServices
    : landingServices.filter(s => s.category === activeServiceTab);


  // Hero slideshow images
  const heroImages = [
    '/himlayangpilipino.webp',
    '/himlayanheritage.jpg',
    '/Panooran-2.jpg'
  ];

  // Gallery/Landmark images
  const landmarks = [
    { image: '/Florante-at-Laura-1-scaled.jpg', title: 'Florante at Laura', desc: 'Classic Filipino love story immortalized in bronze' },
    { image: '/Gabriela-Silang-scaled.jpg', title: 'Gabriela Silang', desc: 'Revolutionary hero and warrior woman' },
    { image: '/Malakas-at-Maganda.jpg', title: 'Malakas at Maganda', desc: 'Filipino creation myth sculpture' },
    { image: '/Pugad-Lawin-scaled.jpg', title: 'Pugad Lawin', desc: 'Site of the Cry of Rebellion' },
    { image: '/Teresa-Magbanua-scaled.jpg', title: 'Teresa Magbanua', desc: 'Visayan Joan of Arc' },
    { image: '/Florante-at-Laura-2-scaled.jpg', title: 'Florante at Laura II', desc: 'Another view of the classic tale' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Handle grave search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    
    try {
      const response = await api.get(`/public/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Phone validation helper
  const getPhoneRequirements = (countryCode) => {
    const requirements = {
      '+63': { digits: 10, country: 'Philippines' },
      '+1': { digits: 10, country: 'USA/Canada' },
      '+44': { digits: 10, country: 'UK' },
      '+61': { digits: 9, country: 'Australia' },
      '+81': { digits: 10, country: 'Japan' },
      '+82': { digits: 10, country: 'South Korea' },
      '+86': { digits: 11, country: 'China' },
      '+65': { digits: 8, country: 'Singapore' },
      '+60': { digits: 10, country: 'Malaysia' },
      '+971': { digits: 9, country: 'UAE' }
    };
    return requirements[countryCode] || { digits: 10, country: 'Selected Country' };
  };

  // Handle contact form change
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const maxLength = getPhoneRequirements(contactForm.phone_country_code).digits;
      setContactForm(prev => ({
        ...prev,
        phone: digitsOnly.slice(0, maxLength)
      }));
    } else if (name === 'phone_country_code') {
      const currentPhone = contactForm.phone;
      const newMaxLength = getPhoneRequirements(value).digits;
      setContactForm(prev => ({
        ...prev,
        phone_country_code: value,
        phone: currentPhone.length > newMaxLength ? '' : currentPhone
      }));
    } else {
      setContactForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field as user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Handle contact form submit
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactMessage('');
    const errors = {};

    // Validate first name
    const firstNameValidation = validateName(contactForm.firstName, 'First Name');
    if (!firstNameValidation.valid) {
      errors.firstName = firstNameValidation.error;
    }

    // Validate last name
    const lastNameValidation = validateName(contactForm.lastName, 'Last Name');
    if (!lastNameValidation.valid) {
      errors.lastName = lastNameValidation.error;
    }

    // Validate email
    const emailValidation = validateEmail(contactForm.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }

    // Validate phone if provided
    if (contactForm.phone) {
      const phoneValidation = validatePhone(contactForm.phone, contactForm.phone_country_code);
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error;
      }
    }

    // Validate message
    const messageValidation = validateTextArea(contactForm.message);
    if (!messageValidation.valid) {
      errors.message = messageValidation.error;
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      errors.captcha = 'Please verify that you are not a robot.';
    }

    // If validation errors exist, display them
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setContactLoading(true);

    try {
      const response = await api.post('/feedback', {
        name: `${contactForm.firstName} ${contactForm.lastName}`,
        email: contactForm.email,
        phone: contactForm.phone || null,
        phone_country_code: contactForm.phone_country_code,
        message: contactForm.message
      });

      if (response.data.success) {
        setContactMessage({ type: 'success', text: 'Thank you! Your message has been sent successfully.' });
        setContactForm({
          firstName: '',
          lastName: '',
          email: '',
          phone_country_code: '+63',
          phone: '',
          message: ''
        });
        setValidationErrors({});
        setRecaptchaToken('');
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
        }
        setTimeout(() => setContactMessage(''), 5000);
      }
    } catch (err) {
      setContactMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to send message. Please try again.' 
      });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : 'nav-transparent'}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            <img src="/himlayan.png" alt="Himlayan" className="logo-img" />
            <span className="logo-text">Himlayan</span>
          </Link>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>

          <ul className={`landing-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#home" onClick={closeMobileMenu}>Home</a></li>
            {/* Find a Grave - scrolls to search section on same page */}
            <li><a href="#search" onClick={closeMobileMenu}>Find a Grave</a></li>
            <li><a href="#about" onClick={closeMobileMenu}>About</a></li>
            <li><a href="#services" onClick={closeMobileMenu}>Services</a></li>
            <li><a href="#gallery" onClick={closeMobileMenu}>Gallery</a></li>
            <li><a href="#contact" onClick={closeMobileMenu}>Contact</a></li>
            <li><Link to="/login" className="mobile-login-link" onClick={closeMobileMenu}>Login</Link></li>
          </ul>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn-nav-login">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen with Parallax */}
      <section id="home" className="hero-fullscreen">
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`hero-slide ${index === currentHeroImage ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="hero-gradient-overlay"></div>
        
        <div className="hero-content-wrapper">
          <div className="hero-badge-top">
            <span>Since 1971</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Himlayang</span>
            <span className="hero-title-line accent">Pilipino</span>
          </h1>
          <p className="hero-subtitle">
            A premier memorial park reflecting Filipino culture and values.<br/>
            Over 37 hectares of serene, beautifully maintained grounds.
          </p>
          <div className="hero-cta-group">
            <a href="#services" className="btn-hero-main">Explore Services</a>
            <a href="#gallery" className="btn-hero-outline">View Gallery</a>
          </div>
          
          {/* Hero Slide Indicators */}
          <div className="hero-indicators">
            {heroImages.map((_, index) => (
              <button 
                key={index}
                className={`indicator ${index === currentHeroImage ? 'active' : ''}`}
                onClick={() => setCurrentHeroImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* Find a Grave Search Section */}
      <section id="search" className="search-section-landing">
        <div className="search-section-container">
          <div className="search-section-header">
            <span className="section-label">Find Your Loved Ones</span>
            <h2 className="section-title">Grave <span>Locator</span></h2>
            <p>Search for burial records by name to find grave locations</p>
          </div>

          <form onSubmit={handleSearch} className="landing-search-form">
            <div className="landing-search-wrapper">
              <svg className="landing-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Enter name (e.g. Juan Dela Cruz)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="landing-search-input"
              />
              {searchQuery && (
                <button type="button" className="landing-search-clear" onClick={() => setSearchQuery('')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="landing-search-btn" disabled={searchLoading}>
              {searchLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {/* Search Results */}
          {hasSearched && (
            <div className="landing-search-results">
              {searchLoading ? (
                <div className="search-loading">
                  <div className="loading-spinner-large"></div>
                  <p>Searching for results...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="results-count-header">
                    <h3>Search Results</h3>
                    <span className="count-badge">{searchResults.length} found</span>
                  </div>
                  <div className="landing-results-grid">
                    {searchResults.map((result) => (
                      <div key={result.id} className="landing-result-card">
                        <div className="result-card-header">
                          <div className="result-avatar-icon">
                            {resolvePhotoUrl(result.deceased_photo_url, result.updated_at) ? (
                              <img 
                                src={resolvePhotoUrl(result.deceased_photo_url, result.updated_at)} 
                                alt={result.deceased_name}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  borderRadius: '50%'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
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
                          <h4>{result.deceased_name}</h4>
                        </div>
                        <div className="result-card-details">
                          <div className="result-detail-row">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Plot: {result.plot?.plot_number || 'N/A'}</span>
                          </div>
                          <div className="result-detail-row">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <path d="M3 9h18M9 21V9"/>
                            </svg>
                            <span>Section {result.plot?.section || 'N/A'}, Block {result.plot?.block || 'N/A'}</span>
                          </div>
                          {result.birth_date && result.death_date && (
                            <div className="result-detail-row">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18"/>
                              </svg>
                              <span>{result.birth_date} - {result.death_date}</span>
                            </div>
                          )}
                        </div>
                        <Link to={`/grave/${result.plot?.plot_number}`} className="result-view-btn">
                          View Details
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="search-empty">
                  <div className="empty-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                  <h3>No Results Found</h3>
                  <p>No results found for &quot;{searchQuery}&quot;</p>
                  <button onClick={() => { setHasSearched(false); setSearchQuery(''); }} className="try-again-btn">
                    Try Another Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Years of Service</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">37</span>
            <span className="stat-label">Hectares</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Families Served</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Landmarks</span>
          </div>
        </div>
      </section>

      {/* About Section with Image */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-image-side">
            <div className="about-image-wrapper">
              <img src="/himlayanheritage.jpg" alt="Himlayan Heritage" />
              <div className="about-image-badge">
                <span className="badge-year">Est. 1971</span>
              </div>
            </div>
          </div>
          <div className="about-content-side">
            <span className="section-label">About Us</span>
            <h2 className="section-title">A Legacy of <span>Honor</span> and <span>Remembrance</span></h2>
            <p className="about-text">
              Himlayang Pilipino, Inc. was established in 1971 when the Aguirre Group acquired 
              a 5-hectare memorial park in Quezon City. Today, it has expanded to over 37 hectares, 
              becoming one of the premier memorial parks in the Philippines.
            </p>
            <p className="about-text">
              The park was developed to reflect Filipino culture and values, offering a respectful 
              and serene environment for remembrance. It honors historical figures such as Melchora 
              "Tandang Sora" Aquino and Emilio Jacinto.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                    <path d="M9 9v.01"/>
                    <path d="M9 12v.01"/>
                    <path d="M9 15v.01"/>
                    <path d="M9 18v.01"/>
                  </svg>
                </div>
                <div>
                  <h4>Cultural Heritage</h4>
                  <p>Preserving Filipino history through art and memorials</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/>
                    <path d="m18 15-2-2"/>
                    <path d="m15 18-2-2"/>
                  </svg>
                </div>
                <div>
                  <h4>Compassionate Care</h4>
                  <p>Supporting families with dignity and respect</p>
                </div>
              </div>
            </div>
            <a href="#contact" className="btn-about-cta">Learn More About Us</a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section-landing">
        <div className="services-header-landing">
          <span className="section-label">Our Services</span>
          <h2 className="section-title">Memorial <span>Products</span> & <span>Services</span></h2>
          <p>We provide quality memorial services for your loved ones. Choose the right service for your family.</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-container-landing">
          <div className="filter-tabs-landing">
            <button
              className={`filter-tab-landing ${activeServiceTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('all')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              All
            </button>
            <button
              className={`filter-tab-landing ${activeServiceTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('products')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Products
            </button>
            <button
              className={`filter-tab-landing ${activeServiceTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('services')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
              Services
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <section className="services-grid-landing">
          {filteredLandingServices.map((service) => (
            <a
              key={service.id}
              href="#contact"
              className={`service-card-landing ${service.popular ? 'popular' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {service.popular && <div className="popular-badge-landing">MOST POPULAR</div>}
              <div className="service-image-landing" style={{ backgroundImage: `url(${service.image})` }}>
              </div>
              <div className="service-content-landing">
                <div className="service-header-landing">
                  <h3>{service.title}</h3>
                  <span className="service-subtitle-landing">{service.subtitle}</span>
                </div>
                <p className="service-description-landing">{service.description}</p>
                <div className="service-footer-landing">
                  <span className="service-price-landing">{service.price}</span>
                </div>
              </div>
            </a>
          ))}
        </section>
      </section>

      {/* Gallery / Landmarks Section */}
      <section id="gallery" className="gallery-section">
        <div className="gallery-header">
          <span className="section-label">Arts & Landmarks</span>
          <h2 className="section-title">Cultural <span>Heritage</span></h2>
          <p>Sculptural artworks celebrating Filipino history and artistic heritage</p>
        </div>
        
        <div className="gallery-carousel">
          <div className="gallery-slides">
            {landmarks.map((item, index) => (
              <div 
                key={index} 
                className={`gallery-slide ${index === currentGalleryIndex ? 'active' : ''} ${item.image === '/Gabriela-Silang-scaled.jpg' ? 'gallery-slide-cropped' : ''}`}
              >
                <img 
                  src={item.image} 
                  alt={item.title}
                />
                <div className="gallery-overlay">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
            
            <button 
              className="gallery-arrow gallery-arrow-left"
              onClick={() => setCurrentGalleryIndex(prev => prev === 0 ? landmarks.length - 1 : prev - 1)}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            <button 
              className="gallery-arrow gallery-arrow-right"
              onClick={() => setCurrentGalleryIndex(prev => prev === landmarks.length - 1 ? 0 : prev + 1)}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            
            <div className="gallery-dots">
              {landmarks.map((_, index) => (
                <button
                  key={index}
                  className={`gallery-dot ${index === currentGalleryIndex ? 'active' : ''}`}
                  onClick={() => setCurrentGalleryIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="gallery-cta">
          <p>Experience the rich cultural heritage of Himlayang Pilipino</p>
          <a href="#contact" className="btn-gallery-cta">Contact Us</a>
        </div>
      </section>

      {/* Parallax CTA Section */}
      <section className="parallax-cta" style={{backgroundImage: 'url(/Malakas-at-Maganda.jpg)'}}>
        <div className="parallax-overlay"></div>
        <div className="parallax-content">
          <h2>A Meaningful Final Resting Place</h2>
          <p>Serving Filipino families with compassion and dignity since 1971</p>
          <div className="parallax-buttons">
            <a href="#contact" className="btn-parallax-primary">Contact Us</a>
            <a href="#search" className="btn-parallax-secondary">Find a Grave</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-info-side">
            <span className="section-label">Get in Touch</span>
            <h2 className="section-title">Contact <span>Us</span></h2>
            <p className="contact-intro">
              We're here to assist you. Reach out for inquiries about services, 
              plot availability, and visiting hours.
            </p>
            
            <div className="contact-cards">
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <h4>Location</h4>
                  <p>Himlayan Road, Barangay Pasong Tamo,<br/>Tandang Sora, Quezon City 1107</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <h4>Phone</h4>
                  <p>0917-130-6930<br/>0968-896-4850<br/>0917-713-5034</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <h4>Hours</h4>
                  <p>Monday - Sunday<br/>6:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-side">
            <form className="contact-form-new" onSubmit={handleContactSubmit}>
              <h3>Send us a Message</h3>
              
              {contactMessage && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: contactMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: contactMessage.type === 'success' ? '#15803d' : '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  {contactMessage.text}
                </div>
              )}
              
              <div className="form-row">
                <div style={{ flex: '1' }}>
                  <input 
                    type="text" 
                    name="firstName"
                    placeholder="First Name" 
                    className="form-input"
                    required
                    value={contactForm.firstName}
                    onChange={handleContactChange}
                    style={validationErrors.firstName ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
                  />
                  {validationErrors.firstName && (
                    <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                      {validationErrors.firstName}
                    </small>
                  )}
                </div>
                <div style={{ flex: '1' }}>
                  <input 
                    type="text" 
                    name="lastName"
                    placeholder="Last Name" 
                    className="form-input"
                    required
                    value={contactForm.lastName}
                    onChange={handleContactChange}
                    style={validationErrors.lastName ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
                  />
                  {validationErrors.lastName && (
                    <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                      {validationErrors.lastName}
                    </small>
                  )}
                </div>
              </div>
              
              <div>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email Address" 
                  className="form-input"
                  required
                  value={contactForm.email}
                  onChange={handleContactChange}
                  style={validationErrors.email ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
                />
                {validationErrors.email && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                    {validationErrors.email}
                  </small>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                <select 
                  name="phone_country_code"
                  className="form-input"
                  style={{ flex: '0 0 120px' }}
                  value={contactForm.phone_country_code}
                  onChange={handleContactChange}
                >
                  <option value="+63">🇵🇭 +63</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+82">🇰🇷 +82</option>
                  <option value="+86">🇨🇳 +86</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="Phone Number" 
                  className="form-input"
                  style={{ flex: '1', borderColor: validationErrors.phone ? '#dc2626' : undefined, borderWidth: validationErrors.phone ? '2px' : undefined }}
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  title={contactForm.phone ? (contactForm.phone.length === getPhoneRequirements(contactForm.phone_country_code).digits ? 'Valid' : `Enter exactly ${getPhoneRequirements(contactForm.phone_country_code).digits} digits`) : `Optional - Enter exactly ${getPhoneRequirements(contactForm.phone_country_code).digits} digits`}
                />
              </div>
              
              {validationErrors.phone ? (
                <small style={{ color: '#dc2626', display: 'block', marginBottom: '1rem' }}>
                  {validationErrors.phone}
                </small>
              ) : (
                <small style={{ color: '#666', display: 'block', marginBottom: '1rem' }}>
                  {contactForm.phone ? (
                    contactForm.phone.length === getPhoneRequirements(contactForm.phone_country_code).digits
                      ? '✓ Valid'
                      : `Enter exactly ${getPhoneRequirements(contactForm.phone_country_code).digits} digits`
                  ) : (
                    `(Optional) Exactly ${getPhoneRequirements(contactForm.phone_country_code).digits} digits needed`
                  )}
                </small>
              )}
              
              <div>
                <textarea 
                  name="message"
                  placeholder="Your Message" 
                  rows="4" 
                  className="form-input"
                  required
                  value={contactForm.message}
                  onChange={handleContactChange}
                  style={validationErrors.message ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
                ></textarea>
                {validationErrors.message && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                    {validationErrors.message}
                  </small>
                )}
              </div>

              {/* reCAPTCHA */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <div ref={recaptchaRef}></div>
                {validationErrors.captcha && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                    {validationErrors.captcha}
                  </small>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn-contact-submit"
                disabled={contactLoading || Object.keys(validationErrors).length > 0}
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="section-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="landing-logo">
                <img src="/himlayan.png" alt="Himlayan" className="logo-img" />
                <span className="logo-text">Himlayan</span>
              </Link>
              <p>Himlayang Pilipino Memorial Park — A premier memorial park reflecting Filipino culture and values.</p>
            </div>
            
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#search">Find a Grave</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>Services</h4>
              <ul>
                <li><a href="#services">Lawn Lots</a></li>
                <li><a href="#services">Columbaries</a></li>
                <li><a href="#services">Mausoleums</a></li>
                <li><a href="#services">Memorial Terraces</a></li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>Contact</h4>
              <ul>
                <li><a href="tel:09171306930">0917-130-6930</a></li>
                <li><a href="tel:09688964850">0968-896-4850</a></li>
                <li><a href="tel:09177135034">0917-713-5034</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 Himlayang Pilipino Memorial Park. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
