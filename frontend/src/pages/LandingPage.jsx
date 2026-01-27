import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [scrolled, setScrolled] = useState(false);

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
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn-nav-login">Login</Link>
            <Link to="/register" className="btn-nav-register">Get Started</Link>
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
      <section id="services" className="services-section">
        <div className="services-header">
          <span className="section-label">Our Services</span>
          <h2 className="section-title">Memorial <span>Products</span> & <span>Services</span></h2>
          <p>Comprehensive options designed to honor your loved ones with dignity</p>
        </div>
        
        <div className="services-grid-new">
          <div className="service-card-new service-featured" style={{backgroundImage: 'url(/Panooran-2.jpg)'}}>
            <div className="service-overlay"></div>
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Lawn Lots</h3>
              <p>Beautifully maintained burial plots set in serene garden landscapes</p>
            </div>
          </div>
          <div className="service-card-new">
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Columbaries</h3>
              <p>Elegant niches for urns in peaceful, well-kept structures</p>
            </div>
          </div>
          <div className="service-card-new">
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Mausoleums</h3>
              <p>Stately family crypts and private memorial structures</p>
            </div>
          </div>
          <div className="service-card-new service-featured" style={{backgroundImage: 'url(/heritage_HD.png)'}}>
            <div className="service-overlay"></div>
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Memorial Terraces</h3>
              <p>Customized memorial spaces with breathtaking scenic views</p>
            </div>
          </div>
          <div className="service-card-new">
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Bereavement Support</h3>
              <p>Compassionate support services for grieving families</p>
            </div>
          </div>
          <div className="service-card-new">
            <div className="service-content">
              <span className="service-icon-new"></span>
              <h3>Digital Memorial</h3>
              <p>QR-enabled grave profiles and online tributes</p>
            </div>
          </div>
        </div>
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
          <Link to="/register" className="btn-gallery-cta">Plan Your Visit</Link>
        </div>
      </section>

      {/* Parallax CTA Section */}
      <section className="parallax-cta" style={{backgroundImage: 'url(/Malakas-at-Maganda.jpg)'}}>
        <div className="parallax-overlay"></div>
        <div className="parallax-content">
          <h2>A Meaningful Final Resting Place</h2>
          <p>Serving Filipino families with compassion and dignity since 1971</p>
          <div className="parallax-buttons">
            <Link to="/register" className="btn-parallax-primary">Inquire Now</Link>
            <a href="#contact" className="btn-parallax-secondary">Contact Us</a>
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
