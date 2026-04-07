import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { logout } from '../../lib/auth';

const studentMenu = [
  { to: '/student/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { to: '/student/tuition', label: 'Tuitions', icon: 'bi-journal-bookmark' },
  { to: '/student/maids', label: 'Maid Services', icon: 'bi-house-heart' },
  { to: '/student/roommates', label: 'Roommates', icon: 'bi-people' },
  { to: '/student/houserent', label: 'House Rent', icon: 'bi-building' },
  { to: '/student/marketplace', label: 'Marketplace', icon: 'bi-bag' },
  { to: '/student/announcements', label: 'Announcements', icon: 'bi-megaphone' },
  { to: '/student/activities', label: 'My Activity', icon: 'bi-clock-history' },
  { to: '/student/profile', label: 'Profile', icon: 'bi-person-circle' },
];

export default function StudentLayout() {
  return (
    <div className="panel-shell">
      <div className="panel-layout">
        <aside className="panel-sidebar">
          <div className="panel-brand-wrap">
            <Link to="/student/dashboard" className="panel-brand">
              <span className="panel-brand-mark">BL</span>
              Student Panel
            </Link>
            <p className="panel-brand-sub">Everything in one focused workspace</p>
          </div>
          <nav className="panel-nav">
            {studentMenu.map((item) => (
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
                window.location.href = '/login';
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
