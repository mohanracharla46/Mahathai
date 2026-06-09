import React from 'react';
import { Phone, MapPin, Globe } from 'lucide-react';
import logoImg from '../assets/mahathailogo_v2.png';

export default function Footer() {
  return (
    <footer className="footer-luxury">

      {/* Elegant Diamond Divider */}
      <div className="footer-divider-wrapper">
        <div className="container">
          <div className="footer-divider">
            <div className="divider-line" />
            <div className="divider-diamond" />
            <div className="divider-line" />
          </div>
        </div>
      </div> 

      {/* 2. Main Footer Grid */}
      <div className="footer-main-content">
        <div className="container">
          <div className="footer-grid">

            {/* Column 1: Brand & Philosophy */}
            <div className="footer-col brand-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="footer-brand" style={{ marginBottom: '1rem' }}>
                <img
                  src={logoImg}
                  alt="Maha Thai Logo"
                  style={{ height: '55px', width: 'auto', display: 'block' }}
                />
              </div>
              <p className="brand-desc" style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: 300 }}>
                The pinnacle of Thai heritage, reimagined for the modern epicurean.
              </p>
              <div className="social-links" style={{ display: 'flex', gap: '0.75rem' }}>
                <a href="#" aria-label="Website" className="social-icon">
                  <Globe size={16} />
                </a>
                <a href="#" aria-label="Instagram" className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a href="#" aria-label="Facebook" className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Visit Us */}
            <div className="footer-col contact-col">
              <h4 className="footer-col-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>VISIT US</h4>
              <div className="contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
                  12 Heritage Court,<br />
                  Sukhumvit, Bangkok 10110
                </p>
                <p style={{ margin: 0, fontWeight: 300 }}>Tel: +66 2 888 7890</p>
                <p style={{ margin: 0, fontWeight: 300 }}>Email: dining@mahathai.com</p>
              </div>
            </div>

            {/* Column 3: Hours */}
            <div className="footer-col hours-col">
              <h4 className="footer-col-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>HOURS</h4>
              <div className="hours-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>Lunch:</span>
                  <span style={{ fontWeight: 300 }}>Mon – Fri, 11:00 AM – 2:00 PM</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>Dinner:</span>
                  <span style={{ fontWeight: 300 }}>Mon – Sun, 18:00 – 22:30</span>
                </div>
              </div>
            </div>

            {/* Column 4: Quick Links */}
            <div className="footer-col nav-col">
              <h4 className="footer-col-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>QUICK LINKS</h4>
              <ul className="footer-nav-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
                <li>
                  <a href="#home" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>The Maha Collective</a>
                </li>
                <li>
                  <a href="#/events" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>Private Dining & Events</a>
                </li>
                <li>
                  <a href="#/rewards" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>Rewards</a>
                </li>
                <li>
                  <a href="#/catering" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>Catering Services</a>
                </li>
                <li>
                  <a href="#/careers" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>Careers</a>
                </li>
                <li>
                  <a href="#" className="footer-nav-link" style={{ fontSize: '0.85rem', fontWeight: 300 }}>Privacy Policy</a>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Footer Bottom */}
      <div className="footer-bottom" style={{ borderTop: '1px solid var(--border-light)', padding: '2rem 0' }}>
        <div className="container">
          <div className="footer-bottom-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span className="copyright-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              © 2026 Maha Thai. Crafted with Heritage.
            </span>
            <div className="footer-policies" style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" className="policy-link" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
              <span className="policy-divider" style={{ color: 'var(--border-light)' }}>/</span>
              <a href="#" className="policy-link" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
