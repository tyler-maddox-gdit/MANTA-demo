import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header>
      {/* DEBT skip-link (best-practice tag) / skip-link-works (MANTA extended): the target id does not exist */}
      <a className="skip" href="#main-content">Skip to main content</a>
      <div className="gov-strip">Benefits Portal · demo — a demonstration site</div>
      <div className="site-header">
        <Link to="/" className="brand">
          <span className="seal" aria-hidden="true">B</span>
          <span><strong>Benefits Portal</strong><br /><small>demo</small></span>
        </Link>
        <nav aria-label="Primary">
          <Link to="/apply">Apply</Link>
          <Link to="/status">Check status</Link>
          <Link to="/signin">Sign in</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="social">
        {/* DEBT link-name: icon-only links with no accessible name */}
        <a href="https://example.com/benefits-x" id="social-x"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg></a>
        <a href="https://example.com/benefits-fb" id="social-fb"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg></a>
        <a href="https://example.com/benefits-yt" id="social-yt"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg></a>
      </div>
      <p className="fine">Benefits Portal · demo. A demonstration site. No real agency, no real data.</p>
      {/* DEBT color-contrast: 2.8:1 muted text */}
      <p className="muted" id="last-updated">Last updated October 3, 2026</p>
    </footer>
  );
}

export default function Shell({ children }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
