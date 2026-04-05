import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const kpis = [
  { id: 'applications', label: 'Total Applications', value: '1,284', delta: '+18%', trend: 'up' },
  { id: 'bookings', label: 'Active Bookings', value: '326', delta: '+9%', trend: 'up' },
  { id: 'payments', label: 'Completed Payments', value: '892', delta: '+26%', trend: 'up' },
  { id: 'response', label: 'Avg Response Time', value: '62ms', delta: '-12%', trend: 'down' },
];

const modules = [
  { key: 'tuition', title: 'Tuition', icon: 'bi-journal-text', desc: 'Find tutors and track sessions', path: '/tuition', available: true },
  { key: 'maids', title: 'Maid Services', icon: 'bi-house-gear', desc: 'Book reliable housekeeping', path: '/maids', available: true },
  { key: 'roommates', title: 'Roommates', icon: 'bi-people', desc: 'Find compatible living partners', path: '/roommates', available: true },
  { key: 'houserent', title: 'House Rent', icon: 'bi-building', desc: 'Browse rental listings', path: '/houserent', available: true },
  { key: 'marketplace', title: 'Marketplace', icon: 'bi-bag-check', desc: 'Buy and sell items', path: '/marketplace', available: true },
  { key: 'subscription', title: 'Subscription', icon: 'bi-credit-card', desc: 'Manage payments', path: '/subscription', available: true },
];

const activities = [
  { id: 1, icon: 'bi-check-circle', text: 'Tuition booking approved for CSE tutor', time: '2 min ago', type: 'success' },
  { id: 2, icon: 'bi-house', text: 'House listing verified by admin', time: '15 min ago', type: 'info' },
  { id: 3, icon: 'bi-cart-check', text: 'Marketplace item marked sold', time: '1 hour ago', type: 'success' },
  { id: 4, icon: 'bi-person-check', text: 'Roommate profile activated', time: '3 hours ago', type: 'info' },
  { id: 5, icon: 'bi-arrow-repeat', text: 'Subscription renewed for 30 days', time: '5 hours ago', type: 'success' },
];

const announcements = [
  { id: 1, title: 'New Maid Services Available', category: 'Service', date: 'Today' },
  { id: 2, title: 'Platform Maintenance Scheduled', category: 'System', date: 'Yesterday' },
  { id: 3, title: 'Tuition Rates Updated', category: 'Pricing', date: '2 days ago' },
];

export default function Dashboard() {
  void motion;

  return (
    <AppShell>
      {/* Stats Row - Bento Grid */}
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            className="surface-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="text-label" style={{ marginBottom: 8 }}>{kpi.label}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--fg-primary)',
                marginBottom: 4,
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                color: kpi.trend === 'up' ? 'var(--success)' : 'var(--danger)',
                fontWeight: 500,
              }}
            >
              {kpi.delta} this week
            </div>
          </motion.div>
        ))}
      </section>

      {/* Quick Access Module Grid */}
      <section>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-label">Quick Access</span>
            <h3 style={{ marginTop: 8 }}>Your Services</h3>
          </div>
          <Link to="/home" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
            View All <i className="bi bi-arrow-right" style={{ marginLeft: 4 }} />
          </Link>
        </div>

        <div className="bento-grid">
          {modules.map((module, index) => (
            <motion.div
              key={module.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
            >
              <Link
                to={module.path}
                className={`feature-card ${!module.available ? 'locked' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="feature-card-icon">
                  <i className={`bi ${module.icon}`} />
                </div>
                <h4>{module.title}</h4>
                <p>{module.desc}</p>
                {!module.available && (
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
                    }}
                  >
                    Coming Soon
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Activity Feed & Announcements */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Activity Feed Panel */}
        <div className="surface-card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div>
              <span className="section-label">Activity</span>
              <h3 style={{ marginTop: 8 }}>Recent Activity</h3>
            </div>
            <Link to="/activities" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  paddingLeft: 16,
                  borderLeft: `2px solid ${activity.type === 'success' ? 'var(--success)' : 'var(--accent)'}`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    display: 'grid',
                    placeItems: 'center',
                    color: activity.type === 'success' ? 'var(--success)' : 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <i className={`bi ${activity.icon}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--fg-primary)', fontSize: '0.9375rem' }}>
                    {activity.text}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Panel */}
        <div className="surface-card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div>
              <span className="section-label">Updates</span>
              <h3 style={{ marginTop: 8 }}>Announcements</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <StatusBadge status={announcement.category} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{announcement.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>{announcement.title}</p>
              </div>
            ))}
          </div>

          <Link
            to="/announcements-all"
            className="btn-ghost w-full"
            style={{ marginTop: 16, textAlign: 'center' }}
          >
            View All Announcements
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
