import React, { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const pageTitle = useMemo(() => {
    const match = links.find((item) => item.to === location.pathname);
    return match ? match.label : 'BacheLORE';
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Toaster position="top-right" />
      <nav className="top-nav py-2">
        <div className="container-fluid d-flex align-items-center justify-content-between gap-3">
          <Link to="/" className="d-flex align-items-center gap-2 text-reset">
            <span className="brand-mark">BL</span>
            <div>
              <div className="fw-bold">BacheLORE</div>
              <small className="text-secondary">Bachelor Life Management</small>
            </div>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Global search listings, users, payments..."
              className="app-input"
              style={{ minWidth: 280 }}
            />
            <button
              className="btn-soft"
              onClick={() => toast.success(query ? `Searching for: ${query}` : 'Type to search')}
              type="button"
            >
              <i className="bi bi-search" />
            </button>
            <button
              className="btn-soft"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              type="button"
            >
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-brightness-high'}`} />
            </button>
            <button className="btn-soft" onClick={() => toast('3 new activity notifications')} type="button">
              <i className="bi bi-bell" />
            </button>
          </div>
        </div>
      </nav>

      <div className="layout-grid">
        <aside className="sidebar">
          <h6 className="mb-3">Navigation</h6>
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
        </aside>

        <main className="content-area">
          <section className="surface-card d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h4 className="mb-1">{pageTitle}</h4>
              <small className="text-secondary">Production-ready relational platform with modern UX</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="btn-soft" type="button">Export</button>
              <button className="btn-gradient" type="button">Create New</button>
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
