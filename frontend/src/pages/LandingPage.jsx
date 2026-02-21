import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // For making search API requests

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Services section state
  const [activeServiceTab, setActiveServiceTab] = useState('all');

  // Services data
  const landingServices = [
    {
      id: 1,
      category: 'burial',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8l7-5 7 5M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
        </svg>
      ),
      title: 'Lawn Lots',
      subtitle: 'Traditional Ground Burial',
      description: 'Traditional burial lots in well-maintained lawn areas. Various sizes available depending on your family\'s needs.',
      features: ['Single or Family lots', 'Perpetual care included', 'Well-maintained landscaping', 'Concrete vault ready'],
      price: 'Starting at ₱150,000',
      popular: false,
      image: '/Florante-at-Laura-1-scaled.jpg'
    },
    {
      id: 2,
      category: 'cremation',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <rect x="7" y="7" width="4" height="4"/>
          <rect x="13" y="7" width="4" height="4"/>
          <rect x="7" y="13" width="4" height="4"/>
          <rect x="13" y="13" width="4" height="4"/>
        </svg>
      ),
      title: 'Columbarium Niches',
      subtitle: 'Modern Cremation Storage',
      description: 'Modern niches for cremated remains. Climate-controlled and secured 24/7 for your peace of mind.',
      features: ['Climate-controlled', 'Secured 24/7', 'Multiple sizes', 'Indoor location'],
      price: 'Starting at ₱80,000',
      popular: true,
      image: '/Panooran-2.jpg'
    },
    {
      id: 3,
      category: 'burial',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>
          <rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/>
        </svg>
      ),
      title: 'Mausoleum',
      subtitle: 'Private Family Tombs',
      description: 'Private family tombs with their own structure. Perfect for large families who want an exclusive memorial.',
      features: ['Custom designs', 'Multiple vault capacity', 'Exclusive area', 'Premium location'],
      price: 'Starting at ₱500,000',
      popular: false,
      image: '/heritage_HD.png'
    },
    {
      id: 4,
      category: 'burial',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
      title: 'Memorial Terrace',
      subtitle: 'Elevated Scenic Views',
      description: 'Elevated memorial area with beautiful views of the entire park. Perfect for those who want a peaceful and serene location.',
      features: ['Scenic views', 'Peaceful atmosphere', 'Well-maintained', 'Garden setting'],
      price: 'Starting at ₱200,000',
      popular: false,
      image: '/Malakas-at-Maganda.jpg'
    },
    {
      id: 5,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 2H6a2 2 0 00-2 2v16l8-4 8 4V4a2 2 0 00-2-2z"/>
        </svg>
      ),
      title: 'Chapel Services',
      subtitle: 'Memorial Masses & Events',
      description: 'Our chapel is available for memorial masses, prayer services, and other religious ceremonies.',
      features: ['Air-conditioned', '100+ seating capacity', 'Audio-visual system', 'Parking available'],
      price: 'Starting at ₱5,000/event',
      popular: false,
      image: '/Teresa-Magbanua-scaled.jpg'
    },
    {
      id: 6,
      category: 'services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1M16 16H8M5.5 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
        </svg>
      ),
      title: 'Burial Coordination',
      subtitle: 'Complete Assistance',
      description: 'Complete and organized burial assistance from start to finish. One call and we\'ll take care of everything.',
      features: ['Funeral home coordination', 'Equipment rental', 'Staff assistance', 'Documentation help'],
      price: 'Starting at ₱15,000',
      popular: true,
      image: '/Gabriela-Silang-scaled.jpg'
    }
  ];

  // Filter services based on active tab
  const filteredLandingServices = activeServiceTab === 'all' 
    ? landingServices 
    : landingServices.filter(s => s.category === activeServiceTab);


  // Hero slideshow images
  const heroImages = [
    '/himlayangpilipino.webp',
    '/heritage_HD.png',
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
          >
            Menu
          </button>

          <ul className={`landing-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#home">Home</a></li>
            {/* Find a Grave - scrolls to search section on same page */}
            <li><a href="#search">Find a Grave</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#contact">Contact</a></li>
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

          {/* Search Examples */}
          {!hasSearched && (
            <div className="search-examples">
              <span>Examples:</span>
              <button onClick={() => setSearchQuery('Juan Dela Cruz')} className="example-tag">Juan Dela Cruz</button>
              <button onClick={() => setSearchQuery('Maria Santos')} className="example-tag">Maria Santos</button>
              <button onClick={() => setSearchQuery('Pedro Garcia')} className="example-tag">Pedro Garcia</button>
            </div>
          )}

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
              <img src="/heritage_HD.png" alt="Himlayan Heritage" />
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
                <div className="feature-icon"></div>
                <div>
                  <h4>Cultural Heritage</h4>
                  <p>Preserving Filipino history through art and memorials</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon"></div>
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
              All Services
            </button>
            <button 
              className={`filter-tab-landing ${activeServiceTab === 'burial' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('burial')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M5 8l7-5 7 5"/>
              </svg>
              Burial Options
            </button>
            <button 
              className={`filter-tab-landing ${activeServiceTab === 'cremation' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('cremation')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <rect x="8" y="8" width="8" height="8"/>
              </svg>
              Cremation
            </button>
            <button 
              className={`filter-tab-landing ${activeServiceTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveServiceTab('services')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
              Additional Services
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <section className="services-grid-landing">
          {filteredLandingServices.map((service) => (
            <div key={service.id} className={`service-card-landing ${service.popular ? 'popular' : ''}`}>
              {service.popular && <div className="popular-badge-landing">MOST POPULAR</div>}
              <div className="service-image-landing" style={{ backgroundImage: `url(${service.image})` }}>
                <div className="service-icon-landing">{service.icon}</div>
              </div>
              <div className="service-content-landing">
                <div className="service-header-landing">
                  <h3>{service.title}</h3>
                  <span className="service-subtitle-landing">{service.subtitle}</span>
                </div>
                <p className="service-description-landing">{service.description}</p>
                <ul className="service-features-landing">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="service-footer-landing">
                  <span className="service-price-landing">{service.price}</span>
                </div>
              </div>
            </div>
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
        
        <div className="gallery-grid">
          {landmarks.map((item, index) => (
            <div key={index} className={`gallery-item ${index === 0 ? 'gallery-large' : ''}`}>
              <img src={item.image} alt={item.title} />
              <div className="gallery-overlay">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
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
                <div className="contact-card-icon"></div>
                <div>
                  <h4>Location</h4>
                  <p>Himlayan Road, Barangay Pasong Tamo,<br/>Tandang Sora, Quezon City 1107</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon"></div>
                <div>
                  <h4>Phone</h4>
                  <p>0917-130-6930<br/>0968-896-4850<br/>0917-713-5034</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon"></div>
                <div>
                  <h4>Hours</h4>
                  <p>Monday - Sunday<br/>6:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-side">
            <form className="contact-form-new">
              <h3>Send us a Message</h3>
              <div className="form-row">
                <input type="text" placeholder="First Name" className="form-input" />
                <input type="text" placeholder="Last Name" className="form-input" />
              </div>
              <input type="email" placeholder="Email Address" className="form-input" />
              <input type="tel" placeholder="Phone Number" className="form-input" />
              <textarea placeholder="Your Message" rows="4" className="form-input"></textarea>
              <button type="submit" className="btn-contact-submit">Send Message</button>
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
              <div className="footer-social">
                <a href="#" className="social-link" title="Facebook">FB</a>
                <a href="#" className="social-link" title="YouTube">YT</a>
              </div>
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
