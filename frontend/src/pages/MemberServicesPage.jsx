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
    product_type: '',
    product_radio: '',
    product_price: '',
    body_weight: '',
    body_height: '',
    body_width: ''
  });

  // Services that require body dimensions
  const requiresBodyDimensions = (title) => [
    'Internment', 'Cremation', 'Pugad Lawin Columbary', 'Dambana ng Alaala', 'Memorials'
  ].includes(title);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contactError, setContactError] = useState('');
  const [productTypeError, setProductTypeError] = useState('');
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
    setRequestForm({ description: '', preferred_date: '', product_type: '', product_radio: '', product_price: '', body_weight: '', body_height: '', body_width: '' });
    setProductTypeError('');
    setSubmitSuccess(false);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    // Product-specific validation
    if (selectedService?.category === 'products') {
      if (!requestForm.product_type) {
        setProductTypeError('Please select a type.');
        return;
      }
      const opts = productTypes[selectedService.title] || [];
      const found = opts.find(o => o.label === requestForm.product_type);
      if (found?.subOptions && !requestForm.product_radio) {
        setProductTypeError('Please select an option for this type.');
        return;
      }
    }

    // Validate body dimensions if required
    if (requiresBodyDimensions(selectedService?.title)) {
      if (!requestForm.body_weight || parseFloat(requestForm.body_weight) <= 0) {
        alert('Body weight is required and must be greater than 0.');
        return;
      }
      if (!requestForm.body_height || parseFloat(requestForm.body_height) <= 0) {
        alert('Body height is required and must be greater than 0.');
        return;
      }
      if (!requestForm.body_width || parseFloat(requestForm.body_width) <= 0) {
        alert('Body width is required and must be greater than 0.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const isProduct = selectedService.category === 'products';
      const productTypeLabel = isProduct
        ? requestForm.product_type + (requestForm.product_radio ? ` \u2013 ${requestForm.product_radio}` : '')
        : undefined;
      // For product requests, send a date 2 days from now (local timezone) so the
      // backend "after:today" rule always passes regardless of which server version is live.
      let preferredDateValue = requestForm.preferred_date;
      if (isProduct) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        const pad = n => String(n).padStart(2, '0');
        preferredDateValue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
      await api.post('/service-requests', {
        service_type: selectedService.title.toLowerCase().replace(/\s+/g, '_'),
        description: requestForm.description,
        preferred_date: preferredDateValue,
        ...(isProduct ? { product_type: productTypeLabel, price_range: requestForm.product_price } : {}),
        ...(requiresBodyDimensions(selectedService.title) ? {
          body_weight: parseFloat(requestForm.body_weight),
          body_height: parseFloat(requestForm.body_height),
          body_width: parseFloat(requestForm.body_width)
        } : {})
      });
      setSubmitSuccess(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const productTypes = {
    'Pugad Lawin Columbary': [
      { label: 'Ash Crypt (4 urns)', price: '\u20b170,000 \u2013 \u20b1105,000', subOptions: null }
    ],
    'Dambana ng Alaala': [
      {
        label: 'Ash Crypt (6 urns)',
        price: null,
        subOptions: [
          { label: 'Premium Exterior', price: '\u20b1135,000 \u2013 \u20b1185,000' },
          { label: 'Premium Interior', price: '\u20b1125,000 \u2013 \u20b1175,000' }
        ]
      },
      {
        label: 'Bone Crypt (Single)',
        price: null,
        subOptions: [
          { label: 'Premium Exterior', price: '\u20b170,000 \u2013 \u20b185,000' },
          { label: 'Premium Interior', price: '\u20b170,000 \u2013 \u20b185,000' }
        ]
      },
      {
        label: 'Bone Crypt (Multiple) \u2013 Premium',
        price: '\u20b1165,000 \u2013 \u20b1175,000',
        subOptions: null
      }
    ],
    'Lawn Lots': [
      { label: 'Lawn Lot', price: '\u20b1355,000 \u2013 \u20b1424,760', subOptions: null }
    ],
    'Memorials': [
      { label: '4-Lot Inventory', price: '\u20b11,200,000 \u2013 \u20b12,250,000', subOptions: null },
      { label: '8-Lot Inventory', price: '\u20b12,400,000', subOptions: null }
    ],
    'Family Estates': [
      { label: '8-Lots Premium', price: '\u20b13,200,000', subOptions: null },
      { label: '16-Lot Inventory', price: '\u20b16,400,000', subOptions: null },
      { label: '24-Lot Inventory', price: '\u20b19,600,000', subOptions: null },
      { label: '27-Lot Inventory', price: '\u20b110,800,000', subOptions: null }
    ],
    'Terraces': [
      { label: 'Terrace', price: '\u20b18,000,000 \u2013 \u20b128,000,000', subOptions: null }
    ]
  };

  const services = [
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
      features: ['Full-sized casket ready', 'Urns & bone remains', 'Secure & serene', 'Cost-effective'],
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
      features: ['Full-sized casket ready', 'Urns & bone remains', 'Secure & serene', 'Cost-effective'],
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
      features: ['By trees or pathwalks', 'Tranquil environment', 'Perpetual care included', 'Well-maintained landscaping'],
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
      features: ['Above-ground niches', 'Highest capacity per area', '9sqm to 30sqm', 'Manicured garden setting'],
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
      features: ['Private mausoleum', 'Washroom & pantry provision', '40sqm to 100sqm', 'Custom layouts'],
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
      features: ['80sqm to 250sqm', 'Custom design allowed', 'Largest premium lots', 'Tailored for comfort'],
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
      features: [],
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
      features: [],
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
      features: [],
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
      features: [],
      price: 'Contact for pricing',
      popular: true,
      image: '/hp-packages.jpg'
    }
  ];

  const faqs = [
    {
      id: 1,
      question: 'Do you still offer plans?',
      answer: 'No, Himlayang Pilipino Plans, a subsidiary of Himlayang Pilipino, Inc. is currently only servicing our existing plan holders. We are not offering any new plans.u may contact our sales agents or call us at (02) 8928-7857 or (02) 8927-9671 to 75 loc 204 to inquire on the price of our memorial lots/crypts.'
    },
    {
      id: 2,
      question: 'Where is Himlayang Pilipino Memorial Park located?',
      answer: 'Himlayang Pilipino Memorial Park is located at Himlayan Rd., Brgy. Pasong Tamo, Quezon City. Meanwhile, our Head Office is located at Triumph Building, 1610 Quezon Avenue, Brgy. South Triangle, Quezon City.'
    },
    {
      id: 3,
      question: 'Are you open for visits?',
      answer: 'Yes, Himlayang Pilipino Memorial Park is open to visitors daily, from 7am to 5pm.'
    },
    {
      id: 4,
      question: 'Are there still available lots and crypts?',
      answer: 'Yes, there are various lots and crypts available as we continuously expand our inventory to accommodate our clients\' needs.'
    },
    {
      id: 5,
      question: 'What are the requirements for buying a lot/crypt?',
      answer: 'The purchaser needs to be of legal age and can fill-up and sign the contract on Philippine soil. You may reach out to our sales agents, who are stationed at the park and at the head office to assist you.'
    },
    {
      id: 6,
      question: 'Can we sell our lot?',
      answer: 'You may choose to sell your lots personally or through our Paki-Benta service wherein we will sell clients\' lots/crypts as part of our inventory. Kindly coordinate with the SRDP at (02)8927-9671 to 75 loc 242 for the requirements in transferring ownership.'
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
              All
            </button>
            <button 
              className={`filter-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Products
            </button>
            <button 
              className={`filter-tab ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
              Services
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
                        {request.preferred_date && !request.product_type && (
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
                      {(request.body_weight || request.body_height || request.body_width) && (
                        <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <strong>Body Dimensions:</strong>{' '}
                          {request.body_weight && <span>Weight: {request.body_weight} kg</span>}
                          {request.body_weight && request.body_height && <span> &middot; </span>}
                          {request.body_height && <span>Height: {request.body_height} cm</span>}
                          {(request.body_weight || request.body_height) && request.body_width && <span> &middot; </span>}
                          {request.body_width && <span>Width: {request.body_width} cm</span>}
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
            <div key={service.id} className="service-card">
              <div className="service-image" style={{ backgroundImage: `url(${service.image})` }}>
              </div>
              <div className="service-content">
                <div className="service-header">
                  <h3>{service.title}</h3>
                  <span className="service-subtitle">{service.subtitle}</span>
                </div>
                <p className="service-description">{service.description}</p>
                <div className="service-footer">
                  <span className="service-price">{service.price}</span>
                  <button className="inquire-btn" onClick={() => openRequestModal(service)}>
                    {service.category === 'products' ? 'Request Product' : 'Request Service'}
                  </button>
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
                <h2>{selectedService?.category === 'products' ? 'Request Product' : 'Request'}: {selectedService?.title}</h2>
                <p className="modal-subtitle">{selectedService?.subtitle}</p>

                <form onSubmit={handleSubmitRequest}>
                  {selectedService?.category === 'products' ? (
                    /* ── PRODUCT FORM ── */
                    <>
                      <div className="form-group">
                        <label>Type <span className="required-star">*</span></label>
                        <select
                          className={`form-control${productTypeError ? ' error' : ''}`}
                          value={requestForm.product_type}
                          onChange={(e) => {
                            const label = e.target.value;
                            const opts = productTypes[selectedService.title] || [];
                            const found = opts.find(o => o.label === label);
                            const directPrice = found && !found.subOptions ? found.price : '';
                            setRequestForm({ ...requestForm, product_type: label, product_radio: '', product_price: directPrice });
                            setProductTypeError('');
                          }}
                        >
                          <option value="">Select a type…</option>
                          {(productTypes[selectedService.title] || []).map(opt => (
                            <option key={opt.label} value={opt.label}>{opt.label}</option>
                          ))}
                        </select>
                        {productTypeError && (
                          <small style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{productTypeError}</small>
                        )}
                        {(() => {
                          const opts = productTypes[selectedService.title] || [];
                          const sel = opts.find(o => o.label === requestForm.product_type);
                          if (!sel || !sel.subOptions) return null;
                          return (
                            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              {sel.subOptions.map(sub => (
                                <label key={sub.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', cursor: 'pointer', fontSize: '0.875rem', color: '#374151', userSelect: 'none' }}>
                                  <input
                                    type="radio"
                                    name="product_radio"
                                    value={sub.label}
                                    checked={requestForm.product_radio === sub.label}
                                    onChange={() => setRequestForm({ ...requestForm, product_radio: sub.label, product_price: sub.price })}
                                    style={{ width: '16px', height: '16px', margin: '0', flexShrink: 0, cursor: 'pointer', accentColor: '#1a472a' }}
                                  />
                                  <span>{sub.label}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })()}
                        {requestForm.product_price && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                            Price Range: {requestForm.product_price}
                          </div>
                        )}
                      </div>
                      {requiresBodyDimensions(selectedService?.title) && (
                        <>
                          <div className="form-group">
                            <label>Body Weight (kg) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_weight}
                              onChange={(e) => setRequestForm({...requestForm, body_weight: e.target.value})}
                              placeholder="e.g. 65"
                              min="1"
                              max="500"
                              step="0.1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Body Height (cm) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_height}
                              onChange={(e) => setRequestForm({...requestForm, body_height: e.target.value})}
                              placeholder="e.g. 170"
                              min="1"
                              max="300"
                              step="0.1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Body Width (cm) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_width}
                              onChange={(e) => setRequestForm({...requestForm, body_width: e.target.value})}
                              placeholder="e.g. 50"
                              min="1"
                              max="200"
                              step="0.1"
                              required
                            />
                          </div>
                        </>
                      )}
                      <div className="form-group">
                        <label>Additional Details</label>
                        <textarea
                          rows="4"
                          value={requestForm.description}
                          onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                          placeholder="Tell us more about your requirements..."
                        />
                      </div>
                    </>
                  ) : (
                    /* ── SERVICE FORM ── */
                    <>
                      <div className="form-group">
                        <label>Preferred Date <span className="required-star">*</span></label>
                        <input
                          type="date"
                          value={requestForm.preferred_date}
                          onChange={(e) => { e.target.setCustomValidity(''); setRequestForm({...requestForm, preferred_date: e.target.value}); }}
                          onInvalid={(e) => {
                            if (e.target.validity.rangeOverflow) {
                              const [y, m, d] = e.target.max.split('-');
                              e.target.setCustomValidity(`Please select a date on or before ${m}/${d}/${y}`);
                            } else {
                              e.target.setCustomValidity('');
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      {requiresBodyDimensions(selectedService?.title) && (
                        <>
                          <div className="form-group">
                            <label>Body Weight (kg) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_weight}
                              onChange={(e) => setRequestForm({...requestForm, body_weight: e.target.value})}
                              placeholder="e.g. 65"
                              min="1"
                              max="500"
                              step="0.1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Body Height (cm) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_height}
                              onChange={(e) => setRequestForm({...requestForm, body_height: e.target.value})}
                              placeholder="e.g. 170"
                              min="1"
                              max="300"
                              step="0.1"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Body Width (cm) <span className="required-star">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={requestForm.body_width}
                              onChange={(e) => setRequestForm({...requestForm, body_width: e.target.value})}
                              placeholder="e.g. 50"
                              min="1"
                              max="200"
                              step="0.1"
                              required
                            />
                          </div>
                        </>
                      )}
                      <div className="form-group">
                        <label>Additional Details</label>
                        <textarea
                          rows="4"
                          value={requestForm.description}
                          onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                          placeholder="Tell us more about your requirements..."
                        />
                      </div>
                    </>
                  )}
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
