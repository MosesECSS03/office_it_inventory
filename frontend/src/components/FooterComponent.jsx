import React from 'react';
import '../css/FooterComponent.css';

const FooterComponent = () => {
  return (
    <footer className="footer-component">
      <div className="footer-content">
        <div className="footer-copyright">
          <p>&copy; 2025 En Community Service Society.</p>
          <p>All rights reserved.</p>
        </div>
        {/*<div className="footer-links">
          <span className="footer-link">Privacy Policy</span>
          <span className="footer-divider">|</span>
          <span className="footer-link">Terms of Service</span>
        </div>*/}
      </div>
    </footer>
  );
};

export default FooterComponent;
