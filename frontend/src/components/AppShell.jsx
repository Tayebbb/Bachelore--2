import React, { useMemo, useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

const links = [
  { to: '/home', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { to: '/tuition', label: 'Tuition', icon: 'bi-journal-text' },
  { to: '/maids', label: 'Maid Services', icon: 'bi-house-gear' },
  { to: '/roommates', label: 'Roommates', icon: 'bi-people' },
  { to: '/houserent', label: 'House Rent', icon: 'bi-building' },
  { to: '/marketplace', label: 'Marketplace', icon: 'bi-bag-check' },
  { to: '/subscription', label: 'Payments', icon: 'bi-credit-card' },
  { to: '/admin-dashboard', label: 'Admin', icon: 'bi-shield-check' },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Respect system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const pageTitle = useMemo(() => {
    const match = links.find((item) => item.to === location.pathname);
    return match ? match.label : 'BacheLORE';
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isAdminDashboard = location.pathname === '/admin-dashboard';
  const showPageHeader = !isAdminDashboard;

  useEffect(() => {
    if (!isAdminDashboard) {
      setCreateMenuOpen(false);
      return;
    }

    const params = new URLSearchParams(location.search);
    setCreateMenuOpen(params.get('openCreate') === '1');
  }, [isAdminDashboard, location.search]);

  const handleCreateNew = () => {
    if (isAdminDashboard) {
      setCreateMenuOpen((prev) => !prev);
      return;
    }

    navigate('/admin-dashboard?openCreate=1');
  };

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--fg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          },
        }}
      />

      {/* Modern Glassmorphism Navigation */}
      <nav className={`top-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-inner">
            {/* Brand */}
            <Link to="/" className="nav-brand">
              <span className="brand-mark">BL</span>
              <span>BacheLORE</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="nav-links d-none d-lg-flex">
              {links.slice(0, 5).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right Actions */}
            <div className="nav-actions">
              {/* Search Input - Desktop */}
              <div className="d-none d-md-flex align-items-center gap-2">
                <div className="position-relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="app-input"
                    style={{
                      minWidth: 220,
                      paddingLeft: 40,
                      background: 'var(--bg-elevated)',
                      border: 'none',
                    }}
                  />
                  <i
                    className="bi bi-search"
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--fg-muted)',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                type="button"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <i
                  className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun-fill'}`}
                  style={{
                    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </button>

              {/* Notifications */}
              <button
                className="theme-toggle position-relative"
                onClick={() => toast('3 new notifications')}
                type="button"
                aria-label="Notifications"
              >
                <i className="bi bi-bell" />
                <span
                  className="position-absolute"
                  style={{
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className="theme-toggle d-lg-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                aria-label="Toggle menu"
              >
                <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="d-lg-none"
            style={{
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border)',
              padding: '16px 24px',
              animation: 'slideDown 0.3s ease',
            }}
          >
            {links.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  d-flex align-items-center gap-3 py-3
                  ${isActive ? 'text-primary' : 'text-muted'}
                `}
                style={{
                  textDecoration: 'none',
                  borderBottom: index < links.length - 1 ? '1px solid var(--border)' : 'none',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Main Layout Grid */}
      <div className="layout-grid">
        {/* Sidebar Navigation */}
        <aside className="sidebar d-none d-lg-block">
          <h6 className="sidebar-title">Navigation</h6>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Sidebar Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div className="status-badge">
              <span className="status-dot" />
              <span>All systems operational</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="content-area">
          {showPageHeader && (
            <section className="surface-card">
              <div className="page-header">
                <div>
                  <h4 style={{ marginBottom: 4, fontSize: '1.5rem' }}>{pageTitle}</h4>
                  <small style={{ color: 'var(--fg-muted)', fontSize: '0.9375rem' }}>
                    Production-ready relational platform with modern UX
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn-ghost" type="button">
                    <i className="bi bi-download me-2" />
                    Export
                  </button>
                  <button className="btn-primary" type="button" onClick={handleCreateNew}>
                    <i className="bi bi-plus-lg me-2" />
                    Create New
                  </button>
                </div>
              </div>
            </section>
          )}

          {createMenuOpen && isAdminDashboard && (
            <div className="surface-card" style={{ padding: 16, marginTop: -8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link className="btn-ghost" to="/announcements-all" onClick={() => setCreateMenuOpen(false)}>
                  New Announcement
                </Link>
                <Link className="btn-ghost" to="/tuition" onClick={() => setCreateMenuOpen(false)}>
                  New Tuition
                </Link>
                <Link className="btn-ghost" to="/maids" onClick={() => setCreateMenuOpen(false)}>
                  New Maid
                </Link>
                <Link className="btn-ghost" to="/houserent" onClick={() => setCreateMenuOpen(false)}>
                  New House Listing
                </Link>
                <Link className="btn-ghost" to="/roommates" onClick={() => setCreateMenuOpen(false)}>
                  New Roommate Listing
                </Link>
                <Link className="btn-ghost" to="/marketplace" onClick={() => setCreateMenuOpen(false)}>
                  New Marketplace Item
                </Link>
              </div>
            </div>
          )}

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
