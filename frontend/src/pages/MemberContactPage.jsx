import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberHeader from '../components/common/MemberHeader';
import MemberFooter from '../components/common/MemberFooter';
import '../styles/MemberDashboard.css';

const MemberContactPage = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement actual submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ subject: '', message: '' });
  };

  return (
    <div className="member-dashboard">
      {/* Header */}
      <MemberHeader />

      {/* Main Content */}
      <main className="member-main">
        <section className="welcome-section">
          <h2>Contact Us</h2>
          <p>We are ready to help with your inquiries</p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          {/* Contact Information */}
          <section style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#1a472a', marginBottom: '25px' }}>Contact Information</h3>
            
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#1a472a', display: 'block', marginBottom: '5px' }}>Address</strong>
                  <p style={{ color: '#666', margin: 0, lineHeight: '1.6' }}>
                    240 Tandang Sora Avenue<br />
                    Barangay Culiat<br />
                    Quezon City, Metro Manila 1128
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#1a472a', display: 'block', marginBottom: '5px' }}>Telephone</strong>
                  <p style={{ color: '#666', margin: 0 }}>
                    <a href="tel:+6328921-6947" style={{ color: '#1a472a' }}>(02) 8921-6947</a><br />
                    <a href="tel:+6328453-4057" style={{ color: '#1a472a' }}>(02) 8453-4057</a>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#1a472a', display: 'block', marginBottom: '5px' }}>Email</strong>
                  <p style={{ color: '#666', margin: 0 }}>
                    <a href="mailto:info@himlayan.ph" style={{ color: '#1a472a' }}>info@himlayan.ph</a>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div>
                  <strong style={{ color: '#1a472a', display: 'block', marginBottom: '5px' }}>Office Hours</strong>
                  <p style={{ color: '#666', margin: 0 }}>
                    Monday - Sunday: 6:00 AM - 6:00 PM<br />
                    <em style={{ fontSize: '0.9rem' }}>Undas: 24 hours (Oct 31 - Nov 2)</em>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Call Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="tel:+6328921-6947" style={{
                background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Call Now
              </a>
              <a href="https://maps.google.com/?q=Himlayang+Pilipino+Memorial+Park+Quezon+City" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: '#f0f0f0',
                  color: '#1a472a',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                Open in Maps
              </a>
            </div>
          </section>

          {/* Contact Form */}
          <section style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ color: '#1a472a', marginBottom: '25px' }}>Send a Message</h3>
            
            {submitted ? (
              <div style={{
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                color: '#155724'
              }}>
                <strong>Your message has been sent!</strong>
                <p style={{ margin: '10px 0 0' }}>You will receive a response within 24-48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      color: '#666'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      color: '#666'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      background: 'white'
                    }}
                  >
                    <option value="">Select a subject...</option>
                    <option value="inquiry">General Inquiry</option>
                    <option value="reservation">Lot Reservation</option>
                    <option value="pricing">Pricing Information</option>
                    <option value="visitation">Visitation Assistance</option>
                    <option value="maintenance">Maintenance Concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Send Message
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Emergency Contact */}
        <section style={{
          background: '#fff3cd',
          borderRadius: '15px',
          padding: '25px',
          marginTop: '30px',
          borderLeft: '4px solid #ffc107'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>Emergency or Urgent Concern?</h3>
          <p style={{ color: '#856404', marginBottom: '15px' }}>
            For immediate assistance, call our hotline directly:
          </p>
          <a href="tel:+6328921-6947" style={{
            background: '#ffc107',
            color: '#856404',
            padding: '10px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            (02) 8921-6947
          </a>
        </section>
      </main>

      {/* Footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberContactPage;
