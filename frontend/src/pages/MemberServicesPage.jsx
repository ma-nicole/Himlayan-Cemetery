import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import api from '../services/api';
import '../styles/MemberServices.css';

const MemberServicesPage = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestForm, setRequestForm] = useState({
    description: '',
    preferred_date: '',
    contact_number: '',
    country_code: '+63'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contactError, setContactError] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsMeta, setRequestsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Digit length rules per country code: [min, max] — local subscriber digits only (no country code prefix)
  // Sources: ITU-T E.164 national numbering plans
  const phoneRules = {
    '+63': [10, 10],  // PH: always 10 (e.g. 9171234567)
    '+1':  [10, 10],  // US/CA: always 10 (NXX-NXX-XXXX)
    '+44': [10, 10],  // UK: always 10 after dropping leading 0 (e.g. 7911123456)
    '+81': [10, 11],  // JP: landline 10, mobile 11 (090/080/070 + 8 = 11)
    '+82': [9,  10],  // KR: Seoul landline 9, mobile 10 (010-XXXX-XXXX)
    '+86': [11, 11],  // CN: mobile always 11 (1XX-XXXX-XXXX)
    '+65': [8,   8],  // SG: always 8
    '+60': [9,  10],  // MY: landline 9, mobile 10 (01X-XXXXXXXX)
    '+61': [9,   9],  // AU: always 9 (04XX-XXX-XXX or 02-XXXX-XXXX)
    '+971':[8,   9],  // UAE: landline 8 (04-XXX-XXXX), mobile 9 (05X-XXX-XXXX)
    '+966':[8,   9],  // SA: landline 8, mobile 9 (05X-XXX-XXXX)
    '+39': [9,  10],  // IT: landline ~9, mobile 10 (3XX-XXX-XXXX)
    '+49': [10, 11],  // DE: mobile 10-11
    '+33': [9,   9],  // FR: always 9 (6X/7X/1X-XXXXXXXX)
    '+34': [9,   9],  // ES: always 9
  };

  const phoneHints = {
    '+63':  'exactly 10 digits (e.g. 9171234567)',
    '+1':   'exactly 10 digits (e.g. 2025550199)',
    '+44':  'exactly 10 digits (e.g. 7911123456)',
    '+81':  '10–11 digits (landline 10, mobile 11)',
    '+82':  '9–10 digits (mobile: 10, e.g. 0101234567)',
    '+86':  'exactly 11 digits (e.g. 13912345678)',
    '+65':  'exactly 8 digits (e.g. 81234567)',
    '+60':  '9–10 digits (mobile: 10, e.g. 0112345678)',
    '+61':  'exactly 9 digits (e.g. 412345678)',
    '+971': '8–9 digits (landline 8, mobile 9)',
    '+966': '8–9 digits (landline 8, mobile 9)',
    '+39':  '9–10 digits (mobile: 10, e.g. 3201234567)',
    '+49':  '10–11 digits',
    '+33':  'exactly 9 digits (e.g. 612345678)',
    '+34':  'exactly 9 digits (e.g. 612345678)',
  };

  const handleContactChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const rule = phoneRules[requestForm.country_code] || [6, 15];
    if (digitsOnly.length <= rule[1]) {
      setRequestForm({ ...requestForm, contact_number: digitsOnly });
      setContactError('');
    }
  };

  useEffect(() => {
    // Check URL params to switch to my-requests tab
    const tab = searchParams.get('tab');
    if (tab === 'my-requests') {
      setActiveTab('my-requests');
      loadMyRequests();
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'my-requests') {
      loadMyRequests(1, filterStatus, sortOrder);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'my-requests') {
      loadMyRequests(1, filterStatus, sortOrder);
    }
  }, [filterStatus, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyRequests = async (page = 1, status = filterStatus, sort = sortOrder) => {
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams({ per_page: 5, page });
      if (status) params.append('status', status);
      params.append('sort', sort === 'oldest' ? 'asc' : 'desc');
      const response = await api.get(`/service-requests?${params}`);
      if (response.data.success) {
        setMyRequests(response.data.data || []);
        setRequestsMeta(response.data.meta || { current_page: 1, last_page: 1, total: 0 });
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load service requests:', error);
      setMyRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this service request? This cannot be undone.')) return;
    try {
      await api.patch(`/service-requests/${id}/cancel`);
      loadMyRequests(currentPage, filterStatus, sortOrder);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const openRequestModal = (service) => {
    setSelectedService(service);
    setRequestForm({ description: '', preferred_date: '', contact_number: '', country_code: '+63' });
    setContactError('');
    setSubmitSuccess(false);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    // Validate contact number digit length (required)
    const rule = phoneRules[requestForm.country_code] || [6, 15];
    const len = requestForm.contact_number.length;
    if (len === 0) {
      setContactError('Contact number is required.');
      return;
    }
    if (len < rule[0] || len > rule[1]) {
      const msg = rule[0] === rule[1]
        ? `Contact number must be exactly ${rule[0]} digits for ${requestForm.country_code}`
        : `Contact number must be ${rule[0]}–${rule[1]} digits for ${requestForm.country_code}`;
      setContactError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const fullContactNumber = requestForm.contact_number 
        ? `${requestForm.country_code} ${requestForm.contact_number}` 
        : '';
      await api.post('/service-requests', {
        service_type: selectedService.title.toLowerCase().replace(/\s+/g, '_'),
        description: requestForm.description,
        preferred_date: requestForm.preferred_date,
        contact_number: fullContactNumber
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
      image: '/himlayanheritage.jpg'
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
            <button 
              className={`filter-tab ${activeTab === 'my-requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-requests')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              My Requests
            </button>
          </div>
        </div>

        {/* My Requests Section */}
        {activeTab === 'my-requests' ? (
          <section className="my-requests-section">
            <div className="requests-header">
              <h2>My Service Requests</h2>
              <p>Track the status of your service requests</p>
            </div>

            {/* Filter + Sort controls */}
            <div className="requests-controls">
              <div className="rc-group">
                <label htmlFor="rc-status">Status</label>
                <select id="rc-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="rc-group">
                <label htmlFor="rc-sort">Sort</label>
                <select id="rc-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              {(filterStatus || sortOrder !== 'newest') && (
                <button className="rc-clear" onClick={() => { setFilterStatus(''); setSortOrder('newest'); }}>Clear</button>
              )}
              {!requestsLoading && (
                <span className="rc-count">{requestsMeta.total} request{requestsMeta.total !== 1 ? 's' : ''}</span>
              )}
            </div>

            {requestsLoading ? (
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Loading your requests...</p>
              </div>
            ) : myRequests.length === 0 && !filterStatus ? (
              <div className="no-requests">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3>No Service Requests</h3>
                <p>You haven't submitted any service requests yet.</p>
                <button className="btn-browse" onClick={() => setActiveTab('all')}>
                  Browse Services
                </button>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="no-requests">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3>No Matching Requests</h3>
                <p>No requests found for the selected filter.</p>
                <button className="btn-browse" onClick={() => setFilterStatus('')}>Clear Filter</button>
              </div>
            ) : (
              <>
              <div className="requests-list">
                {myRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div className="request-type">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span>{request.service_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </div>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="request-body">
                      {request.description && (
                        <p className="request-description">{request.description}</p>
                      )}
                      <div className="request-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Submitted: {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.preferred_date && (
                          <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Preferred: {new Date(request.preferred_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {request.admin_notes && (
                        <div className="admin-notes">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </div>
                      )}
                      {request.status === 'approved' && request.service_fee_amount > 0 && (
                        <div className="admin-notes" style={{ marginTop: '10px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', padding: '10px' }}>
                          <strong>💳 Service Fee:</strong> ₱{parseFloat(request.service_fee_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          <span style={{ display: 'block', fontSize: '0.82rem', color: '#78716c', marginTop: '4px' }}>
                            A payment due has been added to your <a href="/pay-dues" style={{ color: '#15803d', fontWeight: 600 }}>Pay Dues</a> page.
                          </span>
                        </div>
                      )}
                      {['pending', 'approved'].includes(request.status) && (() => {
                        // Pending (not yet approved) → always allow cancellation
                        if (request.status === 'pending') return true;
                        // Approved: only allow cancel when the service fee is truly unpaid
                        const p = request.service_fee_payment;
                        if (!p) return false; // can't determine status safely → hide
                        if (p.status === 'verified' || p.status === 'rejected') return false;
                        if (p.paid_at) return false; // waiting for verification
                        if (p.verification_decision === 'under_investigation') return false; // under review
                        return true; // genuinely unpaid
                      })() && (
                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {requestsMeta.last_page > 1 && (
                <div className="pagination" style={{ marginTop: '20px' }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => loadMyRequests(currentPage - 1, filterStatus, sortOrder)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {requestsMeta.last_page}</span>
                  <button
                    disabled={currentPage >= requestsMeta.last_page}
                    onClick={() => loadMyRequests(currentPage + 1, filterStatus, sortOrder)}
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            )}
          </section>
        ) : (
        <>
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
        </>
        )}
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
                    <label>Preferred Date <span className="required-star">*</span></label>
                    <input
                      type="date"
                      value={requestForm.preferred_date}
                      onChange={(e) => setRequestForm({...requestForm, preferred_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number <span className="required-star">*</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <select 
                        className="form-control"
                        value={requestForm.country_code}
                        onChange={(e) => {
                          setRequestForm({...requestForm, country_code: e.target.value, contact_number: ''});
                          setContactError('');
                        }}
                        style={{ flex: '0 0 100px' }}
                      >
                        <option value="+63">🇵🇭 +63</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+82">🇰🇷 +82</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <div style={{ flex: '1' }}>
                        <input
                          type="tel"
                          className={`form-control${contactError ? ' error' : ''}`}
                          value={requestForm.contact_number}
                          onChange={handleContactChange}
                          placeholder={`digits only`}
                          inputMode="numeric"
                        />
                        {contactError ? (
                          <small style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                            {contactError}
                          </small>
                        ) : (
                          <small style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                            {phoneHints[requestForm.country_code] || '6–15 digits'}
                          </small>
                        )}
                      </div>
                    </div>
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
