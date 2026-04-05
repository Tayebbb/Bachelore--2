import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  { key: 'tuition', title: 'Tuition', icon: 'bi-journal-text', desc: 'Find tutors and track sessions', path: '/tuition', available: true },
  { key: 'maids', title: 'Maid Services', icon: 'bi-house-gear', desc: 'Book reliable housekeeping', path: '/maids', available: true },
  { key: 'roommates', title: 'Roommates', icon: 'bi-people', desc: 'Find compatible living partners', path: '/roommates', available: true },
  { key: 'houserent', title: 'House Rent', icon: 'bi-building', desc: 'Browse rental listings', path: '/houserent', available: true },
  { key: 'marketplace', title: 'Marketplace', icon: 'bi-bag-check', desc: 'Buy and sell items nearby', path: '/marketplace', available: true },
  { key: 'subscription', title: 'Subscription', icon: 'bi-credit-card', desc: 'Manage your plan', path: '/subscription', available: true },
  { key: 'activities', title: 'Activity Log', icon: 'bi-clock-history', desc: 'Track all platform activity', path: '/activities', available: true },
  { key: 'profile', title: 'Profile', icon: 'bi-person-circle', desc: 'Manage your account', path: '/profile', available: true },
];

export default function ModuleBoard() {
  return (
    <div className="bento-grid">
      {modules.map((module) => (
        module.available ? (
          <Link
            key={module.key}
            to={module.path}
            className="feature-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="feature-card-icon">
              <i className={`bi ${module.icon}`} />
            </div>
            <h4>{module.title}</h4>
            <p>{module.desc}</p>
          </Link>
        ) : (
          <div
            key={module.key}
            className="feature-card"
            style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}
          >
            <div className="feature-card-icon">
              <i className={`bi ${module.icon}`} />
            </div>
            <h4>{module.title}</h4>
            <p>{module.desc}</p>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                color: 'var(--fg-muted)',
              }}
            >
              Coming Soon
            </span>
          </div>
        )
      ))}
    </div>
  );
}
