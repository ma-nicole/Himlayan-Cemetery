import React from 'react';
import { Link } from 'react-router-dom';
import './MemberFooter.css';

const MemberFooter = () => {
  return (
    <footer className="member-footer">
      <div className="member-footer-container">
        <p>© 2025 Himlayang Pilipino Memorial Park. All Rights Reserved.</p>
        <div className="member-footer-links">
          <span className="footer-link-text">Privacy Policy</span>
          <span className="footer-link-text">Terms</span>
          <Link to="/member/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default MemberFooter;
