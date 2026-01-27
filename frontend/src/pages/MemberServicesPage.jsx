import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import api from '../services/api';
import '../styles/MemberServices.css';

const MemberServicesPage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestForm, setRequestForm] = useState({
    description: '',
    preferred_date: '',
    contact_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const openRequestModal = (service) => {
    setSelectedService(service);
    setRequestForm({ description: '', preferred_date: '', contact_number: '' });
    setSubmitSuccess(false);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/service-requests', {
        service_type: selectedService.title.toLowerCase().replace(/\s+/g, '_'),
        ...requestForm
      });
      setSubmitSuccess(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const services = [
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

  const faqs = [
    {
      id: 1,
      question: 'How do I reserve a lot?',
      answer: 'Visit our office or call (02) 8921-6947. You\'ll need a valid ID and initial payment (usually 20% down payment). You can also inquire online and we\'ll call you back.'
    },
    {
      id: 2,
      question: 'Do you have installment payment plans?',
      answer: 'Yes, we have flexible payment plans up to 5 years to pay. You can pay monthly, quarterly, or yearly. Zero interest on 1-year payment plans.'
    },
    {
      id: 3,
      question: 'What is included in perpetual care?',
      answer: 'It includes regular maintenance of lawn and landscaping, 24/7 security, upkeep of roads and pathways, and general beautification of the memorial park. This is lifetime with no additional fees.'
    },
    {
      id: 4,
      question: 'Can I visit anytime?',
      answer: 'The park is open daily from 6:00 AM to 6:00 PM. During All Saints Day (Oct 31 - Nov 2), we are open 24 hours. Security and staff are always on duty.'
    },
    {
      id: 5,
      question: 'Is the lot transferable?',
      answer: 'Yes, lot ownership can be transferred to immediate family members. There is only a minimal processing fee. Coordinate with our office for requirements.'
    },
    {
      id: 6,
      question: 'Are there discounts for senior citizens?',
      answer: 'Yes, there is a 5% discount for senior citizens and PWDs. There are also special rates for group purchases and referral discounts.'
    }
  ];

  const filteredServices = activeTab === 'all' 
    ? services 
    : services.filter(s => s.category === activeTab);

  return (
    <div className="services-page">
      {/* Header */}
      <MemberHeader />

      {/* Hero Section */}
      <section className="services-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">Himlayang Pilipino Memorial Park</span>
          <h1>Our Services</h1>
          <p>We provide quality memorial services for your loved ones. Choose the right service for your family.</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="services-main">
        {/* Filter Tabs */}
        <div className="filter-section">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              All Services
            </button>
            <button 
              className={`filter-tab ${activeTab === 'burial' ? 'active' : ''}`}
              onClick={() => setActiveTab('burial')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M5 8l7-5 7 5"/>
              </svg>
              Burial Options
            </button>
            <button 
              className={`filter-tab ${activeTab === 'cremation' ? 'active' : ''}`}
              onClick={() => setActiveTab('cremation')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <rect x="8" y="8" width="8" height="8"/>
              </svg>
              Cremation
            </button>
            <button 
              className={`filter-tab ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
              Additional Services
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <section className="services-grid">
          {filteredServices.map((service) => (
            <div key={service.id} className={`service-card ${service.popular ? 'popular' : ''}`}>
              {service.popular && <div className="popular-badge">Most Popular</div>}
              <div className="service-image" style={{ backgroundImage: `url(${service.image})` }}>
                <div className="service-icon">{service.icon}</div>
              </div>
              <div className="service-content">
                <div className="service-header">
                  <h3>{service.title}</h3>
                  <span className="service-subtitle">{service.subtitle}</span>
                </div>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="service-footer">
                  <span className="service-price">{service.price}</span>
                  <button className="inquire-btn" onClick={() => openRequestModal(service)}>Request Service</button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <div className="cta-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div className="cta-text">
              <h2>Need Help Choosing?</h2>
              <p>Our friendly staff is ready to help you. Talk to our memorial consultants for personalized recommendations.</p>
            </div>
            <div className="cta-buttons">
              <a href="tel:+6328921-6947" className="cta-btn primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                (02) 8921-6947
              </a>
              <Link to="/member/contact" className="cta-btn secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Inquiry
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="faq-header">
            <span className="faq-badge">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Here are answers to common questions about our services</p>
          </div>
          
          <div className="faq-grid">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <div className="faq-toggle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="trust-section">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>50+ Years</h4>
              <p>Trusted since 1971</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h4>10,000+ Families</h4>
              <p>Served with care</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <h4>37 Hectares</h4>
              <p>Premium memorial park</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>24/7 Security</h4>
              <p>Always protected</p>
            </div>
          </div>
        </section>
      </main>

      {/* Service Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRequestModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            {submitSuccess ? (
              <div className="success-message">
                <div className="success-icon">Success</div>
                <h2>Request Submitted!</h2>
                <p>Thank you for your interest in <strong>{selectedService?.title}</strong>.</p>
                <p>Our team will contact you within 24-48 hours.</p>
                <button className="btn-primary" onClick={() => setShowRequestModal(false)}>Close</button>
              </div>
            ) : (
              <>
                <h2>Request: {selectedService?.title}</h2>
                <p className="modal-subtitle">{selectedService?.subtitle}</p>
                
                <form onSubmit={handleSubmitRequest}>
                  <div className="form-group">
                    <label>Preferred Date (Optional)</label>
                    <input
                      type="date"
                      value={requestForm.preferred_date}
                      onChange={(e) => setRequestForm({...requestForm, preferred_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      value={requestForm.contact_number}
                      onChange={(e) => setRequestForm({...requestForm, contact_number: e.target.value})}
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>Additional Details</label>
                    <textarea
                      rows="4"
                      value={requestForm.description}
                      onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                      placeholder="Tell us more about your requirements..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowRequestModal(false)}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberServicesPage;
