import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
    Resources: ['Documentation', 'API Reference', 'Guides', 'Support'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div>
            <Link to="/" className="footer-brand">
              <span className="brand-mark">BL</span>
              <span className="footer-brand-text">BacheLORE</span>
            </Link>
            <p style={{ color: 'var(--fg-muted)', marginBottom: 16, maxWidth: 280, lineHeight: 1.7 }}>
              The complete platform for managing bachelor life. Built with care for students and young professionals.
            </p>
            <div className="status-badge">
              <span className="status-dot" />
              <span>All systems operational</span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div className="footer-column" key={title}>
              <h6>{title}</h6>
              <ul className="footer-links">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" onClick={(e) => { e.preventDefault(); }}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © {currentYear} BacheLORE. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)', fontSize: '0.875rem' }}>
            <span>Made with</span>
            <i className="bi bi-heart-fill" style={{ color: 'var(--danger)', fontSize: 12 }} />
            <span>for the Lore</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
