import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';

const modules = [
  { key: 'tuition', title: 'Tuition', icon: 'bi-journal-text', desc: 'Find tutors and track sessions', path: '/tuition', available: true },
  { key: 'maids', title: 'Maid Services', icon: 'bi-house-gear', desc: 'Book reliable housekeeping', path: '/maids', available: true },
  { key: 'roommates', title: 'Roommates', icon: 'bi-people', desc: 'Find compatible living partners', path: '/roommates', available: true },
  { key: 'houserent', title: 'House Rent', icon: 'bi-building', desc: 'Browse rental listings', path: '/houserent', available: true },
  { key: 'marketplace', title: 'Marketplace', icon: 'bi-bag-check', desc: 'Buy and sell items', path: '/marketplace', available: true },
  { key: 'subscription', title: 'Subscription', icon: 'bi-credit-card', desc: 'Manage payments', path: '/subscription', available: true },
];

function formatRelativeTime(input) {
  if (!input) return 'Unknown time';
  const ts = new Date(input).getTime();
  if (Number.isNaN(ts)) return 'Unknown time';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function Dashboard() {
  void motion;
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activityRes, announcementsRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/activity'),
          api.get('/api/announcements'),
        ]);

        setOverview(statsRes.data?.overview || null);
        setActivity(Array.isArray(activityRes.data) ? activityRes.data.slice(0, 5) : []);
        setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, 5) : []);
      } catch {
        setOverview(null);
        setActivity([]);
        setAnnouncements([]);
      }
    };

    load();
  }, []);

  const kpis = useMemo(() => {
    const totalBookings = overview?.totalBookings ?? 0;
    const pendingApplications = overview?.pendingApplications ?? 0;
    const totalPayments = overview?.totalPayments ?? 0;
    const activeMarketplaceItems = overview?.activeMarketplaceItems ?? 0;

    return [
      { id: 'bookings', label: 'Total Bookings', value: Number(totalBookings).toLocaleString(), trend: 'up' },
      { id: 'applications', label: 'Pending Applications', value: Number(pendingApplications).toLocaleString(), trend: 'down' },
      { id: 'payments', label: 'Total Payments', value: Number(totalPayments).toLocaleString(), trend: 'up' },
      { id: 'marketplace', label: 'Active Marketplace', value: Number(activeMarketplaceItems).toLocaleString(), trend: 'up' },
    ];
  }, [overview]);

  const activityRows = useMemo(() => {
    const iconMap = {
      book_tuition: 'bi-journal-check',
      unbook_tuition: 'bi-arrow-counterclockwise',
      book_maid: 'bi-house-check',
      unbook_maid: 'bi-house-x',
      book_roommate: 'bi-people-fill',
      unbook_roommate: 'bi-people',
      create_marketplace_item: 'bi-bag-plus',
      sell_marketplace_item: 'bi-bag-check',
      create_house_listing: 'bi-building-add',
      create_tuition: 'bi-journal-plus',
      create_announcement: 'bi-megaphone',
    };

    return activity.map((item) => ({
      id: item._id || item.activity_id,
      icon: iconMap[item.action_type] || 'bi-clock-history',
      text: item.action_type?.replaceAll('_', ' ') || 'activity',
      time: formatRelativeTime(item.timestamp),
      type: item.action_type?.includes('unbook') ? 'info' : 'success',
    }));
  }, [activity]);

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
            <div style={{ fontSize: '0.875rem', color: kpi.trend === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              Live from database
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
            {activityRows.map((activityItem) => (
              <div
                key={activityItem.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  paddingLeft: 16,
                  borderLeft: `2px solid ${activityItem.type === 'success' ? 'var(--success)' : 'var(--accent)'}`,
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
                    color: activityItem.type === 'success' ? 'var(--success)' : 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <i className={`bi ${activityItem.icon}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--fg-primary)', fontSize: '0.9375rem' }}>
                    {activityItem.text}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{activityItem.time}</span>
                </div>
              </div>
            ))}
            {activityRows.length === 0 && <p style={{ color: 'var(--fg-muted)', margin: 0 }}>No activity found.</p>}
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
                key={announcement._id || announcement.announcement_id}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <StatusBadge status="active" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{formatRelativeTime(announcement.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>{announcement.title || 'Untitled'}</p>
              </div>
            ))}
            {announcements.length === 0 && <p style={{ color: 'var(--fg-muted)', margin: 0 }}>No announcements found.</p>}
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
