import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { logout } from '../../lib/auth';

const adminMenu = [
  { to: '/admin/dashboard', label: 'Overview', icon: 'bi-speedometer2' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people' },
  { to: '/admin/create-listings', label: 'Create Listings', icon: 'bi-plus-square' },
  { to: '/admin/listings', label: 'Listing Review', icon: 'bi-patch-check' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'bi-megaphone' },
  { to: '/admin/payments', label: 'Payments', icon: 'bi-credit-card-2-front' },
];

export default function AdminLayout() {
  return (
    <div className="panel-shell">
      <div className="panel-layout">
        <aside className="panel-sidebar">
          <div className="panel-brand-wrap">
            <Link to="/admin/dashboard" className="panel-brand">
              <span className="panel-brand-mark">BL</span>
              Admin Control
            </Link>
            <p className="panel-brand-sub">Moderation and platform insights</p>
          </div>
          <nav className="panel-nav">
            {adminMenu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `panel-nav-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`} />
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              className="panel-logout"
              onClick={() => {
                logout();
                window.location.href = '/admin/login';
              }}
            >
              <i className="bi bi-box-arrow-right" /> Logout
            </button>
          </nav>
        </aside>

        <main className="panel-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
